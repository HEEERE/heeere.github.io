import {useEffect, useState} from 'react';

const detectWebGL = (): boolean => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!context) return false;
    const lose = context.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
};

export type Capabilities = {
  webgl: boolean;
  reducedMotion: boolean;
  simple: boolean;
};

export const useCapabilities = (): Capabilities => {
  const [webgl] = useState(detectWebGL);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [simple, setSimple] = useState(() => window.location.hash === '#/simple');

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    const onHash = () => {
      if (window.location.hash === '#/simple') setSimple(true);
    };
    window.addEventListener('hashchange', onHash);
    return () => {
      query.removeEventListener('change', onChange);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  return {webgl, reducedMotion, simple};
};
