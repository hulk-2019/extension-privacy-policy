export const FALLBACK_AUDIO_URL =
  "https://sd-static-web.oss-cn-hangzhou.aliyuncs.com/%E8%BF%99%E6%89%87%E7%AA%97/%E8%BF%99%E6%89%87%E7%AA%97.mp3";

export function configuredAudioUrl(): string {
  const fromEnv = process.env.AUDIO_OSS_URL?.trim() ?? "";
  if (!fromEnv || /your-bucket|example\.com|path\/to\/music/i.test(fromEnv)) {
    return FALLBACK_AUDIO_URL;
  }
  return fromEnv;
}

export function resolveDirectAudioUrl(requested?: string | null): string {
  if (requested) {
    try {
      const parsed = new URL(requested);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch {
      // 非法 url 参数时回退到默认曲目。
    }
  }
  return configuredAudioUrl();
}
