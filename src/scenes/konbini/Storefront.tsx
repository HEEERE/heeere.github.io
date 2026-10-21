import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group, Mesh, MeshBasicMaterial, PointLight} from 'three';
import {
  doormatTexture,
  glassSheenTexture,
  lightPoolTexture,
  plasterWallTexture,
  storeSignTexture,
  verticalSignTexture,
} from '../../three/textures';
import {KONBINI} from './layout';
import {Box, Cyl, Glow, Panel, Pipe, RBox} from '../../three/kit/primitives';
import {flat, glass, toon} from '../../three/materials';
import {Drips, GlassDrops, SlidingDrops} from '../../three/kit/rain';
import {StoreInterior} from './Interior';

const B = KONBINI.building;
const S = KONBINI.storefront;
const SIDEWALK = KONBINI.sidewalkHeight;
const WALL_TOP = SIDEWALK + B.wallHeight;
const CENTER_X = (B.minX + B.maxX) / 2;
const CENTER_Z = (B.minZ + B.maxZ) / 2;
const WIDTH = B.maxX - B.minX;
const DEPTH = B.maxZ - B.minZ;
const FACADE_Z = S.facadeZ;
const GLASS_Z = S.glassZ;
const GLASS_BOTTOM = 0.3;
const GLASS_TOP = 1.08;
const DOOR_BOTTOM = SIDEWALK + 0.01;
const DOOR_TOP = 1.03;

/* ------------------------------------------------------------------ */
/* Sliding entrance                                                    */
/* ------------------------------------------------------------------ */

const AutoDoor = () => {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const spill = useRef<PointLight>(null);

  useFrame(({clock}) => {
    const cycle = 17;
    const time = clock.elapsedTime % cycle;
    let open = 0;
    if (time > 10 && time < 11.1) open = (time - 10) / 1.1;
    else if (time >= 11.1 && time < 13.6) open = 1;
    else if (time >= 13.6 && time < 14.7) open = 1 - (time - 13.6) / 1.1;
    const eased = open * open * (3 - 2 * open);
    const leftNode = left.current;
    const rightNode = right.current;
    if (leftNode) leftNode.position.x = -0.145 - eased * 0.3;
    if (rightNode) rightNode.position.x = 0.145 + eased * 0.3;
    if (spill.current) spill.current.intensity = 0.6 + eased * 1.0;
  });

  return (
    <group>
      {/* Door frame and track */}
      <Box size={[0.72, 0.05, 0.08]} color="#3c4448" p={[0, 1.045, GLASS_Z - 0.01]} ink={false} />
      <Box size={[0.72, 0.05, 0.08]} color="#3c4448" p={[0, 0.305, GLASS_Z - 0.01]} ink={false} />
      <Box size={[0.05, 0.76, 0.08]} color="#3c4448" p={[-0.345, 0.675, GLASS_Z - 0.01]} ink={false} />
      <Box size={[0.05, 0.76, 0.08]} color="#3c4448" p={[0.345, 0.675, GLASS_Z - 0.01]} ink={false} />

      {/* Sliding leaves */}
      <group ref={left} position={[-0.145, 0, 0]}>
        <Panel size={[0.28, DOOR_TOP - DOOR_BOTTOM]} material={glass('#cfe4ee', 0.22)} p={[0, (DOOR_TOP + DOOR_BOTTOM) / 2, GLASS_Z]} />
        <Box size={[0.02, DOOR_TOP - DOOR_BOTTOM, 0.03]} color="#6f7a80" p={[-0.14, (DOOR_TOP + DOOR_BOTTOM) / 2, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.28, 0.02, 0.03]} color="#6f7a80" p={[0, DOOR_TOP, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.28, 0.02, 0.03]} color="#6f7a80" p={[0, DOOR_BOTTOM + 0.01, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.02, 0.1, 0.05]} color="#aab4b8" p={[0.09, 0.62, GLASS_Z + 0.02]} ink={false} shadow={false} />
      </group>
      <group ref={right} position={[0.145, 0, 0]}>
        <Panel size={[0.28, DOOR_TOP - DOOR_BOTTOM]} material={glass('#cfe4ee', 0.22)} p={[0, (DOOR_TOP + DOOR_BOTTOM) / 2, GLASS_Z]} />
        <Box size={[0.02, DOOR_TOP - DOOR_BOTTOM, 0.03]} color="#6f7a80" p={[0.14, (DOOR_TOP + DOOR_BOTTOM) / 2, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.28, 0.02, 0.03]} color="#6f7a80" p={[0, DOOR_TOP, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.28, 0.02, 0.03]} color="#6f7a80" p={[0, DOOR_BOTTOM + 0.01, GLASS_Z]} ink={false} shadow={false} />
        <Box size={[0.02, 0.1, 0.05]} color="#aab4b8" p={[-0.09, 0.62, GLASS_Z + 0.02]} ink={false} shadow={false} />
      </group>

      <Box size={[0.14, 0.03, 0.05]} color="#2b3238" p={[0, 1.1, FACADE_Z - 0.03]} ink={false} shadow={false} />
      <pointLight ref={spill} position={[0, 0.5, -0.28]} color="#ffcf9a" intensity={0.6} distance={1.8} decay={2} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Signage                                                            */
/* ------------------------------------------------------------------ */

const SignBand = () => {
  const glow = useRef<Mesh>(null);
  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    const flicker = Math.sin(time * 2.7) * 0.03 + Math.sin(time * 11.3) * 0.012;
    const material = glow.current?.material as MeshBasicMaterial | undefined;
    if (material) material.opacity = 0.24 + flicker;
  });
  return (
    <group>
      <Box size={[WIDTH + 0.06, 0.3, 0.1]} color="#e4ddcd" p={[CENTER_X, 1.24, FACADE_Z + 0.04]} ink inkWidth={0.006} />
      <Panel size={[WIDTH - 0.04, 0.24]} texture={storeSignTexture()} p={[CENTER_X, 1.24, FACADE_Z + 0.092]} />
      {/* Light box halo */}
      <mesh ref={glow} position={[CENTER_X, 1.24, FACADE_Z + 0.14]}>
        <planeGeometry args={[WIDTH + 0.4, 0.6]} />
        <meshBasicMaterial map={lightPoolTexture('#ffd9a4', 0.55)} transparent opacity={0.25} depthWrite={false} toneMapped={false} />
      </mesh>
      <Glow color="#ffdca0" size={1.7} opacity={0.16} p={[CENTER_X, 1.25, FACADE_Z + 0.3]} />
      <pointLight position={[CENTER_X, 1.15, FACADE_Z + 0.3]} color="#ffd9a4" intensity={0.9} distance={2.4} decay={2} />

      {/* Corner vertical light box */}
      <Box size={[0.17, 0.66, 0.11]} color="#f4ecda" p={[-1.72, 0.92, FACADE_Z + 0.09]} ink inkWidth={0.006} />
      <Panel size={[0.15, 0.62]} texture={verticalSignTexture()} p={[-1.72, 0.92, FACADE_Z + 0.147]} />
      <Panel size={[0.09, 0.62]} texture={verticalSignTexture()} r={[0, Math.PI / 2, 0]} p={[-1.635, 0.92, FACADE_Z + 0.09]} />
      <Glow color="#ffdca8" size={0.5} opacity={0.14} p={[-1.68, 0.92, FACADE_Z + 0.24]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */

const BuildingShell = () => {
  const wall = toon('#b8b1a2', {map: plasterWallTexture()});
  return (
    <group>
      <Box size={[WIDTH, B.wallHeight, 0.07]} material={wall} p={[CENTER_X, SIDEWALK + B.wallHeight / 2, B.minZ + 0.035]} ink inkWidth={0.009} />
      <Box size={[0.07, B.wallHeight, DEPTH]} material={wall} p={[B.minX + 0.035, SIDEWALK + B.wallHeight / 2, CENTER_Z]} ink inkWidth={0.009} />
      <Box size={[0.07, B.wallHeight, DEPTH]} material={wall} p={[B.maxX - 0.035, SIDEWALK + B.wallHeight / 2, CENTER_Z]} ink inkWidth={0.009} />

      {/* Facade around the glazing */}
      <Box size={[WIDTH, GLASS_BOTTOM - SIDEWALK, 0.07]} material={wall} p={[CENTER_X, (GLASS_BOTTOM + SIDEWALK) / 2, FACADE_Z]} ink inkWidth={0.009} />
      <Box size={[0.16, B.wallHeight, 0.07]} material={wall} p={[B.minX + 0.08, SIDEWALK + B.wallHeight / 2, FACADE_Z]} ink inkWidth={0.009} />
      <Box size={[0.1, B.wallHeight, 0.07]} material={wall} p={[B.maxX - 0.05, SIDEWALK + B.wallHeight / 2, FACADE_Z]} ink inkWidth={0.009} />
      <Box size={[WIDTH, 0.06, 0.07]} material={wall} p={[CENTER_X, GLASS_TOP + 0.02, FACADE_Z]} ink={false} />
      <Box size={[WIDTH, WALL_TOP - 1.38, 0.07]} material={wall} p={[CENTER_X, (WALL_TOP + 1.38) / 2, FACADE_Z]} ink={false} />

      {/* Stone skirt along the pavement. */}
      <Box size={[WIDTH + 0.02, 0.14, 0.06]} color="#5a5f61" p={[CENTER_X, SIDEWALK + 0.07, FACADE_Z - 0.055]} ink={false} />
      <Box size={[0.06, 0.14, DEPTH]} color="#5a5f61" p={[B.minX - 0.025, SIDEWALK + 0.07, CENTER_Z]} ink={false} />
      <Box size={[0.06, 0.14, DEPTH]} color="#5a5f61" p={[B.maxX + 0.025, SIDEWALK + 0.07, CENTER_Z]} ink={false} />

      {/* Roof */}
      <Box size={[WIDTH + 0.16, 0.07, DEPTH + 0.16]} color="#5f6462" p={[CENTER_X, WALL_TOP + 0.035, CENTER_Z]} ink inkWidth={0.009} />
      <Box size={[WIDTH + 0.18, 0.1, 0.05]} color="#6a6f6c" p={[CENTER_X, WALL_TOP + 0.1, B.maxZ + 0.08]} ink={false} />
      <Box size={[WIDTH + 0.18, 0.1, 0.05]} color="#6a6f6c" p={[CENTER_X, WALL_TOP + 0.1, B.minZ - 0.06]} ink={false} />
      <Box size={[0.05, 0.1, DEPTH + 0.18]} color="#6a6f6c" p={[B.minX - 0.075, WALL_TOP + 0.1, CENTER_Z]} ink={false} />
      <Box size={[0.05, 0.1, DEPTH + 0.18]} color="#6a6f6c" p={[B.maxX + 0.075, WALL_TOP + 0.1, CENTER_Z]} ink={false} />

      {/* Rooftop plant */}
      <RBox size={[0.34, 0.2, 0.3]} color="#a8a49a" p={[-1.1, WALL_TOP + 0.17, -1.55]} ink={false} shadow={false} />
      <Cyl radius={0.07} height={0.02} color="#5a5f61" p={[-1.1, WALL_TOP + 0.28, -1.55]} ink={false} shadow={false} />
      <Cyl radius={0.03} height={0.06} color="#8a8f8c" p={[-1.02, WALL_TOP + 0.31, -1.48]} ink={false} shadow={false} />
      <Cyl radius={0.055} height={0.02} color="#8a8f8c" p={[-0.55, WALL_TOP + 0.1, -1.9]} ink={false} shadow={false} />
      <Cyl radius={0.02} height={0.23} color="#6f7476" p={[-0.55, WALL_TOP + 0.21, -1.9]} ink={false} shadow={false} />
      <Cyl radius={0.01} height={0.3} color="#5a5f61" p={[0.3, WALL_TOP + 0.25, -1.9]} ink={false} shadow={false} />

      {/* Side wall utilities (alley side) */}
      <RBox size={[0.1, 0.3, 0.4]} color="#c8c2b2" p={[B.maxX + 0.08, 0.52, -1.62]} ink={false} shadow={false} />
      <Cyl radius={0.11} height={0.02} color="#8a8f8c" r={[0, 0, Math.PI / 2]} p={[B.maxX + 0.14, 0.52, -1.62]} ink={false} shadow={false} />
      <Cyl radius={0.02} height={1.35} color="#8f9598" p={[B.maxX + 0.07, 0.72, -0.6]} ink={false} shadow={false} />
      <Pipe from={[B.maxX + 0.07, 1.38, -0.6]} to={[B.maxX + 0.07, 1.38, -0.9]} radius={0.02} color="#8f9598" />
      <RBox size={[0.05, 0.22, 0.16]} color="#6f7578" p={[B.maxX + 0.06, 1.02, -1.05]} ink={false} shadow={false} />
      <Panel size={[0.11, 0.05]} texture={storeSignTexture()} p={[B.maxX + 0.087, 1.02, -1.05]} r={[0, Math.PI / 2, 0]} />
      <Box size={[0.02, 0.5, 0.34]} color="#3f4448" p={[B.maxX + 0.05, 0.72, -1.15]} ink={false} shadow={false} />
      <Box size={[0.024, 0.46, 0.02]} color="#8f9598" p={[B.maxX + 0.062, 0.72, -1.15]} ink={false} shadow={false} />
      <Box size={[0.024, 0.46, 0.02]} color="#8f9598" p={[B.maxX + 0.062, 0.72, -1.04]} ink={false} shadow={false} />
      <Box size={[0.024, 0.46, 0.02]} color="#8f9598" p={[B.maxX + 0.062, 0.72, -1.26]} ink={false} shadow={false} />
    </group>
  );
};

export const Storefront = () => (
  <group>
    <BuildingShell />
    <StoreInterior />

    {/* Glazing frame */}
    <Box size={[WIDTH - 0.26, 0.05, 0.08]} color="#3c4448" p={[CENTER_X, GLASS_TOP, GLASS_Z - 0.01]} ink={false} />
    <Box size={[WIDTH - 0.26, 0.04, 0.08]} color="#3c4448" p={[CENTER_X, GLASS_BOTTOM, GLASS_Z - 0.01]} ink={false} />
    <Box size={[0.04, GLASS_TOP - GLASS_BOTTOM, 0.07]} color="#3c4448" p={[-1.6, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z - 0.01]} ink={false} />
    <Box size={[0.04, GLASS_TOP - GLASS_BOTTOM, 0.07]} color="#3c4448" p={[-0.345, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z - 0.01]} ink={false} />
    <Box size={[0.04, GLASS_TOP - GLASS_BOTTOM, 0.07]} color="#3c4448" p={[0.37, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z - 0.01]} ink={false} />

    {/* Big window + small side pane */}
    <Panel size={[1.2, GLASS_TOP - GLASS_BOTTOM]} material={glass('#bcd6e2', 0.1)} p={[-0.96, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z]} />
    <Panel size={[0.42, GLASS_TOP - GLASS_BOTTOM]} material={glass('#bcd6e2', 0.1)} p={[0.37, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z]} />
    <AutoDoor />

    {/* Reflection streaks + rain beads on the glass */}
    <Panel size={[1.2, GLASS_TOP - GLASS_BOTTOM]} texture={glassSheenTexture()} additive opacity={0.35} p={[-0.96, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z + 0.012]} />
    <GlassDrops size={[1.16, GLASS_TOP - GLASS_BOTTOM - 0.02]} p={[-0.96, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z + 0.02]} opacity={0.22} />
    <SlidingDrops origin={[-0.96, (GLASS_TOP + GLASS_BOTTOM) / 2, GLASS_Z + 0.025]} width={1.1} height={GLASS_TOP - GLASS_BOTTOM - 0.06} count={4} />

    {/* Entrance: step, mat, sensor */}
    <RBox size={[0.78, 0.04, 0.3]} color="#8f918a" p={[0, SIDEWALK + 0.02, -0.4]} ink={false} />
    <Panel size={[0.56, 0.2]} texture={doormatTexture()} r={[-Math.PI / 2, 0, 0]} p={[0, SIDEWALK + 0.045, -0.3]} />
    <Box size={[0.16, 0.03, 0.04]} color="#e8e2d2" p={[0, 1.085, FACADE_Z - 0.05]} ink={false} shadow={false} />

    {/* Awning over the entrance */}
    <RBox size={[2.15, 0.028, 0.32]} color="#264740" p={[CENTER_X, 1.08, FACADE_Z + 0.17]} ink inkWidth={0.005} />
    <Box size={[2.15, 0.055, 0.03]} color="#203f3a" p={[CENTER_X, 1.05, FACADE_Z + 0.32]} ink={false} />
    <Pipe from={[B.minX + 0.2, 0.92, FACADE_Z]} to={[B.minX + 0.2, 1.08, FACADE_Z + 0.28]} radius={0.008} color="#8a8f8c" />
    <Pipe from={[B.maxX - 0.2, 0.92, FACADE_Z]} to={[B.maxX - 0.2, 1.08, FACADE_Z + 0.28]} radius={0.008} color="#8a8f8c" />
    {[-1.3, -0.7, 0.32].map((x) => (
      <group key={x}>
        <Cyl radius={0.018} height={0.012} color="#f6ead0" material={flat('#f6ead0')} p={[x, 1.062, FACADE_Z + 0.24]} ink={false} shadow={false} />
      </group>
    ))}
    <pointLight position={[CENTER_X, 1.02, FACADE_Z + 0.3]} color="#ffdca8" intensity={0.5} distance={1.8} decay={2} />
    <Drips points={[[-1.05, 1.03, -0.17], [-0.35, 1.03, -0.17], [0.3, 1.03, -0.17]] as const} fall={1.02} speed={0.5} />

    {/* Warm light spilling onto the pavement */}
    <Panel
      size={[2.15, 0.95]}
      texture={lightPoolTexture('#ffb877', 0.18)}
      additive
      r={[-Math.PI / 2, 0, 0]}
      p={[CENTER_X, SIDEWALK + 0.002, 0.06]}
    />
    <SignBand />
  </group>
);

