import {createContext, useContext} from 'react';
import type {SceneId} from '../data/scenes';

export type SiteContextValue = {
  /** When false the site renders its static (no WebGL) variant. */
  rich: boolean;
  webglAvailable: boolean;
  staticMode: boolean;
  /** True while the fullscreen exhibit overlay is open. */
  overlayOpen: boolean;
  /** True once the opening moment has finished; heavier 3D mounting waits for it. */
  introDone: boolean;
  reducedMotion: boolean;
  openScene: (id: SceneId) => void;
  toggleMode: () => void;
};

export const SiteContext = createContext<SiteContextValue>({
  rich: false,
  webglAvailable: false,
  staticMode: true,
  overlayOpen: false,
  introDone: true,
  reducedMotion: false,
  openScene: () => undefined,
  toggleMode: () => undefined,
});

export const useSite = (): SiteContextValue => useContext(SiteContext);
