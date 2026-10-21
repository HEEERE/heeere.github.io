import {
  AdditiveBlending,
  BackSide,
  DataTexture,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
  type Side,
  type Texture,
} from 'three';

/* ------------------------------------------------------------------ */
/* Toon ramp                                                          */
/* ------------------------------------------------------------------ */

export const createToonGradient = (): DataTexture => {
  const tones = [0.34, 0.56, 0.76, 0.94, 1];
  const data = new Uint8Array(tones.length * 4);
  tones.forEach((tone, index) => {
    const value = Math.round(tone * 255);
    data[index * 4] = value;
    data[index * 4 + 1] = value;
    data[index * 4 + 2] = value;
    data[index * 4 + 3] = 255;
  });
  const texture = new DataTexture(data, tones.length, 1, RGBAFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

const TOON_GRADIENT = createToonGradient();

const sideOf = (side: 'front' | 'back' | 'double'): Side => {
  if (side === 'back') return BackSide;
  if (side === 'double') return DoubleSide;
  return FrontSide;
};

/* ------------------------------------------------------------------ */
/* Materials (cached, safe to share between canvases)                  */
/* ------------------------------------------------------------------ */

export type ToonOptions = {
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  map?: Texture;
  side?: 'front' | 'back' | 'double';
  vertexColors?: boolean;
};

const toonCache = new Map<string, MeshToonMaterial>();

/** Matte, cel-shaded surface used for almost everything in the dioramas. */
export const toon = (color: string, options: ToonOptions = {}): MeshToonMaterial => {
  const key = `${color}|${options.emissive ?? ''}|${options.emissiveIntensity ?? ''}|${options.opacity ?? ''}|${options.transparent ?? ''}|${options.map?.uuid ?? ''}|${options.side ?? ''}|${options.vertexColors ?? ''}`;
  const cached = toonCache.get(key);
  if (cached) return cached;
  const material = new MeshToonMaterial({
    color,
    gradientMap: TOON_GRADIENT,
    ...(options.emissive ? {emissive: options.emissive} : {}),
    ...(options.emissiveIntensity !== undefined ? {emissiveIntensity: options.emissiveIntensity} : {}),
    ...(options.transparent ? {transparent: true} : {}),
    ...(options.opacity !== undefined ? {opacity: options.opacity} : {}),
    ...(options.map ? {map: options.map} : {}),
    ...(options.side ? {side: sideOf(options.side)} : {}),
    ...(options.vertexColors ? {vertexColors: true} : {}),
  });
  toonCache.set(key, material);
  return material;
};

export type FlatOptions = {
  map?: Texture;
  opacity?: number;
  transparent?: boolean;
  side?: 'front' | 'back' | 'double';
  toneMapped?: boolean;
  depthWrite?: boolean;
  blending?: 'normal' | 'additive';
};

const flatCache = new Map<string, MeshBasicMaterial>();

/** Unlit material for light boxes, screens and glowing paper. */
export const flat = (color: string, options: FlatOptions = {}): MeshBasicMaterial => {
  const key = `${color}|${options.map?.uuid ?? ''}|${options.opacity ?? ''}|${options.transparent ?? ''}|${options.side ?? ''}|${options.toneMapped ?? ''}|${options.depthWrite ?? ''}|${options.blending ?? ''}`;
  const cached = flatCache.get(key);
  if (cached) return cached;
  const material = new MeshBasicMaterial({
    color,
    toneMapped: options.toneMapped ?? false,
    ...(options.map ? {map: options.map} : {}),
    ...(options.transparent ? {transparent: true} : {}),
    ...(options.opacity !== undefined ? {opacity: options.opacity} : {}),
    ...(options.side ? {side: sideOf(options.side)} : {}),
    ...(options.depthWrite !== undefined ? {depthWrite: options.depthWrite} : {}),
    ...(options.blending === 'additive' ? {blending: AdditiveBlending} : {}),
  });
  flatCache.set(key, material);
  return material;
};

const glassCache = new Map<string, MeshStandardMaterial>();

export const glass = (color = '#c2dbe8', opacity = 0.2): MeshStandardMaterial => {
  const key = `${color}/${opacity}`;
  const cached = glassCache.get(key);
  if (cached) return cached;
  const material = new MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.08,
    metalness: 0.4,
    depthWrite: false,
    side: DoubleSide,
  });
  glassCache.set(key, material);
  return material;
};

const metalCache = new Map<string, MeshStandardMaterial>();

export const metal = (color = '#8f969c', roughness = 0.42, metalness = 0.72): MeshStandardMaterial => {
  const key = `${color}/${roughness}/${metalness}`;
  const cached = metalCache.get(key);
  if (cached) return cached;
  const material = new MeshStandardMaterial({color, roughness, metalness});
  metalCache.set(key, material);
  return material;
};

const INK_COLOR = '#131a22';
let inkMaterial: MeshBasicMaterial | null = null;

/** Back-face hull material used for the subtle inverted-hull outlines. */
export const ink = (): MeshBasicMaterial => {
  if (!inkMaterial) {
    inkMaterial = new MeshBasicMaterial({color: INK_COLOR, side: BackSide, toneMapped: false});
  }
  return inkMaterial;
};
