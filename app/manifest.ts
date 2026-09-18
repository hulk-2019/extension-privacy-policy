import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "这扇窗",
    short_name: "这扇窗",
    description: "这扇窗",
    start_url: "/music",
    display: "standalone",
    background_color: "#17171a",
    theme_color: "#17171a",
  };
}
