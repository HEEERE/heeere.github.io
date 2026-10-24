import {useEffect, useLayoutEffect, useState, type CSSProperties} from 'react';
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
  const [target, setTarget] = useState({x: innerWidth * .7, y: innerHeight * .5});
  useLayoutEffect(() => {
    if (!visible) return;
    const stage = document.querySelector('.hero__stage-inner')?.getBoundingClientRect();
    if (stage) setTarget({x: stage.left + stage.width * .53, y: stage.top + stage.height * .57});
    document.documentElement.dataset.opening = mode;
    return () => { delete document.documentElement.dataset.opening; };
  }, [mode, visible]);
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
  return <div className={`opening opening--${mode}`} aria-hidden="true" style={{'--arrival-x': `${target.x}px`, '--arrival-y': `${target.y}px`} as CSSProperties}>
    <div className="opening__mark"><IdentityMark /><span>箱庭 · HAKONIWA</span></div>
  </div>;
};
