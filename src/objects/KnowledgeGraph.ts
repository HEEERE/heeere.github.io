import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import {mulberry32} from '../utils/random';

type Roamer = {mesh: Mesh; from: number; to: number; t: number; speed: number};

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class KnowledgeGraph extends LineSegments {
  public readonly nodes: InstancedMesh;
  private readonly positions: Vector3[] = [];
  private readonly adjacency = new Map<number, number[]>();
  private readonly roamers: Roamer[] = [];
  private readonly random: () => number;
  private readonly time = {value: 0};
  private readonly instanceTransform = new Matrix4();
  private readonly instanceScale = new Vector3();

  public constructor(count: number, roamers: number, seed = 7321) {
    const random = mulberry32(seed);
    const linePositions: number[] = [];
    const edges: Array<[number, number]> = [];
    const positions: Vector3[] = [];
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const radius = 3 + random() * 12;
      positions.push(new Vector3(Math.cos(angle) * radius + 2, (random() - 0.5) * 9, Math.sin(angle) * radius - 4));
    }
    for (let index = 0; index < count; index++) {
      const from = positions[index]!;
      for (let offset = 1; offset <= 2; offset++) {
        const target = (index + offset * 7) % count;
        const to = positions[target]!;
        if (from.distanceToSquared(to) < 72) {
          linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
          edges.push([index, target]);
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(linePositions), 3));
    super(geometry, new LineBasicMaterial({color: '#35504d', transparent: true, opacity: 0.32, blending: AdditiveBlending}));
    this.positions = positions;
    this.random = mulberry32(seed + 1);
    edges.forEach(([from, to]) => {
      this.adjacency.set(from, [...(this.adjacency.get(from) ?? []), to]);
      this.adjacency.set(to, [...(this.adjacency.get(to) ?? []), from]);
    });

    const nodeMaterial = new MeshBasicMaterial({color: new Color('#79c9bd'), transparent: true, opacity: 0.72});
    nodeMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.time;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float aPhase;\nvarying float vTwinkle;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTwinkle = 0.7 + 0.3 * sin(uTime * 1.1 + aPhase);');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTwinkle;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTwinkle;');
    };
    nodeMaterial.customProgramCacheKey = () => 'kg-node-twinkle';
    const nodeGeometry = new SphereGeometry(0.06, 7, 7);
    const phases = new Float32Array(count);
    for (let index = 0; index < count; index++) phases[index] = this.random() * Math.PI * 2;
    nodeGeometry.setAttribute('aPhase', new InstancedBufferAttribute(phases, 1));
    this.nodes = new InstancedMesh(nodeGeometry, nodeMaterial, count);
    this.nodes.instanceMatrix.setUsage(DynamicDrawUsage);
    positions.forEach((position, index) => {
      this.instanceScale.setScalar(index % 11 === 0 ? 2.5 : 1);
      this.instanceTransform.compose(position, this.quaternion, this.instanceScale);
      this.nodes.setMatrixAt(index, this.instanceTransform);
    });
    this.add(this.nodes);

    const roamerGeometry = new SphereGeometry(0.045, 8, 8);
    const roamerMaterial = new MeshBasicMaterial({color: new Color('#79c9bd').multiplyScalar(1.8), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false});
    for (let index = 0; index < roamers; index++) {
      const from = Math.floor(this.random() * count);
      const mesh = new Mesh(roamerGeometry, roamerMaterial);
      mesh.position.copy(positions[from]!);
      this.add(mesh);
      this.roamers.push({mesh, from, to: this.nextTarget(from), t: this.random() * 0.6, speed: 0.35 + this.random() * 0.3});
    }
  }

  private nextTarget(from: number): number {
    const neighbors = this.adjacency.get(from);
    if (!neighbors?.length) return Math.floor(this.random() * this.positions.length);
    return neighbors[Math.floor(this.random() * neighbors.length)]!;
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.rotation.y = elapsed * 0.012;
    this.time.value = elapsed;
    (this.material as LineBasicMaterial).opacity = 0.32 + Math.sin(elapsed * 0.35) * 0.06;
    this.roamers.forEach((roamer) => {
      roamer.t += delta * roamer.speed;
      if (roamer.t >= 1) {
        roamer.t %= 1;
        roamer.from = roamer.to;
        roamer.to = this.nextTarget(roamer.from);
      }
      roamer.mesh.position.lerpVectors(this.positions[roamer.from]!, this.positions[roamer.to]!, easeInOut(roamer.t));
    });
  }

  public disposeGraph(): void {
    this.geometry.dispose();
    (this.material as LineBasicMaterial).dispose();
    this.nodes.geometry.dispose();
    (this.nodes.material as MeshBasicMaterial).dispose();
    const first = this.roamers[0];
    if (first) {
      first.mesh.geometry.dispose();
      (first.mesh.material as MeshBasicMaterial).dispose();
    }
  }
}
