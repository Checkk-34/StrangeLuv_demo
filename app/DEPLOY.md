# 🚀 部署指南 — 池塘奇遇 · 周末约定

## 架构

```
/              → 官网（landing page，纯静态 HTML）
/app/          → App（React SPA，Vite 构建产物）
```

---

## 构建

```bash
cd app

# 1. 构建 App（输出到 dist/，资源路径为 /app/assets/...）
npm run build

# 2. 准备官网 + App 目录结构
mkdir -p deploy/app
Copy-Item landing.html deploy/index.html           # 官网入口
Copy-Item dist/index.html deploy/app/              # App 入口
Copy-Item -Recurse dist/assets deploy/app/assets/  # App 资源
```

最终 `deploy/` 目录结构：
```
deploy/
├── index.html              ← 官网（由 landing.html 改名为 index.html）
├── app/
│   ├── index.html          ← App 入口
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
```

将 `deploy/` 部署到任意静态服务器即可。

---

## 部署方式

### 方式一：Cloudflare Pages（推荐，免费）

1. 在 Cloudflare Dashboard → Pages → 创建项目
2. 连接 GitHub 仓库，构建命令：
   ```bash
   cd app && npm run build
   ```
3. 构建输出目录：`app/dist`
4. 添加重定向规则：
   - 源 URL：`/` → 目标 URL：`/landing.html` → 状态：200

### 方式二：nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/pond-date;
    index index.html;

    # / → 官网
    location = / {
        try_files /landing.html =404;
    }

    # /app/ → App（SPA 回退到 /app/index.html）
    location /app/ {
        try_files $uri $uri/ /app/index.html;
    }
}
```

### 方式三：Vercel

1. 在 `app/` 下创建 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/app/(.*)", "destination": "/app/$1" },
    { "source": "/(.*)", "destination": "/landing.html" }
  ]
}
```

### 方式四：本地预览

```bash
# 用 npx serve 同时托管官网和 App
npx serve deploy/ -l 3000
# → http://localhost:3000 官网
# → http://localhost:3000/app/  App
```

---

## 开发工作流

```bash
# 终端 1：App 开发服务器
cd app && npm run dev
# → http://localhost:5173

# 直接双击 app/landing.html
# CTA 按钮自动检测环境 → 链接到 http://localhost:5173
```

---

## CTA 跳转逻辑

`landing.html` 中的跳转脚本自动判断：

| 环境 | CTA 跳转地址 |
|------|-------------|
| 双击打开（file://） | `http://localhost:5173` |
| localhost 开发 | `http://localhost:5173` |
| 生产部署 | `/app/` |
