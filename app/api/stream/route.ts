import { NextRequest } from "next/server";

// 使用 Node.js 运行时，以便把上游 OSS 的响应体作为流式 Web ReadableStream 转发给客户端。
export const runtime = "nodejs";

// 默认的 OSS 音频地址（例如 https://bucket.oss-cn-hangzhou.aliyuncs.com/path/music.mp3）
const DEFAULT_AUDIO_URL =
  process.env.AUDIO_OSS_URL?.trim() ||
  "https://sd-static-web.oss-cn-hangzhou.aliyuncs.com/%E8%BF%99%E6%89%87%E7%AA%97/%E8%BF%99%E6%89%87%E7%AA%97.mp3";

// 允许通过 /api/stream?url=... 动态指定音频源的主机白名单（逗号分隔，小写比较）。
// 留空则禁用 ?url= 方式（推荐），仅使用 DEFAULT_AUDIO_URL，避免服务被当作开放代理（SSRF）。
const ALLOWED_HOSTS = (process.env.AUDIO_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

// 上游未返回 Content-Type 时使用的兜底值。
const DEFAULT_CONTENT_TYPE = process.env.AUDIO_CONTENT_TYPE?.trim() || "audio/mpeg";

function resolveAudioUrl(request: NextRequest): URL | null {
  const requested = request.nextUrl.searchParams.get("url");

  if (requested) {
    let parsed: URL;
    try {
      parsed = new URL(requested);
    } catch {
      return null;
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    if (!ALLOWED_HOSTS.includes(parsed.host.toLowerCase())) {
      return null;
    }

    return parsed;
  }

  if (DEFAULT_AUDIO_URL) {
    try {
      return new URL(DEFAULT_AUDIO_URL);
    } catch {
      return null;
    }
  }

  return null;
}

async function fetchUpstream(
  audioUrl: URL,
  init: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(audioUrl, { ...init, cache: "no-store" });
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const audioUrl = resolveAudioUrl(request);
  if (!audioUrl) {
    return new Response(
      "音频源未配置：请设置环境变量 AUDIO_OSS_URL，或配置 AUDIO_ALLOWED_HOSTS 白名单后使用 ?url= 参数。",
      { status: 404 }
    );
  }

  const range = request.headers.get("range");

  const upstream = await fetchUpstream(audioUrl, {
    headers: range ? { Range: range } : undefined,
    redirect: "follow",
  });

  if (!upstream) {
    return new Response("无法访问上游音频源。", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("上游音频源返回错误。", {
      status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
    });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? DEFAULT_CONTENT_TYPE
  );
  headers.set("Accept-Ranges", "bytes");

  const contentRange = upstream.headers.get("content-range");
  if (upstream.status === 206 && contentRange) {
    headers.set("Content-Range", contentRange);
  }

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function HEAD(request: NextRequest) {
  const audioUrl = resolveAudioUrl(request);
  if (!audioUrl) {
    return new Response(null, { status: 404 });
  }

  const upstream = await fetchUpstream(audioUrl, { method: "HEAD" });
  if (!upstream) {
    return new Response(null, { status: 502 });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? DEFAULT_CONTENT_TYPE
  );
  headers.set("Accept-Ranges", "bytes");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(null, {
    status: upstream.ok ? 200 : upstream.status,
    headers,
  });
}
