import type {Texture} from 'three';
import {metal} from '../materials';
import {surface, type Finish} from '../surfaces';
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
  groundFinish = 'tile',
  baseColor = '#231f1c',
  trimColor = '#b9995e',
  subtitle = '1:24 / MINIATURE SET',
}: {
  meta: SceneMeta;
  footprint?: [number, number];
  height?: number;
  ground?: Texture;
  groundLit?: boolean;
  groundFinish?: Finish;
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
        radius={0.025}
        segments={2}
        material={surface(baseColor, 'wood', plinthWoodTexture())}
        p={[0, -height / 2, 0]}
        ink={false}
        receive
      />
      {/* Recessed foot and fine lower edge give the plinth a crafted profile. */}
      <RBox size={[width - 0.12, 0.045, depth - 0.12]} radius={0.012} color="#151417" p={[0, -height - 0.012, 0]} ink={false} shadow={false} />
      <Box size={[width - 0.015, 0.008, depth - 0.015]} material={metal('#776343', 0.62, 0.5)} p={[0, -height + 0.035, 0]} ink={false} shadow={false} />
      {/* Brass edge line just under the top surface. */}
      <Box
        size={[width + 0.012, 0.012, depth + 0.012]}
        material={metal(trimColor, 0.52, 0.6)}
        p={[0, -0.012, 0]}
        ink={false}
        shadow={false}
      />
      {/* Soft inner shadow so props feel seated on the base. */}
      <Box size={[width - 0.02, 0.006, depth - 0.02]} color="#151a20" p={[0, -0.002, 0]} ink={false} shadow={false} />
      {ground ? <Panel size={[width, depth]} texture={ground} material={groundLit ? surface('#ffffff', groundFinish, ground) : undefined} lit={groundLit} r={[-Math.PI / 2, 0, 0]} p={[0, 0.002, 0]} /> : null}
      <Panel size={[width * 0.36, 0.123]} texture={plaque} p={[0, -height / 2, depth / 2 + 0.004]} />
    </group>
  );
};
