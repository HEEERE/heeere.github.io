import {useEffect} from 'react';

/** Progressive enhancement: native scrolling and fully usable cards without motion. */
export const useExhibitionMotion = (reducedMotion: boolean) => {
  useEffect(() => {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    const nodes = [...document.querySelectorAll<HTMLElement>('.scene-card, .work__specimen')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.sceneReveal = 'visible';
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.08});
    const revealOnFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('[data-scene-reveal]');
      if (card) {
        card.dataset.sceneReveal = 'visible';
        observer.unobserve(card);
      }
    };
    for (const node of nodes) {
      node.dataset.sceneReveal = node.getBoundingClientRect().top < innerHeight ? 'visible' : 'pending';
      observer.observe(node);
    }
    document.addEventListener('focusin', revealOnFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', revealOnFocus);
      nodes.forEach(node => { delete node.dataset.sceneReveal; });
    };
  }, [reducedMotion]);
};
