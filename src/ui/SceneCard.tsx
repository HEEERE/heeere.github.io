import {useRef, useState, type CSSProperties} from 'react';
import {useSite} from '../app/site';
import type {SceneMeta} from '../data/scenes';
import {SceneViewport} from './SceneViewport';
import {projects} from '../data/projects';
import {projectEvidence} from '../data/projectEvidence';
import {useExperience} from '../experience/Experience';

export const SceneCard = ({meta, featured = false}: {meta: SceneMeta; featured?: boolean}) => {
  const {rich, openScene, reducedMotion, overlayOpen} = useSite();
  const {visited} = useExperience();
  const card = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const press = useRef<{x: number; y: number; time: number} | null>(null);
  const project = featured ? projects.find((item) => item.scene === meta.id) : undefined;

  const open = () => { card.current?.focus({preventScroll: true}); openScene(meta.id); };

  return (
    <article
      ref={card}
      data-scene={meta.id}
      className={`scene-card${featured ? ' scene-card--featured' : ''}${meta.kind === 'project' ? ' scene-card--project' : ''}${hovered ? ' is-hovered' : ''}`}
      style={{'--scene-accent': meta.accent, '--scene-glow': meta.glow} as CSSProperties}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        press.current = null;
      }}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        press.current = {x: event.clientX, y: event.clientY, time: performance.now()};
      }}
      onPointerCancel={() => { press.current = null; }}
      onPointerUp={(event) => {
        const start = press.current;
        press.current = null;
        if (!start) return;
        const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (moved < 8 && performance.now() - start.time < 700) open();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`进入场景 ${meta.index}：${meta.nameZh}（${meta.kindLabel}）`}
    >
      <div className="scene-card__stage">
        <div className="scene-card__canvas">
          <SceneViewport meta={meta} tier="card" hovered={hovered} paused={overlayOpen} />
        </div>
        <span className="scene-card__frame" aria-hidden="true" />
        {rich ? (
          <span className="scene-card__hint" aria-hidden="true">
            {reducedMotion ? '悬停查看' : '拖拽旋转'}
          </span>
        ) : null}
        <span className="scene-card__enter" aria-hidden="true">
          进入场景 <i>↗</i>
        </span>
      </div>

      <div className="scene-card__body">
        {featured ? <p className="scene-card__edition">主展 / SELECTED PROJECT</p> : null}
        <div className="scene-card__caption">
          <span className="scene-card__no">{meta.index}</span>
          <div className="scene-card__names">
            <h3>{meta.nameZh}{visited.has(meta.id) ? <span className="scene-visited" aria-label="本次已到访" title="本次已到访" /> : null}</h3>
            <p>{meta.nameEn}</p>
          </div>
          <span className="scene-card__kind">{meta.kindLabel}</span>
        </div>
        <p className="scene-card__tagline">{meta.tagline}</p>
        {project ? (
          <div className="scene-card__feature-copy">
            <p>{projectEvidence[project.id].question}</p>
            <span>{project.title}</span>
            <div className="scene-card__invitation">走进{meta.nameZh} <span aria-hidden="true">↗</span></div>
          </div>
        ) : null}
      </div>
    </article>
  );
};
