import {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {MeshBasicMaterial, type Group, type Mesh} from 'three';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {
  Box,
  Cable,
  Cone,
  ContactShadow,
  Cyl,
  Glow,
  Panel,
  Pipe,
  Plant,
  RBox,
  Sphere,
  Torus,
  type Vec3,
} from '../../three/kit/primitives';
import {LampLight, RoomLights} from '../../three/kit/lighting';
import {flat, metal, toon} from '../../three/materials';
import {useQuality} from '../../three/quality';
import {sphereGeometry} from '../../three/geometry';
import {getScene} from '../../data/scenes';
import {
  codeScreenTexture,
  feltTexture,
  hazardStripeTexture,
  keyboardTexture,
  labelTagTexture,
  ledStripTexture,
  lightPoolTexture,
  paperSheetTexture,
  pegboardTexture,
  posterTexture,
  serverRackTexture,
  whiteboardSkinTexture,
  woodFloorTexture,
  zoneSignTexture,
} from '../../three/textures';
import {FONT_MONO, FONT_SANS, canvasTexture, grain, horizontalGradient, rng, rr, text, verticalGradient} from '../../three/canvas';

/* ------------------------------------------------------------------ */
/* Local print matter                                                  */
/* ------------------------------------------------------------------ */

const workshopWallTexture = () =>
  canvasTexture('scene/workshop/wall', 1024, 512, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#b0a791'],
      [0.45, '#a69c86'],
      [0.62, '#9c927c'],
      [1, '#8b8270'],
    ]);
    const random = rng(521);
    for (let index = 0; index < 1200; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(255,250,232,0.04)' : 'rgba(60,54,40,0.05)';
      const size = 1 + random() * 16;
      ctx.fillRect(random() * width, random() * height, size, size * 0.5);
    }
    // Board joints.
    for (let x = width / 4; x < width; x += width / 4) {
      ctx.fillStyle = 'rgba(66,60,46,0.15)';
      ctx.fillRect(x - 1.5, 0, 3, height);
      ctx.fillStyle = 'rgba(255,250,236,0.06)';
      ctx.fillRect(x + 1.5, 0, 1.5, height);
    }
    // Lower painted band and the timber rail.
    const band = height * 0.56;
    ctx.fillStyle = 'rgba(66, 84, 72, 0.3)';
    ctx.fillRect(0, band, width, height - band);
    ctx.fillStyle = 'rgba(48, 66, 58, 0.24)';
    ctx.fillRect(0, band, width, height * 0.06);
    ctx.fillStyle = '#7c6144';
    ctx.fillRect(0, band - 4, width, 9);
    ctx.fillStyle = 'rgba(255,240,210,0.18)';
    ctx.fillRect(0, band - 4, width, 2);
    ctx.fillStyle = 'rgba(36,44,36,0.3)';
    ctx.fillRect(0, height - 12, width, 12);
    // Grease marks and scuffs behind the bench.
    const scuff = rng(73);
    for (let index = 0; index < 26; index += 1) {
      ctx.strokeStyle = `rgba(58,52,40,${0.04 + scuff() * 0.06})`;
      ctx.lineWidth = 1 + scuff() * 2;
      const x = scuff() * width;
      const y = height * 0.62 + scuff() * height * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14 + scuff() * 40, y + (scuff() - 0.5) * 8);
      ctx.stroke();
    }
    grain(ctx, width, height, {seed: 29, count: 1700, alpha: 0.035, size: 1.5});
  });

const toolTagStripTexture = () =>
  canvasTexture('scene/workshop/toolTags', 640, 96, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const tags = [
      ['SPANNER', 38],
      ['DRIVER', 168],
      ['PLIERS', 298],
      ['HAMMER', 428],
      ['TAPE', 558],
    ] as const;
    for (const [label, x] of tags) {
      ctx.fillStyle = '#efe7d2';
      rr(ctx, x, 16, 104, 56, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,34,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#a67c44';
      ctx.fillRect(x, 16, 6, 56);
      text(ctx, label, x + 16, 50, {size: 17, weight: 700, font: FONT_SANS, color: '#3d3a30', tracking: 1});
    }
  });

const partsBinTexture = () =>
  canvasTexture('scene/workshop/partsBins', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#4d5b54';
    ctx.fillRect(0, 0, width, height);
    const labels = ['M3', 'M4', 'NUTS', 'LED', 'RELAY', 'HEAT'] as const;
    const cols = 3;
    const rows = 2;
    labels.forEach((label, index) => {
      const column = index % cols;
      const row = Math.floor(index / cols);
      const cellW = width / cols;
      const cellH = height / rows;
      const x = column * cellW;
      const y = row * cellH;
      ctx.fillStyle = index % 2 === 0 ? '#667a70' : '#5f736a';
      ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 12);
      ctx.fillStyle = 'rgba(26, 34, 30, 0.55)';
      ctx.beginPath();
      ctx.ellipse(x + cellW / 2, y + cellH * 0.62, cellW * 0.34, cellH * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 6, y + 6, cellW - 12, 3);
      ctx.fillStyle = '#e9e1cd';
      rr(ctx, x + 18, y + 14, cellW - 36, 24, 3);
      ctx.fill();
      text(ctx, label, x + cellW / 2, y + 32, {size: 16, weight: 700, font: FONT_MONO, color: '#3a4038', align: 'center', tracking: 1});
      ctx.fillStyle = 'rgba(30,38,34,0.22)';
      ctx.fillRect(x + 12, y + cellH - 16, cellW - 24, 4);
    });
  });

const solderStationTexture = () =>
  canvasTexture('scene/workshop/solderStation', 256, 160, (ctx, width, height) => {
    ctx.fillStyle = '#242d31';
    ctx.fillRect(0, 0, width, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.06)'],
      [1, 'rgba(0,0,0,0.16)'],
    ]);
    ctx.fillStyle = '#0f171a';
    rr(ctx, 18, 16, 128, 56, 4);
    ctx.fill();
    text(ctx, '320', 30, 54, {size: 36, weight: 700, font: FONT_MONO, color: '#8fe0c0'});
    text(ctx, '°C', 108, 52, {size: 20, weight: 600, font: FONT_MONO, color: '#8fe0c0'});
    text(ctx, 'SOLDER / 06', 30, 78, {size: 10, weight: 600, font: FONT_MONO, color: '#5f8078'});
    for (const [x, tint] of [
      [188, '#8fe0c0'],
      [224, '#e0b45a'],
    ] as const) {
      ctx.fillStyle = '#39454a';
      ctx.beginPath();
      ctx.arc(x, 50, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.arc(x, 50, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x + 7, 41);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(18, 96, width - 36, 2);
    ctx.fillStyle = '#e0b45a';
    ctx.fillRect(18, 112, 42, 5);
    ctx.fillStyle = '#8fe0c0';
    ctx.fillRect(68, 112, 68, 5);
  });

const meterTexture = () =>
  canvasTexture('scene/workshop/meter', 128, 64, (ctx, width, height) => {
    ctx.fillStyle = '#b7c9a6';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(30, 42, 30, 0.16)';
    for (let y = 6; y < height; y += 8) ctx.fillRect(4, y, width - 8, 1);
    text(ctx, '12.06', 10, 36, {size: 22, weight: 700, font: FONT_MONO, color: '#243424'});
    text(ctx, 'V', 88, 34, {size: 14, weight: 700, font: FONT_MONO, color: '#243424'});
    text(ctx, 'DC', width - 10, 52, {size: 9, weight: 600, font: FONT_MONO, color: '#3f523f', align: 'right'});
  });

const scanTexture = () =>
  canvasTexture('scene/workshop/scan', 8, 64, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(190,244,255,0)');
    gradient.addColorStop(0.44, 'rgba(200,248,255,0.4)');
    gradient.addColorStop(0.54, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.7, 'rgba(200,248,255,0.3)');
    gradient.addColorStop(1, 'rgba(190,244,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, {sharp: true});

/* ------------------------------------------------------------------ */
/* Small animated pieces                                               */
/* ------------------------------------------------------------------ */

const Led = ({
  p,
  color,
  size = 0.012,
  speed = 1.5,
  phase = 0,
}: {
  p: Vec3;
  color: string;
  size?: number;
  speed?: number;
  phase?: number;
}) => {
  const mesh = useRef<Mesh>(null);
  const quality = useQuality();
  const material = useMemo(() => new MeshBasicMaterial({color, toneMapped: false, transparent: true, opacity: 0.95}), [color]);
  useFrame(({clock}) => {
    if (quality.reducedMotion) {
      material.opacity = 0.9;
      return;
    }
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * speed + phase);
    const on = pulse > 0.5 ? 1 : 0.18;
    material.opacity = 0.3 + on * 0.7;
    if (mesh.current) mesh.current.scale.setScalar(0.82 + on * 0.3);
  });
  return <mesh ref={mesh} position={p} material={material} geometry={sphereGeometry(size, 10, 8)} />;
};

const ScreenScan = ({width, height, p}: {width: number; height: number; p: Vec3}) => {
  const group = useRef<Group>(null);
  const quality = useQuality();
  useFrame(({clock}) => {
    if (!group.current || quality.reducedMotion) return;
    const cycle = (clock.elapsedTime * 0.24) % 1;
    group.current.position.y = p[1] + height * (0.42 - cycle * 0.84);
  });
  return (
    <group ref={group} position={p}>
      <Panel size={[width, Math.max(0.012, height * 0.08)]} texture={scanTexture()} additive opacity={0.42} bounds={false} />
    </group>
  );
};

const ShopMonitor = ({p, yaw = 0, width = 0.34, height = 0.22}: {p: Vec3; yaw?: number; width?: number; height?: number}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box size={[0.2, 0.014, 0.12]} color="#2b3338" p={[0, 0.007, 0]} ink={false} shadow={false} />
    <Box size={[0.04, 0.15, 0.04]} color="#2b3338" p={[0, 0.08, -0.025]} ink={false} shadow={false} />
    <group position={[0, 0.18, 0]} rotation={[-0.09, 0, 0]}>
      <RBox size={[width + 0.03, height + 0.03, 0.024]} radius={0.004} color="#212a2f" p={[0, height / 2, 0]} ink={false} shadow={false} />
      <Panel size={[width, height]} texture={codeScreenTexture(0)} p={[0, height / 2, 0.0135]} />
      <ScreenScan width={width} height={height} p={[0, height / 2, 0.022]} />
    </group>
    <Glow color="#9fe4f2" size={width * 1.6} opacity={0.11} p={[0, 0.18 + height / 2, 0.1]} />
  </group>
);

const RackFan = () => {
  const blades = useRef<Group>(null);
  const quality = useQuality();
  useFrame(({clock}) => {
    if (!blades.current || quality.reducedMotion) return;
    blades.current.rotation.y = clock.elapsedTime * 2.3;
  });
  return (
    <group>
      <Cyl radius={0.085} height={0.02} color="#2b363b" p={[1.18, 1.13, -1.42]} ink={false} shadow={false} />
      <group ref={blades} position={[1.18, 1.145, -1.42]}>
        {[0, 1, 2].map((index) => {
          const angle = (index / 3) * Math.PI * 2;
          return (
            <Box
              key={index}
              size={[0.065, 0.004, 0.028]}
              color="#7f8f92"
              p={[Math.cos(angle) * 0.038, 0, Math.sin(angle) * 0.038]}
              r={[0, angle + 0.5, 0.14]}
              ink={false}
              shadow={false}
            />
          );
        })}
      </group>
      <Cyl radius={0.014} height={0.018} color="#5f7075" p={[1.18, 1.151, -1.42]} ink={false} shadow={false} />
      <Torus radius={0.078} tube={0.006} color="#6f8085" r={[-Math.PI / 2, 0, 0]} p={[1.18, 1.145, -1.42]} ink={false} shadow={false} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Architecture                                                        */
/* ------------------------------------------------------------------ */

const Shell = () => (
  <group>
    <Box
      size={[3.44, 0.06, 3.44]}
      material={toon('#b3a48f', {map: woodFloorTexture()})}
      p={[0, 0.03, 0]}
      ink={false}
    />
    <Box
      size={[3.46, 1.74, 0.07]}
      material={toon('#ffffff', {map: workshopWallTexture()})}
      p={[0, 0.87, -1.655]}
      ink
      inkWidth={0.009}
    />
    <Box
      size={[0.07, 1.74, 3.46]}
      material={toon('#ffffff', {map: workshopWallTexture()})}
      p={[-1.655, 0.87, 0]}
      ink
      inkWidth={0.009}
    />
    <Box size={[3.5, 0.03, 0.1]} color="#665844" p={[0, 1.755, -1.655]} ink={false} />
    <Box size={[0.1, 0.03, 3.5]} color="#665844" p={[-1.655, 1.755, 0]} ink={false} />
    <Box size={[3.42, 0.16, 0.03]} color="#4b4436" p={[0, 0.08, -1.6]} ink={false} />
    <Box size={[0.03, 0.16, 3.42]} color="#4b4436" p={[-1.6, 0.08, 0]} ink={false} />
    <Box size={[3.42, 0.05, 0.03]} color="#7c6144" p={[0, 0.235, -1.6]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Pegboard wall + tool library drawers                                */
/* ------------------------------------------------------------------ */

const Wrench = ({x}: {x: number}) => (
  <group>
    <Box size={[0.026, 0.19, 0.012]} color="#8b969a" p={[x, 1.12, -1.572]} ink={false} shadow={false} />
    <Torus radius={0.03} tube={0.009} color="#8b969a" p={[x, 1.24, -1.572]} ink={false} shadow={false} />
  </group>
);

const Screwdriver = ({x}: {x: number}) => (
  <group>
    <Cyl radius={0.016} height={0.075} segments={12} color="#b06a3a" p={[x, 1.22, -1.572]} ink={false} shadow={false} />
    <Cyl radius={0.0045} height={0.15} segments={8} color="#c8cdc9" p={[x, 1.11, -1.572]} ink={false} shadow={false} />
  </group>
);

const Pliers = ({x}: {x: number}) => (
  <group>
    <Box size={[0.012, 0.19, 0.009]} color="#4f6068" p={[x - 0.012, 1.16, -1.572]} r={[0, 0, -0.16]} ink={false} shadow={false} />
    <Box size={[0.012, 0.19, 0.009]} color="#4f6068" p={[x + 0.012, 1.16, -1.572]} r={[0, 0, 0.16]} ink={false} shadow={false} />
    <Cyl radius={0.012} height={0.012} segments={10} color="#9aa5a6" r={[Math.PI / 2, 0, 0]} p={[x, 1.245, -1.57]} ink={false} shadow={false} />
  </group>
);

const Hammer = ({x}: {x: number}) => (
  <group>
    <Box size={[0.019, 0.21, 0.012]} color="#8a6a48" p={[x, 1.12, -1.572]} ink={false} shadow={false} />
    <Box size={[0.11, 0.038, 0.03]} color="#5f6b70" p={[x, 1.235, -1.572]} ink={false} shadow={false} />
  </group>
);

const Pegboard = () => (
  <group>
    <Box size={[0.92, 0.54, 0.025]} color="#8a6a48" p={[-0.98, 1.39, -1.606]} ink={false} />
    <Panel size={[0.88, 0.5]} texture={pegboardTexture()} lit p={[-0.98, 1.39, -1.592]} />
    <Panel size={[0.82, 0.085]} texture={toolTagStripTexture()} p={[-0.98, 1.19, -1.585]} />
    <group position={[0, 0.24, 0]}>
      <Wrench x={-1.31} />
      <Screwdriver x={-1.11} />
      <Pliers x={-0.91} />
      <Hammer x={-0.71} />
      <Cyl radius={0.034} height={0.024} segments={16} color="#d8b84a" r={[Math.PI / 2, 0, 0]} p={[-1.38, 1.08, -1.572]} ink={false} shadow={false} />
      <Box size={[0.02, 0.03, 0.012]} color="#5f6b70" p={[-1.38, 1.03, -1.572]} ink={false} shadow={false} />
      <Torus radius={0.042} tube={0.013} color="#b8733a" p={[-0.58, 1.3, -1.572]} ink={false} shadow={false} />
      <Cyl radius={0.038} height={0.004} color="#8f6a44" r={[Math.PI / 2, 0, 0]} p={[-0.58, 1.3, -1.575]} ink={false} shadow={false} />
      <Cyl radius={0.005} height={0.05} color="#8f9a9a" p={[-0.58, 1.365, -1.57]} ink={false} shadow={false} />
    </group>

    {/* Cool light bar washing the tool wall. */}
    <Box size={[0.82, 0.02, 0.045]} material={flat('#e8f8ff')} p={[-0.98, 1.7, -1.56]} ink={false} shadow={false} />
    <Box size={[0.04, 0.04, 0.08]} color="#4c5b58" p={[-1.36, 1.68, -1.58]} ink={false} />
    <Box size={[0.04, 0.04, 0.08]} color="#4c5b58" p={[-0.6, 1.68, -1.58]} ink={false} />
    <LampLight position={[-0.98, 1.62, -1.38]} color="#dff4ff" intensity={0.9} distance={1.9} />
  </group>
);

const DRAWER_LABELS = [
  ['PYTHON', '#3f6f8a', 'runtime'],
  ['FASTAPI', '#3f7a6a', 'api'],
  ['NEO4J', '#4a7a4a', 'graph'],
  ['DOCKER', '#3f6f8a', 'sandbox'],
  ['RAG', '#8a6a3a', 'retrieval'],
  ['AGENT', '#6a5a8a', 'tools'],
  ['SECURITY', '#8a4a3a', 'guard'],
  ['LINUX', '#4a5a5a', 'system'],
] as const;

const DrawerCabinet = () => (
  <group>
    <Box size={[0.94, 0.06, 0.38]} color="#443d30" p={[-0.98, 0.03, -1.42]} ink={false} />
    <RBox size={[0.92, 0.99, 0.36]} radius={0.006} color="#7d5f42" p={[-0.98, 0.555, -1.42]} ink inkWidth={0.006} />
    <Box size={[0.96, 0.03, 0.4]} color="#a97f52" p={[-0.98, 1.065, -1.42]} ink={false} />
    <Panel size={[0.38, 0.06]} texture={labelTagTexture('TOOL LIBRARY', '#a67c44', 'STACK / 06')} p={[-0.98, 0.995, -1.218]} />
    {DRAWER_LABELS.map(([label, color, sub], index) => {
      const column = Math.floor(index / 4);
      const row = index % 4;
      const x = -1.2 + column * 0.44;
      const y = 0.79 - row * 0.2;
      return (
        <group key={label}>
          <RBox size={[0.4, 0.18, 0.02]} radius={0.004} color="#b0906a" p={[x, y, -1.238]} ink={false} />
          <Panel size={[0.35, 0.075]} texture={labelTagTexture(label, color, sub)} p={[x, y + 0.016, -1.226]} />
          <Cyl radius={0.01} height={0.02} color="#d8b06a" r={[Math.PI / 2, 0, 0]} p={[x, y - 0.052, -1.222]} ink={false} shadow={false} />
        </group>
      );
    })}
  </group>
);

/* ------------------------------------------------------------------ */
/* Whiteboard + parts bench                                            */
/* ------------------------------------------------------------------ */

const Whiteboard = () => (
  <group>
    <Box size={[0.9, 0.48, 0.025]} color="#aeb8b8" p={[0.57, 1.23, -1.604]} ink={false} />
    <Panel size={[0.86, 0.44]} texture={whiteboardSkinTexture()} lit p={[0.57, 1.23, -1.589]} />
    <Box size={[0.9, 0.022, 0.06]} color="#8f9a9a" p={[0.57, 0.985, -1.575]} ink={false} />
    <Cyl radius={0.011} height={0.09} segments={8} color="#2f4050" r={[0, 0, Math.PI / 2]} p={[0.36, 0.999, -1.568]} ink={false} shadow={false} />
    <Cyl radius={0.011} height={0.09} segments={8} color="#9a3f3a" r={[0, 0, Math.PI / 2]} p={[0.52, 0.999, -1.568]} ink={false} shadow={false} />
    <Cyl radius={0.011} height={0.09} segments={8} color="#2d3238" r={[0, 0, Math.PI / 2]} p={[0.68, 0.999, -1.568]} ink={false} shadow={false} />
    <RBox size={[0.11, 0.025, 0.05]} radius={0.004} color="#d8d2c2" p={[0.88, 0.998, -1.57]} ink={false} />
    <Panel size={[0.22, 0.3]} texture={paperSheetTexture('BUILD LOG', 12)} p={[-0.26, 1.36, -1.595]} />
    <Box size={[0.14, 0.024, 0.018]} color="#8f9a9a" p={[-0.26, 1.512, -1.59]} ink={false} />
  </group>
);

const PartsBoard = () => (
  <group>
    <Box size={[0.54, 0.34, 0.09]} color="#4e5f57" p={[-0.2, 0.82, -1.555]} ink={false} />
    <Panel size={[0.5, 0.28]} texture={partsBinTexture()} p={[-0.2, 0.82, -1.507]} />
    <Box size={[0.54, 0.022, 0.1]} color="#8a6a48" p={[-0.2, 1.0, -1.555]} ink={false} />
    <RBox size={[0.16, 0.1, 0.13]} radius={0.004} color="#c9a45c" p={[-0.36, 1.06, -1.54]} ink={false} />
    <Cyl radius={0.032} height={0.11} segments={12} color="#3f6f8a" p={[-0.08, 1.055, -1.54]} ink={false} />
    <Cyl radius={0.032} height={0.02} segments={12} color="#8f9a9a" p={[-0.08, 1.115, -1.54]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Server rack                                                         */
/* ------------------------------------------------------------------ */

const ServerRack = () => (
  <group>
    <Box size={[0.46, 0.05, 0.5]} color="#2c373c" p={[1.18, 0.085, -1.4]} ink={false} />
    <RBox size={[0.44, 0.98, 0.46]} radius={0.006} color="#39464c" p={[1.18, 0.6, -1.4]} ink inkWidth={0.006} />
    <Panel size={[0.32, 0.86]} texture={serverRackTexture(5)} p={[1.15, 0.62, -1.168]} />
    <Panel size={[0.055, 0.62]} texture={ledStripTexture(9, '#7fe0c8')} p={[1.355, 0.74, -1.168]} />
    <Panel size={[0.4, 0.045]} texture={hazardStripeTexture()} p={[1.18, 0.125, -1.168]} />
    <Led p={[1.0, 0.48, -1.16]} color="#8fe0a0" size={0.011} speed={1.2} phase={0.3} />
    <Led p={[1.04, 0.48, -1.16]} color="#8fd6e2" size={0.011} speed={1.9} phase={2.1} />
    <Led p={[1.08, 0.48, -1.16]} color="#e0b45a" size={0.011} speed={0.8} phase={4.2} />
    <RBox size={[0.3, 0.05, 0.26]} radius={0.004} color="#4a5a60" p={[1.18, 1.12, -1.42]} ink={false} />
    <Box size={[0.24, 0.008, 0.2]} color="#2b363b" p={[1.18, 1.15, -1.42]} ink={false} shadow={false} />
    <RackFan />
    <Cable
      points={[
        [1.05, 1.14, -1.42],
        [0.97, 1.18, -1.3],
        [0.94, 1.16, -1.19],
      ]}
      radius={0.005}
      color="#2f4046"
    />
    <Cable
      points={[
        [1.3, 1.14, -1.42],
        [1.4, 1.18, -1.3],
        [1.42, 1.12, -1.19],
      ]}
      radius={0.005}
      color="#2f4046"
    />
    <Panel size={[0.3, 0.15]} texture={zoneSignTexture('RACK 06', 'HOME LAB · 24/7', '#7fd8c8')} p={[1.18, 1.34, -1.59]} />
    <Glow color="#7fe0c8" size={0.8} opacity={0.1} p={[1.2, 0.7, -1.12]} />
    <LampLight position={[1.22, 0.72, -1.06]} color="#7fe0c8" intensity={0.45} distance={1.15} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Workbench                                                           */
/* ------------------------------------------------------------------ */

const TaskLamp = () => (
  <group>
    <Box size={[0.07, 0.03, 0.07]} color="#3c4a50" p={[0.82, 0.585, -0.36]} ink={false} shadow={false} />
    <Pipe from={[0.82, 0.6, -0.36]} to={[0.82, 0.92, -0.36]} radius={0.012} color="#3c4a50" />
    <Cyl radius={0.016} height={0.03} color="#3c4a50" r={[0, 0, Math.PI / 2]} p={[0.82, 0.92, -0.36]} ink={false} shadow={false} />
    <Pipe from={[0.82, 0.93, -0.36]} to={[0.62, 1.04, -0.2]} radius={0.011} color="#3c4a50" />
    <Cone radius={0.082} height={0.088} material={metal('#a4b0ae', 0.4, 0.45)} p={[0.6, 1.01, -0.16]} ink={false} shadow={false} />
    <Sphere radius={0.018} material={flat('#fff0d4')} p={[0.6, 0.968, -0.16]} ink={false} shadow={false} />
    <Glow color="#ffe6b8" size={0.52} opacity={0.26} p={[0.6, 0.965, -0.15]} />
    <LampLight position={[0.6, 0.96, -0.15]} color="#ffdfb0" intensity={1.7} distance={2.1} />
  </group>
);

const Workbench = () => (
  <group>
    <ContactShadow p={[0.15, 0.062, -0.06]} radius={0.95} opacity={0.45} />
    <Box size={[1.5, 0.06, 0.68]} color="#a97f52" p={[0.15, 0.54, -0.1]} ink inkWidth={0.005} />
    <Box size={[1.5, 0.016, 0.03]} color="#4a5a60" p={[0.15, 0.576, 0.235]} ink={false} shadow={false} />
    {(
      [
        [-0.55, -0.39],
        [0.85, -0.39],
        [-0.55, 0.19],
        [0.85, 0.19],
      ] as const
    ).map(([x, z]) => (
      <RBox key={`${x}-${z}`} size={[0.055, 0.45, 0.055]} radius={0.006} color="#46565c" p={[x, 0.285, z]} ink={false} />
    ))}
    <Box size={[1.4, 0.05, 0.04]} color="#46565c" p={[0.15, 0.18, -0.36]} ink={false} />
    <Box size={[1.34, 0.022, 0.56]} color="#5a6b70" p={[0.15, 0.16, -0.1]} ink={false} />
    <Box size={[0.32, 0.12, 0.28]} color="#4a5a60" p={[-0.3, 0.24, -0.12]} ink={false} />
    <Box size={[0.26, 0.1, 0.22]} color="#8a6a48" p={[0.32, 0.23, -0.08]} ink={false} />

    <Panel size={[0.58, 0.4]} texture={feltTexture('workshopBenchMat', '#3f4a41')} r={[-Math.PI / 2, 0, 0]} p={[0.1, 0.572, 0.0]} />
    <ShopMonitor p={[0.18, 0.57, -0.34]} yaw={0.1} width={0.4} height={0.25} />
    <Panel size={[0.28, 0.09]} texture={keyboardTexture()} r={[-Math.PI / 2, 0, 0]} p={[0.18, 0.576, -0.07]} />
    <RBox size={[0.034, 0.014, 0.058]} radius={0.008} color="#c8d2cf" p={[0.38, 0.576, -0.05]} ink={false} />

    {/* Soldering station. */}
    <RBox size={[0.24, 0.065, 0.17]} radius={0.005} color="#3c4a50" p={[-0.38, 0.6, -0.26]} ink={false} />
    <Panel size={[0.21, 0.11]} texture={solderStationTexture()} p={[-0.38, 0.61, -0.174]} />
    <Cyl radius={0.045} height={0.012} color="#39464a" p={[-0.18, 0.576, -0.3]} ink={false} />
    <Cyl radius={0.005} height={0.13} color="#7f8f92" p={[-0.16, 0.64, -0.3]} ink={false} shadow={false} />
    <Cyl radius={0.015} height={0.09} segments={10} color="#2f3c41" r={[0, 0, 1.0]} p={[-0.23, 0.66, -0.28]} ink={false} shadow={false} />
    <Cyl radius={0.004} height={0.09} segments={8} color="#b8c0c0" r={[0, 0, 1.0]} p={[-0.29, 0.7, -0.28]} ink={false} shadow={false} />

    {/* Meter, tray, vise, mug, pencil and paperwork. */}
    <RBox size={[0.15, 0.065, 0.1]} radius={0.006} color="#c9803a" p={[0.54, 0.6, 0.06]} ink={false} />
    <Panel size={[0.11, 0.05]} texture={meterTexture()} p={[0.54, 0.615, 0.113]} />
    <RBox size={[0.26, 0.018, 0.17]} radius={0.004} color="#53645f" p={[0.06, 0.578, 0.08]} ink={false} />
    <Cyl radius={0.011} height={0.012} color="#b8b4a4" p={[0.0, 0.591, 0.08]} ink={false} shadow={false} />
    <Cyl radius={0.009} height={0.012} color="#8f9790" p={[0.04, 0.591, 0.06]} ink={false} shadow={false} />
    <Cyl radius={0.011} height={0.014} color="#c8a45c" p={[0.13, 0.592, 0.1]} ink={false} shadow={false} />
    <Box size={[0.14, 0.04, 0.11]} color="#56665f" p={[0.6, 0.58, 0.12]} ink={false} />
    <Box size={[0.13, 0.06, 0.07]} color="#8f9a9a" p={[0.6, 0.62, 0.1]} ink={false} />
    <Box size={[0.07, 0.06, 0.06]} color="#7f8a8a" p={[0.66, 0.62, 0.1]} ink={false} />
    <Cyl radius={0.008} height={0.15} color="#9aa5a6" r={[0, 0, Math.PI / 2]} p={[0.72, 0.63, 0.1]} ink={false} shadow={false} />
    <Cyl radius={0.034} height={0.085} color="#dfe6e2" p={[-0.22, 0.61, 0.09]} ink={false} />
    <Torus radius={0.026} tube={0.007} color="#dfe6e2" r={[Math.PI / 2, 0, 0]} p={[-0.185, 0.607, 0.09]} ink={false} shadow={false} />
    <Cyl radius={0.004} height={0.14} color="#c9a45c" r={[0, 0.5, Math.PI / 2]} p={[0.0, 0.578, 0.16]} ink={false} shadow={false} />
    <Box size={[0.22, 0.01, 0.16]} color="#8a6a48" p={[-0.2, 0.578, 0.15]} r={[0, 0.16, 0]} ink={false} />
    <Panel size={[0.19, 0.14]} texture={paperSheetTexture('SCHEMATIC', 9)} r={[-Math.PI / 2, 0.16, 0]} p={[-0.2, 0.585, 0.15]} />

    {/* Loose hand tools and solder reel. */}
    <Cyl radius={0.015} height={0.08} segments={12} color="#b06a3a" r={[0, 0, Math.PI / 2]} p={[-0.08, 0.585, 0.22]} ink={false} shadow={false} />
    <Cyl radius={0.004} height={0.12} segments={8} color="#b8c0c0" r={[0, 0, Math.PI / 2]} p={[-0.18, 0.585, 0.22]} ink={false} shadow={false} />
    <Box size={[0.16, 0.012, 0.012]} color="#8f9a9a" r={[0.3, 0.5, 0]} p={[0.46, 0.582, 0.2]} ink={false} shadow={false} />
    <Cyl radius={0.038} height={0.012} color="#8f9a9a" p={[-0.3, 0.586, -0.08]} ink={false} shadow={false} />
    <Cyl radius={0.024} height={0.014} color="#3d4a4f" p={[-0.3, 0.588, -0.08]} ink={false} shadow={false} />
    <Torus radius={0.03} tube={0.011} color="#c9a45c" r={[-Math.PI / 2, 0, 0]} p={[0.5, 0.582, 0.2]} ink={false} shadow={false} />

    {/* Light pool and the task lamp. */}
    <Panel size={[0.4, 0.32]} texture={lightPoolTexture('#ffe9c4', 0.26)} additive opacity={0.28} r={[-Math.PI / 2, 0, 0]} p={[0.58, 0.578, 0.0]} />
    <TaskLamp />
  </group>
);

/* ------------------------------------------------------------------ */
/* Left wall shelves and floor                                         */
/* ------------------------------------------------------------------ */

const LeftWall = () => (
  <group>
    <Box size={[0.3, 0.026, 0.9]} color="#8a6a48" p={[-1.46, 1.16, -0.42]} ink={false} />
    <Box size={[0.02, 0.14, 0.16]} color="#6f7b72" p={[-1.47, 1.06, -0.82]} ink={false} />
    <Box size={[0.02, 0.14, 0.16]} color="#6f7b72" p={[-1.47, 1.06, -0.02]} ink={false} />
    <Cyl radius={0.05} height={0.1} segments={14} color="#a85f4a" p={[-1.47, 1.23, -0.72]} ink={false} />
    <Cyl radius={0.045} height={0.09} segments={14} color="#6f8f9a" p={[-1.47, 1.225, -0.56]} ink={false} />
    <RBox size={[0.16, 0.1, 0.12]} radius={0.004} color="#c9b48e" p={[-1.46, 1.225, -0.2]} ink={false} />
    <Box size={[0.18, 0.008, 0.14]} color="#8a6a48" p={[-1.46, 1.28, -0.2]} ink={false} />
    <Plant p={[-1.45, 1.175, -0.9]} scale={0.42} potColor="#9a6f56" leafColor="#5f7f5a" />
    <Panel
      size={[0.26, 0.36]}
      texture={posterTexture('workshop', 'SAFETY FIRST', 'glasses · gloves · focus', '#a06a3a', 'notice')}
      r={[0, Math.PI / 2, 0]}
      p={[-1.615, 1.22, 0.72]}
    />
    <Box size={[0.28, 0.2, 0.02]} color="#c9c0aa" r={[0, Math.PI / 2, 0.06]} p={[-1.6, 0.32, 1.24]} ink={false} />
    <Box size={[0.24, 0.16, 0.018]} color="#b0a68e" r={[0, Math.PI / 2, 0.02]} p={[-1.59, 0.31, 1.12]} ink={false} />
    <Pipe from={[-1.6, 0.06, -1.1]} to={[-1.6, 1.52, -1.1]} radius={0.015} color="#6f7b72" />
    <Box size={[0.05, 0.02, 0.045]} color="#56665f" p={[-1.585, 0.5, -1.1]} ink={false} />
    <Box size={[0.05, 0.02, 0.045]} color="#56665f" p={[-1.585, 1.2, -1.1]} ink={false} />
    <Cyl radius={0.05} height={0.27} segments={14} color="#b8442f" p={[-1.55, 0.78, 0.2]} ink={false} />
    <Cyl radius={0.018} height={0.07} segments={10} color="#3f4a4a" p={[-1.55, 0.95, 0.2]} ink={false} />
    <Cyl radius={0.008} height={0.17} segments={8} color="#2f3a3a" r={[0, 0, 1.0]} p={[-1.51, 0.85, 0.2]} ink={false} shadow={false} />
    <Box size={[0.02, 0.04, 0.1]} color="#4a5a60" p={[-1.6, 0.9, 0.2]} ink={false} />
  </group>
);

const FloorProps = () => (
  <group>
    <Box
      size={[1.66, 0.008, 0.94]}
      material={toon('#ffffff', {map: feltTexture('workshopFloorMat', '#414a42')})}
      p={[0.05, 0.064, 0.34]}
      ink={false}
    />

    <ContactShadow p={[-0.2, 0.062, 0.54]} radius={0.24} opacity={0.42} />
    <Cyl radius={0.135} height={0.032} color="#8a6a48" p={[-0.2, 0.435, 0.54]} ink={false} />
    <Cyl radius={0.12} height={0.018} color="#5f6b70" p={[-0.2, 0.455, 0.54]} ink={false} />
    {[0, 1, 2, 3].map((index) => {
      const angle = (index / 4) * Math.PI * 2 + 0.4;
      return (
        <Cyl
          key={index}
          radius={0.011}
          height={0.39}
          color="#46565c"
          p={[-0.2 + Math.cos(angle) * 0.1, 0.255, 0.54 + Math.sin(angle) * 0.1]}
          r={[Math.sin(angle) * 0.12, 0, -Math.cos(angle) * 0.12]}
          ink={false}
        />
      );
    })}
    <Torus radius={0.1} tube={0.006} color="#63767a" r={[-Math.PI / 2, 0, 0]} p={[-0.2, 0.21, 0.54]} ink={false} shadow={false} />

    {/* Cable spools. */}
    <ContactShadow p={[1.12, 0.062, 0.52]} radius={0.26} opacity={0.4} />
    <Cyl radius={0.1} height={0.02} color="#8a6a48" p={[1.12, 0.1, 0.52]} ink={false} />
    <Cyl radius={0.1} height={0.02} color="#8a6a48" p={[1.12, 0.24, 0.52]} ink={false} />
    <Cyl radius={0.063} height={0.12} segments={16} color="#2f4046" p={[1.12, 0.17, 0.52]} ink={false} />
    <Torus radius={0.072} tube={0.011} color="#3a4a50" r={[-Math.PI / 2, 0, 0]} p={[1.12, 0.17, 0.52]} ink={false} shadow={false} />
    <Cyl radius={0.09} height={0.018} color="#8a6a48" r={[Math.PI / 2, 0, 0]} p={[1.34, 0.11, 0.3]} ink={false} />
    <Cyl radius={0.09} height={0.018} color="#8a6a48" r={[Math.PI / 2, 0, 0]} p={[1.34, 0.11, 0.44]} ink={false} />
    <Cyl radius={0.058} height={0.13} segments={16} color="#2f4046" r={[Math.PI / 2, 0, 0]} p={[1.34, 0.11, 0.37]} ink={false} />
    <Cable
      points={[
        [1.24, 0.085, 0.3],
        [1.02, 0.075, 0.18],
        [0.7, 0.075, 0.14],
        [0.62, 0.1, -0.1],
      ]}
      radius={0.008}
      color="#2f4046"
    />

    {/* Cardboard boxes and offcuts by the left wall. */}
    <RBox size={[0.32, 0.2, 0.3]} radius={0.005} color="#b9a27e" p={[-1.34, 0.16, 0.88]} ink={false} />
    <RBox size={[0.28, 0.17, 0.26]} radius={0.005} color="#c6b08c" r={[0, 0.16, 0]} p={[-1.3, 0.345, 0.84]} ink={false} />
    <Panel size={[0.16, 0.06]} texture={labelTagTexture('PARTS', '#8a6a3a', 'MIXED / 06')} p={[-1.34, 0.17, 1.032]} />
    <Panel size={[0.14, 0.05]} texture={labelTagTexture('CABLES', '#3f6f8a', 'SPARE')} p={[-1.3, 0.35, 0.972]} />
    <Box size={[0.02, 0.5, 0.34]} color="#9a7a52" r={[0, 0.2, 0.1]} p={[-1.58, 0.34, 1.44]} ink={false} />
    <Box size={[0.02, 0.42, 0.28]} color="#7d6145" r={[0, -0.15, 0.06]} p={[-1.54, 0.3, 1.36]} ink={false} />

    {/* Shop bin with offcuts. */}
    <Cyl radius={0.09} height={0.2} color="#56665f" p={[0.45, 0.16, 0.72]} ink={false} />
    <Cyl radius={0.083} height={0.006} color="#2c3833" p={[0.45, 0.258, 0.72]} ink={false} />
    <Box size={[0.03, 0.22, 0.02]} color="#a97f52" r={[0.1, 0.3, 0.4]} p={[0.42, 0.33, 0.72]} ink={false} />
    <Box size={[0.025, 0.18, 0.02]} color="#8a6a48" r={[-0.12, 0.7, 0.5]} p={[0.48, 0.31, 0.7]} ink={false} />
    <Panel
      size={[0.22, 0.28]}
      texture={paperSheetTexture('WIRING', 8)}
      r={[-Math.PI / 2, 0.5, 0]}
      p={[0.52, 0.066, 0.98]}
    />
    <Panel
      size={[0.66, 0.12]}
      texture={hazardStripeTexture()}
      opacity={0.8}
      r={[-Math.PI / 2, 0, 0]}
      p={[1.12, 0.063, -0.52]}
    />
    <Cable
      points={[
        [1.16, 0.075, -1.15],
        [1.3, 0.075, -0.62],
        [1.16, 0.075, -0.14],
        [0.9, 0.075, 0.24],
        [0.82, 0.4, 0.16],
      ]}
      radius={0.007}
      color="#2f4046"
    />
  </group>
);

/* ------------------------------------------------------------------ */
/* The room                                                            */
/* ------------------------------------------------------------------ */


/**
 * Scene 06 — the tool workshop. A pegboard, labelled tool drawers, a workbench
 * with a monitor and soldering station, a small home-lab rack and a whiteboard
 * carrying the architecture sketch.
 */
export const WorkshopScene = () => {
  const meta = getScene('workshop');
  return (
    <group>
      <RoomLights shadowMapSize={2048} color="#f8e7cd" intensity={2.7} fill="#8fa8bc" />
      <DioramaBase meta={meta} footprint={[3.6, 3.6]} subtitle="1:18 / WORKSHOP" />

      <Shell />
      <Pegboard />
      <DrawerCabinet />
      <Whiteboard />
      <PartsBoard />
      <ServerRack />
      <Workbench />
      <LeftWall />
      <FloorProps />
    </group>
  );
};
