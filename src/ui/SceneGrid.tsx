import {useRef, useState, type CSSProperties} from 'react';
import {useSite} from '../app/site';
import {mainScenes, type SceneMeta} from '../data/scenes';
import {SceneViewport} from './SceneViewport';

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
        <h2>七个微缩场景，一份研究档案</h2>
        <p className="section__lead">
          从一个场景，走进一个项目。点击查看交互流程、技术报告与个人经历；支持的设备上，还可以拖拽模型，换个角度观察。
          <br />
          首屏的雨夜便利店是第一个，下面六个都能点开。
        </p>
      </div>
      <div className="section__meta">
        <span>01 雨夜便利店 已在首屏</span>
        <span>项目 · 关于 · 技能 · 联系</span>
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
