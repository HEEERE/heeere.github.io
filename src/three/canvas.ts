import {CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, SRGBColorSpace} from 'three';

export const FONT_SANS =
  '"Yu Gothic UI", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
export const FONT_SERIF =
  '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", "Songti SC", "SimSun", "Microsoft YaHei", serif';
export const FONT_MONO = '"SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", monospace';

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export type TextureOptions = {
  /** Repeat the texture across a surface. */
  repeat?: readonly [number, number];
  /** Use linear colour space for data textures (defaults to sRGB). */
  linear?: boolean;
  /** Skip mipmaps for tiny UI textures that are always viewed at an angle. */
  sharp?: boolean;
};

const textureCache = new Map<string, CanvasTexture>();

/** Creates (and caches) a canvas texture. Keys must be stable between frames. */
export function canvasTexture(key: string, width: number, height: number, draw: DrawFn, options: TextureOptions = {}): CanvasTexture {
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  draw(ctx, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = options.linear ? NoColorSpace : SRGBColorSpace;
  texture.anisotropy = 4;
  if (options.sharp) {
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
  } else {
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
  }
  if (options.repeat) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

/* ------------------------------------------------------------------ */
/* Small deterministic random + drawing helpers                        */
/* ------------------------------------------------------------------ */

export type Rng = () => number;

export const rng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

export type TextOptions = {
  size?: number;
  font?: string;
  weight?: string | number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  tracking?: number;
  alpha?: number;
};

/** Draws a single line of text with optional letter spacing (works even without ctx.letterSpacing). */
export const text = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, options: TextOptions = {}): number => {
  const size = options.size ?? 16;
  const weight = options.weight ?? 400;
  ctx.save();
  ctx.font = `${weight} ${size}px ${options.font ?? FONT_SANS}`;
  ctx.fillStyle = options.color ?? '#1a1c20';
  ctx.textAlign = (options.tracking ?? 0) === 0 ? (options.align ?? 'left') : 'left';
  ctx.textBaseline = options.baseline ?? 'alphabetic';
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;

  const tracking = options.tracking ?? 0;
  if (tracking === 0) {
    ctx.fillText(value, x, y);
    const measured = ctx.measureText(value).width;
    ctx.restore();
    return measured;
  }

  const glyphs = [...value];
  let total = 0;
  for (const glyph of glyphs) total += ctx.measureText(glyph).width + tracking;
  total -= tracking;
  const start = options.align === 'center' ? x - total / 2 : options.align === 'right' ? x - total : x;
  let cursor = start;
  for (const glyph of glyphs) {
    ctx.fillText(glyph, cursor, y);
    cursor += ctx.measureText(glyph).width + tracking;
  }
  ctx.restore();
  return total;
};

/** Wraps text into lines using the current font on the context. */
export const wrapText = (ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  let current = '';
  for (const char of value) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const grain = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {seed?: number; count?: number; alpha?: number; size?: number; colors?: readonly string[]} = {},
): void => {
  const random = rng(options.seed ?? 7);
  const count = options.count ?? Math.floor((width * height) / 220);
  const colors = options.colors ?? ['#ffffff', '#000000'];
  ctx.save();
  for (let index = 0; index < count; index += 1) {
    const color = colors[Math.floor(random() * colors.length)] ?? '#ffffff';
    ctx.globalAlpha = (options.alpha ?? 0.05) * random();
    ctx.fillStyle = color;
    const size = 0.4 + random() * (options.size ?? 1.4);
    ctx.fillRect(random() * width, random() * height, size, size);
  }
  ctx.restore();
};

export const softGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 0.8,
): void => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.42, withAlpha(color, alpha * 0.45));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
};

export const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgba') || color.startsWith('hsla')) return color;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
    const value = Number.parseInt(full, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

export const verticalGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: ReadonlyArray<readonly [number, string]>,
): void => {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
};

export const horizontalGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: ReadonlyArray<readonly [number, string]>,
): void => {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
};
