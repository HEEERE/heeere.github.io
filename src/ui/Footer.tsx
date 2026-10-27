import {scrollToSection} from '../app/useRoute';
import {useSite} from '../app/site';
import {profile} from '../data/profile';
import {IdentityMark} from './IdentityMark';
import {DecodeText} from './DecodeText';

export const Footer = () => {
  const {staticMode, toggleMode, webglAvailable} = useSite();
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__mark"><IdentityMark small /></span>
        <div>
          <b>HEEERE · 纪喆元</b>
          <p>个人作品集 · 2026</p>
        </div>
      </div>
      <div className="footer__meta">
        <span>
          © 2026 {profile.name} / {profile.englishName}
        </span>
        <span>天津 · 中国</span>
        <span>Built with <DecodeText text="React Three Fiber" /></span>
      </div>
      <div className="footer__links">
        <a href={`mailto:${profile.email}`}>邮件</a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          <DecodeText text="GitHub" /> ↗
        </a>
        <button type="button" onClick={toggleMode} disabled={!webglAvailable}>
          {!webglAvailable ? '当前为静态版' : staticMode ? '进入 3D 版本' : '静态版'}
        </button>
        <button type="button" onClick={() => scrollToSection('top')}>
          回到顶部 ↑
        </button>
      </div>
    </footer>
  );
};
