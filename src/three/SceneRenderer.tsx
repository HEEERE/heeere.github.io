import type {SceneViewportProps} from '../ui/SceneViewport';
import {SceneView} from '../ui/SceneView';
import {SceneCanvas} from './SceneCanvas';

export default function SceneRenderer({meta, tier, hovered, paused, story, onReady}: SceneViewportProps) {
  return (
    <SceneCanvas meta={meta} tier={tier} hovered={hovered} paused={paused} onReady={onReady} interactive sway={tier !== 'card' && !story}>
      <SceneView id={meta.id} story={story} />
    </SceneCanvas>
  );
}
