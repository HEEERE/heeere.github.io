import {useMemo, useRef, useState, type FormEvent} from 'react';
import {useVault} from '../VaultProvider';
import {formatBytes, formatDateTime, type SyncConfig} from '../lib/model';
import {normalizeConfig, testConnection} from '../lib/sync';
import {DSHCard} from './DSHCard';
import {
  IconCheck,
  IconCloud,
  IconDownload,
  IconExternal,
  IconLock,
  IconRestore,
  IconSpinner,
  IconTrash,
} from './Icons';

type Props = {onClose: () => void};

const defaultSync: SyncConfig = {
  owner: 'HEEERE',
  repo: 'hakoniwa-vault',
  branch: 'main',
  path: 'vault.json',
  token: '',
  enabled: true,
};

const trimmed = (value: string): string => value.trim();

export const Settings = ({onClose}: Props) => {
  const vault = useVault();
  const {
    settings,
    meta,
    syncState,
    updateSettings,
    connectSync,
    disconnectSync,
    syncNow,
    changePassphrase,
    exportEncryptedBackup,
    exportMarkdown,
    importEncryptedBackup,
    restoreFromSync,
    resetDevice,
    notify,
  } = vault;

  const [syncForm, setSyncForm] = useState<SyncConfig>(settings.sync ?? defaultSync);
  const [showToken, setShowToken] = useState(false);
  const [syncBusy, setSyncBusy] = useState<'test' | 'connect' | 'sync' | ''>('');
  const [testMessage, setTestMessage] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [restorePass, setRestorePass] = useState('');
  const [passForm, setPassForm] = useState({current: '', next: '', confirm: ''});
  const [passBusy, setPassBusy] = useState(false);
  const [deviceName, setDeviceName] = useState(settings.deviceName);
  const [importPass, setImportPass] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [resetText, setResetText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const syncConfigured = Boolean(settings.sync?.enabled && settings.sync.token);
  const totalBytes = useMemo(
    () => (meta ? `${meta.iterations.toLocaleString('en-US')} 次 PBKDF2 迭代` : ''),
    [meta],
  );

  const saveSync = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed(syncForm.owner) || !trimmed(syncForm.repo) || !trimmed(syncForm.token)) {
      setTestMessage('仓库所有者和令牌不能为空。');
      return;
    }
    setSyncBusy('connect');
    setTestMessage('');
    try {
      await connectSync(normalizeConfig({...syncForm, enabled: true}));
      notify('已连接私有仓库，稍后自动同步', 'good');
    } catch (cause) {
      setTestMessage(cause instanceof Error ? cause.message : '连接失败');
    } finally {
      setSyncBusy('');
    }
  };

  const test = async () => {
    setSyncBusy('test');
    setTestMessage('');
    try {
      const result = await testConnection(normalizeConfig({...syncForm, enabled: true}));
      setTestMessage(result.ok ? `${result.message}${result.warning ? ` · ${result.warning}` : ''}` : result.message);
    } catch (cause) {
      setTestMessage(cause instanceof Error ? cause.message : '无法连接，请检查仓库与令牌权限。');
    } finally {
      setSyncBusy('');
    }
  };

  const doSync = async () => {
    setSyncBusy('sync');
    try {
      await syncNow();
    } finally {
      setSyncBusy('');
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passForm.next.length < 8) {
      notify('新密码至少 8 个字符', 'bad');
      return;
    }
    if (passForm.next !== passForm.confirm) {
      notify('两次输入的新密码不一致', 'bad');
      return;
    }
    setPassBusy(true);
    try {
      await changePassphrase(passForm.current, passForm.next);
      setPassForm({current: '', next: '', confirm: ''});
      notify('密码已更新，旧密码立即失效', 'good');
    } catch {
      notify('当前密码不正确', 'bad');
    } finally {
      setPassBusy(false);
    }
  };

  const pickImport = () => fileRef.current?.click();

  const runImport = async () => {
    if (!importFile) {
      notify('先选择一个备份文件', 'bad');
      return;
    }
    if (!importPass) {
      notify('输入这份备份的密码', 'bad');
      return;
    }
    if (!window.confirm('导入会合并备份里的记录。确定继续？')) return;
    setImportBusy(true);
    try {
      await importEncryptedBackup(importFile, importPass);
      setImportFile(null);
      setImportPass('');
      notify('备份已导入', 'good');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : '导入失败', 'bad');
    } finally {
      setImportBusy(false);
    }
  };

  const runRestore = async () => {
    if (!restorePass) {
      notify('输入要恢复的密码', 'bad');
      return;
    }
    if (!window.confirm('从云端恢复会用快照替换本机这些记录，建议先导出备份。继续？')) return;
    setSyncBusy('sync');
    try {
      await restoreFromSync(restorePass, settings.sync ?? normalizeConfig({...syncForm, enabled: true}));
      setRestorePass('');
      setShowRestore(false);
      notify('已从云端恢复', 'good');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : '恢复失败', 'bad');
    } finally {
      setSyncBusy('');
    }
  };

  const runReset = async () => {
    if (resetText !== '清空庭院') return;
    if (!window.confirm('这会删除这台设备上的所有记录与密钥，云端快照需要密码才能再次打开。确定继续？')) return;
    await resetDevice();
    setResetText('');
  };

  return (
    <div className="vault-settings">
      <header className="vault-settings__head">
        <div>
          <span className="vault-settings__eyebrow">SETTINGS</span>
          <h1>设置与同步</h1>
        </div>
        <button type="button" className="vault-btn" onClick={onClose}>
          返回庭院
        </button>
      </header>

      <div className="vault-settings__scroll">
        <section className="vault-settings__section">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>私有仓库同步</h2>
              <p>所有同步内容在离开浏览器前都已加密。仓库里只有密文和文件名。</p>
            </div>
            <span className={`vault-chip${syncConfigured ? ' is-ok' : ''}`}>
              {syncConfigured ? (syncState.status === 'ok' ? '已同步' : syncState.status === 'syncing' ? '同步中' : '已连接') : '未启用'}
            </span>
          </header>

          <dl className="vault-settings__facts">
            <div>
              <dt>状态</dt>
              <dd>{syncState.message || (syncConfigured ? '等待同步' : '只保存在这台设备')}</dd>
            </div>
            <div>
              <dt>上次同步</dt>
              <dd>{formatDateTime(syncState.at || settings.lastSyncAt)}</dd>
            </div>
            <div>
              <dt>加密</dt>
              <dd>{totalBytes || '本地密钥'}</dd>
            </div>
          </dl>

          <form className="vault-syncform" onSubmit={saveSync}>
            <div className="vault-syncform__grid">
              <label className="vault-field">
                <span>仓库所有者</span>
                <input value={syncForm.owner} onChange={(event) => setSyncForm({...syncForm, owner: event.target.value})} placeholder="GitHub 用户名" autoComplete="off" />
              </label>
              <label className="vault-field">
                <span>仓库名（私有）</span>
                <input value={syncForm.repo} onChange={(event) => setSyncForm({...syncForm, repo: event.target.value})} placeholder="hakoniwa-vault" autoComplete="off" />
              </label>
              <label className="vault-field">
                <span>分支</span>
                <input value={syncForm.branch} onChange={(event) => setSyncForm({...syncForm, branch: event.target.value})} placeholder="main" autoComplete="off" />
              </label>
              <label className="vault-field">
                <span>快照文件</span>
                <input value={syncForm.path} onChange={(event) => setSyncForm({...syncForm, path: event.target.value})} placeholder="vault.json" autoComplete="off" />
              </label>
            </div>
            <label className="vault-field">
              <span>Fine-grained token（仅此仓库 Contents 读写）</span>
              <div className="vault-field__input">
                <IconLock size={16} />
                <input
                  type={showToken ? 'text' : 'password'}
                  value={syncForm.token}
                  onChange={(event) => setSyncForm({...syncForm, token: event.target.value})}
                  placeholder="github_pat_…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" onClick={() => setShowToken((value) => !value)}>
                  {showToken ? '隐藏' : '显示'}
                </button>
              </div>
            </label>

            {testMessage && <p className="vault-settings__message">{testMessage}</p>}

            <div className="vault-syncform__actions">
              <button type="button" className="vault-btn" onClick={() => void test()} disabled={syncBusy !== ''}>
                {syncBusy === 'test' ? <IconSpinner size={16} /> : <IconCloud size={16} />} 测试连接
              </button>
              <button type="submit" className="vault-btn vault-btn--primary" disabled={syncBusy !== ''}>
                {syncBusy === 'connect' ? <IconSpinner size={16} /> : <IconCheck size={16} />}
                {syncConfigured ? '更新连接' : '保存并连接'}
              </button>
              {syncConfigured && (
                <>
                  <button type="button" className="vault-btn" onClick={() => void doSync()} disabled={syncBusy !== ''}>
                    {syncBusy === 'sync' ? <IconSpinner size={16} /> : <IconRestore size={16} />} 立即同步
                  </button>
                  <button
                    type="button"
                    className="vault-textbtn"
                    onClick={() => setShowRestore((value) => !value)}
                  >
                    从云端恢复
                  </button>
                  <button
                    type="button"
                    className="vault-textbtn vault-textbtn--danger"
                    onClick={() => {
                      if (window.confirm('断开同步？本机内容不会删除。')) void disconnectSync();
                    }}
                  >
                    断开
                  </button>
                </>
              )}
            </div>

            {showRestore && (
              <div className="vault-restore">
                <p>用快照文件里的密码恢复记录。适合换设备或清空浏览器数据后重建。</p>
                <div className="vault-restore__row">
                  <input
                    type="password"
                    value={restorePass}
                    placeholder="这份快照的密码"
                    autoComplete="off"
                    onChange={(event) => setRestorePass(event.target.value)}
                  />
                  <button type="button" className="vault-btn" onClick={() => void runRestore()} disabled={syncBusy !== ''}>
                    恢复
                  </button>
                </div>
              </div>
            )}

            <p className="vault-settings__warn">
              Token 与密码都只以加密形式保存在本机 IndexedDB。仓库必须是私有的；公开仓库会让密文快照被公开索引。
            </p>
            <a
              className="vault-settings__link"
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              创建一个 Fine-grained token <IconExternal size={14} />
            </a>
          </form>
        </section>

        <DSHCard />

        <section className="vault-settings__section">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>这台设备</h2>
              <p>设备名会显示在侧栏里，方便日后在多台设备之间辨认。</p>
            </div>
          </header>
          <div className="vault-settings__inline">
            <label className="vault-field">
              <span>设备名</span>
              <input
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                onBlur={() => void updateSettings({deviceName: deviceName.trim()})}
                placeholder="例如：书房的 MacBook"
              />
            </label>
            <label className="vault-field">
              <span>自动锁定</span>
              <select
                value={settings.autoLockMinutes}
                onChange={(event) => void updateSettings({autoLockMinutes: Number(event.target.value)})}
              >
                <option value={0}>不自动锁定</option>
                <option value={5}>离开 5 分钟</option>
                <option value={15}>离开 15 分钟</option>
                <option value={30}>离开 30 分钟</option>
                <option value={60}>离开 1 小时</option>
              </select>
            </label>
          </div>
        </section>

        <section className="vault-settings__section">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>安全密码</h2>
              <p>密码只在本机派生密钥，不会上传。更换后此前导出的备份仍用旧密码。</p>
            </div>
          </header>
          <form className="vault-passform" onSubmit={changePassword}>
            <label className="vault-field">
              <span>当前密码</span>
              <input
                type="password"
                value={passForm.current}
                autoComplete="current-password"
                onChange={(event) => setPassForm({...passForm, current: event.target.value})}
              />
            </label>
            <label className="vault-field">
              <span>新密码（至少 8 位）</span>
              <input
                type="password"
                value={passForm.next}
                autoComplete="new-password"
                onChange={(event) => setPassForm({...passForm, next: event.target.value})}
              />
            </label>
            <label className="vault-field">
              <span>再输入一次</span>
              <input
                type="password"
                value={passForm.confirm}
                autoComplete="new-password"
                onChange={(event) => setPassForm({...passForm, confirm: event.target.value})}
              />
            </label>
            <button type="submit" className="vault-btn" disabled={passBusy}>
              {passBusy ? <IconSpinner size={16} /> : <IconLock size={16} />} 更换密码
            </button>
          </form>
        </section>

        <section className="vault-settings__section">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>备份与导出</h2>
              <p>导出的是加密快照，只有密码能打开；Markdown 导出是明文的，注意保存位置。</p>
            </div>
          </header>
          <div className="vault-settings__inline">
            <button type="button" className="vault-btn" onClick={() => void exportEncryptedBackup()}>
              <IconDownload size={16} /> 导出加密备份
            </button>
            <button type="button" className="vault-btn" onClick={() => void exportMarkdown()}>
              <IconDownload size={16} /> 导出 Markdown
            </button>
          </div>
          <div className="vault-importer">
            <p>导入一份加密备份：</p>
            <div className="vault-importer__row">
              <button type="button" className="vault-btn" onClick={pickImport}>
                {importFile ? importFile.name : '选择备份文件'}
              </button>
              <input
                type="password"
                value={importPass}
                placeholder="备份密码"
                autoComplete="off"
                onChange={(event) => setImportPass(event.target.value)}
              />
              <button type="button" className="vault-btn vault-btn--primary" onClick={() => void runImport()} disabled={importBusy}>
                {importBusy ? <IconSpinner size={16} /> : <IconCheck size={16} />} 导入
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.hakoniwa,application/json"
              hidden
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
            />
            {importFile && <span className="vault-settings__time">{importFile.name} · {formatBytes(importFile.size)}</span>}
          </div>
        </section>

        <section className="vault-settings__section">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>关于这座庭院</h2>
              <p>离线优先、端到端加密的个人知识库。没有服务器保存明文，也没有找回密码的入口。</p>
            </div>
          </header>
          <dl className="vault-settings__facts">
            <div>
              <dt>创建于</dt>
              <dd>{meta ? formatDateTime(meta.createdAt) : '—'}</dd>
            </div>
            <div>
              <dt>加密方式</dt>
              <dd>AES-256-GCM · PBKDF2-SHA256 {meta ? `(${meta.iterations.toLocaleString('en-US')})` : ''}</dd>
            </div>
            <div>
              <dt>存储位置</dt>
              <dd>浏览器 IndexedDB + 可选私有仓库</dd>
            </div>
            <div>
              <dt>入口</dt>
              <dd>/vault/ · 不在公共导航里</dd>
            </div>
          </dl>
          <a className="vault-settings__link" href="/" target="_blank" rel="noreferrer">
            打开公共主页 <IconExternal size={14} />
          </a>
        </section>

        <section className="vault-settings__section vault-settings__section--danger">
          <header className="vault-settings__sectionhead">
            <div>
              <h2>清空这台设备</h2>
              <p>删除本机的全部记录、附件和密钥。若已连接同步，云端快照不会被删除。</p>
            </div>
          </header>
          <div className="vault-reset">
            <input
              value={resetText}
              placeholder="输入「清空庭院」以确认"
              autoComplete="off"
              onChange={(event) => setResetText(event.target.value)}
            />
            <button
              type="button"
              className="vault-btn vault-btn--danger"
              disabled={resetText !== '清空庭院'}
              onClick={() => void runReset()}
            >
              <IconTrash size={16} /> 清空
            </button>
          </div>
        </section>

        <footer className="vault-settings__foot">
          <span>箱庭 · PRIVATE GARDEN</span>
          <span>v{__APP_VERSION__}</span>
        </footer>
      </div>
    </div>
  );
};
