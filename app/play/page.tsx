import type { Metadata } from "next";
import MusicPlayer from "../music/music-player";
import { resolveDirectAudioUrl } from "../../lib/audio-source";

export const metadata: Metadata = {
  title: "这扇窗",
  description: "这扇窗",
  appleWebApp: {
    capable: true,
    title: "这扇窗",
    statusBarStyle: "black-translucent",
  },
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  return <MusicPlayer audioSrc={resolveDirectAudioUrl(url)} />;
}
