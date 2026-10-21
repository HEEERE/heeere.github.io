import {useEffect, useState} from 'react';
import {useSecretEntry} from '../app/secretEntry';
import {scrollToSection} from '../app/useRoute';
import {profile} from '../data/profile';

const links = [
  {id: 'scenes', label: '场景', en: 'SCENES'},
  {id: 'works', label: '项目', en: 'WORKS'},
  {id: 'about', label: '关于', en: 'ABOUT'},
  {id: 'stack', label: '技能', en: 'STACK'},
  {id: 'contact', label: '联系', en: 'CONTACT'},
] as const;

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const {onClick: onSecretClick, ...secretHandlers} = useSecretEntry();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setDrawer(false);
    scrollToSection(id);
  };

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${drawer ? ' is-open' : ''}`}>
      <a
        className="nav__brand"
        href="#top"
        data-secret-entry="brand"
        {...secretHandlers}
        onClick={(event) => {
          onSecretClick(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          go('top');
        }}
      >
        <span className="nav__mark" aria-hidden="true">
          箱
        </span>
        <span className="nav__brand-text">
          <b>箱庭</b>
          <i>HAKONIWA</i>
        </span>
      </a>

      <nav className="nav__links" aria-label="主要导航">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={(event) => {
              event.preventDefault();
              go(link.id);
            }}
          >
            <span>{link.label}</span>
            <em>{link.en}</em>
          </a>
        ))}
      </nav>

      <div className="nav__actions">
        <a className="nav__github" href={profile.github} target="_blank" rel="noreferrer">
          GITHUB <span aria-hidden="true">↗</span>
        </a>
        <button
          className="nav__menu"
          type="button"
          aria-expanded={drawer}
          aria-controls="nav-drawer"
          onClick={() => setDrawer((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span className="visually-hidden">{drawer ? '关闭菜单' : '打开菜单'}</span>
        </button>
      </div>

      <div className="nav__drawer" id="nav-drawer">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={(event) => {
              event.preventDefault();
              go(link.id);
            }}
          >
            <em>{link.en}</em>
            {link.label}
          </a>
        ))}
        <a href={profile.github} target="_blank" rel="noreferrer">
          <em>GITHUB</em>代码仓库 ↗
        </a>
      </div>
    </header>
  );
};
