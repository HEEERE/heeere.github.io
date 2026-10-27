# 庭院私有同步配置

已创建并验证私有仓库：https://github.com/HEEERE/hakoniwa-vault

| App 设置 | 值 |
| --- | --- |
| 仓库所有者 | HEEERE |
| 仓库名 | hakoniwa-vault |
| 分支 | main |
| 快照文件 | vault.json |

这些值已是 App 默认值。仓库初始化完成，真实庭院快照会在第一次同步时生成。

## 剩余的账号授权

打开 [庭院专用 Token 创建页](https://github.com/settings/personal-access-tokens/new?name=Zheyuan%20Garden%20Sync&target_name=HEEERE&expires_in=90&contents=write)。此链接预填名称、账号、90 天有效期与 Contents 读写权限。

1. Repository access 选择 **Only select repositories**，仅选择 **hakoniwa-vault**。
2. 确认 Contents 为 Read and write，然后 Generate token。
3. 将生成的 Token 粘贴到 App「设置与同步」的令牌栏，点击「保存并连接」。不需要把 Token 发到聊天中。
4. 90 天后令牌过期时，生成替代令牌并在各设备更新。

已有网页数据时，先从网页导出加密备份，在 App 恢复，再开启同步。独立创建的两个庭院即使密码相同，密钥盐也不同，不能直接混合同步。

第二台设备可以先建立空庭院，填写同一仓库和 Token；连接提示远端密钥不同后，用「从云端恢复」并输入第一台设备的庭院密码。恢复前备份本机已有记录，因为此操作会替换本机数据。

## 已验证和未完成的部分

- 已在 HEEERE 账号创建私有仓库，默认分支 main。
- 已用真实 GitHub API 验证应用同步模块的加密上传、下载、第二设备合并与解密。临时加密测试文件已从当前分支删除，未创建或修改真实 vault.json。
- 已修复只有远端数据变化时，本机不会应用更新的问题，并打包到 Android 1.0.1。可直接覆盖安装旧版，保留 App 数据。
- 同一修复也位于本地网站源码中；本轮没有发布公共网站。
- 尚未取得仅限此仓库的手机专用 Token，也无法操作用户手机中的解锁和同步配置。因此还不能宣称用户真实数据已经开始同步。
- GitHub CLI 现有登录仅用于创建仓库与测试，未写入源码、APK、备份或配置文件。

Token 模板参数与授权方式依据：[GitHub 官方说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#pre-filling-fine-grained-personal-access-token-details-using-url-parameters)。
