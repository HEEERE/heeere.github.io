import {useEffect, useMemo, useRef} from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Group,
} from 'three';
import {useFrame} from '@react-three/fiber';
import {canvasTexture, rng} from '../canvas';
import {ringGeometry, sphereGeometry} from '../geometry';
import {toon} from '../materials';
import {useQuality} from '../quality';
import {Panel, type Vec3} from './primitives';

const rainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHeight;
  uniform float uWind;
  attribute vec4 aData;
  varying float vFade;
  void main() {
    vec3 p = position;
    float fall = mod(position.y - uTime * aData.x + aData.y, uHeight);
    p.y = fall + aData.z * aData.w;
    p.x += uWind * (uHeight - fall) * 0.08;
    vFade = smoothstep(0.0, 0.1, fall) * (1.0 - smoothstep(uHeight * 0.74, uHeight, fall));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const rainFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vFade);
  }
`;

/**
 * Instanced rain streaks: one draw call for the whole shower, animated entirely
 * on the GPU so the diorama keeps a steady frame rate.
 */
export const Rain = ({
  count = 900,
  width = 4.2,
  depth = 4.2,
  height = 2.7,
  color = '#b9d2e8',
  opacity = 0.38,
  speed = 3.4,
}: {
  count?: number;
  width?: number;
  depth?: number;
  height?: number;
  color?: string;
  opacity?: number;
  speed?: number;
}) => {
  const quality = useQuality();
  const drops = Math.max(24, Math.round(count * quality.particleScale));

  const geometry = useMemo(() => {
    const random = rng(451);
    const positions = new Float32Array(drops * 2 * 3);
    const data = new Float32Array(drops * 2 * 4);
    for (let index = 0; index < drops; index += 1) {
      const x = (random() - 0.5) * width;
      const z = (random() - 0.5) * depth;
      const y = random() * height;
      const fallSpeed = speed * (0.75 + random() * 0.7);
      const phase = random() * height;
      const length = 0.07 + random() * 0.16;
      for (let vertex = 0; vertex < 2; vertex += 1) {
        const offset = (index * 2 + vertex) * 3;
        positions[offset] = x;
        positions[offset + 1] = y;
        positions[offset + 2] = z;
        const dataOffset = (index * 2 + vertex) * 4;
        data[dataOffset] = fallSpeed;
        data[dataOffset + 1] = phase;
        data[dataOffset + 2] = vertex;
        data[dataOffset + 3] = length;
      }
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(positions, 3));
    result.setAttribute('aData', new Float32BufferAttribute(data, 4));
    result.computeBoundingSphere();
    return result;
  }, [drops, width, depth, height, speed]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: {value: 0},
          uHeight: {value: height},
          uWind: {value: 0.7},
          uColor: {value: new Color(color)},
          uOpacity: {value: opacity},
        },
        vertexShader: rainVertex,
        fragmentShader: rainFragment,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    [color, opacity, height],
  );

  useFrame(({clock}) => {
    material.uniforms.uTime!.value = quality.reducedMotion ? 0.4 : clock.elapsedTime;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />;
};

const quaternionFlat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

/** Expanding ripple rings where rain hits puddles / wet asphalt. */
export const Ripples = ({
  count = 26,
  area = [4.2, 4.2] as [number, number],
  center = [0, 0] as [number, number],
  y = 0.012,
  color = '#bcd8ee',
  opacity = 0.16,
  size = 0.09,
  speed = 0.55,
  seed = 7,
}: {
  count?: number;
  area?: [number, number];
  center?: [number, number];
  y?: number;
  color?: string;
  opacity?: number;
  size?: number;
  speed?: number;
  seed?: number;
}) => {
  const quality = useQuality();
  const instances = Math.max(4, Math.round(count * quality.particleScale));
  const ref = useRef<InstancedMesh>(null);

  const ripples = useMemo(() => {
    const rolls = rng(seed + 31);
    return Array.from({length: instances}, () => ({
      x: center[0] + (rolls() - 0.5) * area[0],
      z: center[1] + (rolls() - 0.5) * area[1],
      phase: rolls(),
      rate: speed * (0.7 + rolls() * 0.6),
      scale: 0.7 + rolls() * 0.6,
    }));
  }, [instances, area, center, speed, seed]);

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [color, opacity],
  );

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const tint = new Color('#ffffff');
    for (let index = 0; index < instances; index += 1) mesh.setColorAt(index, tint.setScalar(0));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances]);

  const matrix = useMemo(() => new Matrix4(), []);
  const position = useMemo(() => new Vector3(), []);
  const scale = useMemo(() => new Vector3(), []);
  const tint = useMemo(() => new Color(), []);

  useFrame(({clock}) => {
    const mesh = ref.current;
    if (!mesh) return;
    const time = quality.reducedMotion ? 0.3 : clock.elapsedTime;
    for (let index = 0; index < instances; index += 1) {
      const ripple = ripples[index];
      if (!ripple) continue;
      const progress = (time * ripple.rate + ripple.phase) % 1;
      const ringScale = 0.12 + progress * size * 1.5 * ripple.scale;
      position.set(ripple.x, y, ripple.z);
      scale.set(ringScale, ringScale, 1);
      matrix.compose(position, quaternionFlat, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, tint.setScalar(Math.sin(progress * Math.PI) * 0.9));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[ringGeometry(0.36, 0.4, 24), material, instances]} renderOrder={4} frustumCulled={false} />;
};

const dropletTexture = () =>
  canvasTexture('rain/glassDrops', 256, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const random = rng(88);
    for (let index = 0; index < 90; index += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 1.5 + random() * 4.5;
      ctx.save();
      ctx.globalAlpha = 0.35 + random() * 0.4;
      ctx.fillStyle = 'rgba(225, 240, 250, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(x - radius * 0.28, y - radius * 0.6, radius * 0.35, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (let index = 0; index < 8; index += 1) {
      const x = random() * width;
      const y = random() * height * 0.7;
      const length = 30 + random() * 130;
      const gradient = ctx.createLinearGradient(x, y, x, y + length);
      gradient.addColorStop(0, 'rgba(225,240,250,0.0)');
      gradient.addColorStop(0.4, 'rgba(225,240,250,0.28)');
      gradient.addColorStop(1, 'rgba(225,240,250,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, 2 + random() * 2.5, length);
    }
  });

/** Raindrops beaded on a glass pane. */
export const GlassDrops = ({
  size = [1.2, 0.9] as [number, number],
  p = [0, 0, 0] as Vec3,
  opacity = 0.55,
  r = [0, 0, 0] as Vec3,
}: {
  size?: [number, number];
  p?: Vec3;
  opacity?: number;
  r?: Vec3;
}) => {
  const texture = useMemo(dropletTexture, []);
  return <Panel size={size} texture={texture} p={p} r={r} opacity={opacity} />;
};

/** Small beads of water running down a pane. */
export const SlidingDrops = ({
  origin,
  width = 0.6,
  height = 0.8,
  count = 4,
  z = 0,
}: {
  origin: Vec3;
  width?: number;
  height?: number;
  count?: number;
  z?: number;
}) => {
  const group = useRef<Group>(null);
  const drops = useMemo(() => {
    const random = rng(913);
    return Array.from({length: count}, () => ({
      x: (random() - 0.5) * width,
      phase: random(),
      speed: 0.035 + random() * 0.05,
      scale: 0.7 + random() * 0.8,
    }));
  }, [width, count]);

  useFrame(({clock}) => {
    const node = group.current;
    if (!node) return;
    const time = clock.elapsedTime;
    node.children.forEach((child, index) => {
      const drop = drops[index];
      if (!drop) return;
      const progress = (time * drop.speed + drop.phase) % 1;
      child.position.set(drop.x, height * 0.5 - progress * height, z);
      child.scale.setScalar(drop.scale * (0.7 + progress * 0.4));
    });
  });

  return (
    <group ref={group} position={origin}>
      {drops.map((_, index) => (
        <mesh
          key={index}
          geometry={sphereGeometry(0.007, 8, 6)}
          material={toon('#dceaf2', {emissive: '#a8c8de', emissiveIntensity: 0.35, transparent: true, opacity: 0.85})}
        />
      ))}
    </group>
  );
};

/** Drips falling off an awning / roof edge. */
export const Drips = ({points, fall = 0.9, speed = 0.7, color = '#cfe6f5'}: {points: readonly Vec3[]; fall?: number; speed?: number; color?: string}) => {
  const group = useRef<Group>(null);
  useFrame(({clock}) => {
    const node = group.current;
    if (!node) return;
    const time = clock.elapsedTime;
    node.children.forEach((child, index) => {
      const point = points[index];
      if (!point) return;
      const progress = (time * speed + index * 0.31) % 1;
      child.position.set(point[0], point[1] - progress * fall, point[2]);
      child.scale.setScalar(progress > 0.93 ? 0.35 : 1);
    });
  });
  return (
    <group ref={group}>
      {points.map((_, index) => (
        <mesh
          key={index}
          geometry={sphereGeometry(0.009, 6, 5)}
          material={toon(color, {emissive: '#9fc4dc', emissiveIntensity: 0.4, transparent: true, opacity: 0.85})}
        />
      ))}
    </group>
  );
};

/** Steam drifting up from a mug. */
export const Steam = ({p = [0, 0, 0] as Vec3, height = 0.22, color = '#efe8dc'}: {p?: Vec3; height?: number; color?: string}) => {
  const group = useRef<Group>(null);
  const texture = useMemo(
    () =>
      canvasTexture(`steam/${color}`, 64, 64, (ctx, width, heightPx) => {
        ctx.clearRect(0, 0, width, heightPx);
        const gradient = ctx.createRadialGradient(width / 2, heightPx / 2, 0, width / 2, heightPx / 2, width / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, heightPx);
      }, {sharp: true}),
    [],
  );
  useFrame(({clock}) => {
    const node = group.current;
    if (!node) return;
    const time = clock.elapsedTime;
    node.children.forEach((child, index) => {
      const progress = (time * 0.28 + index / node.children.length) % 1;
      child.position.y = progress * height;
      child.position.x = Math.sin(progress * 5 + index) * 0.02;
      const material = (child as unknown as {material: MeshBasicMaterial}).material;
      material.opacity = 0.24 * Math.sin(progress * Math.PI);
      child.scale.setScalar(0.05 + progress * 0.1);
    });
  });
  return (
    <group ref={group} position={p}>
      {Array.from({length: 4}, (_, index) => (
        <sprite key={index} renderOrder={8}>
          <spriteMaterial map={texture} color={color} transparent depthWrite={false} opacity={0.2} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
};
