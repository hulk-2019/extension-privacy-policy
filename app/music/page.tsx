import type { Metadata } from "next";
import MusicPlayer from "./music-player";

export const metadata: Metadata = {
  title: "这扇窗",
  description: "这扇窗",
  appleWebApp: {
    capable: true,
    title: "这扇窗",
    statusBarStyle: "black-translucent",
  },
};

export default function MusicPage() {
  return <MusicPlayer />;
}
