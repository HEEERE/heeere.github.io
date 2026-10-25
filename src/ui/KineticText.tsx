import {useEffect, useRef} from 'react';
import {useSite} from '../app/site';

/** Letter motion is decorative; the original text and link actions stay intact. */
export const KineticText = ({text}: {text: string}) => {
  const {reducedMotion} = useSite();
  const node = useRef<HTMLSpanElement>(null);
  const animations = useRef<Animation[]>([]);
  useEffect(() => {
    if (reducedMotion) animations.current.forEach(animation => animation.cancel());
    return () => animations.current.forEach(animation => animation.cancel());
  }, [reducedMotion]);
  const react = (pressed: boolean) => {
    if (reducedMotion) return;
    animations.current.forEach(animation => animation.cancel());
    animations.current = [...(node.current?.children ?? [])].map((letter, index) => letter.animate([
      {transform: 'translateY(0) rotate(0deg)'},
      {transform: `translateY(${pressed ? '-.16em' : '-.06em'}) rotate(${pressed ? (index % 2 ? 3 : -3) : 0}deg)`, color: 'var(--brass)'},
      {transform: 'translateY(0) rotate(0deg)'},
    ], {duration: pressed ? 620 : 480, delay: Math.min(index * 18, 180), easing: 'cubic-bezier(.22, 1, .36, 1)'}));
  };
  return <span ref={node} className="kinetic-text"
    onPointerEnter={event => { if (event.pointerType === 'mouse') react(false); }}
    onPointerDown={event => { if (event.isPrimary && event.button === 0 && event.pointerType === 'mouse') react(true); }}>
    {Array.from(text).map((letter, index) => <span key={index} className="kinetic-text__letter">{letter}</span>)}
  </span>;
};
