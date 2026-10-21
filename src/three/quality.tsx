import {createContext, useContext, type ReactNode} from 'react';

export type QualityTier = 'hero' | 'card' | 'exhibit';

export type SceneQuality = {
  tier: QualityTier;
  /** Respect `prefers-reduced-motion`: no rain motion, no idle sway. */
  reducedMotion: boolean;
  /** Coarse pointer or small screen: fewer particles, no shadows, lower DPR. */
  lowPower: boolean;
  dpr: readonly [number, number];
  shadows: boolean;
  outlines: boolean;
  /** 0..1 multiplier for rain and particle counts. */
  particleScale: number;
  shadowMapSize: number;
  /** Skip expensive canvas textures where possible. */
  simplified: boolean;
};

const defaultQuality: SceneQuality = {
  tier: 'hero',
  reducedMotion: false,
  lowPower: false,
  dpr: [1, 2],
  shadows: true,
  outlines: true,
  particleScale: 1,
  shadowMapSize: 1024,
  simplified: false,
};

const QualityContext = createContext<SceneQuality>(defaultQuality);

export const useQuality = (): SceneQuality => useContext(QualityContext);

export const QualityProvider = ({value, children}: {value: SceneQuality; children: ReactNode}) => (
  <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
);

const isBrowser = typeof window !== 'undefined';

export const detectReducedMotion = (): boolean =>
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const detectLowPower = (): boolean => {
  if (!isBrowser) return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 900;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & {deviceMemory?: number}).deviceMemory ?? 8;
  return narrow || cores <= 4 || memory <= 4 || (coarse && window.innerWidth < 1200);
};

export const qualityFor = (tier: QualityTier, reducedMotion: boolean, lowPower: boolean): SceneQuality => {
  if (tier === 'card') {
    return {
      tier,
      reducedMotion,
      lowPower,
      dpr: lowPower ? [1, 1.15] : [1, 1.6],
      shadows: false,
      outlines: !lowPower,
      particleScale: lowPower ? 0.35 : 0.6,
      shadowMapSize: 512,
      simplified: true,
    };
  }
  if (tier === 'exhibit') {
    return {
      tier,
      reducedMotion,
      lowPower,
      dpr: lowPower ? [1, 1.35] : [1, 1.9],
      shadows: !lowPower,
      outlines: !lowPower,
      particleScale: lowPower ? 0.5 : 1,
      shadowMapSize: lowPower ? 1024 : 2048,
      simplified: lowPower,
    };
  }
  return {
    tier,
    reducedMotion,
    lowPower,
    dpr: lowPower ? [1, 1.25] : [1, 2],
    shadows: !lowPower,
    outlines: !lowPower,
    particleScale: lowPower ? 0.45 : 1,
    shadowMapSize: lowPower ? 1024 : 2048,
    simplified: lowPower,
  };
};
