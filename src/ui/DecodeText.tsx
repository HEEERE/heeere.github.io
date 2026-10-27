import {useCallback, useEffect, useRef, useState} from 'react';
import {useSite} from '../app/site';
import {motion} from '../shared/motion';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/·+*';

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#';

/**
 * A short decode pass for decorative English labels: on pointer entry the
 * visible glyphs are replaced with random characters, then restored from right
 * to left. The real text stays in the DOM (only painted transparent while the
 * overlay runs), so selection, copying and screen readers are unaffected.
 */
export const DecodeText = ({text, className = '', play = false}: {text: string; className?: string; play?: boolean}) => {
  const {reducedMotion} = useSite();
  const [glyphs, setGlyphs] = useState<string[] | null>(null);
  const [widths, setWidths] = useState<number[] | null>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const sourceRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const frameStepRef = useRef(-1);
  const startRef = useRef(0);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    frameStepRef.current = -1;
    setGlyphs(null);
    setWidths(null);
  }, []);

  const start = useCallback(() => {
    if (reducedMotion || text.length === 0 || activeRef.current) return;
    activeRef.current = true;
    cancelAnimationFrame(frameRef.current);
    const chars = Array.from(text);
    const source = sourceRef.current;
    setWidths(source ? Array.from(source.children, child => (child as HTMLElement).getBoundingClientRect().width) : null);
    const scramble = (char: string) => /[A-Za-z0-9]/.test(char) ? randomGlyph() : char;
    setGlyphs(chars.map(scramble));
    startRef.current = performance.now();
    frameStepRef.current = -1;

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const progress = Math.min(1, elapsed / motion.decode.duration);
      const step = Math.floor(elapsed / motion.decode.step);
      if (step !== frameStepRef.current) {
        frameStepRef.current = step;
        const restored = Math.floor(progress * chars.length);
        setGlyphs(chars.map((char, index) => (
          index >= chars.length - restored ? char : scramble(char)
        )));
      }
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else stop();
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [reducedMotion, text, stop]);

  useEffect(() => {
    if (play) start();
    return stop;
  }, [play, start, stop]);

  // Links and cards react across their full target, including keyboard focus.
  // Plain labels keep their own hit area; no extra tab stops are introduced.
  useEffect(() => {
    const node = nodeRef.current;
    const target = node?.closest<HTMLElement>('a, button, [role="button"]') ?? node;
    if (!target) return;
    const enter = (event: PointerEvent) => { if (event.pointerType === 'mouse') start(); };
    const press = (event: PointerEvent) => { if (event.isPrimary && event.pointerType === 'touch') start(); };
    target.addEventListener('pointerenter', enter);
    target.addEventListener('pointerleave', stop);
    target.addEventListener('pointercancel', stop);
    target.addEventListener('pointerdown', press);
    target.addEventListener('focusin', start);
    target.addEventListener('focusout', stop);
    return () => {
      target.removeEventListener('pointerenter', enter);
      target.removeEventListener('pointerleave', stop);
      target.removeEventListener('pointercancel', stop);
      target.removeEventListener('pointerdown', press);
      target.removeEventListener('focusin', start);
      target.removeEventListener('focusout', stop);
    };
  }, [start, stop]);

  return (
    <span
      ref={nodeRef}
      className={`decode-text${glyphs ? ' is-decoding' : ''}${className ? ` ${className}` : ''}`}
    >
      <span className="decode-text__source" ref={sourceRef}>
        {Array.from(text, (char, index) => (
          <span className="decode-text__char" key={index}>{char}</span>
        ))}
      </span>
      {glyphs ? (
        <span className="decode-text__ghost" aria-hidden="true">
          {glyphs.map((char, index) => (
            <span
              className="decode-text__char"
              key={index}
              style={widths?.[index] ? {width: `${widths[index]}px`} : undefined}
            >
              {char}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
};
