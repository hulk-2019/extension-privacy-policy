import type { Metadata } from "next";
import MusicPlayer from "./music-player";

export const metadata: Metadata = {
  title: "流式音乐播放器",
  description: "基于 OSS 的流式音乐播放页面，支持 Web 与移动端。",
};

export default function MusicPage() {
  return <MusicPlayer />;
}
