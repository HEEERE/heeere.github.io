import {surface} from '../../three/surfaces';
import {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CatmullRomCurve3, MeshBasicMaterial, Vector3, type Group, type Mesh} from 'three';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {
  Box,
  Cable,
  ContactShadow,
  Cone,
  Cyl,
  Glow,
  LightCone,
  Panel,
  Plant,
  Pipe,
  RBox,
  Sphere,
  Torus,
  type Vec3,
} from '../../three/kit/primitives';
import {LampLight, RoomLights} from '../../three/kit/lighting';
import {flat, glass, metal, toon} from '../../three/materials';
import {useQuality} from '../../three/quality';
import {sphereGeometry} from '../../three/geometry';
import {getScene} from '../../data/scenes';
import {
  archiveDrawersTexture,
  binderSpinesTexture,
  clockFaceTexture,
  corkBoardTexture,
  feltTexture,
  flowBoardTexture,
  graphScreenTexture,
  keyboardTexture,
  labelTagTexture,
  lifecycleScreenTexture,
  lightPoolTexture,
  paperSheetTexture,
  posterTexture,
  zoneSignTexture,
} from '../../three/textures';
import {FONT_MONO, FONT_SANS, canvasTexture, grain, rng, rr, text, verticalGradient} from '../../three/canvas';

/* ------------------------------------------------------------------ */
/* Local print matter                                                  */
/* ------------------------------------------------------------------ */

const archiveWallTexture = () =>
  canvasTexture('scene/archive/wall', 1024, 512, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#9aa9b0'],
      [0.42, '#8b9ba2'],
      [0.62, '#81929a'],
      [1, '#71838b'],
    ]);
    const random = rng(311);
    for (let index = 0; index < 1300; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(38,50,56,0.035)';
      const size = 1 + random() * 14;
      ctx.fillRect(random() * width, random() * height, size, size * 0.6);
    }
    // Panel joints.
    for (let x = width / 4; x < width; x += width / 4) {
      ctx.fillStyle = 'rgba(54,68,74,0.16)';
      ctx.fillRect(x - 1.5, 0, 3, height);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x + 1.5, 0, 1.5, height);
    }
    // Dado rail and the darker lower wall.
    const dado = height * 0.6;
    ctx.fillStyle = 'rgba(38,52,60,0.23)';
    ctx.fillRect(0, dado, width, height - dado);
    ctx.fillStyle = 'rgba(40,54,60,0.16)';
    ctx.fillRect(0, dado, width, 34);
    ctx.fillStyle = '#5d6f75';
    ctx.fillRect(0, dado, width, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, dado, width, 2);
    ctx.fillStyle = 'rgba(28,40,44,0.3)';
    ctx.fillRect(0, height - 12, width, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, dado + 36, width, 3);
    // Scuffs and a couple of taped sheets.
    const scuff = rng(77);
    for (let index = 0; index < 18; index += 1) {
      ctx.strokeStyle = `rgba(60,72,76,${0.04 + scuff() * 0.06})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const x = scuff() * width;
      const y = height * 0.66 + scuff() * height * 0.3;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + scuff() * 30, y + (scuff() - 0.5) * 6);
      ctx.stroke();
    }
    grain(ctx, width, height, {seed: 42, count: 1700, alpha: 0.03, size: 1.4});
  });

const archiveFloorTexture = () =>
  canvasTexture(
    'scene/archive/floor',
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = '#6d7b7c';
      ctx.fillRect(0, 0, width, height);
      const random = rng(901);
      const tile = 64;
      for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
          const tone = 112 + Math.floor(random() * 18);
          ctx.fillStyle = `rgb(${tone - 5}, ${tone + 3}, ${tone + 2})`;
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
          ctx.fillStyle = 'rgba(30,42,44,0.1)';
          for (let speck = 0; speck < 3; speck += 1) {
            ctx.fillRect(x + random() * tile, y + random() * tile, 2, 2);
          }
          ctx.fillStyle = 'rgba(210,222,220,0.05)';
          ctx.fillRect(x + 4, y + 3, tile - 8, 2);
        }
      }
      ctx.strokeStyle = 'rgba(38,50,52,0.4)';
      ctx.lineWidth = 2;
      for (let value = 0; value <= width; value += tile) {
        ctx.beginPath();
        ctx.moveTo(value, 0);
        ctx.lineTo(value, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, value);
        ctx.lineTo(width, value);
        ctx.stroke();
      }
      for (let index = 0; index < 22; index += 1) {
        ctx.strokeStyle = `rgba(190,202,200,${0.03 + random() * 0.04})`;
        ctx.lineWidth = 1 + random() * 2;
        const x = random() * width;
        const y = random() * height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20 + random() * 40, y + (random() - 0.5) * 18);
        ctx.stroke();
      }
      grain(ctx, width, height, {seed: 18, count: 1600, alpha: 0.035, size: 1.2});
    },
    {repeat: [2, 2]},
  );

const filingDrawersTexture = () =>
  canvasTexture('scene/archive/filing', 256, 512, (ctx, width, height) => {
    ctx.fillStyle = '#6b7d82';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.06)'],
      [1, 'rgba(20,28,32,0.14)'],
    ]);
    for (let index = 0; index < 4; index += 1) {
      const y = 14 + index * 122;
      ctx.fillStyle = index % 2 === 0 ? '#87999d' : '#829499';
      ctx.fillRect(16, y, width - 32, 106);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(16, y, width - 32, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(16, y + 103, width - 32, 3);
      // Label card.
      ctx.fillStyle = '#e8e1cf';
      rr(ctx, 64, y + 18, 128, 44, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,70,76,0.5)';
      ctx.fillRect(74, y + 28, 54, 3);
      ctx.fillRect(74, y + 38, 92, 2);
      ctx.fillRect(74, y + 46, 70, 2);
      text(ctx, `${index + 1}`, 178, y + 48, {size: 16, weight: 700, font: FONT_MONO, color: '#8a7a5a'});
      // Steel handle.
      ctx.fillStyle = '#c0c9c9';
      ctx.fillRect(92, y + 76, 72, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(92, y + 83, 72, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(92, y + 76, 72, 2);
    }
    grain(ctx, width, height, {seed: 63, count: 900, alpha: 0.05, size: 1.1});
  });

const indexCardTexture = () =>
  canvasTexture('scene/archive/card', 256, 160, (ctx, width, height) => {
    ctx.fillStyle = '#f0e7d2';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#b8442f';
    ctx.fillRect(0, 0, width, 5);
    ctx.fillStyle = '#3c464c';
    text(ctx, 'PMU-0341', 16, 30, {size: 19, weight: 700, font: FONT_MONO, color: '#3c464c'});
    text(ctx, 'procedure · verify · reuse', 16, 47, {size: 11, weight: 500, font: FONT_SANS, color: '#72838a'});
    ctx.strokeStyle = 'rgba(90,112,122,0.32)';
    ctx.lineWidth = 1;
    for (let index = 0; index < 5; index += 1) {
      const y = 66 + index * 18;
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(width - 14, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(60,76,84,0.38)';
      ctx.fillRect(18, y - 7, 70 + (index % 3) * 34, 2);
    }
    ctx.save();
    ctx.translate(width - 50, height - 26);
    ctx.rotate(-0.14);
    ctx.strokeStyle = 'rgba(58,122,134,0.8)';
    ctx.lineWidth = 3;
    rr(ctx, -46, -20, 92, 34, 4);
    ctx.stroke();
    text(ctx, 'VERIFIED', 0, 4, {size: 15, weight: 800, font: FONT_SANS, color: '#3a7a86', align: 'center', tracking: 1});
    ctx.restore();
    grain(ctx, width, height, {seed: 7, count: 500, alpha: 0.04, size: 1});
  });

const screenScanTexture = () =>
  canvasTexture('scene/archive/scan', 8, 64, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(190,244,255,0)');
    gradient.addColorStop(0.42, 'rgba(198,246,255,0.45)');
    gradient.addColorStop(0.52, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.68, 'rgba(198,246,255,0.35)');
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
  size = 0.013,
  speed = 1.4,
  phase = 0,
  steady = false,
}: {
  p: Vec3;
  color: string;
  size?: number;
  speed?: number;
  phase?: number;
  steady?: boolean;
}) => {
  const mesh = useRef<Mesh>(null);
  const quality = useQuality();
  const material = useMemo(() => new MeshBasicMaterial({color, toneMapped: false, transparent: true, opacity: 0.95}), [color]);
  useFrame(({clock}) => {
    if (quality.reducedMotion) {
      material.opacity = 0.9;
      return;
    }
    const pulse = steady ? 1 : 0.5 + 0.5 * Math.sin(clock.elapsedTime * speed + phase);
    const on = pulse > 0.5 ? 1 : 0.16;
    material.opacity = 0.28 + on * 0.72;
    if (mesh.current) mesh.current.scale.setScalar(0.8 + on * 0.32);
  });
  return <mesh ref={mesh} position={p} material={material} geometry={sphereGeometry(size, 10, 8)} />;
};

const ScreenScan = ({width, height, p}: {width: number; height: number; p: Vec3}) => {
  const group = useRef<Group>(null);
  const quality = useQuality();
  useFrame(({clock}) => {
    if (!group.current || quality.reducedMotion) return;
    const cycle = (clock.elapsedTime * 0.2) % 1;
    group.current.position.y = p[1] + height * (0.42 - cycle * 0.84);
  });
  return (
    <group ref={group} position={p}>
      <Panel size={[width, Math.max(0.014, height * 0.09)]} texture={screenScanTexture()} additive opacity={0.42} bounds={false} />
    </group>
  );
};

const ArchiveMonitor = ({
  p,
  yaw = 0,
  width = 0.34,
  height = 0.22,
  texture,
  scan = false,
}: {
  p: Vec3;
  yaw?: number;
  width?: number;
  height?: number;
  texture: ReturnType<typeof canvasTexture>;
  scan?: boolean;
}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box size={[0.17, 0.012, 0.11]} color="#2a3338" p={[0, 0.006, 0]} ink={false} shadow={false} />
    <Box size={[0.034, 0.15, 0.034]} color="#2a3338" p={[0, 0.08, -0.018]} ink={false} shadow={false} />
    <group position={[0, 0.18, 0]} rotation={[-0.1, 0, 0]}>
      <RBox
        size={[width + 0.026, height + 0.026, 0.022]}
        radius={0.004}
        color="#232c31"
        p={[0, height / 2, 0]}
        ink={false}
        shadow={false}
      />
      <Panel size={[width, height]} texture={texture} p={[0, height / 2, 0.0125]} />
      {scan ? <ScreenScan width={width} height={height} p={[0, height / 2, 0.021]} /> : null}
    </group>
    <Glow color="#bfe6f4" size={width * 1.5} opacity={0.1} p={[0, 0.18 + height / 2, 0.1]} />
  </group>
);

const DataDots = ({
  points,
  count,
  color,
  size = 0.0115,
}: {
  points: readonly Vec3[];
  count: number;
  color: string;
  size?: number;
}) => {
  const quality = useQuality();
  const curve = useMemo(() => new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))), [points]);
  const material = useMemo(() => new MeshBasicMaterial({color, toneMapped: false, transparent: true, opacity: 0.94}), [color]);
  const refs = useRef<Array<Mesh | null>>([]);
  const starts = useMemo(
    () =>
      Array.from({length: count}, (_, index) => {
        const position = new Vector3();
        curve.getPointAt(index / count, position);
        return position;
      }),
    [curve, count],
  );
  useFrame(({clock}) => {
    if (quality.reducedMotion) return;
    const time = clock.elapsedTime * 0.17;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const t = (time + index / count) % 1;
      curve.getPointAt(t, mesh.position);
      mesh.scale.setScalar(0.55 + Math.sin(t * Math.PI) * 0.75);
    });
  });
  return (
    <>
      {starts.map((position, index) => (
        <mesh
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          position={position}
          material={material}
          geometry={sphereGeometry(size, 10, 8)}
        />
      ))}
    </>
  );
};

const ExhaustFan = () => {
  const blades = useRef<Group>(null);
  const quality = useQuality();
  useFrame(({clock}) => {
    if (!blades.current || quality.reducedMotion) return;
    blades.current.rotation.z = clock.elapsedTime * 1.15;
  });
  return (
    <group>
      <Box size={[0.26, 0.26, 0.018]} color="#4a5c61" p={[-1.45, 1.6, -1.606]} ink={false} />
      <Cyl radius={0.075} height={0.006} color="#1e292d" r={[Math.PI / 2, 0, 0]} p={[-1.45, 1.6, -1.593]} ink={false} shadow={false} />
      <group ref={blades} position={[-1.45, 1.6, -1.587]}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            size={[0.06, 0.021, 0.005]}
            color="#8c9a9c"
            p={[Math.cos((index / 3) * Math.PI * 2) * 0.043, Math.sin((index / 3) * Math.PI * 2) * 0.043, 0]}
            r={[0, 0, (index / 3) * Math.PI * 2 + 0.4]}
            ink={false}
            shadow={false}
          />
        ))}
      </group>
      <Cyl radius={0.014} height={0.02} color="#53656a" r={[Math.PI / 2, 0, 0]} p={[-1.45, 1.6, -1.577]} ink={false} shadow={false} />
      <Torus radius={0.083} tube={0.006} color="#6e8085" p={[-1.45, 1.6, -1.578]} ink={false} shadow={false} />
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
      material={surface('#ffffff', 'tile', archiveFloorTexture())}
      p={[0, 0.03, 0]}
      ink={false}
    />

    <Box
      size={[3.46, 1.74, 0.07]}
      material={surface('#ffffff', 'plaster', archiveWallTexture())}
      p={[0, 0.87, -1.655]}
      ink
      inkWidth={0.009}
    />
    <Box
      size={[0.07, 1.74, 3.46]}
      material={surface('#ffffff', 'plaster', archiveWallTexture())}
      p={[-1.655, 0.87, 0]}
      ink
      inkWidth={0.009}
    />
    <Box size={[3.5, 0.03, 0.1]} material={surface('#5c6b70', 'paint')} p={[0, 1.755, -1.655]} ink={false} />
    <Box size={[0.1, 0.03, 3.5]} material={surface('#5c6b70', 'paint')} p={[-1.655, 1.755, 0]} ink={false} />

    <Box size={[3.42, 0.1, 0.03]} color="#4a585d" p={[0, 0.11, -1.6]} ink={false} />
    <Box size={[0.03, 0.1, 3.42]} color="#4a585d" p={[-1.6, 0.11, 0]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Left wall archive shelving                                          */
/* ------------------------------------------------------------------ */

const LeftShelving = () => (
  <group>
    <Box size={[0.03, 1.34, 0.03]} color="#55676d" p={[-1.44, 0.73, -1.0]} ink={false} />
    <Box size={[0.03, 1.34, 0.03]} color="#55676d" p={[-1.44, 0.73, -0.18]} ink={false} />
    {[0.5, 0.94].map((y) => (
      <Box key={y} size={[0.3, 0.028, 0.86]} color="#8b9a9a" p={[-1.46, y, -0.59]} ink={false} />
    ))}
    <Box size={[0.26, 0.18, 0.3]} color="#b9b09a" p={[-1.47, 0.6, -0.86]} ink={false} />
    <Box size={[0.24, 0.16, 0.28]} color="#c4bca6" r={[0, 0.06, 0]} p={[-1.47, 0.59, -0.33]} ink={false} />
    <Panel size={[0.16, 0.055]} texture={labelTagTexture('A–M', '#6f8a94', '1998 — 2016')} r={[0, Math.PI / 2, 0]} p={[-1.335, 0.61, -0.86]} />
    <Panel
      size={[0.8, 0.23]}
      texture={binderSpinesTexture()}
      color="#97a4a2"
      r={[0, Math.PI / 2, 0]}
      p={[-1.47, 1.065, -0.56]}
    />
    <Box size={[0.02, 0.26, 0.13]} color="#6f8287" r={[0, 0, 0]} p={[-1.47, 1.08, -1.08]} ink={false} />
    <Box size={[0.02, 0.26, 0.13]} color="#6f8287" p={[-1.47, 1.08, -0.2]} ink={false} />
    <Panel
      size={[0.54, 0.36]}
      texture={corkBoardTexture()}
      lit
      r={[0, Math.PI / 2, 0]}
      p={[-1.615, 1.2, 0.62]}
    />
    <Panel
      size={[0.14, 0.18]}
      texture={paperSheetTexture('VERIFY / 03', 7)}
      r={[0, Math.PI / 2, 0]}
      p={[-1.6, 1.23, 0.5]}
    />
    <Panel
      size={[0.15, 0.11]}
      texture={indexCardTexture()}
      r={[0, Math.PI / 2, 0]}
      p={[-1.6, 1.14, 0.67]}
    />
    <Panel
      size={[0.13, 0.075]}
      texture={labelTagTexture('STORE', '#6f8a94', 'CANDIDATE')}
      r={[0, Math.PI / 2, 0]}
      p={[-1.6, 1.29, 0.72]}
    />
    <Panel
      size={[0.22, 0.29]}
      texture={posterTexture('archive', 'PROCESS MEMORY', 'verify → repair → reuse', '#5f8a96', 'notice')}
      r={[0, Math.PI / 2, 0]}
      p={[-1.615, 1.26, 1.28]}
    />
    <Pipe from={[-1.6, 0.06, 1.55]} to={[-1.6, 1.5, 1.55]} radius={0.016} color="#7f8f92" />
    <Box size={[0.05, 0.02, 0.045]} color="#5c6c70" p={[-1.588, 0.5, 1.55]} ink={false} />
    <Box size={[0.05, 0.02, 0.045]} color="#5c6c70" p={[-1.588, 1.1, 1.55]} ink={false} />
    <RBox size={[0.09, 0.14, 0.1]} color="#6f8185" p={[-1.575, 1.02, 1.55]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Card catalog + filing cabinet                                       */
/* ------------------------------------------------------------------ */

const CardCatalog = () => {
  const card = indexCardTexture();
  return (
    <group>
      <RBox size={[0.74, 0.72, 0.36]} radius={0.006} color="#6f8287" p={[-1.16, 0.42, -1.43]} ink inkWidth={0.006} />
      <Box size={[0.78, 0.03, 0.4]} color="#8b9a9d" p={[-1.16, 0.795, -1.43]} ink={false} />
      <Panel size={[0.68, 0.62]} texture={archiveDrawersTexture()} p={[-1.16, 0.41, -1.2475]} />
      <Panel
        size={[0.3, 0.08]}
        texture={labelTagTexture('A–M', '#8a6a3a', 'CARD CATALOG / 1972')}
        r={[-Math.PI / 2, 0, 0]}
        p={[-1.16, 0.811, -1.34]}
      />

      {/* One drawer pulled open. */}
      <Box size={[0.3, 0.1, 0.18]} color="#829499" p={[-1.32, 0.63, -1.15]} ink={false} />
      <Box size={[0.26, 0.05, 0.14]} color="#e8e0cc" p={[-1.32, 0.69, -1.14]} ink={false} />
      <Panel size={[0.15, 0.094]} texture={card} r={[-Math.PI / 2 + 0.3, 0.12, 0]} p={[-1.32, 0.706, -1.08]} />
      <Box size={[0.04, 0.02, 0.02]} color="#c0c9c9" p={[-1.32, 0.64, -1.055]} ink={false} shadow={false} />

      {/* Archive boxes stacked on top. */}
      <RBox size={[0.24, 0.16, 0.28]} radius={0.005} color="#b9b09a" p={[-1.3, 0.89, -1.4]} ink={false} />
      <Panel size={[0.15, 0.055]} texture={labelTagTexture('SERIES 04', '#6f8a94', 'TRACE / 2024–26')} p={[-1.3, 0.89, -1.257]} />
      <RBox size={[0.2, 0.13, 0.24]} radius={0.005} color="#c6bea8" r={[0, 0.09, 0]} p={[-0.99, 0.875, -1.41]} ink={false} />
      <Panel size={[0.13, 0.048]} texture={labelTagTexture('SERIES 05', '#8a6a3a', 'SKILL / 2026')} p={[-0.99, 0.875, -1.287]} />

      {/* Wall shelf of binders above. */}
      <Box size={[0.72, 0.026, 0.18]} color="#8b9a9a" p={[-1.16, 1.2, -1.52]} ink={false} />
      <Box size={[0.02, 0.13, 0.16]} color="#55676d" p={[-1.47, 1.135, -1.52]} ink={false} />
      <Box size={[0.02, 0.13, 0.16]} color="#55676d" p={[-0.85, 1.135, -1.52]} ink={false} />
      <Panel size={[0.66, 0.23]} texture={binderSpinesTexture()} color="#97a4a2" p={[-1.16, 1.33, -1.51]} />
      <Box size={[0.022, 0.27, 0.14]} color="#6f8287" p={[-1.508, 1.34, -1.502]} ink={false} />
      <Box size={[0.022, 0.27, 0.14]} color="#6f8287" p={[-0.812, 1.34, -1.502]} ink={false} />
      <Panel size={[0.22, 0.052]} texture={labelTagTexture('INDEX / A–M', '#6f8a94', 'CARDS')} p={[-1.16, 1.185, -1.428]} />
    </group>
  );
};

const FilingCabinet = () => (
  <group>
    <RBox size={[0.52, 1.04, 0.42]} radius={0.006} color="#66797e" p={[1.05, 0.58, -1.42]} ink inkWidth={0.006} />
    <Box size={[0.56, 0.028, 0.46]} color="#849498" p={[1.05, 1.104, -1.42]} ink={false} />
    <Panel size={[0.46, 0.94]} texture={filingDrawersTexture()} p={[1.05, 0.58, -1.208]} />
    <Panel
      size={[0.26, 0.07]}
      texture={labelTagTexture('A–M / 1998', '#8a6a3a', 'SEALED')}
      r={[-Math.PI / 2, 0, 0]}
      p={[1.05, 1.12, -1.48]}
    />
    <RBox size={[0.3, 0.08, 0.28]} radius={0.004} color="#b5ab94" p={[1.02, 1.16, -1.43]} ink={false} />
    <Panel size={[0.18, 0.05]} texture={labelTagTexture('PENDING', '#6f8a94', 'CARDS')} p={[1.02, 1.16, -1.287]} />
    <Box size={[0.2, 0.006, 0.14]} color="#efe9d8" p={[1.02, 1.205, -1.42]} r={[0, 0.12, 0]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Flow console, board and status lights                               */
/* ------------------------------------------------------------------ */

const FlowConsole = () => (
  <group>
    <Box size={[0.94, 0.045, 0.42]} color="#6d7f83" p={[0.01, 0.695, -1.4]} ink={false} />
    <Panel size={[0.9, 0.36]} texture={posterTexture('console', 'INDEX', 'drawer → card → trace', '#6f8a94', 'notice')} r={[-Math.PI / 2, 0, 0]} p={[0.01, 0.718, -1.5]} />
    {[-0.41, 0.43].map((x) => (
      <group key={x}>
        <Box size={[0.036, 0.63, 0.036]} material={surface('#4d5c61', 'paint')} p={[x, 0.375, -1.57]} ink={false} />
        <Box size={[0.036, 0.63, 0.036]} material={surface('#4d5c61', 'paint')} p={[x, 0.375, -1.23]} ink={false} />
      </group>
    ))}
    <Box size={[0.86, 0.022, 0.32]} material={surface('#4d5c61', 'paint')} p={[0.01, 0.18, -1.4]} ink={false} />
    <Box size={[0.24, 0.16, 0.22]} color="#b9b09a" p={[0.01, 0.27, -1.4]} ink={false} />

    <ArchiveMonitor p={[0.02, 0.718, -1.46]} width={0.36} height={0.235} texture={lifecycleScreenTexture()} yaw={0.05} />
    <Panel size={[0.24, 0.082]} texture={keyboardTexture()} r={[-Math.PI / 2, 0, 0]} p={[0.02, 0.722, -1.285]} />
    <Panel size={[0.15, 0.04]} texture={labelTagTexture('PMU / 03', '#6f8a94', 'LIFECYCLE')} p={[0.32, 0.69, -1.188]} />

    {/* Document trays + paper on the right end. */}
    <RBox size={[0.24, 0.04, 0.18]} radius={0.004} color="#5f7176" p={[0.34, 0.745, -1.42]} ink={false} />
    <RBox size={[0.24, 0.04, 0.18]} radius={0.004} color="#7f9296" p={[0.34, 0.792, -1.405]} ink={false} />
    <Panel size={[0.19, 0.145]} texture={paperSheetTexture('PMU TRACE', 11)} r={[-Math.PI / 2, 0.14, 0]} p={[0.34, 0.815, -1.4]} />
    <Panel size={[0.16, 0.11]} texture={indexCardTexture()} r={[-Math.PI / 2, -0.2, 0]} p={[0.12, 0.72, -1.25]} />

    {/* Small plant and a spare mug. */}
    <Plant p={[-0.37, 0.718, -1.5]} scale={0.5} potColor="#9a8a70" leafColor="#6f8f78" />
    <Cyl radius={0.03} height={0.075} color="#dfe6e2" p={[-0.26, 0.758, -1.28]} ink={false} />

    {/* Lifecycle flow board. */}
    <Box size={[0.94, 0.4, 0.03]} color="#2b343a" p={[-0.02, 1.33, -1.598]} ink={false} />
    <Panel size={[0.88, 0.34]} texture={flowBoardTexture()} p={[-0.02, 1.33, -1.581]} />
    <Glow color="#9fd8e8" size={1.15} opacity={0.1} p={[-0.02, 1.33, -1.55]} />
    <Panel size={[0.35, 0.17]} texture={zoneSignTexture('MEMORY', 'ARCHIVE · PMU-GRAPH', '#9fc7d8')} p={[-0.02, 1.622, -1.59]} />

  </group>
);

const StatusLights = () => (
  <group>
    {[
      {label: 'CANDIDATE', sub: '12 · PENDING', color: '#d0ad5f', y: 1.34, speed: 1.1, phase: 0.4},
      {label: 'VERIFIED', sub: '34 · SEALED', color: '#7fbf9a', y: 1.49, speed: 0.8, phase: 2.1},
      {label: 'ACTIVE', sub: '08 · IN USE', color: '#7fc8d8', y: 1.64, speed: 1.7, phase: 4.2},
    ].map((row) => (
      <group key={row.label}>
        <RBox size={[0.34, 0.12, 0.055]} radius={0.006} color="#2a3439" p={[1.1, row.y, -1.578]} ink={false} />
        <Panel size={[0.29, 0.082]} texture={labelTagTexture(row.label, row.color, row.sub)} p={[1.085, row.y, -1.548]} />
        <Led p={[1.245, row.y, -1.542]} color={row.color} size={0.0135} speed={row.speed} phase={row.phase} />
      </group>
    ))}
    <Glow color="#9fd8e8" size={0.5} opacity={0.1} p={[1.1, 1.49, -1.52]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* The memory core                                                     */
/* ------------------------------------------------------------------ */

const FLOW_PATH: Vec3[] = [
  [0.32, 0.21, -0.7],
  [0.4, 0.075, -0.86],
  [0.49, 0.075, -1.08],
  [0.55, 0.08, -1.36],
  [0.55, 0.2, -1.5],
  [0.55, 0.66, -1.56],
  [0.55, 1.12, -1.56],
  [0.42, 1.12, -1.56],
];

const CoreDevice = () => {
  const quality = useQuality();
  const count = quality.particleScale > 0.65 ? 6 : 3;
  return (
    <group>
      <ContactShadow p={[0.18, 0.062, -0.62]} radius={0.42} opacity={0.5} />
      <RBox size={[0.42, 0.07, 0.4]} radius={0.008} color="#33454b" p={[0.18, 0.095, -0.62]} ink={false} />
      <Box size={[0.4, 0.008, 0.38]} color="#8fa2a4" p={[0.18, 0.133, -0.62]} ink={false} shadow={false} />
      <RBox size={[0.28, 0.43, 0.26]} radius={0.006} color="#3a5158" p={[0.18, 0.355, -0.62]} ink inkWidth={0.005} />
      <Box size={[0.35, 0.03, 0.32]} color="#6f878c" p={[0.18, 0.59, -0.62]} ink={false} />
      <Box size={[0.3, 0.02, 0.27]} color="#93a7a9" p={[0.18, 0.607, -0.62]} ink={false} shadow={false} />

      {/* Front panel: label, vents, a slim status strip and side handles. */}
      <Panel
        size={[0.22, 0.078]}
        texture={labelTagTexture('PMU CORE', '#6fa9c4', 'unit-07 · active')}
        p={[0.2, 0.44, -0.488]}
      />
      <Box size={[0.012, 0.15, 0.01]} material={flat('#8fd6e2')} p={[0.075, 0.33, -0.487]} ink={false} shadow={false} />
      <Box size={[0.17, 0.014, 0.01]} color="#1d2a2f" p={[0.2, 0.28, -0.486]} ink={false} shadow={false} />
      <Box size={[0.17, 0.014, 0.01]} color="#1d2a2f" p={[0.2, 0.245, -0.486]} ink={false} shadow={false} />
      <Box size={[0.17, 0.014, 0.01]} color="#1d2a2f" p={[0.2, 0.21, -0.486]} ink={false} shadow={false} />
      <Cyl radius={0.011} height={0.07} color="#8da0a3" r={[0, 0, Math.PI / 2]} p={[0.02, 0.5, -0.56]} ink={false} shadow={false} />
      <Cyl radius={0.011} height={0.07} color="#8da0a3" r={[0, 0, Math.PI / 2]} p={[0.34, 0.5, -0.56]} ink={false} shadow={false} />

      {/* Core, glowing seams and the three rings. */}
      <Cyl radius={0.074} height={0.23} segments={24} color="#3b5057" p={[0.18, 0.73, -0.62]} ink={false} shadow={false} />
      <Cyl radius={0.085} height={0.235} segments={24} material={glass('#bcdae2', 0.16)} p={[0.18, 0.73, -0.62]} shadow={false} />
      <Cyl radius={0.085} height={0.032} color="#31444a" p={[0.18, 0.615, -0.62]} ink={false} shadow={false} />
      <Cyl radius={0.079} height={0.022} material={flat('#d8f8ff')} p={[0.18, 0.7, -0.62]} ink={false} shadow={false} />
      <Cyl radius={0.079} height={0.012} material={flat('#9fe4f2')} p={[0.18, 0.79, -0.62]} ink={false} shadow={false} />
      <Cyl radius={0.058} height={0.04} color="#445b62" p={[0.18, 0.865, -0.62]} ink={false} shadow={false} />
      <Cyl radius={0.042} height={0.03} color="#2f4147" p={[0.18, 0.895, -0.62]} ink={false} shadow={false} />
      <Sphere radius={0.011} material={flat('#d8f8ff')} p={[0.18, 0.915, -0.62]} ink={false} shadow={false} />
      <Torus radius={0.116} tube={0.008} material={toon('#82979c')} r={[-Math.PI / 2, 0, 0]} p={[0.18, 0.66, -0.62]} ink={false} shadow={false} />
      <Torus radius={0.13} tube={0.008} material={toon('#a4b5b8')} r={[-Math.PI / 2, 0, 0]} p={[0.18, 0.735, -0.62]} ink={false} shadow={false} />
      <Torus radius={0.116} tube={0.008} material={toon('#82979c')} r={[-Math.PI / 2, 0, 0]} p={[0.18, 0.81, -0.62]} ink={false} shadow={false} />
      <Box size={[0.05, 0.012, 0.02]} color="#8fa2a4" p={[0.18, 0.735, -0.752]} ink={false} shadow={false} />
      <Cyl radius={0.009} height={0.26} color="#566b71" p={[0.18, 0.735, -0.752]} ink={false} shadow={false} />
      <Box size={[0.19, 0.011, 0.013]} color="#566b71" p={[0.18, 0.66, -0.752]} ink={false} shadow={false} />
      <Box size={[0.19, 0.011, 0.013]} color="#566b71" p={[0.18, 0.81, -0.752]} ink={false} shadow={false} />
      <Cable
        points={[
          [0.18, 0.9, -0.64],
          [0.25, 0.88, -0.72],
          [0.3, 0.66, -0.75],
          [0.28, 0.58, -0.73],
        ]}
        radius={0.005}
        color="#2c3a40"
      />

      {/* Stack light for the three lifecycle states. */}
      <Cyl radius={0.033} height={0.022} color="#3c4c52" p={[0.35, 0.618, -0.51]} ink={false} shadow={false} />
      <Cyl radius={0.027} height={0.032} material={flat('#d8b166')} p={[0.35, 0.645, -0.51]} ink={false} shadow={false} />
      <Cyl radius={0.027} height={0.032} material={flat('#8fce9f')} p={[0.35, 0.679, -0.51]} ink={false} shadow={false} />
      <Cyl radius={0.027} height={0.032} material={flat('#8fd6e2')} p={[0.35, 0.713, -0.51]} ink={false} shadow={false} />
      <Cyl radius={0.03} height={0.01} color="#3c4c52" p={[0.35, 0.734, -0.51]} ink={false} shadow={false} />
      <Glow color="#a8eaf8" size={0.2} opacity={0.16} p={[0.35, 0.68, -0.5]} />

      <Glow color="#9fdcf0" size={0.54} opacity={0.24} p={[0.18, 0.74, -0.58]} />
      <LampLight position={[0.18, 0.75, -0.56]} color="#9fdcf0" intensity={0.75} distance={1.15} />

      {/* Data conduit: floor run to the wall, up to the lifecycle board. */}
      <Cable points={FLOW_PATH} radius={0.011} color="#3d5057" />
      <DataDots points={FLOW_PATH} count={count} color="#d8f8ff" size={0.021} />
      <RBox size={[0.14, 0.12, 0.08]} color="#4b5d63" p={[0.55, 0.19, -1.56]} ink={false} />
      <Box size={[0.09, 0.008, 0.005]} material={flat('#8fd6e2')} p={[0.55, 0.23, -1.518]} ink={false} shadow={false} />
      <Led p={[0.585, 0.19, -1.515]} color="#9fd8e8" size={0.01} speed={1.3} phase={1.1} />
      <Box size={[0.05, 0.018, 0.03]} color="#5c6c70" p={[0.55, 0.46, -1.57]} ink={false} />
      <Box size={[0.05, 0.018, 0.03]} color="#5c6c70" p={[0.55, 0.86, -1.57]} ink={false} />
      <Box size={[0.05, 0.018, 0.03]} color="#5c6c70" p={[0.55, 0.06, -1.2]} ink={false} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Worktable                                                           */
/* ------------------------------------------------------------------ */

const WorkTable = () => {
  const card = indexCardTexture();
  return (
    <group>
      <ContactShadow p={[-0.68, 0.062, -0.02]} radius={0.85} opacity={0.5} />
      <Box size={[1.3, 0.05, 0.7]} material={surface('#8a7259', 'wood')} p={[-0.68, 0.525, -0.03]} ink inkWidth={0.005} />
      {(
        [
          [-1.29, -0.33],
          [-0.07, -0.33],
          [-1.29, 0.27],
          [-0.07, 0.27],
        ] as const
      ).map(([x, z]) => (
        <Box key={`${x}-${z}`} size={[0.042, 0.44, 0.042]} color="#55676c" p={[x, 0.28, z]} ink={false} />
      ))}
      <Box size={[1.2, 0.02, 0.6]} color="#5e7075" p={[-0.68, 0.2, -0.03]} ink={false} />
      <Box size={[0.24, 0.14, 0.24]} color="#b9b09a" p={[-0.98, 0.28, -0.1]} ink={false} />

      <Panel size={[0.7, 0.42]} texture={feltTexture('archiveDeskMat', '#3f5257')} r={[-Math.PI / 2, 0, 0]} p={[-0.84, 0.552, 0.02]} />
      <Panel size={[0.3, 0.2]} texture={paperSheetTexture('INDEX / 03', 6)} r={[-Math.PI / 2, -0.08, 0]} p={[-0.94, 0.556, -0.06]} />
      <Panel size={[0.26, 0.085]} texture={keyboardTexture()} r={[-Math.PI / 2, 0, 0]} p={[-0.84, 0.558, 0.14]} />
      <RBox size={[0.034, 0.014, 0.058]} radius={0.008} color="#c8d2cf" p={[-0.62, 0.556, 0.11]} ink={false} />
      <ArchiveMonitor p={[-0.75, 0.55, -0.18]} yaw={0.16} width={0.32} height={0.205} texture={graphScreenTexture()} scan />

      <RBox size={[0.25, 0.04, 0.19]} radius={0.004} color="#5f7176" p={[-1.2, 0.572, -0.06]} ink={false} />
      <RBox size={[0.25, 0.04, 0.19]} radius={0.004} color="#8a9a9c" p={[-1.2, 0.616, -0.04]} ink={false} />
      <Box size={[0.22, 0.02, 0.16]} color="#efe9d8" p={[-1.2, 0.64, -0.03]} ink={false} />
      <Panel size={[0.2, 0.15]} texture={paperSheetTexture('VERIFY', 8)} r={[-Math.PI / 2, 0.08, 0]} p={[-1.2, 0.652, -0.03]} />

      <RBox size={[0.18, 0.07, 0.13]} radius={0.004} color="#7d8f92" p={[-1.24, 0.585, -0.3]} ink={false} />
      <Box size={[0.15, 0.04, 0.1]} color="#e8e0cc" p={[-1.24, 0.625, -0.3]} ink={false} />
      <Panel size={[0.15, 0.094]} texture={card} r={[-0.25, 0.2, 0]} p={[-1.24, 0.656, -0.3]} />
      <Panel size={[0.15, 0.094]} texture={card} r={[-Math.PI / 2, 0.16, 0]} p={[-1.1, 0.553, -0.23]} />

      <Cyl radius={0.034} height={0.085} color="#d8e2df" p={[-1.02, 0.593, 0.22]} ink={false} />
      <Torus radius={0.026} tube={0.007} color="#d8e2df" r={[Math.PI / 2, 0, 0]} p={[-0.985, 0.59, 0.22]} ink={false} shadow={false} />
      <Cyl radius={0.028} height={0.01} color="#6d7f83" p={[-1.02, 0.557, 0.22]} ink={false} />
      <Cyl radius={0.004} height={0.13} color="#b9954f" r={[0, 0.4, Math.PI / 2]} p={[-0.53, 0.548, 0.2]} ink={false} shadow={false} />

      {/* Open ledger at the front edge. */}
      <Box size={[0.22, 0.012, 0.16]} color="#4c5f65" r={[0, 0.18, 0]} p={[-1.02, 0.552, 0.29]} ink={false} />
      <Box size={[0.2, 0.006, 0.14]} color="#efe9d8" r={[0, 0.18, 0]} p={[-1.02, 0.56, 0.29]} ink={false} shadow={false} />
      <Panel size={[0.18, 0.12]} texture={paperSheetTexture('ACTIVATE', 7)} r={[-Math.PI / 2, 0.18, 0]} p={[-1.02, 0.565, 0.29]} />

      {/* Reference books on the open half of the table. */}
      <RBox size={[0.24, 0.035, 0.17]} radius={0.004} color="#5f7378" r={[0, 0.2, 0]} p={[-0.19, 0.559, 0.05]} ink={false} />
      <RBox size={[0.21, 0.028, 0.15]} radius={0.004} color="#a89272" r={[0, 0.3, 0]} p={[-0.2, 0.591, 0.04]} ink={false} />

      <Panel size={[0.24, 0.058]} texture={labelTagTexture('TABLE 03 / INDEXING', '#6f8a94', 'PROCESS MEMORY')} p={[-0.68, 0.45, 0.322]} />
      <Panel size={[0.62, 0.5]} texture={lightPoolTexture('#ffeccf', 0.34)} additive opacity={0.6} r={[-Math.PI / 2, 0, 0]} p={[-0.72, 0.554, 0.02]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Pendant, stool, floor dressing                                      */
/* ------------------------------------------------------------------ */

const Pendant = () => (
  <group>
    <Box size={[0.1, 0.12, 0.025]} color="#4d5f64" p={[-0.55, 1.62, -1.603]} ink={false} />
    <Pipe from={[-0.55, 1.66, -1.6]} to={[-0.72, 1.7, -0.18]} radius={0.011} color="#4d5f64" bounds={false} />
    <Cyl radius={0.018} height={0.035} color="#4d5f64" r={[0, 0, 0.7]} p={[-0.72, 1.68, -0.18]} ink={false} shadow={false} />
    <Pipe from={[-0.72, 1.68, -0.18]} to={[-0.72, 1.648, -0.18]} radius={0.011} color="#4d5f64" bounds={false} />
    <Cone
      radius={0.112}
      height={0.1}
      material={metal('#9aa9ac', 0.42, 0.45)}
      p={[-0.72, 1.585, -0.18]}
      ink={false}
      shadow={false}
    />
    <Torus radius={0.104} tube={0.005} material={flat('#fff2dc')} r={[-Math.PI / 2, 0, 0]} p={[-0.72, 1.537, -0.18]} shadow={false} />
    <Sphere radius={0.022} color="#fff5e4" material={flat('#fff5e4')} p={[-0.72, 1.53, -0.18]} ink={false} shadow={false} />
    <Glow color="#ffeccf" size={0.58} opacity={0.26} p={[-0.72, 1.525, -0.18]} />
    <LightCone color="#ffeccf" height={1.0} radiusTop={0.03} radiusBottom={0.32} opacity={0.09} p={[-0.72, 1.525, -0.18]} />
    <LampLight position={[-0.72, 1.52, -0.18]} color="#ffdcaa" intensity={3} distance={2.5} />
  </group>
);

const Stool = () => (
  <group>
    <ContactShadow p={[-0.32, 0.062, 0.6]} radius={0.22} opacity={0.42} />
    <Cyl radius={0.135} height={0.035} color="#5f7176" p={[-0.32, 0.42, 0.6]} ink={false} />
    <Cyl radius={0.12} height={0.02} color="#7f9194" p={[-0.32, 0.44, 0.6]} ink={false} />
    {[0, 1, 2, 3].map((index) => {
      const angle = (index / 4) * Math.PI * 2 + 0.4;
      return (
        <Cyl
          key={index}
          radius={0.011}
          height={0.4}
          color="#4d5d62"
          p={[-0.32 + Math.cos(angle) * 0.1, 0.24, 0.6 + Math.sin(angle) * 0.1]}
          r={[Math.sin(angle) * 0.12, 0, -Math.cos(angle) * 0.12]}
          ink={false}
        />
      );
    })}
    <Torus radius={0.1} tube={0.006} color="#63767a" r={[-Math.PI / 2, 0, 0]} p={[-0.32, 0.2, 0.6]} ink={false} shadow={false} />
  </group>
);

const FloorDressing = () => (
  <group>
    {/* Cool light pool under the core unit. */}
    <Panel size={[0.9, 1.05]} texture={lightPoolTexture('#cfeef8', 0.2)} additive opacity={0.7} r={[-Math.PI / 2, 0, 0]} p={[0.18, 0.065, -0.58]} />

    {/* Rubber mat under the worktable. */}
    <Box
      size={[1.5, 0.008, 0.96]}
      material={toon('#ffffff', {map: feltTexture('archiveFloorMat', '#3c4e53')})}
      p={[-0.68, 0.064, 0.08]}
      ink={false}
    />

    {/* Archive boxes stacked along the left wall. */}
    <RBox size={[0.3, 0.16, 0.34]} radius={0.005} color="#b4ab96" p={[-1.33, 0.14, 0.42]} ink={false} />
    <RBox size={[0.27, 0.14, 0.31]} radius={0.005} color="#c3baa4" r={[0, 0.12, 0]} p={[-1.34, 0.29, 0.42]} ink={false} />
    <RBox size={[0.24, 0.12, 0.28]} radius={0.005} color="#aca38f" r={[0, -0.08, 0]} p={[-1.35, 0.42, 0.42]} ink={false} />
    <Panel size={[0.15, 0.055]} texture={labelTagTexture('1998–2004', '#6f8a94', 'CLOSED')} p={[-1.33, 0.15, 0.592]} />
    <Panel size={[0.13, 0.05]} texture={labelTagTexture('2005–2012', '#8a6a3a', 'CLOSED')} p={[-1.34, 0.3, 0.578]} />

    <Cyl radius={0.085} height={0.17} color="#54686e" p={[-1.38, 0.145, 0.78]} ink={false} />
    <Cyl radius={0.078} height={0.006} color="#26343a" p={[-1.38, 0.232, 0.78]} ink={false} />
    <Sphere radius={0.032} color="#d6d0c0" p={[-1.36, 0.242, 0.8]} s={[1.2, 0.7, 1]} ink={false} />
    <Sphere radius={0.024} color="#e0dacb" p={[-1.41, 0.238, 0.74]} ink={false} />

    {/* Rolling archive trolley. */}
    <ContactShadow p={[1.3, 0.062, 0.58]} radius={0.38} opacity={0.45} />
    <Box size={[0.44, 0.018, 0.3]} color="#5a6b70" p={[1.3, 0.2, 0.58]} ink={false} />
    <Box size={[0.44, 0.018, 0.3]} color="#5a6b70" p={[1.3, 0.56, 0.58]} ink={false} />
    {(
      [
        [1.1, 0.44],
        [1.5, 0.44],
        [1.1, 0.72],
        [1.5, 0.72],
      ] as const
    ).map(([x, z]) => (
      <Box key={`${x}-${z}`} size={[0.017, 0.38, 0.017]} color="#4d5f64" p={[x, 0.37, z]} ink={false} />
    ))}
    <Cyl radius={0.02} height={0.016} color="#313f45" r={[0, 0, Math.PI / 2]} p={[1.22, 0.082, 0.72]} ink={false} shadow={false} />
    <Cyl radius={0.02} height={0.016} color="#313f45" r={[0, 0, Math.PI / 2]} p={[1.38, 0.082, 0.72]} ink={false} shadow={false} />
    <Box size={[0.017, 0.16, 0.017]} color="#4d5f64" p={[1.11, 0.65, 0.7]} ink={false} />
    <Box size={[0.017, 0.16, 0.017]} color="#4d5f64" p={[1.49, 0.65, 0.7]} ink={false} />
    <Cyl radius={0.009} height={0.4} color="#5f7277" r={[0, 0, Math.PI / 2]} p={[1.3, 0.735, 0.7]} ink={false} shadow={false} />
    <RBox size={[0.3, 0.15, 0.24]} radius={0.004} color="#b4ab96" p={[1.28, 0.285, 0.56]} ink={false} />
    <Panel size={[0.15, 0.052]} texture={labelTagTexture('SEALED', '#6f8a94', 'A–M / 2025')} p={[1.28, 0.29, 0.682]} />
    <RBox size={[0.25, 0.13, 0.22]} radius={0.004} color="#c6bea8" r={[0, 0.16, 0]} p={[1.3, 0.64, 0.57]} ink={false} />
    <Panel size={[0.13, 0.048]} texture={labelTagTexture('SEALED', '#8a6a3a', 'B–Z / 2024')} p={[1.3, 0.645, 0.678]} />

    <Panel
      size={[0.21, 0.28]}
      texture={paperSheetTexture('TRANSITIONS', 10)}
      r={[-Math.PI / 2, 0.3, 0]}
      p={[0.5, 0.066, 0.95]}
    />
    <Cable
      points={[
        [0.78, 0.075, -1.16],
        [0.9, 0.075, -0.8],
        [0.62, 0.075, -0.42],
        [0.3, 0.075, -0.22],
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
 * Scene 03 — the memory archive. Card drawers, a lifecycle flow board and a
 * central PMU core unit on a pedestal, all under a cool white archive light.
 */

export const ArchiveScene = () => {
  const meta = getScene('archive');
  return (
    <group>
      <RoomLights focused shadowMapSize={2048} color="#f2e5ce" intensity={2.15} fill="#7f97aa" />
      <DioramaBase meta={meta} footprint={[3.6, 3.6]} subtitle="1:18 / ARCHIVE" />

      <Shell />
      <LeftShelving />
      <CardCatalog />
      <FilingCabinet />
      <FlowConsole />
      <StatusLights />
      <CoreDevice />
      <WorkTable />
      <Stool />
      <Pendant />
      <FloorDressing />

      {/* Wall furniture: clock and the ventilation fan. */}
      <Cyl radius={0.1} height={0.024} color="#c8d2d1" r={[Math.PI / 2, 0, 0]} p={[-0.68, 1.47, -1.596]} ink={false} shadow={false} />
      <Panel size={[0.2, 0.2]} texture={clockFaceTexture()} opacity={1} p={[-0.68, 1.47, -1.582]} />
      <ExhaustFan />
    </group>
  );
};
