import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  IcosahedronGeometry,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

export class PMUScene extends BaseProjectScene {
  private readonly conveyor: LineSegments;
  private readonly cultivation = new Group();
  private readonly buds: Mesh[] = [];

  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('pmu', cameraRig, bus, 'line');
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([-5.5, -1.7, 0, 5.82, -1.7, 0]), 3));
    this.conveyor = new LineSegments(geometry, new LineDashedMaterial({color: '#b8ff3d', transparent: true, opacity: 0.25, dashSize: 0.18, gapSize: 0.14}));
    this.conveyor.computeLineDistances();
    const stemMaterial = new MeshBasicMaterial({color: '#506647', transparent: true, opacity: 0.16, depthWrite: false});
    stemMaterial.userData.bloom = false;
    const branchPaths = [
      [new Vector3(-4.8, -2.2, -0.5), new Vector3(-3.2, -1.6, -0.2), new Vector3(-1.8, -0.4, 0.1), new Vector3(-0.8, 1.1, 0)],
      [new Vector3(-1.8, -0.4, 0.1), new Vector3(-1.0, -1.1, 0), new Vector3(0.3, -1.5, 0.15), new Vector3(1.4, -0.7, 0)],
      [new Vector3(0.2, -1.45, 0.1), new Vector3(1.4, -1.9, -0.2), new Vector3(3.2, -1.45, 0), new Vector3(4.5, -0.35, 0.1)],
    ];
    branchPaths.forEach((points, index) => {
      const stem = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 38, 0.009 + index * 0.002, 6, false), stemMaterial);
      stem.name = `CULTIVATION_STEM_${index}`;
      this.cultivation.add(stem);
      const budMaterial = new MeshBasicMaterial({color: '#9abe68', transparent: true, opacity: 0.38, depthWrite: false});
      budMaterial.userData.bloom = false;
      const bud = new Mesh(new IcosahedronGeometry(0.09 + index * 0.018, 1), budMaterial);
      bud.name = `CULTIVATION_BUD_${index}`;
      bud.position.copy(points.at(-1)!);
      this.buds.push(bud);
      this.cultivation.add(bud);
    });
    this.group.add(this.conveyor, this.cultivation);
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    if (!this.reducedMotion) this.conveyor.position.x = -((elapsed * 0.5) % 0.32);
    this.buds.forEach((bud, index) => {
      const active = this.simulationTime >= 0 ? 1 : 0.72;
      bud.scale.setScalar(active + Math.sin(elapsed * 1.8 + index) * 0.08);
      bud.rotation.y += delta * (0.16 + index * 0.04);
    });
  }

  protected override onSimulationStart(): void { this.trace('CANDIDATE CREATED / EVIDENCE QUEUED'); }
  protected override onStep(index: number): void {
    this.trace(['EXECUTOR RUNNING', 'JUDGE VERIFYING EVIDENCE', 'REPAIR ISOLATING FAILURE', 'VERIFIED / POLICY PASSED', 'ACTIVE / GRAPH COMMITTED'][index] ?? 'TRACE ACTIVE');
  }
  protected override onSimulationComplete(): void { this.trace('ACTIVE MEMORY COMMITTED / DEMO COMPLETE'); }
}
