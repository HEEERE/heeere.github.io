import {createContext, useContext} from 'react';
import type {SceneId} from '../data/scenes';

export type SiteContextValue = {
  /** When false the site renders its static (no WebGL) variant. */
  rich: boolean;
  staticMode: boolean;
  /** True while the fullscreen exhibit overlay is open. */
  overlayOpen: boolean;
  reducedMotion: boolean;
  openScene: (id: SceneId) => void;
  toggleMode: () => void;
};

export const SiteContext = createContext<SiteContextValue>({
  rich: false,
  staticMode: true,
  overlayOpen: false,
  reducedMotion: false,
  openScene: () => undefined,
  toggleMode: () => undefined,
});

export const useSite = (): SiteContextValue => useContext(SiteContext);
