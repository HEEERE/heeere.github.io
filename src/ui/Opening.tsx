import {useEffect, useRef, useState} from 'react';
import {useSite} from '../app/site';
import {motion} from '../shared/motion';
import {DecodeText} from './DecodeText';

/** Ensures one performance per full page load, even if React remounts the tree. */
let playedThisLoad = false;

type Phase = 'playing' | 'decoding' | 'leaving' | 'done';

const isPosterRequest = () => new URLSearchParams(window.location.search).has('poster');

/**
 * The opening is intentionally independent of the 3D bundle and of all remote
 * assets: it runs on its own timer, starts lifting before the last byte loads
 * and is removed from the DOM afterwards, so refresh never shows a long black
 * screen while the scenes are still downloading.
 */
export const Opening = ({onDone}: {onDone?: () => void}) => {
  const {reducedMotion} = useSite();
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>(() => (isPosterRequest() ? 'done' : 'playing'));

  // The module flag is set here rather than in the state initializer: a double
  // invoked initializer would consume the flag before the overlay ever renders.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (isPosterRequest()) return;
    if (playedThisLoad) {
      setPhase('done');
      return;
    }
    playedThisLoad = true;
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      delete document.documentElement.dataset.opening;
      onDone?.();
      return;
    }
    document.documentElement.dataset.opening = reducedMotion ? 'reduced' : 'logo';
  }, [phase, reducedMotion, onDone]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setTimeout(
      () => setPhase(reducedMotion ? 'done' : 'decoding'),
      reducedMotion ? motion.opening.reduced : motion.opening.hold,
    );
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'decoding') return;
    const timer = setTimeout(() => setPhase(reducedMotion ? 'done' : 'leaving'), reducedMotion ? 0 : motion.opening.decode);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('done'), motion.opening.exit);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`opening${phase === 'leaving' ? ' is-leaving' : ''}${reducedMotion ? ' opening--reduced' : ''}`}
      aria-hidden="true"
    >
      <div className="opening__inner">
        <img
          className="opening__mark"
          src="/images/brand/logo-mark-256.png"
          srcSet="/images/brand/logo-mark-256.png 256w, /images/brand/logo-mark.png 512w"
          sizes="(max-width: 720px) 96px, 132px"
          width="256"
          height="256"
          alt=""
          draggable={false}
        />
        <p className="opening__lockup">
          <span className="opening__word"><span>HEEERE</span></span>
          <span className="opening__note">纪喆元 · 个人作品集 · 2026</span>
        </p>
        <span className="opening__rule" />
        <span className="opening__meta"><DecodeText text="AI AGENT / KNOWLEDGE GRAPH / SECURITY" play={phase === 'decoding'} /></span>
      </div>
    </div>
  );
};
