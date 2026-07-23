import {theme} from '../styles/theme';

type IdentityGlyphProps = {
  width: number;
  accent?: string;
};

export const IdentityGlyph: React.FC<IdentityGlyphProps> = ({width, accent = theme.lime}) => (
  <div
    style={{
      position: 'relative',
      display: 'grid',
      placeContent: 'center',
      width,
      aspectRatio: '.82',
      overflow: 'hidden',
      border: `2px solid ${accent}`,
      backgroundColor: theme.surface,
      backgroundImage:
        `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${theme.cyan}18 1px, transparent 1px), radial-gradient(circle at center, ${accent}24, transparent 58%)`,
      backgroundSize: '36px 36px, 36px 36px, 100% 100%',
      color: accent,
      textAlign: 'center',
    }}
  >
    <div style={{position: 'absolute', inset: '11%', border: `1px solid ${theme.cyan}66`, borderRadius: '50%'}} />
    <div style={{position: 'absolute', inset: '20%', border: `1px solid ${accent}55`, rotate: '45deg'}} />
    <strong style={{position: 'relative', fontFamily: theme.sans, fontSize: width * .3, lineHeight: .8, letterSpacing: -width * .025, textShadow: `${width * .025}px ${width * .025}px 0 ${theme.cyan}33`}}>JZY</strong>
    <small style={{position: 'relative', marginTop: width * .08, fontFamily: theme.mono, fontSize: width * .045, fontWeight: 800, letterSpacing: width * .012}}>AGENT / 00</small>
  </div>
);
