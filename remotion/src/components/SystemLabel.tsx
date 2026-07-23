import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../styles/theme';

export const SystemLabel: React.FC<{index: string; label: string; accent?: string; align?: 'left' | 'center'}> = ({index, label, accent = theme.lime, align = 'left'}) => {
  const frame = useCurrentFrame();
  return <div style={{display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 18, alignItems: 'center', opacity: interpolate(frame, [0, 18], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}), color: theme.muted, fontFamily: theme.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3}}>
    <span style={{display: 'grid', placeItems: 'center', width: 54, height: 54, border: `1px solid ${accent}`, color: accent}}>{index}</span>
    <span>{label}</span>
  </div>;
};
