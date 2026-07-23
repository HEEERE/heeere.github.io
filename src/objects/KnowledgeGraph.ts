import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import {mulberry32} from '../utils/random';

export class KnowledgeGraph extends LineSegments {
  public readonly nodes: InstancedMesh;
  private readonly positions: Vector3[] = [];
  private readonly instanceTransform = new Matrix4();
  private readonly instanceScale = new Vector3();

  public constructor(count: number, seed = 7321) {
    const random = mulberry32(seed);
    const linePositions: number[] = [];
    const positions: Vector3[] = [];
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const radius = 3 + random() * 12;
      positions.push(new Vector3(Math.cos(angle) * radius + 2, (random() - 0.5) * 9, Math.sin(angle) * radius - 4));
    }
    for (let index = 0; index < count; index++) {
      const from = positions[index]!;
      for (let offset = 1; offset <= 2; offset++) {
        const to = positions[(index + offset * 7) % count]!;
        if (from.distanceToSquared(to) < 72) linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(linePositions), 3));
    super(geometry, new LineBasicMaterial({color: '#35504d', transparent: true, opacity: 0.32, blending: AdditiveBlending}));
    this.positions = positions;
    this.nodes = new InstancedMesh(
      new SphereGeometry(0.06, 7, 7),
      new MeshBasicMaterial({color: new Color('#79c9bd'), transparent: true, opacity: 0.72}),
      count,
    );
    this.nodes.instanceMatrix.setUsage(DynamicDrawUsage);
    positions.forEach((position, index) => {
      this.instanceScale.setScalar(index % 11 === 0 ? 2.5 : 1);
      this.instanceTransform.compose(position, this.quaternion, this.instanceScale);
      this.nodes.setMatrixAt(index, this.instanceTransform);
    });
    this.add(this.nodes);
  }

  public update(elapsed: number, reducedMotion: boolean): void {
    if (!reducedMotion) this.rotation.y = elapsed * 0.012;
  }

  public disposeGraph(): void {
    this.geometry.dispose();
    (this.material as LineBasicMaterial).dispose();
    this.nodes.geometry.dispose();
    (this.nodes.material as MeshBasicMaterial).dispose();
  }
}
