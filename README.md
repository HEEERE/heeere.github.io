# 箱庭 HAKONIWA — 纪喆元的场景式作品集

纪喆元的个人作品集。站点由 **七个可以旋转查看的微缩场景** 组成，每个场景对应一个项目或内容页面（关于、技能、联系方式）。

- **首页主场景**：雨夜便利店街角（可旋转、缩放、持续降雨、自动门开合）
- **场景入口**：学习工作台 / 记忆档案室 / 应急指挥室 / 防御实验室 / 工具工坊 / 街角邮箱
- **项目入口**：PMU-Graph、LLM4EKG、MAJD-Guard
- **职业定位**：AI Agent 系统开发 · 知识工程与安全；所在地天津。
- **项目档案**：实现成果、箱庭流程演示、可下载技术报告，以及源码 / 项目交流入口。防御项目使用当前名称 MAJD-Guard。
- 每个场景都是真实搭在博物馆式底座上的三维立体模型，而不是“加了 3D 倾斜的卡片”。

## 视觉与实现方向

- 三渲二 / toon-NPR：保留阶梯 ramp 与局部反向外扩描边；木材、喷漆金属、墙面、地砖、湿路面加入程序化凹凸与物理材质响应。
- 微缩模型感：统一深色木质底座、黄铜名牌、明确的边界与构图
- 日式夜景氛围：冷暖对比、湿路面反射、灯箱与屏光、轻量动效
- 全部场景由代码程序化搭建（R3F 组件 + Canvas 程序纹理），无需 Blender / GLB 资产
- 画面质感主要来自 **Canvas 程序纹理**：招牌、海报、屏幕、价签、货架商品、卡座抽屉标签等

## 技术栈

- Vite + TypeScript（strict）
- React 19 + React Three Fiber 9 + Drei
- Three.js 0.180
- Canvas 2D 程序纹理 / 程序几何体
- Vitest + ESLint
- GitHub Actions → GitHub Pages

Remotion 子项目仍保留在 `remotion/`（历史视频产物），但**不参与网站运行时**。

## 目录结构

```text
src/
├─ app/          App 外壳、hash 路由、能力检测、站点上下文
├─ data/         个人信息、项目、技能、场景目录（场景索引与相机参数）
├─ three/
│  ├─ SceneCanvas.tsx   每个场景独立的 Canvas + 自动取景 + OrbitControls
│  ├─ quality.tsx       画质分档（hero / card / exhibit）与低性能降级
│  ├─ materials.ts      toon / flat / glass / metal 材质缓存
│  ├─ geometry.ts       程序化几何体缓存
│  ├─ kit/              微缩场景工具：模型底台、灯光、雨、粒子、基础几何组件
│  ├─ textures/         程序纹理库（表面、招牌、屏幕、道具、后期光效）
│  └─ canvas.ts         Canvas 绘图辅助与纹理缓存
├─ scenes/
│  ├─ konbini/          01 雨夜便利店（分 Storefront / Interior / Street）
│  ├─ desk/             02 学习工作台
│  ├─ archive/          03 记忆档案室（PMU-Graph）
│  ├─ command/          04 应急指挥室（LLM4EKG）
│  ├─ security/         05 防御实验室（多智能体污染防御）
│  ├─ workshop/         06 工具工坊（Stack）
│  └─ postbox/          07 街角邮箱（Contact）
├─ ui/           导航、首屏、场景卡片、项目/关于/技能/联系区块、详情层
├─ vault/        隐藏的私人庭院（加密笔记 + PWA，见 docs/vault.md）
└─ styles/       设计 token、布局、场景、区块、详情层、响应式
docs/scene-authoring.md   如何新增一个场景（kit API、风格与性能规则）
docs/vault.md             私人庭院的安全模型、同步与验证方式
vault/index.html          庭院的独立多页入口（noindex）
```

## 场景式导航

- 首页首屏是场景 01「雨夜便利店」，可直接拖拽旋转。
- 场景入口区是 6 张 **实时渲染的三维微缩场景卡片**：悬停轻推镜头，拖拽旋转查看，点击进入。
- 点击后进入左右分栏的「展陈详情层」（`#/scene/<id>`）：左侧大场景可旋转缩放，右侧是该场景承载的内容。
- `Esc` 关闭，`←/→` 切换上一个 / 下一个场景。
- 键盘可 Tab 到任意场景卡片，`Enter` / `Space` 进入。
- 三个项目场景的装置标记与流程步骤联动，场景内可查看输出、前进及重看。分支分别展示验证失败、证据缺失与污染阻断；不展示具体实验数据。
- 顶部资料导航可直接查看流程、技术报告和公开源码。报告下载由 `npm run reports` 从 `src/data/projectEvidence.ts` 生成，生产构建自动同步。
- 验收路径、资料来源与视觉规则见 [docs/portfolio-acceptance.md](docs/portfolio-acceptance.md)。

## 内容映射

| 场景 | 入口用途 | 内容 |
| --- | --- | --- |
| 01 雨夜便利店 | World / Entrance | 欢迎与作品入口 |
| 02 学习工作台 | About / Profile | 学校、专业、课程、研究方向、个人总结 |
| 03 记忆档案室 | Project 01 | PMU-Graph |
| 04 应急指挥室 | Project 02 | LLM4EKG |
| 05 防御实验室 | Project 03 | 多智能体污染防御实验平台 |
| 06 工具工坊 | Stack / Skills | 技能分组与能力清单 |
| 07 街角邮箱 | Contact | 邮箱、GitHub、地点、状态 |

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

## 新增一个场景

1. 在 `src/data/scenes.ts` 添加元数据与相机视角（azimuth / elevation / target / padding）。
2. 在 `src/scenes/<id>/` 下创建 `<Name>Scene.tsx`，以 `DioramaBase` 为底座搭建内容。
3. 在 `src/ui/SceneView.tsx` 的场景 registry 中注册。
4. 阅读 `docs/scene-authoring.md` 了解 kit API、材质 / 纹理规范、性能预算与验证方式。

## 交互与可访问性

- `prefers-reduced-motion`：关闭自动运镜、雨与粒子动画，场景保持静态可看。
- 无 WebGL / 出错：单场景边界捕获错误并回退为静态场景插画，不拖垮整页。
- `/#/simple` 或页脚「静态版」：整站切换为无 3D 的静态展示版本；页脚可切回 3D。
- 全部内容（个人资料、项目详情、联系方式）始终存在于语义化 DOM 中；Canvas 只是增强层。
- 场景卡片支持键盘操作与可见焦点；详情层为 `role="dialog"`，`Esc` 关闭并返回焦点。
- 静态 `<noscript>` 回退提供姓名、方向与联系方式。

## 开发与验证脚本

```bash
npm run typecheck   # TS strict + Remotion 子项目
npm run lint
npm test
npm run build       # typecheck + 生产构建
npm run preview     # 预览 dist

npm run qa -- http://127.0.0.1:5173/ # 原有导航回归（开发预览）
npm run qa:portfolio # 箱庭流程、资料入口、移动端及静态回退验收
npm run qa:release   # 先 build；自动启动生产预览并运行全部浏览器验收
npm run shots       # 截取桌面各区块到 tmp/shots/
npm run posters     # 重新生成 public/images/scenes/*.jpg（场景海报 / 静态回退）
npm run og          # 重新生成 public/images/og-cover.png
npm run dev         # 开发服务器；配合 node scripts/closeup.mjs 做单场景检查
node scripts/vault-shots.mjs   # 私人庭院：隐秘入口、加密笔记、设置页、移动端、错误口令回归
node scripts/vault-icons.mjs   # 重新生成 PWA 图标
```

> `qa / shots / posters / og / closeup` 需要本机安装 Chrome（`playwright-core` 通过 `channel: 'chrome'` 调用，不额外下载浏览器）。

## 场景海报与静态版

`public/images/scenes/<id>.jpg` 是各场景的真实渲染海报，用途有三处：

1. 画布加载完成前的占位图（海报淡出、实时场景淡入）。
2. `/#/simple`、无 WebGL 或单场景渲染失败时的静态回退。
3. README / 分享内容中的展示图（`docs/screenshots/`）。

新增或修改场景后，运行 `npm run posters`（需先 `npm run dev`）即可刷新海报。

## 私人庭院（隐藏页面）

站点里还藏着一个不进入导航的私人知识库 `/vault/`：本地优先、端到端加密的日记 / 灵感 / Prompt / 工作流 / 技术笔记。
在公开页依次输入 `garden` 或长按左上角「箱」字即可进入；它支持装成手机 PWA、系统分享收集、以及同步到你自己的私有 GitHub 仓库。
它不依赖后端，也不会把任何明文内容放进这个公开仓库。设计与安全说明见 [docs/vault.md](docs/vault.md)。

## GitHub Pages 部署

仓库名为 `heeere.github.io`，Vite 使用根路径 `base: '/'`。推送到 `main` 后，`.github/workflows/deploy.yml` 会执行 `npm ci` → typecheck → lint → test → build → 依赖安全审计 → 生产浏览器验收 → 部署 `dist`。Pull Request 执行相同检查，不发布。

浏览器验收覆盖手机布局、项目分支与报告下载、静态版往返切换、浏览器历史、键盘焦点、无 WebGL / 无 JavaScript / 3D 下载失败的回退、PWA 分享及发布资源。CI 自动安装对应 Chromium 并保留 7 天验收截图，本地使用 Chrome。完整验收说明见 [上线验收记录](docs/release-readiness.md)。

目标地址：<https://heeere.github.io/>

## 资源与版权

- 所有三维场景、纹理、图标与身份标识均由代码绘制，未使用第三方模型或贴图。
- 字体：Cormorant Garamond 与 IBM Plex Mono（`@fontsource`，SIL OFL）；中文使用系统字体栈。
- `public/images/og-cover.png` 与 `public/images/scenes/*.jpg`：由本项目首页与各场景截图生成。
- `remotion/` 为早期视频实验保留，不在站点运行时使用；渲染输出改为 `remotion/out/`，不再进入 `public/` 构建产物。
