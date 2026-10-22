import {useQuality} from '../quality';

type LightProps = {
  shadowMapSize?: number;
  color?: string;
  intensity?: number;
};

const shadowProps = (size: number) => ({
  castShadow: true,
  'shadow-mapSize-width': size,
  'shadow-mapSize-height': size,
  'shadow-camera-left': -4.2,
  'shadow-camera-right': 4.2,
  'shadow-camera-top': 4.2,
  'shadow-camera-bottom': -4.2,
  'shadow-camera-near': 0.5,
  'shadow-camera-far': 22,
  'shadow-bias': -0.0006,
  'shadow-normalBias': 0.018,
});

/**
 * Cold ambience for the rainy street scenes: low ambient, blue sky bounce and a
 * soft moon key light that carries the only real shadow map.
 */
export const NightExteriorLights = ({
  shadowMapSize = 2048,
  color = '#b7cfe8',
  intensity = 2.1,
}: LightProps) => {
  const quality = useQuality();
  return (
    <>
      <ambientLight intensity={0.22} color="#64799a" />
      <hemisphereLight intensity={0.48} color="#7f9cc4" groundColor="#27201b" />
      <directionalLight position={[-3.6, 5.4, 4.2]} color={color} intensity={intensity} {...shadowProps(Math.min(shadowMapSize, quality.shadowMapSize))} castShadow={quality.shadows} />
      <directionalLight position={[4.6, 2.6, -2.4]} color="#8fb0d4" intensity={1.25} />
      <pointLight position={[-0.6, 0.9, 0.65]} color="#ffb56b" intensity={2.2} distance={3.2} decay={2} visible={!quality.simplified} />
    </>
  );
};

/**
 * Generic interior room light: warm key from the open front, cool bounce from
 * the back wall. Scenes add their own practical lights on top.
 */
export const RoomLights = ({
  shadowMapSize = 2048,
  color = '#ffe7c4',
  intensity = 2.6,
  fill = '#8fa8c4',
}: LightProps & {fill?: string}) => {
  const quality = useQuality();
  return (
    <>
      <ambientLight intensity={0.28} color={fill} />
      <hemisphereLight intensity={0.45} color="#c8d8e8" groundColor="#443329" />
      <directionalLight position={[2.4, 4.6, 4.4]} color={color} intensity={intensity} {...shadowProps(Math.min(shadowMapSize, quality.shadowMapSize))} castShadow={quality.shadows} />
      <directionalLight position={[-3.6, 2.8, -1.6]} color={fill} intensity={1.1} />
      <pointLight position={[-0.8, 1.4, 1.1]} color="#f4c593" intensity={1.3} distance={3.5} decay={2} visible={!quality.simplified} />
    </>
  );
};

/** A warm practical lamp: emissive bulb light with a small pool of light. */
export const LampLight = ({position, color = '#ffcf9a', intensity = 4, distance = 3.4}: {position: readonly [number, number, number]; color?: string; intensity?: number; distance?: number}) => (
  <pointLight position={position} color={color} intensity={intensity} distance={distance} decay={2} />
);
