# 掘金技术小册 & 电子书极速阅读器 (Juejin Books Reader)

一款专为技术人打造的高颜值、现代、流畅且轻量沉浸的技术小册与电子书阅读器。

![技术小册阅读器](https://img.shields.io/badge/React-18-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.0-green?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen?style=flat-square)

---

## 🌟 核心特性

- 📚 **本地小册智能扫描与自然排序**：支持自动识别 `books/` 目录下的 Markdown 与 PDF 小册，按照自然数字序号（0, 1, 2... 10, 11, 12...）精准排序。
- ☁️ **GitHub 远程小册库与单本按需下载 (On-Demand Downloader)**：
  - 连接包含 115+ 本技术小册的海量 GitHub 仓库（如 `lm-rebooter/NuggetsBooklet`），无需全量克隆数 GB 仓库。
  - 仅获取目录轻量元数据，点击哪本就精准下载哪本（支持国内加速镜像与流式多并发下载）。
- 🔍 **全库毫秒级检索**：快捷键 `⌘ K` / `Ctrl K` 唤起全局搜索面板，支持按小册名、章节名、正文 SQL / 知识点快速检索与高亮。
- 📖 **沉浸式双模阅读体验**：
  - **Markdown 引擎强化**：代码语法高亮（Prism.js 带语言标牌、行号与一键复制）、KaTeX 数学公式渲染、GFM 表格与引用样式。
  - **右侧本章大纲 (TOC)**：滚动时实时跟随高亮当前小节，点击平滑滚动。
  - **0ms 即时悬浮提示 (Instant Tooltip)**：悬停目录与大纲即时展示完整长标题，绝不遮挡或截断。
  - **内置 PDF 阅读器**：自适应缩放与新标签页预览。
- 🎨 **多款护眼主题与排版定制**：内置晨曦白、羊皮纸暖黄（护眼）、暗夜黑、极客绿 4 款主题，支持字号大小（14~24px）、字体系列（无衬线/衬线/等宽）与版心宽度自由调节。
- 📈 **观看学习记录与统计大盘**：
  - 精准记录每次阅读时间、小册名、章节名、阅读百分比与上次离开位置，一键恢复滚动续读。
  - 统计累计专注时长、连续学习打卡天数，并生成最近 30 天的学习活跃度热力图。
- 📝 **随堂笔记与打卡撒花**：支持在章节内记录技术笔记，标记已学完时触发庆祝五彩纸屑撒花动画。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动本地服务

```bash
npm run dev
```

启动后：
- 前端页面：`http://localhost:5174/` (或 `http://localhost:5173/`)
- 后端 API 服务：`http://localhost:3001/`

### 3. 添加您自己的小册

将任意包含 `.md` 或 `.pdf` 的书籍文件夹复制到 `books/` 目录下（如 `books/My-Book/`），系统将自动热更新并在书架中呈现。

---

## 🛠️ 技术栈

- **前端**：React 18, TypeScript, Vite, Lucide React, React Markdown, Remark GFM, Remark Math, Rehype KaTeX, PrismJS, Canvas Confetti
- **后端**：Node.js, Express, TypeScript, tsx
- **持久化**：Flat-file JSON 数据库 (存放在 `data/storage.json`)

---

## 📄 License

MIT License.
