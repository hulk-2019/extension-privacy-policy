"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

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
      audio.play().catch(() => setIsPlaying(false));
    }
  }, []);

  const handleVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    setIsMuted(next === 0);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = next;
      audio.muted = next === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.6);
      audio.volume = 0.6;
    }
  }, [isMuted, volume]);

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
            <div
              ref={trackRef}
              className={styles.lyricsTrack}
            >
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
              className={styles.iconButton}
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? "取消静音" : "静音"}
            >
              <VolumeIcon muted={isMuted || volume === 0} />
            </button>
            <input
              type="range"
              className={styles.volume}
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => handleVolume(Number(event.target.value))}
              aria-label="音量"
            />
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
