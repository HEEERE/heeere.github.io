import type {CSSProperties} from 'react';
import {scrollToSection} from '../app/useRoute';
import {useSite} from '../app/site';
import {konbiniScene} from '../data/scenes';
import {profile} from '../data/profile';
import {SceneCanvas} from '../three/SceneCanvas';
import {SceneBoundary} from './SceneBoundary';
import {SceneArt} from './SceneArt';
import {SceneView} from './SceneView';

const meta = konbiniScene;

export const Hero = () => {
  const {rich, reducedMotion, overlayOpen} = useSite();
  const scroll = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    scrollToSection(id);
  };

  return (
    <section
      id="top"
      className="hero"
      style={{'--scene-accent': meta.accent, '--scene-glow': meta.glow} as CSSProperties}
    >
      <div className="hero__copy">
        <p className="eyebrow">
          <span>PORTFOLIO</span> / 箱庭 HAKONIWA
        </p>
        <h1 className="hero__name">
          纪喆元
          <span className="hero__name-en">JI ZHEYUAN</span>
        </h1>
        <p className="hero__roles">
          AI Agent Systems <i>·</i> Knowledge Graph <i>·</i> Agent Security
        </p>
        <p className="hero__intro">{profile.intro}</p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#scenes" onClick={scroll('scenes')}>
            浏览场景 <span aria-hidden="true">↘</span>
          </a>
          <a className="btn" href="#works" onClick={scroll('works')}>
            查看项目
          </a>
          <a className="btn btn--quiet" href={profile.github} target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
        <dl className="hero__meta">
          <div>
            <dt>学校</dt>
            <dd>{profile.school} · {profile.schoolNote}</dd>
          </div>
          <div>
            <dt>专业</dt>
            <dd>{profile.major}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{profile.availability}</dd>
          </div>
        </dl>
      </div>

      <div className="hero__stage">
        <div className="hero__stage-inner">
          {rich ? (
            <SceneBoundary fallback={<SceneArt meta={meta} variant="hero" />} label="konbini">
              <SceneCanvas meta={meta} tier="hero" interactive sway paused={overlayOpen}>
                <SceneView id="konbini" />
              </SceneCanvas>
            </SceneBoundary>
          ) : (
            <SceneArt meta={meta} variant="hero" />
          )}
        </div>
        <div className="hero__stage-caption">
          <span className="hero__stage-index">SCENE {meta.index}</span>
          <span className="hero__stage-name">
            {meta.nameEn} <i>/</i> {meta.nameJp}
          </span>
        </div>
        {rich ? <p className="hero__drag-hint">{reducedMotion ? '静态展示' : '拖拽旋转 · 鼠标查看'}</p> : null}
        <span className="hero__ghost" aria-hidden="true">
          01
        </span>
      </div>

      <p className="hero__vertical" aria-hidden="true">
        雨の夜、コンビニの灯り。
      </p>
      <div className="hero__scroll" aria-hidden="true">
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
};
