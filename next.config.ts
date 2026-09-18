import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成可独立运行的产物，供阿里云函数计算（自定义运行时）部署。
  output: "standalone",
};

export default nextConfig;
