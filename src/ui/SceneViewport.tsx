import {lazy, Suspense, useCallback, useEffect, useRef, useState} from 'react';
import {useSite} from '../app/site';
import type {SceneMeta} from '../data/scenes';
import type {DemoControl} from './ProjectDossier';
import {SceneArt} from './SceneArt';
import {SceneBoundary} from './SceneBoundary';

const SceneRenderer = lazy(() => import('../three/SceneRenderer'));

export type SceneViewportProps = {
  meta: SceneMeta;
  tier: 'hero' | 'card' | 'exhibit';
  hovered?: boolean;
  paused?: boolean;
  story?: DemoControl;
  onReady?: () => void;
};

/** Keep the reading experience independent of WebGL and its download. */
export const SceneViewport = (props: SceneViewportProps) => {
  const {rich} = useSite();
  const holder = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(props.tier !== 'card');
  const [load, setLoad] = useState<'loading' | 'ready' | 'failed'>('loading');
  const ready = useCallback(() => { setLoad('ready'); props.onReady?.(); }, [props.onReady]);
  const failed = useCallback(() => setLoad('failed'), []);
  useEffect(() => {
    if (!rich || !nearby || load !== 'loading') return;
    const timer = setTimeout(failed, 25000);
    return () => clearTimeout(timer);
  }, [rich, nearby, load, failed]);
  useEffect(() => {
    if (nearby || !rich || !holder.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setNearby(true);
        observer.disconnect();
      }
    }, {rootMargin: '260px 0px'});
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, [nearby, rich]);

  const fallback = <SceneArt key={props.meta.id} meta={props.meta} variant={props.tier} />;
  return (
    <div ref={holder} className="scene-viewport" data-scene={props.meta.id} data-story-step={props.story?.step} data-story-variant={props.story?.variant} data-load={rich && nearby ? load : 'poster'}>
      {rich && nearby && load !== 'failed' ? (
        <SceneBoundary key={props.meta.id} fallback={fallback} label={props.meta.id} onFailure={failed}>
          <Suspense fallback={fallback}><SceneRenderer {...props} onReady={ready} /></Suspense>
        </SceneBoundary>
      ) : fallback}
      {rich && nearby ? <span key={load} className={`scene-load scene-load--${load}`} role="status"><i aria-hidden="true" /><span className="visually-hidden">{load === 'loading' ? '场景正在亮起' : load === 'ready' ? '场景已就绪' : '已保留静态场景，可继续阅读'}</span></span> : null}
    </div>
  );
};
