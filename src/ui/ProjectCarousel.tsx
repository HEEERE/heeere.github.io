import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useSite} from '../app/site';
import {projects} from '../data/projects';
import {getScene} from '../data/scenes';
import {SceneCard} from './SceneCard';

export const ProjectCarousel = () => {
  const {reducedMotion, overlayOpen} = useSite();
  const [center, setCenter] = useState(2); // RAISE is the first main exhibit.
  const [automatic, setAutomatic] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 980px)').matches);
  const gallery = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, DOMRect>());
  const animations = useRef<Animation[]>([]);
  const activeProject = projects[center]!;
  const ordered = [-1, 0, 1].map(offset => projects[(center + offset + projects.length) % projects.length]!);
  const playing = automatic && visible && !hovered && !focused && !hidden && !compact && !overlayOpen && !reducedMotion;

  const select = useCallback((next: number) => {
    const normalized = (next + projects.length) % projects.length;
    if (normalized === center) return;
    // Measure the current visual position, so rapid input continues smoothly.
    positions.current.clear();
    track.current?.querySelectorAll<HTMLElement>('[data-carousel-project]').forEach(node => {
      positions.current.set(node.dataset.carouselProject!, node.getBoundingClientRect());
    });
    animations.current.forEach(animation => animation.cancel());
    setCenter(normalized);
  }, [center]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const nextAnimations: Animation[] = [];
    track.current?.querySelectorAll<HTMLElement>('[data-carousel-project]').forEach(node => {
      const before = positions.current.get(node.dataset.carouselProject!);
      if (!before) return;
      const after = node.getBoundingClientRect();
      const dx = before.left - after.left;
      if (Math.abs(dx) < 1) return;
      nextAnimations.push(node.animate([
        {transform: `translateX(${dx}px)`, opacity: .72},
        {transform: 'translateX(0)', opacity: 1},
      ], {duration: 950, easing: 'cubic-bezier(.22, 1, .36, 1)'}));
    });
    animations.current = nextAnimations;
    return () => nextAnimations.forEach(animation => animation.cancel());
  }, [center, reducedMotion]);

  useEffect(() => {
    const query = matchMedia('(max-width: 980px)');
    const resize = () => {
      animations.current.forEach(animation => animation.cancel());
      positions.current.clear();
      setCompact(query.matches);
    };
    const visibility = () => setHidden(document.hidden);
    query.addEventListener('change', resize);
    document.addEventListener('visibilitychange', visibility);
    if (!('IntersectionObserver' in window) || !gallery.current) return () => {
      query.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {threshold: .35});
    observer.observe(gallery.current);
    return () => {
      observer.disconnect();
      query.removeEventListener('change', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => select(center + 1), 7000);
    return () => clearTimeout(timer);
  }, [playing, center, select]);

  return (
    <div ref={gallery} className="project-carousel" role="region" aria-roledescription="轮播" aria-label="研究项目展区"
      data-playing={playing} data-center={activeProject.id}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="project-carousel__controls">
        <p className="project-carousel__current" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          <span>当前主展 / ON VIEW</span><b>{activeProject.title}</b>
        </p>
        <div className="project-carousel__navigation">
          {!compact && !reducedMotion ? <button type="button" className="project-carousel__play" onClick={() => setAutomatic(value => !value)} aria-label={automatic ? '暂停项目自动轮播' : '开启项目自动轮播'} aria-pressed={!automatic}>{automatic ? '暂停轮播' : '自动轮播'}</button> : null}
          <button type="button" onClick={() => select(center - 1)} aria-label="上一个居中项目">←</button>
          <span className="project-carousel__count">0{center + 1} / 03</span>
          <button type="button" onClick={() => select(center + 1)} aria-label="下一个居中项目">→</button>
        </div>
      </div>
      <div className="project-carousel__selectors" aria-label="选择居中项目">
        {projects.map((project, index) => <button key={project.id} type="button" aria-pressed={center === index} aria-label={`将 ${project.title} 居中展示`} onClick={() => select(index)}><span>{project.number}</span>{project.title}<i aria-hidden="true" /></button>)}
      </div>
      <div className="project-carousel__window">
        <div ref={track} className="project-carousel__track">
          {ordered.map(project => {
            const featured = project.id === activeProject.id;
            return <div key={project.id} className={`project-carousel__slot${featured ? ' is-center' : ''}`} data-carousel-project={project.id} inert={compact && !featured} aria-hidden={compact && !featured ? true : undefined}>
              <SceneCard meta={getScene(project.scene)} featured={featured} />
            </div>;
          })}
        </div>
      </div>
    </div>
  );
};
