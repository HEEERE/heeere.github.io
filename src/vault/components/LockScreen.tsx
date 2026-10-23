import {useEffect, useRef, useState, type FormEvent} from 'react';
import {useVault} from '../VaultProvider';
import {MIN_PASSPHRASE_LENGTH} from '../lib/crypto';
import {IconArrowLeft, IconCheck, IconLock, IconSpinner} from './Icons';

const strength = (value: string): {score: number; label: string} => {
  let score = 0;
  if (value.length >= MIN_PASSPHRASE_LENGTH) score += 1;
  if (value.length >= 14) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const label = score <= 2 ? '偏弱' : score === 3 ? '尚可' : '足够稳妥';
  return {score, label};
};

export const LockScreen = () => {
  const {status, createVault, unlock} = useVault();
  const creating = status === 'empty';
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [creating]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(`安全密码至少需要 ${MIN_PASSPHRASE_LENGTH} 个字符。`);
      return;
    }
    if (creating) {
      if (passphrase !== confirm) {
        setError('两次输入的密码不一致。');
        return;
      }
      if (!acknowledged) {
        setError('请确认你已保存好这串密码。');
        return;
      }
    }
    setBusy(true);
    try {
      if (creating) await createVault(passphrase);
      else await unlock(passphrase);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法打开庭院，请再试一次。');
    } finally {
      setBusy(false);
    }
  };

  const ratio = strength(passphrase);

  return (
    <div className="vault-lock">
      <div className="vault-lock__scene" aria-hidden="true">
        <div className="vault-lock__glow" />
        <div className="vault-lock__lines" />
        <div className="vault-lock__plinth">
          <div className="vault-lock__house">
            <span className="vault-lock__window is-warm" />
            <span className="vault-lock__window is-dim" />
            <span className="vault-lock__sign">PRIVATE</span>
          </div>
        </div>
        <p className="vault-lock__poem">
          雨夜里留了一盏灯。
          <br />
          这里的门，只为你开。
        </p>
      </div>

      <div className="vault-lock__panel">
        <a className="vault-back" href="/">
          <IconArrowLeft size={16} /> 回到公共主页
        </a>

        <div className="vault-lock__head">
          <span className="vault-lock__eyebrow">HAKONIWA / PRIVATE GARDEN</span>
          <h1>{creating ? '开启喆元的庭院' : '喆元的庭院'}</h1>
          <p>
            {creating
              ? '这里的内容会用这串密码加密，只保存在你的设备和你指定的私有仓库里。没有服务器，也没有找回密码的入口。'
              : '输入你的安全密码。所有内容都在本机解密，密码不会离开这台设备。'}
          </p>
        </div>

        <form className="vault-lock__form" onSubmit={submit}>
          <label className="vault-field">
            <span>{creating ? '设定安全密码' : '安全密码'}</span>
            <div className="vault-field__input">
              <IconLock size={17} />
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={passphrase}
                autoComplete={creating ? 'new-password' : 'current-password'}
                placeholder={creating ? `至少 ${MIN_PASSPHRASE_LENGTH} 个字符` : '输入密码'}
                onChange={(event) => setPassphrase(event.target.value)}
              />
              <button type="button" onClick={() => setShow((value) => !value)}>
                {show ? '隐藏' : '显示'}
              </button>
            </div>
          </label>

          {creating && (
            <>
              <div className="vault-strength" data-score={ratio.score}>
                <span className="vault-strength__bar" />
                <span className="vault-strength__bar" />
                <span className="vault-strength__bar" />
                <em>{ratio.label}</em>
              </div>
              <label className="vault-field">
                <span>再输入一次</span>
                <div className="vault-field__input">
                  <IconLock size={17} />
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    autoComplete="new-password"
                    placeholder="确认密码"
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </div>
              </label>
              <label className="vault-check">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>我知道这串密码无法找回，会自己妥善保存。</span>
              </label>
            </>
          )}

          {error && <p className="vault-lock__error">{error}</p>}

          <button type="submit" className="vault-btn vault-btn--primary vault-lock__submit" disabled={busy}>
            {busy ? <IconSpinner size={17} /> : <IconCheck size={17} />}
            {creating ? '创建庭院' : '解锁'}
          </button>
        </form>

        <div className="vault-lock__foot">
          <span>端到端加密 · 离线优先</span>
          <span className="vault-lock__dots">箱庭 / 2026</span>
        </div>
      </div>
    </div>
  );
};
