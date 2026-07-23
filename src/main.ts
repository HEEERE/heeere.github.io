import './styles/global.css';
import './styles/hud.css';
import './styles/panels.css';
import './styles/responsive.css';
import {SimpleMode} from './ui/SimpleMode';

const simpleMode = new SimpleMode();
simpleMode.bind();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const requestedSimpleMode = window.location.hash === '#/simple';

if (reduceMotion || requestedSimpleMode) {
  simpleMode.enter(false);
} else {
  document.documentElement.dataset.mode = 'cinematic';
}

const canvas = document.querySelector<HTMLCanvasElement>('#webgl');
let fallbackStarted = false;

const fallback = (): void => {
  if (fallbackStarted) return;
  fallbackStarted = true;
  document.documentElement.dataset.webgl = 'unavailable';
  if (document.documentElement.dataset.mode === 'simple') return;

  const video = document.querySelector<HTMLVideoElement>('#fallback-video');
  const layer = document.querySelector<HTMLElement>('#cinematic-layer');
  const finish = (): void => {
    video?.pause();
    simpleMode.enter(false);
  };

  if (video?.canPlayType('video/mp4')) {
    canvas?.setAttribute('hidden', '');
    layer?.classList.add('is-fallback');
    video.style.display = 'block';
    video.addEventListener('ended', finish, {once: true});
    video.addEventListener('error', finish, {once: true});
    document.querySelector<HTMLElement>('[data-skip-intro]')?.addEventListener('click', finish, {once: true});
    void video.play().catch(finish);
  } else {
    finish();
  }
};

if (!canvas) {
  simpleMode.enter(false);
} else {
  try {
    void import('./core/Experience').then(({Experience}) => {
      const experience = new Experience(canvas);
      void experience.start();
      window.addEventListener('pagehide', () => experience.dispose(), {once: true});
    }).catch((error: unknown) => {
      console.error('3D experience failed to load; using accessible fallback.', error);
      fallback();
    });
  } catch (error) {
    console.error('WebGL initialization failed; using accessible fallback.', error);
    fallback();
  }
}
