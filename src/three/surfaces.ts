import {MeshPhysicalMaterial, type Texture} from 'three';
import {canvasTexture, rng} from './canvas';

export type Finish = 'wood' | 'paint' | 'plaster' | 'tile' | 'wet';
const settings: Record<Finish, {roughness: number; metalness: number; bumpScale: number; clearcoat: number}> = {
  wood: {roughness: 0.64, metalness: 0, bumpScale: 0.008, clearcoat: 0.12},
  paint: {roughness: 0.5, metalness: 0.18, bumpScale: 0.003, clearcoat: 0.18},
  plaster: {roughness: 0.95, metalness: 0, bumpScale: 0.013, clearcoat: 0},
  tile: {roughness: 0.58, metalness: 0.02, bumpScale: 0.004, clearcoat: 0.16},
  wet: {roughness: 0.32, metalness: 0.04, bumpScale: 0.006, clearcoat: 0.55},
};
const cache = new Map<string, MeshPhysicalMaterial>();

/** Small shared data maps add tactile detail without external assets or per-frame allocations. */
export const surface = (color: string, finish: Finish, map?: Texture): MeshPhysicalMaterial => {
  const key = `${finish}/${color}/${map?.uuid ?? ''}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const bump = canvasTexture(`finish/${finish}`, 128, 128, (ctx, width, height) => {
    const random = rng(73);
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const grain = finish === 'wood' ? Math.sin(y * 0.7 + Math.sin(x * 0.05) * 2) * 25 : 0;
        const shade = Math.round(110 + random() * 36 + grain);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`; ctx.fillRect(x, y, 1, 1);
      }
    }
  }, {linear: true, repeat: [3, 3]});
  const roughness = canvasTexture(`finish/${finish}/roughness`, 64, 64, (ctx, width, height) => {
    const random = rng(19);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const grain = finish === 'wood' ? Math.sin(y * 0.5 + Math.sin(x * 0.08)) * 12 : 0;
        const shade = Math.round(218 + random() * 25 + grain);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, {linear: true, repeat: [3, 3]});
  const material = new MeshPhysicalMaterial({color, ...(map ? {map} : {}), bumpMap: bump, roughnessMap: roughness, ...settings[finish], clearcoatRoughness: 0.38});
  cache.set(key, material);
  return material;
};
