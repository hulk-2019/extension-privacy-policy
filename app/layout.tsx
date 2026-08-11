import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudDock Privacy Policy",
  description:
    "CloudDock 浏览器扩展隐私权政策 - Privacy Policy for the CloudDock browser extension",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
