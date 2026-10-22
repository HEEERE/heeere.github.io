import {useMemo, type ReactNode} from 'react';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  MeshBasicMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import {canvasTexture, softGlow} from '../canvas';
import {boxGeometry, coneGeometry, cylinderGeometry, planeGeometry, roundedBoxGeometry, sphereGeometry, torusGeometry, type Vec3} from '../geometry';
import {flat, ink, toon} from '../materials';
import {useQuality} from '../quality';

export type {Vec3};

type Transform = {
  p?: Vec3;
  r?: Vec3;
  s?: number | Vec3;
};

type CommonProps = Transform & {
  color?: string;
  material?: Material;
  ink?: boolean;
  /** Fine outline thickness in scene units (defaults to 0.008). */
  inkWidth?: number;
  shadow?: boolean;
  receive?: boolean;
  /** Set to false to exclude this mesh from the automatic camera framing. */
  bounds?: boolean;
  visible?: boolean;
  renderOrder?: number;
};

const scaleOf = (s: number | Vec3 | undefined): Vec3 => {
  if (s === undefined) return [1, 1, 1];
  return typeof s === 'number' ? [s, s, s] : s;
};

const inkScale = (size: Vec3, width: number): Vec3 => [
  (size[0] + width * 2) / size[0],
  (size[1] + width * 2) / size[1],
  (size[2] + width * 2) / size[2],
];

type SolidProps = CommonProps & {geometry: BufferGeometry; size: Vec3};

/** One cel-shaded solid with an optional inverted-hull ink outline. */
const Solid = ({
  geometry,
  size,
  color = '#c8c8c8',
  material,
  ink: useInk = true,
  inkWidth = 0.008,
  shadow = true,
  receive = true,
  visible,
  renderOrder,
  bounds = true,
  p,
  r,
  s,
}: SolidProps) => {
  const quality = useQuality();
  const materialRef = material ?? toon(color);
  const showInk = useInk && quality.outlines;
  const outline = inkScale(size, inkWidth);
  const base = scaleOf(s);
  return (
    <>
      <mesh
        geometry={geometry}
        material={materialRef}
        position={p}
        rotation={r}
        scale={base}
        castShadow={shadow && quality.shadows}
        receiveShadow={receive && quality.shadows}
        visible={visible}
        renderOrder={renderOrder}
        userData={bounds ? undefined : {ignoreBounds: true}}
      />
      {showInk ? (
        <mesh
          geometry={geometry}
          material={ink()}
          position={p}
          rotation={r}
          scale={[base[0] * outline[0], base[1] * outline[1], base[2] * outline[2]]}
          visible={visible}
          renderOrder={renderOrder}
        />
      ) : null}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Solids                                                              */
/* ------------------------------------------------------------------ */

export const Box = ({size, ...props}: {size: Vec3} & CommonProps) => (
  <Solid geometry={boxGeometry(size)} size={size} {...props} />
);

export const RBox = ({size, radius = 0.02, segments = 3, ...props}: {size: Vec3; radius?: number; segments?: number} & CommonProps) => (
  <Solid geometry={roundedBoxGeometry(size, radius, segments)} size={size} {...props} />
);

export const Cyl = ({
  radius,
  radiusTop,
  height,
  segments = 16,
  ...props
}: {radius: number; radiusTop?: number; height: number; segments?: number} & CommonProps) => {
  const size: Vec3 = [radius * 2, height, radius * 2];
  return <Solid geometry={cylinderGeometry(radiusTop ?? radius, radius, height, segments)} size={size} {...props} />;
};

export const Sphere = ({radius, segments = 18, ...props}: {radius: number; segments?: number} & CommonProps) => {
  const size: Vec3 = [radius * 2, radius * 2, radius * 2];
  return <Solid geometry={sphereGeometry(radius, segments, Math.max(8, Math.round(segments * 0.7)))} size={size} {...props} />;
};

export const Cone = ({radius, height, segments = 18, ...props}: {radius: number; height: number; segments?: number} & CommonProps) => {
  const size: Vec3 = [radius * 2, height, radius * 2];
  return <Solid geometry={coneGeometry(radius, height, segments)} size={size} {...props} />;
};

export const Torus = ({
  radius,
  tube,
  radialSegments = 8,
  tubularSegments = 28,
  ...props
}: {radius: number; tube: number; radialSegments?: number; tubularSegments?: number} & CommonProps) => {
  const size: Vec3 = [radius * 2, tube * 2, radius * 2];
  return <Solid geometry={torusGeometry(radius, tube, radialSegments, tubularSegments)} size={size} {...props} />;
};

/* ------------------------------------------------------------------ */
/* Planes and printed surfaces                                         */
/* ------------------------------------------------------------------ */

type PanelProps = CommonProps & {
  size: [number, number];
  texture?: Texture;
  /** Lit panels receive light; unlit panels glow like printed light boxes. */
  lit?: boolean;
  opacity?: number;
  additive?: boolean;
  doubleSide?: boolean;
};

export const Panel = ({size, texture, lit = false, opacity, additive, doubleSide, color = '#ffffff', material, ...props}: PanelProps) => {
  const quality = useQuality();
  const materialRef = useMemo(() => {
    if (material) return material;
    if (lit) {
      return toon(color, {
        map: texture,
        transparent: opacity !== undefined,
        opacity,
        side: doubleSide ? 'double' : 'front',
      });
    }
    return flat(color, {
      map: texture,
      transparent: opacity !== undefined || additive,
      opacity,
      side: doubleSide ? 'double' : 'front',
      blending: additive ? 'additive' : 'normal',
      depthWrite: additive ? false : undefined,
      toneMapped: false,
    });
  }, [material, lit, color, texture, opacity, additive, doubleSide]);

  return (
    <mesh
      geometry={planeGeometry(size[0], size[1])}
      material={materialRef}
      position={props.p}
      rotation={props.r}
      scale={props.s}
      receiveShadow={(props.receive ?? lit) && quality.shadows}
      userData={props.bounds === false ? {ignoreBounds: true} : undefined}
    />
  );
};

/** A glowing screen / light box / printed sign. */
export const Lit = (props: Omit<PanelProps, 'lit'>) => <Panel {...props} lit={false} />;

/** An unlit ground decal (additive by default so it reads as reflected light). */
export const Decal = ({size, ...props}: Omit<PanelProps, 'size'> & {size: [number, number]}) => <Panel size={size} additive {...props} />;

/* ------------------------------------------------------------------ */
/* Glows, light cones and fake bounced light                            */
/* ------------------------------------------------------------------ */

const glowTextures = new Map<string, ReturnType<typeof canvasTexture>>();
const glowTexture = (color: string) => {
  const cached = glowTextures.get(color);
  if (cached) return cached;
  const texture = canvasTexture(`glow/${color}`, 128, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    softGlow(ctx, width / 2, height / 2, width / 2, color, 0.95);
  }, {sharp: true});
  glowTextures.set(color, texture);
  return texture;
};

export const Glow = ({
  color = '#ffcf9a',
  size = 1,
  opacity = 0.8,
  p = [0, 0, 0],
  depthTest = true,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  p?: Vec3;
  depthTest?: boolean;
}) => {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: glowTexture(color),
        color: new Color('#ffffff'),
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [color, opacity, depthTest],
  );
  return (
    <sprite position={p} scale={[size, size, 1]} renderOrder={10}>
      <primitive object={material} attach="material" />
    </sprite>
  );
};

const coneTextures = new Map<string, ReturnType<typeof canvasTexture>>();
const coneTexture = (color: string) => {
  const cached = coneTextures.get(color);
  if (cached) return cached;
  const texture = canvasTexture(`cone/${color}`, 64, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    // Canvas top maps to the cone's top (lamp end), so the light fades downward.
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.32, 'rgba(255,255,255,0.26)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // Soft horizontal falloff so the cone has no hard silhouette.
    const horizontal = ctx.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, 'rgba(0,0,0,1)');
    horizontal.addColorStop(0.5, 'rgba(0,0,0,0)');
    horizontal.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, width, height);
  }, {sharp: true});
  coneTextures.set(color, texture);
  return texture;
};

/** Volumetric-ish light cone under a street lamp. */
export const LightCone = ({
  color = '#ffd7a0',
  height = 1.6,
  radiusTop = 0.06,
  radiusBottom = 0.6,
  opacity = 0.3,
  p = [0, 0, 0],
}: {
  color?: string;
  height?: number;
  radiusTop?: number;
  radiusBottom?: number;
  opacity?: number;
  p?: Vec3;
}) => {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: coneTexture(color),
        transparent: true,
        opacity,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [color, opacity],
  );
  const geometry = useMemo(
    () => new CylinderGeometry(radiusTop, radiusBottom, height, 24, 1, true),
    [radiusTop, radiusBottom, height],
  );
  return <mesh position={[p[0], p[1] - height / 2, p[2]]} geometry={geometry} renderOrder={5} material={material} />;
};

/** Soft round shadow under furniture, used when real shadows are not affordable. */
export const ContactShadow = ({p = [0, 0, 0], radius = 0.4, opacity = 0.35, color = '#0a0e14'}: {p?: Vec3; radius?: number; opacity?: number; color?: string}) => {
  const texture = useMemo(
    () =>
      canvasTexture(`contactShadow/${color}/${radius}/${opacity}`, 128, 128, (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
        gradient.addColorStop(0.55, 'rgba(0,0,0,0.25)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }, {sharp: true}),
    [color, radius, opacity],
  );
  return (
    <mesh geometry={planeGeometry(radius * 2, radius * 2)} rotation={[-Math.PI / 2, 0, 0]} position={[p[0], p[1] + 0.002, p[2]]} renderOrder={1}>
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ */
/* Pipes, cables and wheels                                            */
/* ------------------------------------------------------------------ */

const up = new Vector3(0, 1, 0);

export const Pipe = ({from, to, radius = 0.01, color = '#8a9098', segments = 8, ...props}: {from: Vec3; to: Vec3; radius?: number; color?: string; segments?: number} & Omit<CommonProps, 'p' | 'r' | 's'>) => {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const direction = new Vector3().subVectors(b, a);
  const length = direction.length();
  const midpoint = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(up, direction.clone().normalize());
  return (
    <mesh
      geometry={cylinderGeometry(radius, radius, length, segments)}
      material={props.material ?? toon(color)}
      position={midpoint.toArray() as unknown as Vec3}
      quaternion={quaternion}
      castShadow={false}
      receiveShadow={false}
      userData={props.bounds === false ? {ignoreBounds: true} : undefined}
    />
  );
};

export const Cable = ({points, radius = 0.005, color = '#22262c', material}: {points: readonly Vec3[]; radius?: number; color?: string; material?: Material}) => {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
    return new TubeGeometry(curve, Math.max(12, points.length * 6), radius, 5, false);
  }, [points, radius]);
  return <mesh geometry={geometry} material={material ?? toon(color)} castShadow={false} receiveShadow={false} userData={{ignoreBounds: true}} />;
};

export const Wheel = ({p, r, radius = 0.1, tube = 0.012, color = '#2a2e34', spokes = 6}: {p: Vec3; r?: Vec3; radius?: number; tube?: number; color?: string; spokes?: number}) => (
  <group position={p} rotation={r ?? [0, 0, 0]}>
    <mesh geometry={torusGeometry(radius, tube, 8, 28)} material={toon(color)} castShadow={false} />
    <mesh geometry={cylinderGeometry(radius * 0.18, radius * 0.18, tube * 2.6, 10)} material={toon('#9aa0a4')} rotation={[Math.PI / 2, 0, 0]} />
    {Array.from({length: spokes}, (_, index) => (
      <mesh
        key={index}
        geometry={cylinderGeometry(0.0025, 0.0025, radius * 1.8, 4)}
        material={toon('#b8bcc0')}
        rotation={[Math.PI / 2, 0, (index / spokes) * Math.PI * 2]}
        position={[0, 0, 0]}
      />
    ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Small nature + soft props                                           */
/* ------------------------------------------------------------------ */

export const Plant = ({
  p = [0, 0, 0],
  scale = 1,
  potColor = '#9a6f56',
  leafColor = '#5f7f5a',
  tall = false,
}: {
  p?: Vec3;
  scale?: number;
  potColor?: string;
  leafColor?: string;
  tall?: boolean;
}) => (
  <group position={p} scale={scale}>
    <Cyl radius={0.055} height={0.1} color={potColor} p={[0, 0.05, 0]} ink={false} />
    <Cyl radius={0.06} height={0.02} color={potColor} p={[0, 0.1, 0]} ink={false} />
    {Array.from({length: tall ? 7 : 5}, (_, index) => {
      const angle = (index / (tall ? 7 : 5)) * Math.PI * 2;
      const radius = 0.05 + (index % 3) * 0.02;
      const height = (tall ? 0.24 : 0.12) + (index % 4) * 0.025;
      return (
        <Sphere
          key={index}
          radius={0.045 + (index % 2) * 0.012}
          color={leafColor}
          ink={false}
          p={[Math.cos(angle) * radius, 0.11 + height, Math.sin(angle) * radius]}
          s={[1, 1.35, 1]}
        />
      );
    })}
  </group>
);

export const GrassTuft = ({p = [0, 0, 0], scale = 1, color = '#5a7a4a'}: {p?: Vec3; scale?: number; color?: string}) => (
  <group position={p} scale={scale}>
    {Array.from({length: 4}, (_, index) => (
      <Cone
        key={index}
        radius={0.012}
        height={0.05 + index * 0.008}
        segments={4}
        color={color}
        ink={false}
        p={[Math.cos(index * 1.9) * 0.014, (0.05 + index * 0.008) / 2, Math.sin(index * 1.9) * 0.014]}
        r={[0, index, (index - 1.5) * 0.18]}
      />
    ))}
  </group>
);

/** A simple reusable cardboard box. */
export const Crate = ({p = [0, 0, 0], size = [0.16, 0.12, 0.14], color = '#b99a6a', r = [0, 0, 0]}: {p?: Vec3; size?: Vec3; color?: string; r?: Vec3}) => (
  <group position={p} rotation={r}>
    <RBox size={size} radius={0.006} color={color} />
    <Box size={[size[0] * 1.01, 0.012, size[2] * 0.2]} color="#8f7350" p={[0, size[1] * 0.32, 0]} ink={false} />
    <Box size={[0.01, size[1] * 0.62, size[2] * 1.01]} color="#8f7350" p={[size[0] * 0.2, 0, 0]} ink={false} />
  </group>
);

export const Group = ({children, ...props}: {children: ReactNode} & Transform) => (
  <group position={props.p ?? [0, 0, 0]} rotation={props.r ?? [0, 0, 0]} scale={props.s ?? 1}>
    {children}
  </group>
);
