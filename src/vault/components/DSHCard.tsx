import {useMemo, useState} from 'react';
import {renderSVG} from 'uqr';
import {useVault} from '../VaultProvider';
import {toBase64, utf8} from '../lib/crypto';
import {formatDateTime} from '../lib/model';
import {IconCheck, IconCopy, IconPhone, IconQr, IconTrash} from './Icons';

/**
 * DSH (DeepSeek Harness) hand-off.
 *
 * DSH desktop can expose a short-lived pairing URL. We never hard-code it in
 * the repository: the URL is entered here, stored only inside the encrypted
 * local settings, and encoded into a QR code that opens the vault already
 * carrying the pairing link (`/vault/?dsh=<base64url(link)>`). The phone then
 * has everything it needs to reach the desktop harness later.
 */
export const DSHCard = () => {
  const {settings, updateSettings, notify} = useVault();
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(!settings.dshPairUrl);

  const pairLink = useMemo(() => {
    const url = settings.dshPairUrl.trim();
    if (!url) return '';
    return `${window.location.origin}/vault/?dsh=${encodeURIComponent(toBase64(utf8(url)))}`;
  }, [settings.dshPairUrl]);

  const qr = useMemo(() => {
    if (!pairLink) return '';
    try {
      return renderSVG(pairLink, {
        ecc: 'M',
        border: 2,
        pixelSize: 8,
        blackColor: '#101711',
        whiteColor: '#f3ecd9',
      });
    } catch {
      return '';
    }
  }, [pairLink]);

  const copy = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label}已复制`, 'good');
    } catch {
      notify('浏览器没有允许复制，请长按选择', 'bad');
    }
  };

  const save = async () => {
    const value = input.trim();
    if (!/^https?:\/\//i.test(value)) {
      notify('请粘贴以 http(s):// 开头的配对链接', 'bad');
      return;
    }
    await updateSettings({dshPairUrl: value, dshUpdatedAt: Date.now()});
    setInput('');
    setEditing(false);
    notify('已保存 DSH 手机连接', 'good');
  };

  const remove = async () => {
    await updateSettings({dshPairUrl: '', dshUpdatedAt: Date.now()});
    setEditing(true);
    notify('已移除 DSH 配对链接');
  };

  return (
    <section className="vault-settings__section">
      <header className="vault-settings__sectionhead">
        <div>
          <h2>连接手机 · DSH</h2>
          <p>把 DSH 生成的一次性配对链接放进二维码，用手机扫码即可在手机上继续使用。</p>
        </div>
        <span className={`vault-chip${settings.dshPairUrl ? ' is-ok' : ''}`}>
          {settings.dshPairUrl ? '已连接' : '未连接'}
        </span>
      </header>

      {settings.dshPairUrl && !editing ? (
        <div className="vault-dsh">
          <div className="vault-dsh__qr" aria-label="DSH 配对二维码">
            {qr ? (
              <div className="vault-dsh__svg" dangerouslySetInnerHTML={{__html: qr}} />
            ) : (
              <span className="vault-dsh__qrfallback">二维码生成失败</span>
            )}
            <span className="vault-dsh__qlabel">DSH · 移动端入口</span>
          </div>
          <div className="vault-dsh__info">
            <div className="vault-dsh__row">
              <IconCheck size={16} />
              <span>配对链接已加密保存在本机</span>
            </div>
            <p className="vault-dsh__link" title={pairLink}>
              {pairLink}
            </p>
            <div className="vault-dsh__actions">
              <button type="button" className="vault-btn vault-btn--primary" onClick={() => void copy(pairLink, '入口链接')}>
                <IconCopy size={15} /> 复制入口
              </button>
              <button type="button" className="vault-btn" onClick={() => void copy(settings.dshPairUrl, '配对链接')}>
                <IconPhone size={15} /> 复制原链接
              </button>
              <button type="button" className="vault-textbtn" onClick={() => setEditing(true)}>
                重新粘贴
              </button>
              <button type="button" className="vault-textbtn vault-textbtn--danger" onClick={() => void remove()}>
                <IconTrash size={14} /> 移除
              </button>
            </div>
            <p className="vault-settings__note">
              配对链接由 DSH 生成，可能是临时地址，失效后重新生成并粘贴即可。手机与电脑需要在同一网络下，或都使用同一个可访问的 DSH 服务。
            </p>
            {settings.dshUpdatedAt > 0 && (
              <span className="vault-settings__time">写入于 {formatDateTime(settings.dshUpdatedAt)}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="vault-dsh__setup">
          <ol className="vault-steps">
            <li>在 DSH 桌面端打开手机连接，复制带 token 的配对链接。</li>
            <li>粘贴到下面，保存后会出现二维码。</li>
            <li>用手机扫码打开，随后可以「添加到主屏幕」，当作独立应用使用。</li>
          </ol>
          <label className="vault-field">
            <span>DSH 配对链接</span>
            <div className="vault-field__input">
              <IconQr size={17} />
              <input
                type="url"
                value={input}
                placeholder="https://…/pair?token=…"
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
          </label>
          <div className="vault-dsh__save">
            <button type="button" className="vault-btn vault-btn--primary" onClick={() => void save()} disabled={!input.trim()}>
              <IconCheck size={16} /> 保存并生成二维码
            </button>
            {settings.dshPairUrl && (
              <button type="button" className="vault-textbtn" onClick={() => setEditing(false)}>
                取消
              </button>
            )}
          </div>
          <p className="vault-settings__warn">
            这个链接包含访问令牌，只会以加密形式保存在这台设备上。请不要把它写进代码、截图或公开的地方。
          </p>
        </div>
      )}
    </section>
  );
};
