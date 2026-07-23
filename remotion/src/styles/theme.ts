import {DESIGN_TOKENS} from '../../../src/shared/design';

export const theme = {
  ...DESIGN_TOKENS,
  mono: 'Consolas, "SFMono-Regular", monospace',
  sans: 'Inter, "Segoe UI", "Microsoft YaHei", sans-serif',
  safeX: 100,
  safeY: 108,
} as const;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
