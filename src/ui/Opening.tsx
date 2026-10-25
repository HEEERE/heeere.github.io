import {useEffect, useLayoutEffect, useState} from 'react';
import {useSite} from '../app/site';
import {readLocal, writeLocal} from '../experience/preferences';
import {IdentityMark} from './IdentityMark';

export const Opening = () => {
  const {reducedMotion} = useSite();
  const [mode] = useState(() => {
    if (window.location.hash || new URLSearchParams(location.search).has('poster') || matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';
    return readLocal('hakoniwa.arrived') || matchMedia('(max-width: 720px)').matches ? 'brief' : 'full';
  });
  const [visible, setVisible] = useState(mode !== 'none');
  const [word, setWord] = useState('H··/····,');
  useLayoutEffect(() => {
    if (!visible) return;
    document.documentElement.dataset.opening = mode;
    return () => { delete document.documentElement.dataset.opening; };
  }, [mode, visible]);
  useEffect(() => {
    if (mode !== 'full' || !visible || reducedMotion) return;
    const letters = Array.from('Hakoniwa,');
    const symbols = ['·', '/', '—', '+'];
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      setWord(letters.map((letter, index) => index < frame / 1.4 ? letter : symbols[(frame + index) % symbols.length]).join(''));
      if (frame >= letters.length * 1.4) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, [mode, visible, reducedMotion]);
  useEffect(() => {
    writeLocal('hakoniwa.arrived', '1');
    if (!visible) return;
    const finish = () => setVisible(false);
    const timer = setTimeout(finish, reducedMotion ? 0 : mode === 'full' ? 1800 : 500);
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const;
    events.forEach(name => window.addEventListener(name, finish, {passive: true, capture: true}));
    return () => { clearTimeout(timer); events.forEach(name => window.removeEventListener(name, finish, true)); };
  }, [mode, visible, reducedMotion]);
  if (!visible || reducedMotion) return null;
  return <div className={`opening opening--${mode}`} aria-hidden="true">
    <div className="opening__brand">
      <p className="opening__kicker">纪喆元 / A PERSONAL COLLECTION</p>
      <div className="opening__signature"><IdentityMark /><span className="opening__word">{word}</span></div>
      <div className="opening__lines"><span>Intelligence.</span><span>Memory.</span><span>Trust.</span></div>
      <span className="opening__rule" />
      <p className="opening__edition">七个微缩世界，一份研究档案。<span>01 — 07</span></p>
    </div>
  </div>;
};
