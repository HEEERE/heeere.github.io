import {DioramaBase} from '../../three/kit/DioramaBase';
import {Box, Panel, RBox} from '../../three/kit/primitives';
import {NightExteriorLights} from '../../three/kit/lighting';
import {Rain, Ripples} from '../../three/kit/rain';
import {toon} from '../../three/materials';
import {konbiniPavement, konbiniRoadGround, reflectionStreakTexture, wetSheenTexture} from '../../three/textures';
import {getScene} from '../../data/scenes';
import {KONBINI} from './layout';
import {Storefront} from './Storefront';
import {StreetProps} from './Street';

const SIDEWALK = KONBINI.sidewalkHeight;

/**
 * Scene 01 — the rainy convenience store corner.
 * A full diorama: raised pavement, a lit shop interior behind glass, a narrow
 * alley, a shuttered neighbour, wet asphalt and a continuous shower.
 */
export const KonbiniScene = () => {
  const meta = getScene('konbini');
  return (
    <group>
      <NightExteriorLights shadowMapSize={2048} />
      <fog attach="fog" args={['#0a1018', 11, 30]} />

      <DioramaBase meta={meta} footprint={[4.6, 4.6]} ground={konbiniRoadGround()} groundFinish="wet" subtitle="1:24 · RAIN / 24H" />

      {/* Raised pavement block that both buildings sit on. */}
      <RBox size={[4.6, SIDEWALK, 0.88]} radius={0.006} color="#878d90" p={[0, SIDEWALK / 2, -0.08]} ink={false} />
      <RBox size={[0.64, SIDEWALK, 1.76]} radius={0.006} color="#6f7477" p={[0.82, SIDEWALK / 2, -1.4]} ink={false} />
      <Panel size={[4.58, 0.86]} texture={konbiniPavement()} lit r={[-Math.PI / 2, 0, 0]} p={[0, SIDEWALK + 0.002, -0.08]} />
      <Panel
        size={[0.62, 1.74]}
        material={toon('#5f6464')}
        lit
        r={[-Math.PI / 2, 0, 0]}
        p={[0.82, SIDEWALK + 0.002, -1.4]}
      />

      {/* Curb and drainage seam. */}
      <RBox size={[4.6, 0.062, 0.06]} radius={0.012} color="#b4b8b4" p={[0, SIDEWALK - 0.012, 0.355]} ink={false} />
      <Box size={[4.6, 0.008, 0.05]} color="#3a4044" p={[0, SIDEWALK + 0.001, 0.33]} ink={false} shadow={false} />

      <Storefront />
      <StreetProps />

      {/* Wet asphalt sheen and colour streaks coming off the shop lights. */}
      <Panel
        size={[4.56, 1.9]}
        texture={wetSheenTexture()}
        additive
        opacity={0.2}
        r={[-Math.PI / 2, 0, 0]}
        p={[0, 0.006, 1.32]}
      />
      <Panel
        size={[1.5, 1.5]}
        texture={reflectionStreakTexture('#ffc98a', 0.65)}
        additive
        opacity={0.3}
        r={[-Math.PI / 2, 0, 0]}
        p={[-0.5, 0.007, 1.02]}
      />
      <Panel
        size={[0.7, 1.0]}
        texture={reflectionStreakTexture('#a8d4f0', 0.55)}
        additive
        opacity={0.26}
        r={[-Math.PI / 2, 0, 0]}
        p={[0.72, 0.007, 0.5]}
      />
      <Panel
        size={[1.1, 0.9]}
        texture={reflectionStreakTexture('#ffcf9a', 0.45)}
        additive
        opacity={0.24}
        r={[-Math.PI / 2, 0, 0]}
        p={[0.9, 0.007, 1.25]}
      />

      {/* Rain hitting the road and the pavement. */}
      <Ripples count={26} area={[3.6, 1.3]} center={[0.2, 1.1]} y={0.014} size={0.075} speed={0.6} seed={11} color="#8fb8d8" />
      <Ripples count={12} area={[3.4, 0.5]} center={[-0.3, 0.0]} y={0.062} size={0.08} speed={0.5} seed={23} color="#9fc4dc" />
      <Ripples count={8} area={[0.4, 0.9]} center={[0.82, -1.4]} y={0.062} size={0.1} speed={0.45} seed={41} />
      <Rain count={950} width={4.5} depth={4.5} height={2.9} opacity={0.2} speed={3.2} />
    </group>
  );
};
