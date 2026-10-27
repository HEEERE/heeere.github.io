/**
 * The HEEERE signature: champagne line art from the final mark, exported as a
 * transparent PNG. The raster file keeps the original curves and glow intact,
 * which no honest vector trace of the fine ellipse would preserve.
 *
 * `small` swaps in a 96px asset whose alpha is lightly dilated: at nav sizes
 * the original strokes fall under one device pixel and would read as a scratch.
 */
export const IdentityMark = ({className = '', small = false}: {className?: string; small?: boolean}) => (
  small ? (
    <img
      className={`identity-mark${className ? ` ${className}` : ''}`}
      src="/images/brand/logo-mark-nav.png"
      width="96"
      height="96"
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
    />
  ) : (
    <img
      className={`identity-mark${className ? ` ${className}` : ''}`}
      src="/images/brand/logo-mark-128.png"
      srcSet="/images/brand/logo-mark-128.png 128w, /images/brand/logo-mark-256.png 256w, /images/brand/logo-mark.png 512w"
      sizes="40px"
      width="128"
      height="128"
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
    />
  )
);
