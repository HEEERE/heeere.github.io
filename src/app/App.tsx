import {useCallback, useEffect, useMemo, useState} from 'react';
import {SiteContext} from './site';
import {useRoute} from './useRoute';
import {useCapabilities} from './capabilities';
import {Nav} from '../ui/Nav';
import {Hero} from '../ui/Hero';
import {SceneGrid} from '../ui/SceneGrid';
import {WorksSection} from '../ui/WorksSection';
import {AboutSection} from '../ui/AboutSection';
import {StackSection} from '../ui/StackSection';
import {ContactSection} from '../ui/ContactSection';
import {Footer} from '../ui/Footer';
import {ExhibitOverlay} from '../ui/ExhibitOverlay';

export const App = () => {
  const {route, openScene, navigateScene, closeScene} = useRoute();
  const capabilities = useCapabilities();
  const [forceStatic, setForceStatic] = useState(() => window.location.hash === '#/simple');

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#/simple') setForceStatic(true);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const staticMode = forceStatic || capabilities.simple;
  const rich = capabilities.webgl && !staticMode;

  const toggleMode = useCallback(() => {
    if (staticMode) {
      setForceStatic(false);
      if (window.location.hash === '#/simple') {
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
      }
    } else {
      setForceStatic(true);
    }
  }, [staticMode]);

  const siteValue = useMemo(
    () => ({rich, staticMode, overlayOpen: route.kind === 'scene', reducedMotion: capabilities.reducedMotion, openScene, toggleMode}),
    [rich, staticMode, route.kind, capabilities.reducedMotion, openScene, toggleMode],
  );

  useEffect(() => {
    document.documentElement.dataset.view = rich ? 'rich' : 'static';
  }, [rich]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', route.kind === 'scene');
    return () => document.body.classList.remove('is-locked');
  }, [route.kind]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.documentElement.dataset.loaded = 'true';
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <SiteContext.Provider value={siteValue}>
      <a className="skip-link" href="#scenes">
        跳到场景列表
      </a>
      <Nav />
      <main className="site">
        <Hero />
        <SceneGrid />
        <WorksSection />
        <AboutSection />
        <StackSection />
        <ContactSection />
      </main>
      <Footer />
      {route.kind === 'scene' ? <ExhibitOverlay sceneId={route.scene} onClose={closeScene} onNavigate={navigateScene} /> : null}
      {!capabilities.webgl ? (
        <p className="webgl-note" role="status">
          当前浏览器未启用 WebGL，已切换为静态展示版本。
        </p>
      ) : null}
    </SiteContext.Provider>
  );
};
