import {useEffect, useRef, useState} from 'react';
import {useSecretEntry} from '../app/secretEntry';
import {scrollToSection} from '../app/useRoute';
import {profile} from '../data/profile';
import {IdentityMark} from './IdentityMark';
import {SoundControls} from './SoundControls';
import {useExperience} from '../experience/Experience';

const links = [
  {id: 'scenes', label: '场景', en: 'SCENES'},
  {id: 'works', label: '项目', en: 'WORKS'},
  {id: 'about', label: '关于', en: 'ABOUT'},
  {id: 'stack', label: '技能', en: 'STACK'},
  {id: 'contact', label: '联系', en: 'CONTACT'},
] as const;

export const Nav = () => {
  const {section, setSection} = useExperience();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const {onClick: onSecretClick, ...secretHandlers} = useSecretEntry();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      setScrolled(window.scrollY > 30);
      let active = 'top';
      for (const link of links) {
        if ((document.getElementById(link.id)?.getBoundingClientRect().top ?? Infinity) <= innerHeight * .35) active = link.id;
      }
      setSection(active);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [setSection]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawer(false);
        menuRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setDrawer(false);
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setDrawer(false);
    };
    const desktop = window.matchMedia('(min-width: 981px)');
    const onResize = () => { if (desktop.matches) setDrawer(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocus);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocus);
      desktop.removeEventListener('change', onResize);
    };
  }, [drawer]);

  const go = (id: string) => {
    setDrawer(false);
    scrollToSection(id);
  };

  return (
    <header ref={headerRef} className={`nav${scrolled ? ' is-scrolled' : ''}${drawer ? ' is-open' : ''}`}>
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
          <IdentityMark />
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
            aria-current={section === link.id ? 'location' : undefined}
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
        <SoundControls />
        <a className="nav__github" href={profile.github} target="_blank" rel="noreferrer">
          GITHUB <span aria-hidden="true">↗</span>
        </a>
        <button
          ref={menuRef}
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

      <nav className="nav__drawer" id="nav-drawer" aria-label="移动端导航" inert={!drawer}>
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={section === link.id ? 'location' : undefined}
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
      </nav>
    </header>
  );
};
