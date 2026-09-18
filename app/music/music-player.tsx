"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import styles from "./music.module.css";

const STREAM_URL = "/api/stream";
const LYRICS_URL = "/api/lyrics";
const DEFAULT_TITLE = "这扇窗";

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type LyricLine = { time: number; text: string };

type ParsedLrc = {
  lines: LyricLine[];
  title: string;
  artist: string;
  album: string;
};

function computeLyricOffset(
  container: HTMLElement,
  track: HTMLElement,
  lyrics: LyricLine[],
  currentTime: number,
): number {
  const children = Array.from(track.children) as HTMLElement[];
  if (children.length === 0) return 0;

  let index = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) index = i;
    else break;
  }

  const first = children[0];
  if (index < 0) {
    return container.clientHeight * 0.72 - first.offsetTop - first.clientHeight;
  }

  const current = children[index];
  const next = children[index + 1];
  const currentCenter = current.offsetTop + current.clientHeight / 2;

  if (!next) {
    return container.clientHeight / 2 - currentCenter;
  }

  const span = Math.max(lyrics[index + 1].time - lyrics[index].time, 0.001);
  const progress = Math.min(1, Math.max(0, (currentTime - lyrics[index].time) / span));
  const nextCenter = next.offsetTop + next.clientHeight / 2;
  return container.clientHeight / 2 - (currentCenter + (nextCenter - currentCenter) * progress);
}

function parseLrc(raw: string): ParsedLrc {
  const lines: LyricLine[] = [];
  let title = "";
  let artist = "";
  let album = "";

  const timeTagRe = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of raw.split(/\r?\n/)) {
    const metaMatch = line.match(/^\[(ti|ar|al|by|offset):(.*)\]$/i);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const value = metaMatch[2].trim();
      if (key === "ti") title = value;
      else if (key === "ar") artist = value;
      else if (key === "al") album = value;
      continue;
    }

    const matches = [...line.matchAll(timeTagRe)];
    if (matches.length === 0) continue;

    const text = line.replace(timeTagRe, "").trim();
    if (!text || /^\[[^\]]+\]$/.test(text)) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = (match[3] ?? "0").padEnd(3, "0").slice(0, 3);
      lines.push({
        time: minutes * 60 + seconds + parseInt(fraction, 10) / 1000,
        text,
      });
    }
  }

  lines.sort((a, b) => a.time - b.time);

  return { lines, title, artist, album };
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a4 4 0 0 1 0 7" />
          <path d="M18 6a7 7 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const volumeInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [verticalVolume, setVerticalVolume] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const graphReadyRef = useRef(false);
  const volumeHideTimerRef = useRef(0);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(isMuted);
  volumeRef.current = volume;
  mutedRef.current = isMuted;

  const clearVolumeHideTimer = useCallback(() => {
    window.clearTimeout(volumeHideTimerRef.current);
  }, []);

  const scheduleVolumeHide = useCallback(() => {
    window.clearTimeout(volumeHideTimerRef.current);
    volumeHideTimerRef.current = window.setTimeout(() => {
      setVolumeOpen(false);
    }, 1200);
  }, []);

  const outputLevel = useCallback(() => {
    return mutedRef.current ? 0 : volumeRef.current;
  }, []);

  const applyOutputGain = useCallback((level: number) => {
    const safe = Math.min(1, Math.max(0, level));
    if (gainRef.current) {
      gainRef.current.gain.value = safe;
      if (audioRef.current) audioRef.current.volume = 1;
      return;
    }
    if (audioRef.current) {
      audioRef.current.volume = safe;
    }
  }, []);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (audioCtxRef.current?.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    if (!audio || graphReadyRef.current) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      graphReadyRef.current = true;
      return;
    }

    try {
      const ctx = new AudioContextCtor();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = outputLevel();
      source.connect(gain);
      gain.connect(ctx.destination);
      audio.volume = 1;
      audioCtxRef.current = ctx;
      gainRef.current = gain;
      void ctx.resume();
    } catch {
      // 元素已被接入音频图，或当前环境不支持 Web Audio。
    } finally {
      graphReadyRef.current = true;
    }
  }, [outputLevel]);

  const syncDuration = useCallback((audio: HTMLAudioElement) => {
    const next = audio.duration;
    if (Number.isFinite(next) && next > 0) {
      setDuration(next);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      ensureAudioGraph();
      applyOutputGain(outputLevel());
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [applyOutputGain, ensureAudioGraph, outputLevel]);

  const handleSeek = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }, []);

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    if (audio.paused) {
      ensureAudioGraph();
      applyOutputGain(outputLevel());
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [applyOutputGain, ensureAudioGraph, outputLevel]);

  const handleVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    setIsMuted(next === 0);
    volumeRef.current = next;
    mutedRef.current = next === 0;
    ensureAudioGraph();
    applyOutputGain(next);
    const audio = audioRef.current;
    if (audio) {
      audio.muted = false;
    }
  }, [applyOutputGain, ensureAudioGraph]);

  const applyVerticalVolume = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const rail = event.currentTarget.getBoundingClientRect();
      if (rail.height <= 0) return;
      handleVolume((rail.bottom - event.clientY) / rail.height);
    },
    [handleVolume],
  );

  const handleVerticalVolumePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!verticalVolume) return;
      event.preventDefault();
      event.stopPropagation();
      clearVolumeHideTimer();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // 非可信指针事件（自动化测试）可能无法捕获，不影响音量计算。
      }
      applyVerticalVolume(event);
    },
    [applyVerticalVolume, clearVolumeHideTimer, verticalVolume],
  );

  const handleVerticalVolumePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!verticalVolume || !event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      applyVerticalVolume(event);
    },
    [applyVerticalVolume, verticalVolume],
  );

  const handleVerticalVolumePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!verticalVolume) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      scheduleVolumeHide();
    },
    [scheduleVolumeHide, verticalVolume],
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    let nextVolume = volume;
    if (!nextMuted && volume === 0) {
      nextVolume = 0.6;
      setVolume(nextVolume);
    }
    setIsMuted(nextMuted);
    volumeRef.current = nextVolume;
    mutedRef.current = nextMuted;
    ensureAudioGraph();
    applyOutputGain(nextMuted ? 0 : nextVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.muted = nextMuted;
    }
  }, [applyOutputGain, ensureAudioGraph, isMuted, volume]);

  const handleVolumeIconClick = useCallback(() => {
    if (!verticalVolume) {
      toggleMute();
      return;
    }
    if (!volumeOpen) {
      setVolumeOpen(true);
      scheduleVolumeHide();
      return;
    }
    toggleMute();
    scheduleVolumeHide();
  }, [scheduleVolumeHide, toggleMute, verticalVolume, volumeOpen]);

  const activeIndex = useMemo(() => {
    let low = 0;
    let high = lyrics.length - 1;
    let result = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (lyrics[mid].time <= currentTime) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result;
  }, [lyrics, currentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    syncDuration(audio);
  }, [isLoading, isPlaying, syncDuration]);

  useEffect(() => {
    let cancelled = false;

    async function loadLyrics() {
      try {
        const res = await fetch(LYRICS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (cancelled) return;

        const parsed = parseLrc(text);
        if (cancelled) return;

        setLyrics(parsed.lines);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.artist) setArtist(parsed.artist);
        if (parsed.album) setAlbum(parsed.album);
      } catch {
        if (!cancelled) setLyricsError("歌词加载失败");
      }
    }

    loadLyrics();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = lyricsRef.current;
    const track = trackRef.current;
    if (!container || !track || lyrics.length === 0) return;

    function applyOffset(time: number) {
      if (!container || !track) return;
      track.style.transform = `translateY(${computeLyricOffset(container, track, lyrics, time)}px)`;
    }

    function syncFromAudio() {
      applyOffset(audioRef.current?.currentTime ?? 0);
    }

    syncFromAudio();

    const observer = new ResizeObserver(syncFromAudio);
    observer.observe(container);

    if (!isPlaying) {
      return () => observer.disconnect();
    }

    let frame = 0;
    function tick() {
      syncFromAudio();
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isPlaying, lyrics]);

  useEffect(() => {
    if (isPlaying) return;
    const container = lyricsRef.current;
    const track = trackRef.current;
    if (!container || !track || lyrics.length === 0) return;
    track.style.transform = `translateY(${computeLyricOffset(container, track, lyrics, currentTime)}px)`;
  }, [currentTime, isPlaying, lyrics]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setVerticalVolume(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!verticalVolume) {
      setVolumeOpen(false);
      clearVolumeHideTimer();
    }
  }, [clearVolumeHideTimer, verticalVolume]);

  useEffect(() => () => clearVolumeHideTimer(), [clearVolumeHideTimer]);

  useEffect(() => {
    volumeInputRef.current?.setAttribute(
      "orient",
      verticalVolume ? "vertical" : "horizontal",
    );
  }, [verticalVolume]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") return;
      event.preventDefault();
      togglePlay();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const { mediaSession } = navigator;

    mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
    });
    mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    mediaSession.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number" && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
      }
    });
    mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    });
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || DEFAULT_TITLE,
        artist: artist || "CloudDock Player",
        album,
      });
    } catch {
      // 某些浏览器可能不支持 MediaMetadata，忽略即可。
    }
  }, [title, artist, album]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  useEffect(() => {
    if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: 1,
          position: currentTime,
        });
      } catch {
        // 忽略不支持的分段状态上报。
      }
    }
  }, [currentTime, duration]);

  return (
    <main className={styles.page} data-theme="dark" aria-label="音乐播放器">
      <div className={styles.stageWrap}>
        <div
          className={styles.stage}
          onClick={togglePlay}
          onKeyDown={(event) => {
            if (event.key === "Enter") togglePlay();
          }}
          role="presentation"
        >
          <div
            className={`${styles.vinyl} ${isPlaying ? styles.spinning : ""}`}
            aria-hidden="true"
          />

          <div className={styles.lyrics} ref={lyricsRef}>
            {lyricsError ? (
              <p className={styles.lyricsError}>{lyricsError}</p>
            ) : (
              <div ref={trackRef} className={styles.lyricsTrack}>
                {lyrics.map((line, index) => (
                  <p
                    key={`${line.time}-${index}`}
                    className={`${styles.lyricLine} ${
                      index === activeIndex ? styles.lyricActive : ""
                    }`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSeek(line.time);
                    }}
                  >
                    {line.text || "♪"}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.dock}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleReplay}
            aria-label="重新播放"
          >
            <ReplayIcon />
          </button>

          <button
            type="button"
            className={styles.playButton}
            onClick={togglePlay}
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isLoading && !isPlaying ? (
              <span className={styles.spinner} />
            ) : isPlaying ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>

          <div className={styles.volumeGroup}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.muteButton}`}
              onClick={handleVolumeIconClick}
              aria-label={
                verticalVolume && !volumeOpen
                  ? "调节音量"
                  : isMuted || volume === 0
                    ? "取消静音"
                    : "静音"
              }
              aria-expanded={verticalVolume ? volumeOpen : undefined}
            >
              <VolumeIcon muted={isMuted || volume === 0} />
            </button>
            <div
              className={`${styles.volumeRail} ${
                volumeOpen ? styles.volumeRailOpen : ""
              }`}
              role={verticalVolume && volumeOpen ? "slider" : undefined}
              aria-label={verticalVolume && volumeOpen ? "音量" : undefined}
              aria-orientation={verticalVolume && volumeOpen ? "vertical" : undefined}
              aria-valuemin={verticalVolume && volumeOpen ? 0 : undefined}
              aria-valuemax={verticalVolume && volumeOpen ? 1 : undefined}
              aria-valuenow={
                verticalVolume && volumeOpen ? (isMuted ? 0 : volume) : undefined
              }
              tabIndex={verticalVolume && volumeOpen ? 0 : undefined}
              onPointerDown={handleVerticalVolumePointerDown}
              onPointerMove={handleVerticalVolumePointerMove}
              onPointerUp={handleVerticalVolumePointerUp}
              onPointerCancel={handleVerticalVolumePointerUp}
              onKeyDown={
                verticalVolume
                  ? (event) => {
                      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                        event.preventDefault();
                        handleVolume((isMuted ? 0 : volume) + 0.05);
                      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                        event.preventDefault();
                        handleVolume((isMuted ? 0 : volume) - 0.05);
                      }
                    }
                  : undefined
              }
            >
              <input
                ref={volumeInputRef}
                type="range"
                className={styles.volume}
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(event) => handleVolume(Number(event.target.value))}
                aria-label="音量"
                aria-orientation={verticalVolume ? "vertical" : "horizontal"}
                aria-hidden={verticalVolume}
                tabIndex={verticalVolume ? -1 : 0}
              />
            </div>
          </div>
        </div>

        <div className={styles.progressBlock}>
          <input
            type="range"
            className={styles.progress}
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(Number(event.target.value))}
            disabled={!duration}
            aria-label="播放进度"
          />
          <div className={styles.timeRow}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          syncDuration(event.currentTarget);
          setIsLoading(false);
        }}
        onDurationChange={(event) => {
          syncDuration(event.currentTarget);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={(event) => {
          syncDuration(event.currentTarget);
          setIsLoading(false);
        }}
        onCanPlay={(event) => {
          syncDuration(event.currentTarget);
          setIsLoading(false);
        }}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setError("音频加载失败");
          setIsLoading(false);
        }}
      />
    </main>
  );
}
