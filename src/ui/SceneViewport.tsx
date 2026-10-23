import {lazy, Suspense, useEffect, useRef, useState} from 'react';
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
};

/** Keep the reading experience independent of WebGL and its download. */
export const SceneViewport = (props: SceneViewportProps) => {
  const {rich} = useSite();
  const holder = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(props.tier !== 'card');
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
    <div ref={holder} className="scene-viewport">
      {rich && nearby ? (
        <SceneBoundary key={props.meta.id} fallback={fallback} label={props.meta.id}>
          <Suspense fallback={fallback}><SceneRenderer {...props} /></Suspense>
        </SceneBoundary>
      ) : fallback}
    </div>
  );
};
