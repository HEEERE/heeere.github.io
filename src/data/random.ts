let seed = 20261021;

/** Deterministic pseudo-random generator so procedural detail is stable between renders and screenshots. */
export const random = (): number => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export const resetRandom = (value = 20261021): void => {
  seed = value;
};

export const randomRange = (min: number, max: number): number => min + random() * (max - min);

export const pick = <T>(items: readonly T[]): T => {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
};

/** Smooth 0..1 ramp used by light flicker and subtle motion helpers. */
export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
