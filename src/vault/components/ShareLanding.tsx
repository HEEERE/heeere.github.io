import {useState} from 'react';
import {canInstall, isStandalone, promptInstall} from '../pwa';
import {IconCheck, IconPhone, IconShare} from './Icons';

type Props = {onEnter: () => void};

export const ShareLanding = ({onEnter}: Props) => {
  const [message, setMessage] = useState('');
  const standalone = isStandalone();

  const install = async () => {
    if (!canInstall()) {
      setMessage('这个浏览器没有提供安装按钮。iPhone 可以点分享菜单里的「添加到主屏幕」。');
      return;
    }
    const result = await promptInstall();
    setMessage(result === 'accepted' ? '已添加到主屏幕。' : '已取消安装。');
  };

  return (
    <div className="vault-share">
      <div className="vault-share__card">
        <span className="vault-share__seal">箱</span>
        <span className="vault-share__eyebrow">HAKONIWA / PRIVATE GARDEN</span>
        <h1>把庭院放进手机</h1>
        <p>
          这里是私人庭院。加上主屏幕之后，可以像普通 App 一样打开；从别的应用分享文字、链接或图片时，也会直接收进庭院。
        </p>
        <div className="vault-share__steps">
          <div>
            <IconPhone size={18} />
            <strong>添加主屏幕</strong>
            <span>{standalone ? '当前已经是独立应用模式。' : '安卓 Chrome 会给出安装提示；iPhone 用分享菜单里的「添加到主屏幕」。'}</span>
          </div>
          <div>
            <IconShare size={18} />
            <strong>从系统分享</strong>
            <span>分享菜单里选择「箱庭」，内容会先放进待整理队列，解锁后自动出现。</span>
          </div>
          <div>
            <IconCheck size={18} />
            <strong>离线也能写</strong>
            <span>断网时照常记录，联网后同步到你自己的私有仓库。</span>
          </div>
        </div>
        <div className="vault-share__actions">
          <button type="button" className="vault-btn vault-btn--primary" onClick={() => void install()}>
            添加到主屏幕
          </button>
          <button type="button" className="vault-btn" onClick={onEnter}>
            进入庭院
          </button>
        </div>
        {message && <p className="vault-share__message">{message}</p>}
      </div>
    </div>
  );
};
