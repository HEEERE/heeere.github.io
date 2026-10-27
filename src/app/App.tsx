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
import {ExperienceProvider} from '../experience/Experience';
import {Opening} from '../ui/Opening';
import {useExhibitionMotion} from '../experience/useExhibitionMotion';
import {PointerAccent} from '../ui/PointerAccent';

export const App = () => {
  const {route, openScene, navigateScene, closeScene} = useRoute();
  const capabilities = useCapabilities();
  useExhibitionMotion(capabilities.reducedMotion);
  const [forceStatic, setForceStatic] = useState(() => window.location.hash === '#/simple');
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#/simple') setForceStatic(true);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const staticMode = forceStatic || !capabilities.webgl;
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
    () => ({rich, webglAvailable: capabilities.webgl, staticMode, overlayOpen: route.kind === 'scene', introDone, reducedMotion: capabilities.reducedMotion, openScene, toggleMode}),
    [rich, capabilities.webgl, staticMode, route.kind, introDone, capabilities.reducedMotion, openScene, toggleMode],
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
      <ExperienceProvider scene={route.kind === 'scene' ? route.scene : null}>
      <div inert={route.kind === 'scene'}>
        <a className="skip-link" href="#scenes">
          跳到场景列表
        </a>
        <Nav />
        <span className="reading-progress" aria-hidden="true" />
        <main className="site">
          <Hero />
          <SceneGrid />
          <WorksSection />
          <AboutSection />
          <StackSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
      {route.kind === 'scene' ? <ExhibitOverlay sceneId={route.scene} onClose={closeScene} onNavigate={navigateScene} /> : null}
      {!capabilities.webgl ? (
        <p className="webgl-note" role="status">
          当前浏览器未启用 WebGL，已切换为静态展示版本。
        </p>
      ) : null}
      <Opening onDone={finishIntro} />
      <PointerAccent />
      </ExperienceProvider>
    </SiteContext.Provider>
  );
};
