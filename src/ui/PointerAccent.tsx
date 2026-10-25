import {useEffect, useRef} from 'react';
import {useSite} from '../app/site';

export const PointerAccent = () => {
  const {reducedMotion} = useSite();
  const cursor = useRef<HTMLSpanElement>(null);
  const pulse = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    if (reducedMotion || !fine.matches || !cursor.current || !pulse.current) return;
    const ring = cursor.current;
    const click = pulse.current;
    let frame = 0;
    let animation: Animation | undefined;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = event.target instanceof Element ? event.target.closest('a, button, .kinetic-text') : null;
        ring.dataset.active = String(Boolean(target) && event.pointerType === 'mouse');
        ring.style.translate = `${event.clientX}px ${event.clientY}px`;
      });
    };
    const press = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !(event.target instanceof Element) || !event.target.closest('a, button, .kinetic-text')) return;
      click.style.left = `${event.clientX}px`;
      click.style.top = `${event.clientY}px`;
      animation?.cancel();
      animation = click.animate([
        {transform: 'translate(-50%, -50%) scale(.4) rotate(-35deg)', opacity: .8},
        {transform: 'translate(-50%, -50%) scale(1.8) rotate(20deg)', opacity: 0},
      ], {duration: 600, easing: 'cubic-bezier(.16, 1, .3, 1)'});
    };
    const hide = () => { ring.dataset.active = 'false'; };
    document.addEventListener('pointermove', move, {passive: true});
    document.addEventListener('pointerdown', press, {passive: true});
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    return () => {
      cancelAnimationFrame(frame); animation?.cancel(); hide();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', press);
      document.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, [reducedMotion]);
  return <div className="pointer-accent" aria-hidden="true"><span ref={cursor} className="pointer-accent__ring" /><span ref={pulse} className="pointer-accent__pulse" /></div>;
};
