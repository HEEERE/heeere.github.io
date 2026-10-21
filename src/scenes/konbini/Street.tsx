import {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Mesh, MeshBasicMaterial, PointLight} from 'three';
import {canvasTexture, rng} from '../../three/canvas';
import {
  binderSpinesTexture,
  concreteTexture,
  lightPoolTexture,
  lightSpillTexture,
  menuBoardTexture,
  plasterWallTexture,
  labelTagTexture,
  storeSignTexture,
  vendingFrontTexture,
} from '../../three/textures';
import {Box, Cable, Cone, Cyl, Glow, GrassTuft, LightCone, Panel, Pipe, Plant, RBox, Torus, Wheel, type Vec3} from '../../three/kit/primitives';
import {flat, glass, metal, toon} from '../../three/materials';
import {KONBINI} from './layout';

const SIDEWALK = KONBINI.sidewalkHeight;

/* ------------------------------------------------------------------ */
/* Local painted textures                                              */
/* ------------------------------------------------------------------ */

const shutterTexture = () =>
  canvasTexture('konbini/shutter', 256, 320, (ctx, width, height) => {
    ctx.fillStyle = '#6a6f70';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 18) {
      ctx.fillStyle = y % 36 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y, width, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y + 12, width, 3);
    }
    // Rust streaks.
    const random = rng(51);
    for (let index = 0; index < 10; index += 1) {
      ctx.fillStyle = `rgba(120, 84, 56, ${0.08 + random() * 0.12})`;
      ctx.fillRect(random() * width, random() * height, 3 + random() * 6, 20 + random() * 60);
    }
    // Old sticker.
    ctx.fillStyle = 'rgba(232, 226, 210, 0.65)';
    ctx.fillRect(width * 0.62, height * 0.42, 66, 24);
    ctx.fillStyle = 'rgba(60,66,66,0.6)';
    ctx.fillRect(width * 0.62 + 8, height * 0.42 + 9, 44, 3);
  });

const snackSignTexture = () =>
  canvasTexture('konbini/snackSign', 128, 420, (ctx, width, height) => {
    ctx.fillStyle = '#2a2020';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e8b48a';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    ctx.save();
    ctx.shadowColor = '#ff9a6a';
    ctx.shadowBlur = 16;
    const glyphs = ['ス', 'ナ', 'ッ', 'ク'];
    glyphs.forEach((glyph, index) => {
      textChar(ctx, glyph, width / 2, 74 + index * 58, 42, '#ffcf9a');
    });
    textChar(ctx, 'ゆ', width / 2, 330, 30, '#ffdca8');
    textChar(ctx, 'き', width / 2, 364, 30, '#ffdca8');
    textChar(ctx, 'BAR', width / 2, 400, 14, '#c88a6a');
    ctx.restore();
  });

const textChar = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string): void => {
  ctx.save();
  ctx.font = `600 ${size}px "Yu Gothic", "Hiragino Kaku Gothic ProN", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
};

const warmWindowTexture = () =>
  canvasTexture('konbini/warmWindow', 256, 256, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffd9a4');
    gradient.addColorStop(0.6, '#e8a86a');
    gradient.addColorStop(1, '#c88a5a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // Curtains.
    ctx.fillStyle = 'rgba(248, 232, 210, 0.75)';
    ctx.fillRect(0, 0, 54, height);
    ctx.fillRect(width - 62, 0, 62, height);
    ctx.fillStyle = 'rgba(160, 120, 90, 0.25)';
    for (let index = 0; index < 4; index += 1) ctx.fillRect(10 + index * 12, 0, 4, height);
    // A lamp and a shelf silhouette.
    ctx.fillStyle = 'rgba(90, 60, 40, 0.35)';
    ctx.fillRect(96, 130, 70, 7);
    ctx.fillRect(110, 92, 44, 6);
    ctx.beginPath();
    ctx.arc(150, 118, 12, 0, Math.PI * 2);
    ctx.fill();
    // Window mullion shadow.
    ctx.fillStyle = 'rgba(40, 34, 30, 0.45)';
    ctx.fillRect(width / 2 - 3, 0, 6, height);
    ctx.fillRect(0, height / 2 - 3, width, 6);
  });

const coolWindowTexture = () =>
  canvasTexture('konbini/coolWindow', 256, 256, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2f4a62');
    gradient.addColorStop(1, '#16222e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // TV glow seen through the curtain.
    ctx.fillStyle = 'rgba(120, 180, 220, 0.35)';
    ctx.fillRect(60, 130, 130, 80);
    ctx.fillStyle = 'rgba(80, 140, 190, 0.25)';
    ctx.fillRect(80, 90, 80, 6);
    ctx.fillStyle = 'rgba(240, 236, 226, 0.55)';
    ctx.fillRect(0, 0, 48, height);
    ctx.fillRect(width - 52, 0, 52, height);
    ctx.fillStyle = 'rgba(30, 40, 48, 0.6)';
    ctx.fillRect(width / 2 - 3, 0, 6, height);
    ctx.fillRect(0, height / 2 - 3, width, 6);
  });

/* ------------------------------------------------------------------ */
/* Neighbour building (bar / apartment)                                */
/* ------------------------------------------------------------------ */

const N = KONBINI.neighbor;
const NEIGHBOR_WIDTH = N.maxX - N.minX;
const NEIGHBOR_DEPTH = N.maxZ - N.minZ;
const NEIGHBOR_HEIGHT = 1.82;
const NEIGHBOR_CX = (N.minX + N.maxX) / 2;
const NEIGHBOR_CZ = (N.minZ + N.maxZ) / 2;
const NEIGHBOR_FACADE_Z = N.maxZ;

const NeighborFacade = () => {
  return (
    <group>
      {/* Rolling shutter of a closed shop. */}
      <Panel size={[0.74, 0.7]} texture={shutterTexture()} p={[NEIGHBOR_CX - 0.16, SIDEWALK + 0.45, NEIGHBOR_FACADE_Z + 0.006]} />
      <Box size={[0.8, 0.06, 0.05]} color="#8a8f8e" p={[NEIGHBOR_CX - 0.16, SIDEWALK + 0.82, NEIGHBOR_FACADE_Z + 0.02]} ink={false} />
      <Box size={[0.8, 0.1, 0.06]} color="#5f6462" p={[NEIGHBOR_CX - 0.16, SIDEWALK + 0.88, NEIGHBOR_FACADE_Z + 0.02]} ink={false} />

      {/* Entrance door with a warm lamp. */}
      <Box size={[0.24, 0.78, 0.04]} color="#4a4440" p={[NEIGHBOR_CX + 0.32, SIDEWALK + 0.4, NEIGHBOR_FACADE_Z + 0.015]} ink={false} />
      <Box size={[0.18, 0.3, 0.02]} color="#7f8f96" material={glass('#e8c890', 0.5)} p={[NEIGHBOR_CX + 0.32, SIDEWALK + 0.52, NEIGHBOR_FACADE_Z + 0.03]} ink={false} />
      <Box size={[0.02, 0.06, 0.02]} color="#b8a888" p={[NEIGHBOR_CX + 0.4, SIDEWALK + 0.42, NEIGHBOR_FACADE_Z + 0.04]} ink={false} />
      <Box size={[0.3, 0.04, 0.14]} color="#3f4442" p={[NEIGHBOR_CX + 0.32, SIDEWALK + 0.86, NEIGHBOR_FACADE_Z + 0.07]} ink={false} />
      <Glow color="#ffbe82" size={0.42} opacity={0.4} p={[NEIGHBOR_CX + 0.32, SIDEWALK + 0.8, NEIGHBOR_FACADE_Z + 0.12]} />
      <pointLight position={[NEIGHBOR_CX + 0.32, SIDEWALK + 0.75, NEIGHBOR_FACADE_Z + 0.2]} color="#ffc28a" intensity={0.7} distance={1.6} decay={2} />

      {/* Mailboxes */}
      <RBox size={[0.26, 0.2, 0.06]} color="#7f8480" p={[NEIGHBOR_CX + 0.02, SIDEWALK + 0.52, NEIGHBOR_FACADE_Z + 0.04]} ink={false} shadow={false} />
      {[0, 1, 2].map((index) => (
        <Box key={index} size={[0.065, 0.09, 0.01]} color="#d8d2c2" p={[NEIGHBOR_CX - 0.06 + index * 0.08, SIDEWALK + 0.54, NEIGHBOR_FACADE_Z + 0.075]} ink={false} shadow={false} />
      ))}

      {/* Bar sign: the one warm accent on this side of the alley. */}
      <Box size={[0.15, 0.58, 0.08]} color="#2a2020" p={[N.minX + 0.13, 1.28, NEIGHBOR_FACADE_Z + 0.05]} ink />
      <Panel size={[0.13, 0.54]} texture={snackSignTexture()} p={[N.minX + 0.13, 1.28, NEIGHBOR_FACADE_Z + 0.095]} />
      <Glow color="#ff9a6a" size={0.55} opacity={0.16} p={[N.minX + 0.16, 1.28, NEIGHBOR_FACADE_Z + 0.2]} />

      {/* Upper floor windows */}
      <Box size={[0.5, 0.42, 0.05]} color="#6f736f" p={[NEIGHBOR_CX - 0.12, 1.42, NEIGHBOR_FACADE_Z + 0.02]} ink={false} />
      <Panel size={[0.42, 0.34]} texture={warmWindowTexture()} p={[NEIGHBOR_CX - 0.12, 1.42, NEIGHBOR_FACADE_Z + 0.05]} />
      <Box size={[0.4, 0.36, 0.05]} color="#6f736f" p={[NEIGHBOR_CX + 0.36, 1.42, NEIGHBOR_FACADE_Z + 0.02]} ink={false} />
      <Panel size={[0.32, 0.28]} texture={coolWindowTexture()} p={[NEIGHBOR_CX + 0.36, 1.42, NEIGHBOR_FACADE_Z + 0.05]} />

      {/* Balcony in front of the warm window. */}
      <Box size={[0.56, 0.04, 0.16]} color="#8a8d88" p={[NEIGHBOR_CX - 0.12, 1.16, NEIGHBOR_FACADE_Z + 0.11]} ink={false} />
      <Box size={[0.56, 0.035, 0.02]} color="#9a9d98" p={[NEIGHBOR_CX - 0.12, 1.34, NEIGHBOR_FACADE_Z + 0.19]} ink={false} shadow={false} />
      {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.24].map((offset) => (
        <Box key={offset} size={[0.012, 0.18, 0.012]} color="#9a9d98" p={[NEIGHBOR_CX - 0.12 + offset, 1.25, NEIGHBOR_FACADE_Z + 0.19]} ink={false} shadow={false} />
      ))}
      <Plant p={[NEIGHBOR_CX - 0.3, 1.18, NEIGHBOR_FACADE_Z + 0.1]} scale={0.7} leafColor="#6a8a5a" potColor="#a8806a" />
      <RBox size={[0.2, 0.14, 0.14]} color="#b8b2a2" p={[NEIGHBOR_CX + 0.06, 1.23, NEIGHBOR_FACADE_Z + 0.1]} ink={false} shadow={false} />
      <Cyl radius={0.055} height={0.012} color="#6f7472" r={[0, 0, Math.PI / 2]} p={[NEIGHBOR_CX + 0.06, 1.23, NEIGHBOR_FACADE_Z + 0.172]} ink={false} shadow={false} />

      {/* Downpipes, meters and a lamp bracket */}
      <Cyl radius={0.018} height={1.72} color="#7f8480" p={[N.minX + 0.05, SIDEWALK + 0.86, NEIGHBOR_FACADE_Z + 0.05]} ink={false} shadow={false} />
      <Pipe from={[N.minX + 0.05, 1.72, NEIGHBOR_FACADE_Z + 0.05]} to={[N.minX + 0.05, 1.72, NEIGHBOR_FACADE_Z - 0.3]} radius={0.018} color="#7f8480" />
      <RBox size={[0.16, 0.2, 0.07]} color="#8a8f8c" p={[NEIGHBOR_CX + 0.6, SIDEWALK + 1.02, NEIGHBOR_FACADE_Z + 0.06]} ink={false} shadow={false} />
      <Box size={[0.05, 0.3, 0.05]} color="#5f6462" p={[NEIGHBOR_CX - 0.5, SIDEWALK + 1.06, NEIGHBOR_FACADE_Z + 0.06]} ink={false} shadow={false} />
      <Cyl radius={0.02} height={0.24} color="#8a8f8c" p={[NEIGHBOR_CX + 0.62, SIDEWALK + 1.4, NEIGHBOR_FACADE_Z + 0.05]} ink={false} shadow={false} />

      {/* Roof clutter */}
      <Box size={[NEIGHBOR_WIDTH + 0.1, 0.06, NEIGHBOR_DEPTH + 0.1]} color="#5f6360" p={[NEIGHBOR_CX, SIDEWALK + NEIGHBOR_HEIGHT, NEIGHBOR_CZ]} ink={false} />
      <Box size={[0.3, 0.22, 0.26]} color="#a8a49a" p={[NEIGHBOR_CX + 0.32, SIDEWALK + NEIGHBOR_HEIGHT + 0.14, NEIGHBOR_CZ]} ink={false} />
      <Cyl radius={0.055} height={0.3} color="#9a9d98" p={[NEIGHBOR_CX - 0.3, SIDEWALK + NEIGHBOR_HEIGHT + 0.18, NEIGHBOR_CZ]} ink={false} />
      <Cyl radius={0.008} height={0.5} color="#5f6462" p={[NEIGHBOR_CX - 0.1, SIDEWALK + NEIGHBOR_HEIGHT + 0.28, NEIGHBOR_CZ]} ink={false} />
    </group>
  );
};

const NeighborBuilding = () => (
  <group>
    <RBox
      size={[NEIGHBOR_WIDTH, NEIGHBOR_HEIGHT, NEIGHBOR_DEPTH]}
      radius={0.012}
      segments={2}
      material={toon('#68645d', {map: plasterWallTexture()})}
      p={[NEIGHBOR_CX, SIDEWALK + NEIGHBOR_HEIGHT / 2, NEIGHBOR_CZ]}
      ink
      inkWidth={0.009}
    />
    {/* Alley-facing wall details (visible from the gap). */}
    <Box size={[0.05, 0.28, 0.44]} color="#c8c2b2" p={[N.minX - 0.01, 0.52, -1.3]} ink={false} shadow={false} />
    <Cyl radius={0.018} height={1.4} color="#7f8480" p={[N.minX - 0.01, 0.75, -1.85]} ink={false} shadow={false} />
    <Cyl radius={0.1} height={0.02} color="#6f7472" p={[N.minX - 0.01, 0.52, -1.3]} ink={false} shadow={false} />
    <Panel size={[0.3, 0.24]} texture={binderSpinesTexture()} r={[0, -Math.PI / 2, 0]} p={[N.minX - 0.012, 1.18, -1.1]} />
    <NeighborFacade />
    <MailSlot />
    {/* Right-hand return wall, visible from the camera side. */}
    <Panel size={[0.44, 0.3]} texture={coolWindowTexture()} r={[0, Math.PI / 2, 0]} p={[N.maxX + 0.012, 1.42, -1.5]} />
    <Box size={[0.05, 0.36, 0.5]} color="#c8c2b2" p={[N.maxX + 0.02, 0.62, -0.95]} ink={false} shadow={false} />
    <Cyl radius={0.1} height={0.018} color="#6f7472" r={[0, 0, Math.PI / 2]} p={[N.maxX + 0.05, 0.62, -0.95]} ink={false} shadow={false} />
    <Cyl radius={0.022} height={1.72} color="#7f8480" p={[N.maxX + 0.03, 0.92, -0.66]} ink={false} shadow={false} />
    <Box size={[0.06, 0.2, 0.14]} color="#5f6462" p={[N.maxX + 0.02, 1.06, -1.1]} ink={false} shadow={false} />
    <Panel size={[0.14, 0.05]} texture={labelTagTexture('METER', '#7a8478')} r={[0, Math.PI / 2, 0]} p={[N.maxX + 0.055, 1.06, -1.1]} />
  </group>
);

const MailSlot = () => (
  <group>
    <Box size={[0.12, 0.16, 0.02]} color="#d8d2c2" p={[NEIGHBOR_CX - 0.34, SIDEWALK + 0.5, NEIGHBOR_FACADE_Z + 0.06]} ink={false} shadow={false} />
    <Box size={[0.1, 0.02, 0.01]} color="#4a4a44" p={[NEIGHBOR_CX - 0.34, SIDEWALK + 0.5, NEIGHBOR_FACADE_Z + 0.072]} ink={false} shadow={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Utility pole + wires                                                */
/* ------------------------------------------------------------------ */

const WIRES: readonly (readonly Vec3[])[] = [
  [
    [-2.12, 2.02, 0.1],
    [-1.3, 1.72, 0.12],
    [-0.2, 1.9, 0.14],
    [1.1, 1.7, 0.08],
    [2.3, 1.95, 0.02],
  ],
  [
    [-2.12, 1.9, 0.16],
    [-1.2, 1.6, 0.18],
    [-0.1, 1.74, 0.2],
    [1.2, 1.56, 0.12],
    [2.3, 1.8, 0.06],
  ],
  [
    [-2.12, 1.78, 0.04],
    [-1.0, 1.5, 0.02],
    [0.2, 1.62, 0.04],
    [1.4, 1.5, 0.0],
    [2.3, 1.66, -0.04],
  ],
  [
    [-2.1, 1.96, 0.12],
    [-1.92, 1.66, -0.2],
    [-1.7, 1.5, -0.42],
    [-1.62, 1.48, -0.48],
  ],
];

const UtilityPole = () => (
  <group>
    <Cyl radius={0.058} height={2.06} segments={12} color="#9a988f" p={[-2.12, SIDEWALK + 1.03, 0.08]} ink={false} bounds={false} />
    <Cyl radius={0.07} height={0.08} color="#7f7d74" p={[-2.12, SIDEWALK + 0.04, 0.08]} ink={false} />
    {[1.58, 1.78].map((y) => (
      <group key={y}>
        <Box size={[0.62, 0.045, 0.045]} color="#6f6d66" p={[-2.12, SIDEWALK + y, 0.08]} ink={false} bounds={false} />
        {[-0.26, -0.09, 0.1, 0.27].map((offset) => (
          <Cyl key={offset} radius={0.018} height={0.05} color="#d8d2c2" p={[-2.12 + offset, SIDEWALK + y + 0.045, 0.08]} ink={false} shadow={false} bounds={false} />
        ))}
      </group>
    ))}
    <Cyl radius={0.075} height={0.3} color="#8a8a84" p={[-1.99, SIDEWALK + 1.28, 0.08]} ink={false} bounds={false} />
    <Cyl radius={0.065} height={0.24} color="#7f7f78" p={[-2.22, SIDEWALK + 1.32, 0.08]} ink={false} bounds={false} />
    <Box size={[0.12, 0.18, 0.05]} color="#5f6260" p={[-2.12, SIDEWALK + 0.86, 0.14]} ink={false} bounds={false} />
    <Cyl radius={0.012} height={0.9} color="#5f6260" p={[-2.12, SIDEWALK + 0.95, 0.02]} ink={false} bounds={false} />
    {WIRES.map((points, index) => (
      <Cable key={index} points={points} radius={0.0045} color="#1d2228" />
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Street lamp                                                        */
/* ------------------------------------------------------------------ */

const StreetLamp = () => {
  const light = useRef<PointLight>(null);
  useFrame(({clock}) => {
    if (!light.current) return;
    const t = clock.elapsedTime;
    const flicker = Math.sin(t * 1.7) * 0.06 + Math.sin(t * 9.1) * 0.02;
    light.current.intensity = 2.6 + flicker * 0.35;
  });
  return (
    <group>
      <Cyl radius={0.024} height={1.52} color="#5f6462" p={[1.3, SIDEWALK + 0.76, 0.2]} ink={false} />
      <Cyl radius={0.06} height={0.07} color="#4a4f4d" p={[1.3, SIDEWALK + 0.035, 0.2]} ink={false} />
      <Cable points={[[1.3, SIDEWALK + 1.5, 0.2], [1.3, SIDEWALK + 1.62, 0.38], [1.32, SIDEWALK + 1.58, 0.6]]} radius={0.021} color="#4a4f4d" />
      <RBox size={[0.18, 0.05, 0.12]} color="#d8d4c8" p={[1.32, SIDEWALK + 1.55, 0.64]} ink={false} />
      <Box size={[0.14, 0.012, 0.09]} material={flat('#fff2d4')} p={[1.32, SIDEWALK + 1.522, 0.64]} ink={false} shadow={false} />
      <Glow color="#ffe0b0" size={0.9} opacity={0.3} p={[1.32, SIDEWALK + 1.52, 0.64]} />
      <LightCone color="#ffd8a0" height={1.5} radiusTop={0.04} radiusBottom={0.85} opacity={0.13} p={[1.32, SIDEWALK + 1.52, 0.64]} />
      <pointLight ref={light} position={[1.32, SIDEWALK + 1.5, 0.64]} color="#ffd9a8" intensity={2.6} distance={4.4} decay={2} />
      <Panel
        size={[2.2, 1.5]}
        texture={lightPoolTexture('#ffcf8a', 0.22)}
        additive
        r={[-Math.PI / 2, 0, 0]}
        p={[1.32, 0.008, 1.0]}
      />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Vending machine                                                    */
/* ------------------------------------------------------------------ */

const VendingMachine = () => {
  const glow = useRef<Mesh>(null);
  useFrame(({clock}) => {
    if (!glow.current) return;
    const material = glow.current.material;
    if (!Array.isArray(material)) material.opacity = 0.16 + Math.sin(clock.elapsedTime * 1.3) * 0.02;
  });
  return (
    <group position={[0.84, SIDEWALK, -0.63]}>
      <RBox size={[0.44, 0.96, 0.32]} color="#e8e2d2" p={[0, 0.48, 0]} ink inkWidth={0.005} />
      <Panel size={[0.4, 0.84]} texture={vendingFrontTexture()} p={[0, 0.5, 0.163]} />
      <Box size={[0.44, 0.05, 0.32]} color="#d8503f" p={[0, 0.98, 0]} ink={false} shadow={false} />
      <Box size={[0.46, 0.04, 0.34]} color="#8a8f8e" p={[0, 0.02, 0]} ink={false} shadow={false} />
      <mesh ref={glow} position={[0, 0.5, 0.2]}>
        <planeGeometry args={[0.7, 1.0]} />
        <meshBasicMaterial map={lightPoolTexture('#bfe0ff', 0.6)} transparent opacity={0.09} depthWrite={false} toneMapped={false} />
      </mesh>
      <Glow color="#cfe8ff" size={0.8} opacity={0.14} p={[0, 0.5, 0.28]} />
      <pointLight position={[0, 0.5, 0.3]} color="#cfe6ff" intensity={0.8} distance={1.3} decay={2} />
      <Panel
        size={[0.8, 0.7]}
        texture={lightPoolTexture('#a8d4f0', 0.6)}
        additive
        r={[-Math.PI / 2, 0, 0]}
        p={[0, 0.002, 0.32]}
      />
      {/* Recycle bin beside it. */}
      <RBox size={[0.14, 0.18, 0.14]} color="#5f8ab0" p={[0.32, 0.09, 0.12]} ink={false} />
      <Box size={[0.08, 0.02, 0.06]} color="#2b3238" p={[0.32, 0.18, 0.12]} ink={false} shadow={false} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Bicycle                                                            */
/* ------------------------------------------------------------------ */

const Bicycle = ({p = [-1.42, SIDEWALK, -0.24] as Vec3, r = [0, 0.06, 0] as Vec3}) => {
  const frame = '#3f6068';
  const metalColor = '#9aa0a4';
  const wheelRadius = 0.145;
  const axleY = wheelRadius + 0.015;
  return (
    <group position={p} rotation={r}>
      <Wheel p={[-0.33, axleY, 0]} radius={wheelRadius} tube={0.011} color="#2a2e32" spokes={7} />
      <Wheel p={[0.33, axleY, 0]} radius={wheelRadius} tube={0.011} color="#2a2e32" spokes={7} />
      {/* Frame */}
      <Pipe from={[-0.33, axleY, 0]} to={[-0.02, axleY + 0.06, 0]} radius={0.011} color={frame} />
      <Pipe from={[-0.02, axleY + 0.06, 0]} to={[-0.1, axleY + 0.28, 0]} radius={0.011} color={frame} />
      <Pipe from={[-0.1, axleY + 0.28, 0]} to={[0.26, axleY + 0.26, 0]} radius={0.011} color={frame} />
      <Pipe from={[0.26, axleY + 0.26, 0]} to={[0.33, axleY, 0]} radius={0.01} color={frame} />
      <Pipe from={[-0.02, axleY + 0.06, 0]} to={[0.26, axleY + 0.26, 0]} radius={0.012} color={frame} />
      <Pipe from={[-0.33, axleY, 0]} to={[-0.1, axleY + 0.28, 0]} radius={0.009} color={frame} />
      {/* Seat */}
      <Cyl radius={0.035} height={0.02} color="#2a2624" r={[0, 0, Math.PI / 2]} p={[-0.11, axleY + 0.31, 0]} />
      <Pipe from={[-0.1, axleY + 0.28, 0]} to={[-0.11, axleY + 0.3, 0]} radius={0.007} color={metalColor} />
      {/* Handlebar */}
      <Pipe from={[0.26, axleY + 0.26, 0]} to={[0.3, axleY + 0.38, 0]} radius={0.009} color={metalColor} />
      <Pipe from={[0.3, axleY + 0.38, -0.13]} to={[0.3, axleY + 0.38, 0.13]} radius={0.008} color={metalColor} />
      <Cyl radius={0.012} height={0.05} color="#2a2624" r={[0, 0, Math.PI / 2]} p={[0.3, axleY + 0.38, -0.14]} />
      <Cyl radius={0.012} height={0.05} color="#2a2624" r={[0, 0, Math.PI / 2]} p={[0.3, axleY + 0.38, 0.14]} />
      {/* Front basket */}
      <Box size={[0.16, 0.005, 0.18]} color={metalColor} p={[0.42, axleY + 0.2, 0]} ink={false} shadow={false} />
      <Box size={[0.005, 0.12, 0.18]} color={metalColor} p={[0.5, axleY + 0.26, 0]} ink={false} shadow={false} />
      <Box size={[0.005, 0.12, 0.18]} color={metalColor} p={[0.34, axleY + 0.26, 0]} ink={false} shadow={false} />
      <Box size={[0.16, 0.12, 0.005]} color={metalColor} p={[0.42, axleY + 0.26, -0.09]} ink={false} shadow={false} />
      <Box size={[0.16, 0.12, 0.005]} color={metalColor} p={[0.42, axleY + 0.26, 0.09]} ink={false} shadow={false} />
      {/* Rear rack + kickstand + light */}
      <Box size={[0.2, 0.012, 0.11]} color={metalColor} p={[-0.3, axleY + 0.21, 0]} ink={false} shadow={false} />
      <Pipe from={[-0.22, axleY + 0.2, 0.02]} to={[-0.3, 0.0, 0.1]} radius={0.005} color={metalColor} />
      <Cyl radius={0.022} height={0.03} color="#e8e4d8" r={[0, 0, Math.PI / 2]} p={[0.38, axleY + 0.18, 0]} ink={false} shadow={false} />
      <Torus radius={0.035} tube={0.006} color={metalColor} p={[-0.02, axleY + 0.06, 0.05]} r={[0, Math.PI / 2, 0]} />
      {/* Fenders */}
      <Torus radius={wheelRadius + 0.02} tube={0.006} color={frame} p={[0.33, axleY, 0]} r={[0, Math.PI / 2, 0]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Small street objects                                               */
/* ------------------------------------------------------------------ */

const TrashBins = () => (
  <group position={[-0.86, SIDEWALK, -0.4]}>
    {[
      {color: '#5f8ab0', z: 0},
      {color: '#c8a04a', z: 0.17},
      {color: '#8a8f84', z: 0.34},
    ].map((bin) => (
      <group key={bin.color} position={[0, 0, bin.z]}>
        <Cyl radius={0.068} height={0.26} color={bin.color} p={[0, 0.13, 0]} ink={false} />
        <Cyl radius={0.072} height={0.035} color="#3f4442" p={[0, 0.275, 0]} ink={false} shadow={false} />
        <Box size={[0.1, 0.05, 0.01]} color="#f2eee2" p={[0, 0.15, 0.062]} ink={false} shadow={false} />
        <Box size={[0.05, 0.01, 0.005]} color="#3f4442" p={[0, 0.18, 0.068]} ink={false} shadow={false} />
      </group>
    ))}
  </group>
);

const UmbrellaStand = () => (
  <group position={[0.42, SIDEWALK, -0.42]}>
    <Cyl radius={0.08} height={0.3} color="#4a5054" p={[0, 0.15, 0]} ink={false} />
    <Cyl radius={0.085} height={0.02} color="#6f7472" p={[0, 0.31, 0]} ink={false} shadow={false} />
    {[
      {color: '#2f4a5f', tilt: [0.1, 0.1, -0.16]},
      {color: '#9fb8c4', tilt: [-0.14, 0.3, 0.12]},
      {color: '#a85a4a', tilt: [0.16, -0.2, 0.2]},
    ].map((umbrella, index) => (
      <group key={index} rotation={umbrella.tilt as unknown as Vec3} position={[(index - 1) * 0.035, 0.16, index * 0.02]}>
        <Cone radius={0.032} height={0.5} color={umbrella.color} p={[0, 0.25, 0]} ink={false} />
        <Cyl radius={0.006} height={0.62} color="#8a8f8c" p={[0, 0.2, 0]} ink={false} shadow={false} />
        <Torus radius={0.028} tube={0.006} color="#5f6462" p={[0, 0.54, 0]} r={[Math.PI / 2, 0, 0]} />
      </group>
    ))}
  </group>
);

const AFrameSign = () => (
  <group position={[-0.6, SIDEWALK, 0.02]} rotation={[0, 0.22, 0]}>
    <Panel size={[0.32, 0.42]} texture={menuBoardTexture()} p={[0, 0.3, 0.09]} r={[0.16, 0, 0]} />
    <Panel size={[0.32, 0.42]} texture={menuBoardTexture()} p={[0, 0.3, -0.09]} r={[-0.16, Math.PI, 0]} />
    <Box size={[0.35, 0.03, 0.2]} color="#4a3f34" p={[0, 0.52, 0]} ink={false} shadow={false} />
    <Box size={[0.05, 0.03, 0.05]} color="#2f2a24" p={[-0.14, 0.1, 0.1]} ink={false} shadow={false} />
    <Box size={[0.05, 0.03, 0.05]} color="#2f2a24" p={[0.14, 0.1, 0.1]} ink={false} shadow={false} />
    <Glow color="#ffcf9a" size={0.3} opacity={0.15} p={[0, 0.3, 0.2]} />
  </group>
);

const Guardrail = () => (
  <group>
    {[-2.2, -1.85, -1.5, -1.2].map((x) => (
      <group key={x}>
        <Cyl radius={0.014} height={0.42} color="#c8ccc4" p={[x, SIDEWALK + 0.21, 0.3]} ink={false} />
        <Box size={[0.03, 0.02, 0.03]} color="#d8503f" p={[x, SIDEWALK + 0.43, 0.3]} ink={false} shadow={false} />
      </group>
    ))}
    <Pipe from={[-2.2, SIDEWALK + 0.3, 0.3]} to={[-1.2, SIDEWALK + 0.3, 0.3]} radius={0.012} color="#c8ccc4" />
    <Pipe from={[-2.2, SIDEWALK + 0.38, 0.3]} to={[-1.2, SIDEWALK + 0.38, 0.3]} radius={0.01} color="#c8ccc4" />
  </group>
);

const ConvexMirror = () => (
  <group position={[1.66, SIDEWALK, 0.26]} rotation={[0, -0.55, 0]}>
    <Cyl radius={0.016} height={1.18} color="#9a9f9c" p={[0, 0.59, 0]} ink={false} />
    <group position={[0, 1.14, 0]}>
      <Torus radius={0.12} tube={0.014} color="#d8784a" />
      <Cyl radius={0.11} height={0.014} color="#c8d8e0" material={metal('#b8c8d0', 0.18, 0.9)} r={[Math.PI / 2, 0, 0]} />
      <Cyl radius={0.11} height={0.014} color="#6f7472" r={[Math.PI / 2, 0, 0]} p={[0, 0, -0.012]} />
    </group>
    <Box size={[0.03, 0.03, 0.03]} color="#5f6462" p={[0, 1.02, 0]} ink={false} shadow={false} />
  </group>
);

const TrafficSignal = () => {
  const lamps = useRef<(Mesh | null)[]>([]);
  const glow = useRef<Mesh>(null);
  const onColors = useMemo(() => [flat('#e05a4a'), flat('#e0b45a'), flat('#6ac8a0')], []);
  const offColors = useMemo(() => [flat('#3a2626'), flat('#3a3226'), flat('#263a30')], []);

  useFrame(({clock}) => {
    const time = clock.elapsedTime % 20;
    const phase = time < 9 ? 2 : time < 11 ? 1 : 0;
    lamps.current.forEach((lamp, index) => {
      if (!lamp) return;
      const material = index === phase ? onColors[index] : offColors[index];
      if (material) lamp.material = material;
    });
    if (glow.current) {
      const color = phase === 2 ? '#6ac8a0' : phase === 1 ? '#e0b45a' : '#e05a4a';
      const material = glow.current.material as MeshBasicMaterial;
      material.color.set(color);
      material.opacity = 0.2 + Math.sin(clock.elapsedTime * 3) * 0.03;
    }
  });

  return (
    <group position={[1.96, SIDEWALK, 0.4]}>
      <Cyl radius={0.026} height={1.82} color="#6f7472" p={[0, 0.91, 0]} ink={false} bounds={false} />
      <Cable points={[[0, 1.78, 0], [0, 1.9, -0.2], [0, 1.86, -0.48]]} radius={0.024} color="#6f7472" />
      <RBox size={[0.4, 0.13, 0.1]} color="#3f4442" p={[0, 1.74, -0.5]} ink={false} bounds={false} />
      {[0, 1, 2].map((index) => (
        <group key={index}>
          <Cyl
            radius={0.038}
            height={0.014}
            color="#2b3032"
            r={[Math.PI / 2, 0, 0]}
            p={[-0.12 + index * 0.12, 1.74, -0.447]}
            ink={false}
            bounds={false}
          />
          <mesh
            ref={(node) => {
              lamps.current[index] = node;
            }}
            geometry={undefined}
            position={[-0.12 + index * 0.12, 1.74, -0.435]}
            renderOrder={3}
          >
            <circleGeometry args={[0.032, 16]} />
            <meshBasicMaterial color="#3a2626" toneMapped={false} />
          </mesh>
          <Box size={[0.09, 0.025, 0.05]} color="#2b3032" p={[-0.12 + index * 0.12, 1.795, -0.47]} ink={false} shadow={false} bounds={false} />
        </group>
      ))}
      <mesh ref={glow} position={[-0.12, 1.74, -0.42]}>
        <planeGeometry args={[0.5, 0.16]} />
        <meshBasicMaterial map={lightPoolTexture('#6ac8a0', 0.7)} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Pedestrian signal on the pole. */}
      <RBox size={[0.1, 0.22, 0.08]} color="#3f4442" p={[0, 1.05, 0.02]} ink={false} bounds={false} />
      <Panel size={[0.07, 0.09]} texture={storeSignTexture()} p={[0, 1.11, 0.062]} />
      <Box size={[0.03, 0.03, 0.02]} color="#d8503f" p={[0, 1.05, 0.06]} ink={false} shadow={false} bounds={false} />
      <Glow color="#d8503f" size={0.2} opacity={0.3} p={[0, 1.05, 0.1]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Alley                                                              */
/* ------------------------------------------------------------------ */

const Alley = () => {
  const lantern = useRef<Mesh>(null);
  useFrame(({clock}) => {
    if (!lantern.current) return;
    const material = lantern.current.material;
    if (!Array.isArray(material)) material.opacity = 0.85 + Math.sin(clock.elapsedTime * 2.1) * 0.05;
  });
  return (
    <group>
      <Panel size={[0.62, 1.76]} texture={concreteTexture('alleyFloor', '#4a4c4a')} lit r={[-Math.PI / 2, 0, 0]} p={[0.82, SIDEWALK + 0.001, -1.4]} />
      <Panel
        size={[0.4, 0.5]}
        texture={lightPoolTexture('#ffb070', 0.5)}
        additive
        r={[-Math.PI / 2, 0, 0]}
        p={[0.82, SIDEWALK + 0.004, -1.2]}
      />
      {/* Back door. */}
      <Box size={[0.44, 0.9, 0.04]} color="#4a423c" p={[0.82, SIDEWALK + 0.45, -2.24]} ink={false} />
      <Box size={[0.3, 0.3, 0.02]} color="#6f7a7c" material={glass('#c8d8d8', 0.25)} p={[0.82, SIDEWALK + 0.58, -2.215]} ink={false} />
      <Box size={[0.05, 0.05, 0.02]} color="#b8a888" p={[0.94, SIDEWALK + 0.42, -2.21]} ink={false} shadow={false} />
      {/* Lantern hanging on the wall. */}
      <Cable points={[[0.6, SIDEWALK + 1.56, -0.6], [0.7, SIDEWALK + 1.44, -0.7]]} radius={0.004} color="#2a2a2a" />
      <Cyl radius={0.05} height={0.11} color="#d87a5a" p={[0.86, SIDEWALK + 1.3, -0.72]} ink={false} />
      <mesh ref={lantern} position={[0.86, SIDEWALK + 1.3, -0.72]}>
        <cylinderGeometry args={[0.055, 0.055, 0.012, 12]} />
        <meshBasicMaterial color="#ffd0a0" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <Glow color="#ffb070" size={0.7} opacity={0.3} p={[0.86, SIDEWALK + 1.28, -0.72]} />
      <pointLight position={[0.86, SIDEWALK + 1.22, -0.7]} color="#ffb070" intensity={1.1} distance={1.8} decay={2} />
      <Cyl radius={0.05} height={0.11} color="#d87a5a" p={[0.82, SIDEWALK + 1.08, -1.3]} ink={false} />
      <Glow color="#ffb070" size={0.5} opacity={0.16} p={[0.82, SIDEWALK + 1.06, -1.3]} />
      <Panel size={[0.26, 0.08]} texture={labelTagTexture('路地 / ALLEY', '#8f3f34', 'PRIVATE')} p={[0.82, SIDEWALK + 1.16, -0.53]} />
      {/* Crates. */}
      <group position={[0.82, SIDEWALK, -1.92]}>
        <RBox size={[0.22, 0.17, 0.17]} color="#b99a6a" p={[0, 0.085, 0]} ink={false} />
        <RBox size={[0.22, 0.17, 0.17]} color="#a8885a" p={[0.02, 0.255, 0.01]} r={[0, 0.18, 0]} ink={false} />
        <RBox size={[0.2, 0.16, 0.16]} color="#a83f36" p={[-0.2, 0.08, 0.3]} ink={false} />
        <Box size={[0.02, 0.09, 0.015]} color="#7a5f43" p={[0, 0.36, 0]} ink={false} shadow={false} />
      </group>
      {/* Pipes on the konbini wall. */}
      <Cyl radius={0.014} height={1.3} color="#7a7f7c" p={[0.55, SIDEWALK + 0.65, -1.5]} ink={false} shadow={false} />
      <Cyl radius={0.011} height={1.1} color="#8a8f8c" p={[0.56, SIDEWALK + 0.55, -1.72]} ink={false} shadow={false} />
      <Pipe from={[0.55, SIDEWALK + 1.3, -1.5]} to={[0.55, SIDEWALK + 1.3, -2.1]} radius={0.014} color="#7a7f7c" />
      <GrassTuft p={[0.62, SIDEWALK, -2.1]} scale={1.2} />
      <GrassTuft p={[1.02, SIDEWALK, -0.75]} scale={0.9} />
      {/* No-entry sign on the wall. */}
      <Panel size={[0.16, 0.08]} texture={storeSignTexture()} p={[0.9, SIDEWALK + 0.95, -2.2]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Export                                                             */
/* ------------------------------------------------------------------ */

export const StreetProps = () => (
  <group>
    <NeighborBuilding />
    <UtilityPole />
    <StreetLamp />
    <VendingMachine />
    <Bicycle />
    <TrashBins />
    <UmbrellaStand />
    <AFrameSign />
    <Guardrail />
    <ConvexMirror />
    <TrafficSignal />
    <Alley />
    <GrassTuft p={[-1.86, SIDEWALK, -0.3]} scale={1.1} />
    <GrassTuft p={[-0.2, SIDEWALK, -0.48]} scale={0.8} color="#6a8a54" />
    <Pipe from={[-1.74, SIDEWALK, -0.48]} to={[-1.73, 1.44, -0.48]} radius={0.016} color="#8f9598" />
    <Panel size={[0.2, 0.28]} texture={lightSpillTexture('#ffcf9a', 0.4)} additive r={[0, Math.PI / 2, 0]} p={[0.51, 0.62, -1.1]} />
  </group>
);
