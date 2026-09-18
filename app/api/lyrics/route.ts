// 使用 Node.js 运行时。
export const runtime = "nodejs";

// 默认歌词地址（LRC 文件），可用环境变量 AUDIO_LRC_URL 覆盖。
const DEFAULT_LRC_URL =
  process.env.AUDIO_LRC_URL?.trim() ||
  "https://sd-static-web.oss-cn-hangzhou.aliyuncs.com/%E8%BF%99%E6%89%87%E7%AA%97/%E8%BF%99%E6%89%87%E7%AA%97.lrc";

export async function GET() {
  try {
    const upstream = await fetch(DEFAULT_LRC_URL, { cache: "no-store" });

    if (!upstream.ok) {
      return new Response("歌词获取失败", {
        status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
      });
    }

    const text = await upstream.text();

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("歌词获取失败", { status: 502 });
  }
}
