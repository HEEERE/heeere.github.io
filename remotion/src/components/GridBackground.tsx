import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../styles/theme';

export const GridBackground: React.FC<{accent?: string; density?: number}> = ({accent = theme.cyan, density = 72}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: theme.background, overflow: 'hidden'}}>
      <AbsoluteFill style={{
        opacity: interpolate(frame, [0, 36], [0.12, 0.34], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}),
        backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`,
        backgroundSize: `${density}px ${density}px`,
        translate: `${interpolate(frame, [0, 240], [0, -density], clamp)}px ${interpolate(frame, [0, 240], [0, density], clamp)}px`,
      }} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 58% 48%, ${accent}22, transparent 44%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 44%, rgba(0,0,0,.82) 100%)'}} />
    </AbsoluteFill>
  );
};
