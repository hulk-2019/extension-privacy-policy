import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standalone = join(".next", "standalone");

if (!existsSync(standalone)) {
  throw new Error("未找到 .next/standalone，请先执行 npm run build");
}

if (existsSync("public")) {
  cpSync("public", join(standalone, "public"), { recursive: true });
}

const staticDir = join(".next", "static");
if (existsSync(staticDir)) {
  mkdirSync(join(standalone, ".next"), { recursive: true });
  cpSync(staticDir, join(standalone, ".next", "static"), { recursive: true });
}

console.log("已准备函数计算代码包：.next/standalone");
