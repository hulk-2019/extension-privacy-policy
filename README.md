# CloudDock Privacy Policy

CloudDock 浏览器扩展隐私权政策网站，基于 Next.js 构建，可部署到阿里云函数计算（FC 3.0）。

## 路由
- `/cloud-dock` - CloudDock Privacy Policy
- `/music` - 流式音乐播放器（Web / 移动端自适应）
- `/api/stream` - 服务端音频流推送代理（支持 HTTP Range 拖动进度）
- `/` - 自动重定向到 `/music`

## 流式音乐播放器

`/music` 页面通过服务端路由 `/api/stream` 代理上游 OSS 音频地址，将音频以流式（HTTP Range）推送给浏览器，从而：

- 规避 OSS 的跨域（CORS）限制；
- 支持拖动进度 / 分段缓冲（`Accept-Ranges` + `Content-Range`）；
- 客户端无需暴露 OSS 地址，私有桶可改用签名 URL。

### 配置

复制 `.env.example` 为 `.env.local` 并填写：

```bash
# 必填：OSS 音频文件的完整 URL
AUDIO_OSS_URL=https://your-bucket.oss-cn-hangzhou.aliyuncs.com/path/to/music.mp3

# 可选：LRC 歌词文件 URL
AUDIO_LRC_URL=

# 可选：允许 ?url= 动态指定音频源的主机白名单（逗号分隔，留空则禁用 ?url=）
AUDIO_ALLOWED_HOSTS=
```

## 技术栈

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 部署到阿里云函数计算（FC 3.0）

项目使用 Next.js `standalone` 产物 + 自定义运行时（官方 Node.js 20 层）。配置见 `s.yaml`。

### 1. 安装并登录 Serverless Devs

```bash
npm i -g @serverless-devs/s
s config add
```

按提示填写 AccessKey、默认地域（与 `s.yaml` 中 `vars.region` 一致，默认 `cn-hangzhou`）。

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（或 `.env.local` 后再 export），至少填写音频地址：

```bash
cp .env.example .env
```

`s deploy` 会读取当前 shell / `.env` 中的 `AUDIO_*` 变量并注入函数环境变量。

如需改地域或函数名，编辑 `s.yaml` 里的 `vars.region`、`vars.functionName`。

### 3. 部署

```bash
npm install
npm run deploy:fc
```

会先 `next build`，把静态资源拷进 `.next/standalone`，再上传为 Web 函数。部署成功后会给出 HTTP 触发器地址，形如：

```text
https://cloud-dock-web-xxxxxxxx.cn-hangzhou.fcapp.run
```

可直接访问 `/cloud-dock`、`/music`。根路径 `/` 会直接渲染隐私政策，不再做 302 跳转（FC 默认域名禁止外跳）。

注意：

- `*.fcapp.run` 未备案，浏览器会把页面当成附件下载，看起来像“打不开”。这是函数计算的限制，不是站点挂了。
- `*.devsapp.net` 测试域名已经失效，打开是 Serverless Devs 社区说明页，不会进你的函数。
- 要在浏览器里正常打开，需要绑定已备案自定义域名。当前配置为 `nano-banana.ai520.wiki`。

### 4. 绑定自定义域名

1. 在域名解析里添加 CNAME（主机记录 `nano-banana`，记录值见下）。
2. 公网 CNAME 格式：`<阿里云主账号ID>.cn-hangzhou.fc.aliyuncs.com`  
   账号 ID 可在函数计算控制台「添加自定义域名」页看到；本项目上次部署自动域名里的账号 ID 为 `1755883887221979`，即：

   ```text
   nano-banana.ai520.wiki  CNAME  1755883887221979.cn-hangzhou.fc.aliyuncs.com
   ```

3. 解析生效后再执行 `npm run deploy:fc`。未解析成功时，FC 会报 `DomainNameNotResolved`。
4. 访问：`http://nano-banana.ai520.wiki`、`/cloud-dock`、`/music`。HTTPS 可在控制台上传证书后把 `s.yaml` 的 `protocol` 改成 `HTTP,HTTPS`。

### 控制台手动上传（可选）

1. 本地执行 `npm run build && npm run prepare:fc`
2. 将 `.next/standalone` 打成 zip
3. 控制台创建 **Web 函数** → 运行环境选 **自定义运行时 Debian 10**
4. 绑定官方层 `Nodejs20`，环境变量增加 `PATH=/opt/nodejs20/bin:...`、`PORT=3000`、`HOSTNAME=0.0.0.0`
5. 启动命令：`node server.js`，监听端口：`3000`
6. 超时建议 ≥ 300 秒（音频 Range 流式代理）

## 构建

```bash
npm run build
npm start
```
