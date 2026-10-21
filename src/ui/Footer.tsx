import {scrollToSection} from '../app/useRoute';
import {useSite} from '../app/site';
import {profile} from '../data/profile';

export const Footer = () => {
  const {staticMode, toggleMode} = useSite();
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__mark">箱</span>
        <div>
          <b>箱庭 HAKONIWA</b>
          <p>一组微缩场景构成的个人作品集。</p>
        </div>
      </div>
      <div className="footer__meta">
        <span>
          © 2026 {profile.name} / {profile.englishName}
        </span>
        <span>海口 · 中国</span>
        <span>Built with React Three Fiber</span>
      </div>
      <div className="footer__links">
        <a href={`mailto:${profile.email}`}>邮件</a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <button type="button" onClick={toggleMode}>
          {staticMode ? '进入 3D 版本' : '静态版'}
        </button>
        <button type="button" onClick={() => scrollToSection('top')}>
          回到顶部 ↑
        </button>
      </div>
    </footer>
  );
};
