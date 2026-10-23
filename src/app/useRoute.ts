import {useCallback, useEffect, useState} from 'react';
import type {SceneId} from '../data/scenes';

type Route = {kind: 'home'} | {kind: 'scene'; scene: SceneId};

export type RouteState = {
  route: Route;
  openScene: (id: SceneId) => void;
  navigateScene: (id: SceneId) => void;
  closeScene: () => void;
};

const sceneIds: readonly SceneId[] = ['konbini', 'desk', 'archive', 'command', 'security', 'workshop', 'postbox'];
const legacyProjectScene: Record<string, SceneId> = {pmu: 'archive', ekg: 'command', security: 'security'};

const isSceneId = (value: string): value is SceneId => (sceneIds as readonly string[]).includes(value);

const readRoute = (): Route => {
  const hash = window.location.hash;
  if (hash.startsWith('#/scene/')) {
    const id = hash.slice('#/scene/'.length);
    if (isSceneId(id)) return {kind: 'scene', scene: id};
  }
  const legacy = hash.match(/^#\/project\/(pmu|ekg|security)$/);
  if (legacy && legacy[1]) {
    const scene = legacyProjectScene[legacy[1]];
    if (scene) return {kind: 'scene', scene};
  }
  return {kind: 'home'};
};

export const useRoute = (): RouteState => {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    if (/^#\/project\//.test(window.location.hash)) {
      const parsed = readRoute();
      if (parsed.kind === 'scene') window.history.replaceState({}, '', `#/scene/${parsed.scene}`);
    }
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const openScene = useCallback((id: SceneId) => {
    window.history.pushState({hakoniwaScene: true}, '', `#/scene/${id}`);
    setRoute({kind: 'scene', scene: id});
    document.body.classList.add('is-locked');
  }, []);

  const navigateScene = useCallback((id: SceneId) => {
    window.history.replaceState(window.history.state, '', `#/scene/${id}`);
    setRoute({kind: 'scene', scene: id});
  }, []);

  const closeScene = useCallback(() => {
    // A scene opened here owns one history entry. Return to the actual opener
    // so Back does not leave visitors stuck on duplicate home entries.
    if (window.history.state?.hakoniwaScene) {
      window.history.back();
      return;
    }
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    setRoute({kind: 'home'});
    document.body.classList.remove('is-locked');
  }, []);

  return {route, openScene, navigateScene, closeScene};
};

export const scrollToSection = (id: string): void => {
  const element = document.getElementById(id);
  if (!element) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth', block: 'start'});
};
