import {ThreeCanvas} from '@remotion/three';
import {useLayoutEffect, useMemo, useRef} from 'react';
import {BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Matrix4, Vector3} from 'three';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, theme} from '../styles/theme';

const randomValues = (count: number): number[] => {
  let seed = 2401266324;
  const values: number[] = [];
  for (let index = 0; index < count * 3; index++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    values.push(seed / 4294967296);
  }
  return values;
};

export const ThreeGraph: React.FC<{accent?: string; intensity?: number}> = ({accent = theme.cyan, intensity = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const count = 48;
  const nodes = useMemo(() => {
    const random = randomValues(count);
    return Array.from({length: count}, (_, index) => {
      const angle = random[index * 3]! * Math.PI * 2;
      const radius = 2.5 + random[index * 3 + 1]! * 6;
      return new Vector3(Math.cos(angle) * radius, (random[index * 3 + 2]! - 0.5) * 5, Math.sin(angle) * radius - 2);
    });
  }, []);
  const mesh = useRef<InstancedMesh>(null);
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    nodes.forEach((node, index) => {
      const other = nodes[(index + 7) % nodes.length]!;
      if (node.distanceToSquared(other) < 52) positions.push(node.x, node.y, node.z, other.x, other.y, other.z);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [nodes]);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    nodes.forEach((position, index) => {
      matrix.makeTranslation(position.x, position.y, position.z);
      matrix.scale(new Vector3(index % 9 === 0 ? 2.2 : 1, index % 9 === 0 ? 2.2 : 1, index % 9 === 0 ? 2.2 : 1));
      mesh.current?.setMatrixAt(index, matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  }, [nodes]);

  return <ThreeCanvas width={width} height={height} camera={{position: [0, 1.2, 10], fov: 44}} style={{opacity: interpolate(frame, [0, 18], [0, intensity], clamp)}}>
    <ambientLight intensity={0.4} />
    <directionalLight position={[4, 6, 8]} intensity={0.8} color={accent} />
    <group rotation={[0.08, interpolate(frame, [0, 240], [-0.16, 0.35], clamp), 0]} position={[1, 0, 0]}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={new Color(accent)} transparent opacity={0.2} />
      </lineSegments>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color={new Color(accent)} />
      </instancedMesh>
      <mesh scale={interpolate(frame, [0, 100], [0.4, 1.1], clamp)} rotation={[frame * 0.007, frame * 0.012, 0]}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshStandardMaterial color="#101716" emissive={accent} emissiveIntensity={1.1} wireframe roughness={0.25} metalness={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0, frame * -0.008]}>
        <torusGeometry args={[1.8, 0.018, 8, 100]} />
        <meshBasicMaterial color={accent} transparent opacity={0.68} />
      </mesh>
    </group>
  </ThreeCanvas>;
};
