# 喆元的庭院 · Android 1.0.1

从现有 Garden 私人知识库扩展的个人研究 App。页面随 APK 打包，启动和记录无需联网；使用 Android 系统 WebView 渲染，并通过受限原生接口接入文件选择、系统导出、剪贴板、返回键和文字分享。

## 功能

- 研究首页：知识库总数、近七天新增数和每日活动。
- 四种可编辑模板：论文阅读、实验记录、Prompt、每日复盘。
- 继承 Garden 的八类笔记、Markdown、图片/文件附件、标签、全文搜索、置顶、收藏和回收站。
- AES-256-GCM 本机加密、密码解锁；切到后台锁定，系统文件选择期间保留当前操作。未保存草稿在进程存活时保留，关闭进程会丢失。
- 接收其他应用通过 Android 分享菜单发送的文字和链接。解锁后进入草稿，保存后加密落盘。当前不接收外部图片分享，可在编辑器内添加图片和附件。
- 原生文件选择和保存：加密 JSON 备份、Markdown、图片与附件导出。
- 可选使用原有的私有 GitHub 仓库同步；未内置任何账号、Token 或密码。
- Android 阻止截图及任务预览截图；系统备份关闭。没有分析或广告 SDK。

## 安装与迁移

1. 将 `deliverables/Zheyuan-Garden-1.0.1.apk` 发送到手机，打开安装；如系统询问，允许当前文件管理器安装此 APK。
2. 要求 Android 8.0 或更高版本，并更新 Android System WebView。首次打开自行设定密码。安装包中没有预设密码或示例记录。
3. 如果原网页里已有记录，在网页 Garden「设置 → 备份与导出」导出加密备份；在 App 建立空庭院后进入设置，选择该文件并输入**备份原密码**恢复。
4. 恢复会替换 App 本机记录、密码及同步设置；有新记录时先备份。网页与 App 各自存储，安装不会自动迁移浏览器数据。
5. 需要跨设备同步时，在设置中连接同一个私有 GitHub 仓库。首次应从已有备份或远端恢复，避免独立创建的不同加密密钥混用。
6. 定期将加密备份保存在 App 之外。卸载或清除 App 数据会删除本机记录；忘记密码无法恢复。

## 构建与签名

```powershell
npm ci
npm run typecheck
npm run lint
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android.ps1 -SdkPath D:\android-sdk -JavaPath D:\java
node scripts/garden-qa.mjs
```

构建使用本地 Android SDK 34 的 aapt、d8、zipalign、apksigner 和 JDK 17，不依赖 Gradle。前端单独构建 Garden，不打包公共 3D 作品集。

APK 的应用 ID 为 `io.heeere.garden`，版本 `1.0.1`（versionCode 2），最低 API 26、目标 API 34。这是供个人侧载的签名安装包，未发布到应用商店。

首次构建在 `android/signing/` 生成专属 RSA 签名密钥及随机口令，后续构建复用。该目录与 APK 已被 Git 忽略。请私下备份整个签名目录，以便未来覆盖安装升级；不要上传到公开仓库。升级时提高 AndroidManifest 的 versionCode/versionName，并同步调整输出文件名。

## 验证范围

`scripts/garden-qa.mjs` 用手机尺寸 Chrome 加载 APK 内置的生产文件，套用与原生相同的 CSP，并模拟原生桥接口，验证建库、研究模板、保存、后台锁定、错误密码、搜索、系统文字分享入口、加密导出、重启读取和新设备恢复。它不替代真机系统文件选择器和 Android 生命周期的验证。

原生资源采用独立 HTTPS origin 映射到 APK assets，仅允许内置页面驻留 WebView；外部链接交给系统浏览器。设计依据：[Android 官方本地内容加载文档](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)。
