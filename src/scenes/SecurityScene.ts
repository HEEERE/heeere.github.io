import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, Points, PointsMaterial, TorusGeometry} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {mulberry32} from '../utils/random';
import {BaseProjectScene} from './BaseProjectScene';

const CONTAINED_COLOR = new Color('#263522');
const IDLE_COLOR = new Color('#2b1c1d');
const CONTAINED_EMISSIVE = new Color('#1c2b12');
const IDLE_EMISSIVE = new Color('#14090a');

export class SecurityScene extends BaseProjectScene {
  private readonly wisps: Points;
  private readonly shieldSegments: Mesh[] = [];
  private containment = 0;
  private containmentTarget = 0;

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
    const segmentCount = 12;
    const segmentGeometry = new TorusGeometry(1, 0.014, 6, 18, Math.PI * 2 / segmentCount * 0.72);
    for (let index = 0; index < segmentCount; index++) {
      const angle = index / segmentCount * Math.PI * 2;
      const segment = new Mesh(
        segmentGeometry,
        new MeshStandardMaterial({color: IDLE_COLOR, emissive: IDLE_EMISSIVE, emissiveIntensity: 0.32, roughness: 0.28, metalness: 0.34, transparent: true, opacity: 0.54}),
      );
      segment.name = `CONTAINMENT_SEGMENT_${String(index).padStart(2, '0')}`;
      segment.userData.angle = angle;
      segment.position.z = -0.25;
      segment.rotation.z = angle;
      segment.scale.set(4.15, 2.72, 1);
      this.shieldSegments.push(segment);
      this.group.add(segment);
    }
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    this.containment += (this.containmentTarget - this.containment) * Math.min(1, delta * 4);
    const wispMaterial = this.wisps.material as PointsMaterial;
    wispMaterial.opacity += ((this.simulationTime >= 0 ? 0.55 : 0) - wispMaterial.opacity) * Math.min(1, delta * 2);
    this.wisps.visible = wispMaterial.opacity > 0.01;
    if (!this.reducedMotion) this.wisps.rotation.z += delta * 0.4;
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.opacity += ((this.simulationTime >= 0 ? 0.3 : 0.12) - ringMaterial.opacity) * Math.min(1, delta * 2);
    this.shieldSegments.forEach((segment, index) => {
      const radiusX = 4.15 - this.containment * 0.32;
      const radiusY = 2.72 - this.containment * 0.24;
      const material = segment.material as MeshStandardMaterial;
      material.color.lerp(this.containment > 0.5 ? CONTAINED_COLOR : IDLE_COLOR, Math.min(1, delta * 5));
      material.emissive.lerp(this.containment > 0.5 ? CONTAINED_EMISSIVE : IDLE_EMISSIVE, Math.min(1, delta * 5));
      const breath = 1 + this.containment * 0.025 + Math.sin(elapsed * 1.2 + index) * 0.004;
      segment.scale.set(radiusX * breath, radiusY * breath, 1);
    });
  }

  public override async exit(): Promise<void> {
    await super.exit();
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.color.set(this.project.color);
    ringMaterial.opacity = 0.12;
    this.containment = 0;
    this.containmentTarget = 0;
  }

  protected override onSimulationStart(): void {
    this.containmentTarget = 0;
    (this.outerRing.material as MeshBasicMaterial).color.set('#ff6f61');
    this.trace('SIMULATION ONLY / TEST CONTAMINATION RELEASED');
  }
  protected override onStep(index: number): void {
    this.trace(['L1 REGEX / SIGNAL FLAGGED', 'L2 SEMANTIC / RISK 0.82', 'L3 INTENT / ESCALATE', 'GUARD CONSENSUS / QUORUM', 'CONTAINMENT / EDGE CUT', 'TRACE REPLAY / BLOCK VERIFIED'][index] ?? 'SAFE DEMO RUNNING');
  }
  protected override onSimulationComplete(): void {
    this.containmentTarget = 1;
    const ringMaterial = this.outerRing.material as MeshBasicMaterial;
    ringMaterial.color.set('#b8ff3d');
    ringMaterial.opacity = 0.55;
    this.bus.emit('audio:cue', 'contain');
    this.trace('CONTAMINATION CONTAINED / SIMULATION COMPLETE');
  }
}
