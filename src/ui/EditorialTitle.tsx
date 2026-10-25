import {useEffect, useRef, type CSSProperties} from 'react';
import {KineticText} from './KineticText';

/** Only headings move; body copy stays available throughout the reveal. */
export const EditorialTitle = ({lines, accent}: {lines: readonly string[]; accent: string}) => {
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = title.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!node || motion.matches || !('IntersectionObserver' in window)) return;

    // Keep content visible until enhancement is ready, including without IO support.
    node.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      node.dataset.reveal = 'visible';
      observer.disconnect();
    }, {threshold: 0.15});
    observer.observe(node);
    const reveal = () => {
      if (motion.matches) {
        delete node.dataset.reveal;
        observer.disconnect();
      }
    };
    motion.addEventListener('change', reveal);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', reveal);
      delete node.dataset.reveal;
    };
  }, []);

  return (
    <h2 ref={title} className="editorial-title">
      {lines.map((line, index) => (
        <span className="editorial-title__line" key={line} style={{'--line-index': index} as CSSProperties}>
          <span><KineticText text={line} /></span>
        </span>
      ))}
      <span className="editorial-title__line editorial-title__accent" aria-hidden="true" style={{'--line-index': lines.length} as CSSProperties}>
        <em lang="en"><KineticText text={accent} /></em>
      </span>
    </h2>
  );
};
