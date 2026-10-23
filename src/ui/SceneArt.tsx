import {useState, type CSSProperties} from 'react';
import type {SceneMeta} from '../data/scenes';

/**
 * Static stand-in for a diorama: a poster render of the real scene when it is
 * available, otherwise a restrained procedural plate. Used for the no-WebGL
 * mode, while scenes load, and when a scene fails to mount.
 */
export const SceneArt = ({meta, variant = 'card'}: {meta: SceneMeta; variant?: 'card' | 'exhibit' | 'hero'}) => {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div
      className={`scene-art scene-art--${variant}${imageFailed ? ' is-fallback' : ''}`}
      style={{'--scene-accent': meta.accent, '--scene-glow': meta.glow} as CSSProperties}
    >
      {!imageFailed ? (
        <img
          className="scene-art__image"
          src={`/images/scenes/${meta.id}.jpg`}
          alt=""
          loading={variant === 'card' ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={variant === 'hero' ? 'high' : 'auto'}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {imageFailed ? (
        <>
          <span className="scene-art__glow" />
          <span className="scene-art__index">{meta.index}</span>
          <span className="scene-art__jp" aria-hidden="true">
            {meta.nameJp}
          </span>
          <span className="scene-art__label">
            <b>{meta.nameZh}</b>
            <i>{meta.nameEn}</i>
          </span>
        </>
      ) : null}
    </div>
  );
};
