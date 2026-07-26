import {BufferAttribute, BufferGeometry, LineDashedMaterial, LineSegments} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

export class PMUScene extends BaseProjectScene {
  private readonly conveyor: LineSegments;

  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('pmu', cameraRig, bus, 'line');
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([-5.5, -1.7, 0, 5.82, -1.7, 0]), 3));
    this.conveyor = new LineSegments(geometry, new LineDashedMaterial({color: '#b8ff3d', transparent: true, opacity: 0.25, dashSize: 0.18, gapSize: 0.14}));
    this.conveyor.computeLineDistances();
    this.group.add(this.conveyor);
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    if (!this.reducedMotion) this.conveyor.position.x = -((elapsed * 0.5) % 0.32);
  }

  protected override onSimulationStart(): void { this.trace('CANDIDATE CREATED / EVIDENCE QUEUED'); }
  protected override onStep(index: number): void {
    this.trace(['EXECUTOR RUNNING', 'JUDGE VERIFYING EVIDENCE', 'REPAIR ISOLATING FAILURE', 'VERIFIED / POLICY PASSED', 'ACTIVE / GRAPH COMMITTED'][index] ?? 'TRACE ACTIVE');
  }
  protected override onSimulationComplete(): void { this.trace('ACTIVE MEMORY COMMITTED / DEMO COMPLETE'); }
}
