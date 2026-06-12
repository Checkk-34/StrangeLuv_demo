# 🚀 部署指南 — 池塘奇遇 · 周末约定

## 架构

```
/              → 官网（landing page → index.html）
/app/          → App（React SPA，Vite 构建产物）
```

---

## 部署方式：GitHub Pages（推荐，免费）

### 前置条件

1. 代码已推送到 GitHub 仓库（当前：`Checkk-34/StrangeLuv_demo`）
2. 已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`）

### 启用步骤

1. 在浏览器打开 GitHub 仓库页面
2. 点击 **Settings** → **Pages**
3. 在 **Source** 处选择 **GitHub Actions**
4. 之后每次推送到 `main` 分支，GitHub Actions 会自动构建并部署
5. 部署完成后，访问：
   ```
   https://checkk-34.github.io/StrangeLuv_demo/    → 官网首页
   https://checkk-34.github.io/StrangeLuv_demo/app/ → App
   ```

### 手动触发部署

在 GitHub 仓库 → **Actions** → **Deploy to GitHub Pages** → **Run workflow**

---

## 构建流程

```bash
cd app

# 构建（VITE_BASE_PATH 由构建脚本自动设置）
bash build-deploy.sh

# 输出在 app/dist/
# ├── index.html    ← 官网 landing.html（重命名）
# ├── app/
# │   ├── index.html ← App SPA 入口
# │   └── assets/
# └── 404.html      ← SPA fallback
```

---

## 本地预览

```bash
cd app && npm run dev
# → http://localhost:5173（App 开发服务器）

# 或直接双击 app/landing.html
# CTA 按钮自动检测环境 → 链接到 http://localhost:5173
```

---

## CTA 跳转逻辑

`landing.html` 中的跳转脚本自动判断：

| 环境 | CTA 跳转地址 |
|------|-------------|
| 双击打开（file://） | `http://localhost:5173` |
| localhost 开发 | `http://localhost:5173` |
| GitHub Pages | `/{repo}/app/`（自动检测） |
| 自定义域名 | `/app/`（自动检测） |
