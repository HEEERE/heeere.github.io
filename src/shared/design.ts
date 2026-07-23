export const DESIGN_TOKENS = {
  background: '#090b0d',
  surface: '#101417',
  lime: '#b8ff3d',
  cyan: '#44d9e6',
  coral: '#ff6f61',
  text: '#f3f5f2',
  muted: '#929a94',
} as const;

export const INTRO_TIMING = {
  systemWake: [0, 1.2],
  graphDive: [1.2, 3.4],
  coreActivation: [3.4, 5.4],
  identityReveal: [5.4, 8],
} as const;
