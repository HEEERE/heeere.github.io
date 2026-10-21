# 私人庭院 / Private Garden

藏在作品集里的私人知识库：日记、灵感、Prompt、工作流、Style、技术笔记与摘录。
它不参与公开站点的导航，也不会把任何明文内容带进这个公开仓库。

## 入口

- 在公开站点上依次输入 `garden`（间隔约 2.6 秒内），或长按左上角的「箱」字约 1 秒。
- 直接访问 `/vault/` 也可以，但第一次需要创建口令。
- 手机可用同一条路径安装成独立 PWA（添加到主屏幕）。

## 安全模型

- **端到端加密**：口令通过 PBKDF2-SHA-256（600,000 次）派生 AES-256-GCM 密钥，数据在写入 IndexedDB 前加密。
- 口令、密钥不写入仓库、不上传服务器。没有任何找回口令的入口；遗失口令等于遗失内容。
- **本机优先**：内容默认只保存在浏览器的 IndexedDB（`hakoniwa-vault`）。
- **可选同步**：用户自己提供一个 Fine-grained GitHub Token（只勾选一个**私有**仓库的 Contents 读写权限），
  客户端把加密快照写到该私有仓库的 `vault.json`，Token 只以加密形式保存在本机设置里。
  公开仓库的密文快照仍可能被索引，因此同步仓库必须是私有的。
- 附件同样加密；加密附件在同步快照中以密文形式保存。
- 可以导出加密备份（JSON）或明文 Markdown（明文导出请注意存放位置）。

## DSH 手机配对

设置页最下方可以粘贴 DSH 的手机配对链接，保存后生成二维码。
该链接包含访问令牌，加密后只保存在本机；**不要把它写进代码、截图或公开的地方**。
需要重新配对时，替换链接即可。

## PWA

- `vault/manifest.webmanifest`：名称、图标、standalone、`share_target`（接收系统分享）。
- `public/vault-sw.js`：注册在 `/vault/` 作用域，只处理分享目标（POST → Cache → 跳回 `/vault/?shared=1`），
  不缓存页面外壳；更新靠普通刷新。
- 分享入口：系统分享到「箱庭」后，打开庭院会自动把文字/链接/图片收成一条记录。

## 数据与恢复

- 30 天内删除的内容留在回收站，之后清理。
- 更换口令会重新加密全部记录与附件；旧口令导出的备份仍需要旧口令打开。
- 换设备：在设置里配置同一个私有仓库与口令，可“从远端恢复”，合并时以较新的记录为准。

## 开发与验证

```bash
npm run dev                      # 公共站点 + /vault/ 一起启动
npm test                         # 含 src/vault/vault.test.ts
node scripts/vault-shots.mjs     # 隐秘入口、建库、写入、设置页、移动端与错误口令回归
node scripts/vault-icons.mjs     # 重新生成 public/vault/icons/*
npm run build                    # 多页构建，产出 dist/ 与 dist/vault/
```

代码分层：

```text
src/vault/
├─ lib/            crypto / idb / model / markdown / sync / files / download
├─ components/     LockScreen / Sidebar / EntryList / EntryDetail / Composer / Settings / DSHCard / ShareLanding
├─ VaultApp.tsx    视图、筛选、快捷键与移动端导航
├─ VaultProvider.tsx  解锁、CRUD、自动锁定、同步、备份、附件
└─ vault*.css      设计 token、布局与组件样式
vault/index.html   独立的多页入口（noindex）
public/vault-sw.js Service Worker（分享目标）
public/vault/manifest.webmanifest
```

## 注意

- 仓库是公开的。任何真实口令、Token、配对链接都只应保存在浏览器的加密设置里，不要提交。
- `tmp/shots/` 下的 QA 截图已被 git 忽略；不要把带真实内容或令牌的截图提交。
