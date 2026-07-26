import {AdditiveBlending, BufferAttribute, BufferGeometry, MeshBasicMaterial, Points, PointsMaterial} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {mulberry32} from '../utils/random';
import {BaseProjectScene} from './BaseProjectScene';

export class SecurityScene extends BaseProjectScene {
  private readonly wisps: Points;

  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('security', cameraRig, bus, 'ring');
    const random = mulberry32(4409);
    const positions = new Float32Array(40 * 3);
    for (let index = 0; index < 40; index++) {
      const angle = random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * (4.2 + (random() - 0.5) * 0.6);
      positions[index * 3 + 1] = Math.sin(angle) * (2.8 + (random() - 0.5) * 0.4);
      positions[index * 3 + 2] = (random() - 0.5) * 0.8;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.wisps = new Points(geometry, new PointsMaterial({color: '#ff6f61', size: 0.06, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false}));
    this.wisps.visible = false;
    this.group.add(this.wisps);
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    const wispMaterial = this.wisps.material as PointsMaterial;
    wispMaterial.opacity += ((this.simulationTime >= 0 ? 0.55 : 0) - wispMaterial.opacity) * Math.min(1, delta * 2);
    this.wisps.visible = wispMaterial.opacity > 0.01;
    if (!this.reducedMotion) this.wisps.rotation.z += delta * 0.4;
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.opacity += ((this.simulationTime >= 0 ? 0.3 : 0.12) - ringMaterial.opacity) * Math.min(1, delta * 2);
  }

  public override async exit(): Promise<void> {
    await super.exit();
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.color.set(this.project.color);
    ringMaterial.opacity = 0.12;
  }

  protected override onSimulationStart(): void {
    (this.outerRing.material as MeshBasicMaterial).color.set('#ff6f61');
    this.trace('SIMULATION ONLY / TEST CONTAMINATION RELEASED');
  }
  protected override onStep(index: number): void {
    this.trace(['L1 REGEX / SIGNAL FLAGGED', 'L2 SEMANTIC / RISK 0.82', 'L3 INTENT / ESCALATE', 'GUARD CONSENSUS / QUORUM', 'CONTAINMENT / EDGE CUT', 'TRACE REPLAY / BLOCK VERIFIED'][index] ?? 'SAFE DEMO RUNNING');
  }
  protected override onSimulationComplete(): void {
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.color.set('#b8ff3d');
    ringMaterial.opacity = 0.55;
    this.bus.emit('audio:cue', 'contain');
    this.trace('CONTAMINATION CONTAINED / SIMULATION COMPLETE');
  }
}
