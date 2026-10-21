import {useRef, useState, type CSSProperties} from 'react';
import {useSite} from '../app/site';
import {mainScenes, type SceneMeta} from '../data/scenes';
import {SceneCanvas} from '../three/SceneCanvas';
import {SceneBoundary} from './SceneBoundary';
import {SceneArt} from './SceneArt';
import {SceneView} from './SceneView';

const SceneCard = ({meta}: {meta: SceneMeta}) => {
  const {rich, openScene, reducedMotion, overlayOpen} = useSite();
  const [hovered, setHovered] = useState(false);
  const press = useRef<{x: number; y: number; time: number} | null>(null);

  const open = () => openScene(meta.id);

  return (
    <article
      className={`scene-card${hovered ? ' is-hovered' : ''}`}
      style={{'--scene-accent': meta.accent, '--scene-glow': meta.glow} as CSSProperties}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        press.current = null;
      }}
      onPointerDown={(event) => {
        press.current = {x: event.clientX, y: event.clientY, time: performance.now()};
      }}
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
          {rich ? (
            <SceneBoundary fallback={<SceneArt meta={meta} />} label={meta.id}>
              <SceneCanvas meta={meta} tier="card" hovered={hovered} interactive sway={false} paused={overlayOpen}>
                <SceneView id={meta.id} />
              </SceneCanvas>
            </SceneBoundary>
          ) : (
            <SceneArt meta={meta} />
          )}
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

      <div className="scene-card__caption">
        <span className="scene-card__no">{meta.index}</span>
        <div className="scene-card__names">
          <h3>{meta.nameZh}</h3>
          <p>
            {meta.nameEn} <i>·</i> {meta.nameJp}
          </p>
        </div>
        <span className="scene-card__kind">{meta.kindLabel}</span>
      </div>
      <p className="scene-card__tagline">{meta.tagline}</p>
    </article>
  );
};

export const SceneGrid = () => (
  <section id="scenes" className="section section--scenes">
    <header className="section__head">
      <p className="eyebrow">
        <span>SCENES</span> / 箱庭コレクション
      </p>
      <div className="section__head-row">
        <h2>七个可以拖拽旋转的微缩场景</h2>
        <p className="section__lead">
          每张卡片都是一个单独搭建的三维场景，有底座、边界和灯光。按住拖动可以旋转，点击进入它对应的项目或页面。
          <br />
          首屏的雨夜便利店是第一个，下面六个都能点开。
        </p>
      </div>
      <div className="section__meta">
        <span>01 雨夜便利店 已在首屏</span>
        <span>拖拽旋转</span>
        <span>点击进入</span>
      </div>
    </header>

    <div className="scene-grid">
      {mainScenes.map((scene) => (
        <SceneCard key={scene.id} meta={scene} />
      ))}
    </div>
  </section>
);
