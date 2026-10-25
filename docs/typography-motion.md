# Typography and exhibition motion

The portfolio pairs locally served Inter Variable for Latin text, navigation and
tabular numbers with system Chinese sans-serif fonts. Chinese headings use their
own size, line-height and tracking. Cormorant Garamond italic provides the signature
and English chapter accents. Technical code and state labels retain IBM Plex Mono.

## Reference direction

- [Studio Freight](https://studiofreight.com/): a disciplined, asymmetric gallery
  around a clear visual anchor. The supplied freight.cargo URL was unavailable;
  the studio's current official site was reviewed instead.
- [LoveFrom](https://www.lovefrom.com/): typography and generous negative space.
- [A1 typographic portfolios](https://www.a1.gallery/websites/typographic-portfolio):
  consistent hierarchy across projects with different visual content.
- [Locomotive](https://locomotive.ca/en): large imagery, deliberate transitions
  between sections, and distinct display and interface typography.

These are design references, not copied assets, fonts or implementations.

## Behavior

- Project records and hero shortcuts keep LLM4EKG, PMU-Graph, RAISE order.
  RAISE is the default middle exhibit in the rotating gallery. The selected
  project moves to the raised center column while its neighbors sit lower.
  Arrows and named selectors support manual browsing. Desktop autoplay waits
  seven seconds and pauses offscreen, in background tabs, during hover/focus,
  or while a scene dialog is open. Compact screens and reduced motion use manual
  browsing. Project report URLs retain their stable IDs.
- Only heading lines reveal, staggered by 140 ms. Body text remains readable.
- Scene frames open from a modest inset mask; their inner image settles from
  1.075× scale. Keyboard focus immediately reveals the focused card.
- Project thumbnails have a small hover zoom and directional arrow feedback.
- Supporting desktop browsers add native scroll-driven hero depth and a thin
  reading progress rule. There is no scroll interception or animation library.
- The 1.8-second first-visit opening resolves the Hakoniwa signature from abstract
  glyphs, then lifts its curtain. Any input skips it; returning/mobile visitors
  use the brief entrance. No loading progress or completion is simulated.
- Name, chapter and navigation letters react in a small wave on mouse hover and
  click. A pointer-transparent ring and click pulse supplement the native cursor.
  Touch and reduced-motion users retain the same content and actions.
- Reduced-motion preferences disable reveals, parallax, zoom and tracking motion.
  Unsupported browsers retain the complete static layout. Print reveals all text.

Run `npm run build`, `npm test`, `npm run lint`, and `npm run qa:release` before
publication. Inspect desktop, tablet and narrow mobile widths for clipped titles,
then check pointer, keyboard, static mode and reduced-motion behavior.
