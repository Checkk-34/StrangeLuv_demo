# 🐟🐸 池塘奇遇 · 周末约定 — 实现计划

> 版本: v1.0  
> 日期: 2025-03-15  
> 依赖: [设计文档](../ProjectDocments/pond-date-design.md)  
> 方法论: Superpowers 阶段 2 — 编写实现计划  
> 目标文件: `index.html`（单文件）

---

## 项目文件结构

```
StrangeLuv_demo/
├── index.html              ← 唯一源代码文件
├── ProjectDocments/
│   └── pond-date-design.md ← 设计文档
└── ProjectPlans/
    └── pond-date-plan.md   ← 本文件
```

---

## 任务拆解（12 个原子任务，每个 2-5 分钟）

---

### 任务 1 · HTML 骨架 + CSS 变量 + 全局样式

**文件**: `index.html`（新建）

**内容**:
- `<!DOCTYPE html>` 文档结构
- `<head>`: Google Fonts（Zen Maru Gothic + M PLUS Rounded 1c）、viewport meta
- CSS 自定义属性：配色方案（`--bg-primary`、`--fish-orange`、`--frog-green`、`--card-cream`、`--text-main`、`--text-light`、`--white`、`--heart`）
- CSS 全局基础：`body` 背景渐变、`*` box-sizing、基本排版
- 5 个 `<section>` 占位：`#countdown`、`#movies`、`#playground`、`#activities`、`#danmaku`
- `<footer>`

**验证**: 
- 浏览器打开 `index.html`，背景显示樱花粉渐变
- 无 JS 报错
- Google Fonts 加载成功

---

### 任务 2 · 倒计时模块

**文件**: `index.html`（编辑 `#countdown` 区域 + `<script>`）

**内容**:
- HTML: 极简一行文字「距离今天结束还有 HH:MM:SS」+ 副文字
- JS: `updateCountdown()` 每秒计算 `24:00 - now`
- CSS: 小字号、居中、最后 10 秒颜色渐变到 `--heart`

**验证**:
- 倒计时每秒递减
- 打开页面显示正确剩余时间
- 控制台执行 `new Date()` 确认时间计算正确

---

### 任务 3 · 影视卡片区（TMDb API）

**文件**: `index.html`（编辑 `#movies` 区域 + `<script>`）

**内容**:
- HTML: 5 张卡片的容器（`.movie-grid`）
- JS: `fetchMovies()` 调用 TMDb `/movie/now_playing` API
- 卡片渲染：`<img>` 海报 + `<p>` 片名 + `<span>` 年份·评分
- CSS: 横向 flex、圆角卡片、hover 浮起动效
- 失败降级：API 失败时显示静态示例数据

**验证**:
- 页面加载后 5 张电影卡片出现
- 有海报图、片名、年份
- 缩小浏览器宽度，卡片可横向滚动
- 断开网络 → 显示降级静态数据

---

### 任务 4 · Tab 切换系统 + 卡片/按钮通用样式

**文件**: `index.html`（编辑 `#playground` → Tab 导航 + CSS）

**内容**:
- Tab 导航栏：3 个按钮「🎯 转盘」「🎰 老虎机」「💞 默契问卷」
- 3 个 `<div>` 内容面板，默认显示第一个
- JS: `switchTab(index)` 切换 `.active` 类
- CSS: Tab 按钮 Claymorphism 风格（内阴影、圆角）、角色色区分
- 通用卡片样式 `.card`、通用按钮样式 `.btn-fish` / `.btn-frog`

**验证**:
- 点击 Tab 切换内容面板
- 当前 Tab 高亮，其余半透明
- 按钮样式有明显角色色区分（橙=小鱼，绿=蛙蛙）

---

### 任务 5 · 🎯 转盘

**文件**: `index.html`（编辑 `#tab-wheel` + `<script>`）

**内容**:
- `<canvas>` 元素 300×300
- JS: 绘制 6 扇形分区，每区不同颜色+文字标签
- 指针（三角形）固定在顶部
- 按钮「🐟 小鱼转」和「🐸 蛙蛙转」触发旋转
- 旋转动画：`requestAnimationFrame`，减速缓出
- 结果弹窗：「🎉 抽中：XXX」+「添加到清单」按钮

**验证**:
- Canvas 渲染 6 个彩色扇形 + 文字
- 点击按钮后转盘旋转 3-4 秒停止
- 停止后弹出结果
- 两种按钮都能触发，颜色不同

---

### 任务 6 · 🎰 老虎机

**文件**: `index.html`（编辑 `#tab-slots` + `<script>`）

**内容**:
- 三栏 `.slot-column`，每栏内有滚动的选项列表
- CSS: 每栏裁剪区域（`overflow: hidden`），内有长列表
- JS: 点击拉杆 → 三栏 `transform: translateY` 动画依次停止
- 停止后高亮结果行
- 结果弹窗同转盘格式

**验证**:
- 三栏显示不同类别的文字
- 点击按钮后三栏依次滚动停止（有时间差）
- 停止后三行高亮，显示完整结果

---

### 任务 7 · 💞 默契问卷

**文件**: `index.html`（编辑 `#tab-quiz` + `<script>`）

**内容**:
- HTML: 10 个 checkbox 选项列表
- 角色切换按钮：「我是🐟小鱼」「我是🐸蛙蛙」
- 提交按钮 + 状态显示
- JS 逻辑:
  - 选择角色 → 勾选选项 → 提交 → 存 localStorage
  - 检测双方是否都提交 → 计算交集 → 显示「今日默契小事件」
  - 如果一方未提交 → 显示「等待对方中...」
- 交集结果：🍿 卡片列表 + 一键添加到活动清单

**验证**:
- 切换角色，勾选并提交
- 手动修改 localStorage 模拟对方已提交 → 显示默契结果
- 仅一方提交 → 显示等待状态
- 交集项可添加到清单

---

### 任务 8 · 手动添加 + 活动清单

**文件**: `index.html`（编辑 `#activities` + `<script>`）

**内容**:
- 输入框 + 🐟添加/🐸添加 两个按钮
- `<ul>` 活动列表，每项格式: `[🐟/🐸/💞] 活动名 · 时间段 [✕删除]`
- JS: `addActivity()` / `deleteActivity(id)` + 渲染函数 `renderActivities()`
- 删除动画：`translateX` + `opacity` 后移除 DOM
- localStorage 读写

**验证**:
- 输入文字 + 点添加 → 列表出现新项
- 点 ✕ → 项滑出消失
- 刷新页面 → 数据保留
- 两个按钮分别标记不同角色图标

---

### 任务 9 · 💬 弹幕留言板

**文件**: `index.html`（编辑 `#danmaku` + `<script>`）

**内容**:
- 弹幕舞台 `.danmaku-stage`：固定高度、`overflow: hidden`
- 每个弹幕气泡：绝对定位、从右到左 CSS animation
- 气泡样式：角色色底、圆角、右下角日期标注
- 底部输入框 + 发送按钮（选择🐟/🐸身份）
- JS:
  - `sendMessage()` 写入 localStorage + 创建气泡元素
  - `createBubble()` 生成随机轨道（y 位置）+ 随机速度
  - `animationend` 事件移除已完成的气泡
  - hover 暂停动画
- 页面加载时从 localStorage 读取历史消息，随机间隔播放

**验证**:
- 输入留言 + 发送 → 气泡从右侧飘入
- 气泡颜色对应角色
- 日期标注在气泡角落
- 页面加载时历史消息自动播放
- hover 气泡暂停

---

### 任务 10 · 数据层封装

**文件**: `index.html`（编辑 `<script>` 顶部）

**内容**:
- `AppData` 对象封装所有 localStorage 操作:
  - `getActivities()` / `addActivity()` / `deleteActivity()`
  - `getMessages()` / `addMessage()`
  - `getQuiz(date)` / `submitQuiz(role, picks)`
  - `getPool()` / `updatePool()`
- 初始化默认数据（首次使用时填充示例活动池）
- Supabase 预留注释标注

**验证**:
- 在控制台调用 `AppData.addActivity(...)` → localStorage 更新
- 控制台调用 `AppData.getActivities()` → 返回数组
- 首次打开页面 → 自动初始化默认活动池

---

### 任务 11 · 集成贯通 + 交互闭环

**文件**: `index.html`（编辑各模块连接逻辑）

**内容**:
- 转盘结果 → 点「添加到清单」→ 调用 `AppData.addActivity()` → 刷新清单
- 老虎机结果 → 同上
- 默契问卷交集 → 「一键添加全部」→ 批量添加
- 所有模块渲染统一从 `AppData` 读取
- 角色选择（🐟/🐸）在当前会话中保持（存 sessionStorage）
- 页面初始化入口 `init()` 函数

**验证**:
- 转盘 → 添加 → 清单出现（连贯操作）
- 老虎机 → 添加 → 清单出现
- 默契 → 一键添加 → 清单出现 3 条标记 💞
- 刷新页面 → 清单和弹幕数据保留

---

### 任务 12 · 响应式 + 动效打磨 + 最终审查

**文件**: `index.html`（CSS 媒体查询 + 微调）

**内容**:
- `@media (max-width: 480px)` 移动端微调
- `@media (min-width: 768px)` 桌面端居中 max-width: 640px
- 卡片/按钮触摸目标 ≥ 44px 检查
- `prefers-reduced-motion` 媒体查询关闭动画
- 所有动画时长/缓动统一
- 最终浏览器验证：Chrome/Firefox/Edge

**验证**:
- Chrome DevTools 模拟 iPhone SE/12/Pro Max → 布局不崩
- 平板横屏 → 居中不拉宽
- 开启 `prefers-reduced-motion` → 转盘/弹幕/老虎机动画跳过
- 颜色对比度测试通过

---

## 执行方式建议

```
┌─────────────────────────────────────────────┐
│  推荐:  子 Agent 驱动执行（阶段 4）          │
│                                             │
│  理由:                                       │
│  · 12 个任务，每个独立可并行                  │
│  · 单文件编辑，适合逐个串行但隔离上下文        │
│  · 每个任务有明确输入/输出/验证               │
│  · 子 Agent 自审 + 规格审查保证质量            │
│                                             │
│  备选:  当前会话顺序执行（阶段 3 TDD）        │
│        更慢但你可以逐步参与每个细节            │
└─────────────────────────────────────────────┘
```

---

> 下一步: 你选择执行方式后进入实现阶段
