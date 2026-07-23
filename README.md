# JZY — AI Agent Memory Core

纪喆元的电影式 Three.js 交互个人作品集。网站把个人简介、技术栈和三个核心项目组织成一个可探索的 **AI Agent Memory Core / 智能体记忆中枢**：

- PMU-Graph：过程记忆与技能图谱
- LLM4EKG：应急预案知识图谱增强生成
- 多智能体污染防御策略实验平台：污染传播检测、共识与动态隔离

主体验是实时 Three.js 场景，Remotion 只负责确定性视频产物和 WebGL 回退，不参与网站运行时渲染。

## 视觉概念

深黑系统空间、编辑式大字号、知识图谱、扫描网格与克制的 Bloom。三个项目分别使用荧光绿、青色和珊瑚红。所有核心文本由 DOM 承载，Canvas 只负责空间与实时视觉。

## 技术栈

- Vite + TypeScript
- Three.js + GSAP
- React + Remotion（独立视频子项目）
- Vitest + ESLint
- GitHub Actions / GitHub Pages

## 本地开发

要求 Node.js 20.19+，推荐 Node.js 22。

```bash
npm install
npm run dev
```

生产验证：

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Windows PowerShell 若禁止运行 `npm.ps1`，可将命令中的 `npm` 替换为 `npm.cmd`。

## Remotion

打开 Studio：

```bash
npm run remotion:studio
```

渲染三个视频：

```bash
npm run render:intro
npm run render:teaser
npm run render:vertical
```

Composition：

| ID | 规格 | 用途 |
| --- | --- | --- |
| `CinematicIntro` | 1920×1080 / 30fps / 8s | 开场视觉预演与 WebGL fallback |
| `PortfolioTeaser` | 1920×1080 / 30fps / 15s | 横版作品集宣传片 |
| `VerticalTeaser` | 1080×1920 / 30fps / 15s | 重新排版的竖版宣传片 |

视频产物输出到 `public/video/`。Pages 工作流不会重复渲染 Remotion 视频，渲染后应将需要部署的 MP4 一并提交。

## 目录结构

```text
src/
├─ core/       Renderer、CameraRig、状态机、质量与输入
├─ scenes/     Intro、Hub、PMU、EKG、Security
├─ objects/    AgentCore、知识图谱、项目节点、粒子与信号
├─ systems/    交互、音频、可访问性、可见性、后处理
├─ ui/         开场、项目面板、HUD、Simple Mode
├─ data/       真实个人资料、项目与技术栈
└─ styles/     全局、HUD、面板与响应式样式

remotion/
├─ public/     Remotion 静态资源
└─ src/
   ├─ compositions/  三个 composition
   ├─ components/    共享视频组件与 ThreeCanvas
   └─ styles/        与网站共享的视觉 token
```

## 体验模式与性能

- `GUIDED MODE`：默认，点击/触摸项目节点或底部导航。
- `EXPLORER MODE`：仅桌面端，WASD 缓慢移动，Shift 轻微加速。
- `SIMPLE MODE`：完整的语义化 HTML/CSS 简历，可分享 `/#/simple`。
- 自动质量：根据设备能力与运行帧率选择 DPR、节点数、粒子数与 Bloom 强度。
- 移动端：降低 DPR、节点与粒子，禁用 Explorer Mode。
- 页面隐藏时暂停渲染与音频上下文。

## 键盘操作

| 按键 | 操作 |
| --- | --- |
| Tab / Enter | 聚焦并激活可交互元素 |
| 1 / 2 / 3 | 选择 PMU、LLM4EKG、Security |
| E / Enter | 运行当前项目演示 |
| Escape | 返回 Hub / 关闭面板 |
| W A S D | Explorer Mode 移动 |
| Shift | 轻微加速 |
| M | 显示/隐藏项目地图 |
| H | 显示帮助 |

## 可访问性与回退

- 开场开始后可立即跳过，并在同一 session 内记住完成状态。
- `prefers-reduced-motion` 默认进入无高速镜头的 Hub / Simple Mode 路径。
- WebGL 初始化失败时优先播放 `intro-fallback.mp4`，视频不可用时进入 Simple Mode。
- 完整项目内容、链接与联系方式始终存在于语义化 DOM 中。
- 所有键盘操作有可见焦点，状态变更通过 `aria-live` 提示。

## GitHub Pages

仓库名为 `heeere.github.io`，Vite 使用根路径 `base: '/'`。推送到 `main` 后，`.github/workflows/deploy.yml` 会执行：

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. 上传 `dist`
7. 部署 GitHub Pages

目标地址：<https://heeere.github.io/>

## 资源与版权

- 网站与 Remotion 使用代码绘制的 `JZY` 抽象身份标识；真人头像不进入公开仓库或构建产物。
- `public/images/og-cover.png`：由本项目 Remotion `CinematicIntro` 帧生成。
- 三个 MP4：由本项目 Remotion 源代码本地生成。
- 未下载或使用第三方音乐、音效、3D 模型或纹理；网站提示音由 Web Audio API 实时合成，默认关闭。

## 已知限制

- 浏览器与显卡差异会影响 WebGL 后处理效果；低性能设备自动采用简化质量。
- Explorer Mode 是增强体验，不含碰撞、重力或物理引擎。
- 项目流程演示使用明确标注的本地模拟数据，不会发起真实 LLM 请求，也不包含攻击载荷。
