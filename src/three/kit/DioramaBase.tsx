import type {Texture} from 'three';
import {metal, toon} from '../materials';
import {plaqueTexture, plinthWoodTexture} from '../textures';
import type {SceneMeta} from '../../data/scenes';
import {Box, Panel, RBox} from './primitives';

/**
 * The shared museum plinth every diorama stands on: dark wood sides, a brass
 * edge and an engraved name plate. Keeping this identical across scenes is what
 * makes the collection read as one set of miniature models.
 */
export const DioramaBase = ({
  meta,
  footprint = [4.6, 4.6],
  height = 0.24,
  ground,
  groundLit = true,
  baseColor = '#231f1c',
  trimColor = '#b9995e',
  subtitle = '1:24 / MINIATURE SET',
}: {
  meta: SceneMeta;
  footprint?: [number, number];
  height?: number;
  ground?: Texture;
  groundLit?: boolean;
  baseColor?: string;
  trimColor?: string;
  subtitle?: string;
}) => {
  const [width, depth] = footprint;
  const plaque = plaqueTexture(meta.index, meta.nameZh, meta.nameEn, subtitle);
  return (
    <group>
      <RBox
        size={[width, height, depth]}
        radius={0.015}
        segments={2}
        material={toon(baseColor, {map: plinthWoodTexture()})}
        p={[0, -height / 2, 0]}
        ink={false}
        receive
      />
      {/* Brass edge line just under the top surface. */}
      <Box
        size={[width + 0.012, 0.012, depth + 0.012]}
        material={metal(trimColor, 0.38, 0.75)}
        p={[0, -0.012, 0]}
        ink={false}
        shadow={false}
      />
      {/* Soft inner shadow so props feel seated on the base. */}
      <Box size={[width - 0.02, 0.006, depth - 0.02]} color="#151a20" p={[0, -0.002, 0]} ink={false} shadow={false} />
      {ground ? <Panel size={[width, depth]} texture={ground} lit={groundLit} r={[-Math.PI / 2, 0, 0]} p={[0, 0.002, 0]} /> : null}
      <Panel size={[width * 0.36, 0.123]} texture={plaque} p={[0, -height / 2, depth / 2 + 0.004]} />
    </group>
  );
};
