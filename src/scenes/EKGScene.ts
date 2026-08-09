import {BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, OctahedronGeometry, TorusGeometry} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

const DOC_SPOTS: ReadonlyArray<[number, number, number]> = [[-3, 1.25, -3.4], [2.7, -1.05, -3.8]];

export class EKGScene extends BaseProjectScene {
  private readonly docs: Mesh[] = [];
  private readonly evidence = new Group();

  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('ekg', cameraRig, bus, 'line');
    const geometry = new BoxGeometry(0.58, 0.82, 0.035, 2, 3, 1);
    const material = new MeshPhysicalMaterial({color: '#163a3d', emissive: '#08191b', emissiveIntensity: 0.3, roughness: 0.18, clearcoat: 0.65, transmission: 0.16, thickness: 0.18, transparent: true, opacity: 0.18});
    material.userData.bloom = false;
    DOC_SPOTS.forEach((spot) => {
      const doc = new Mesh(geometry, material);
      doc.position.set(...spot);
      this.docs.push(doc);
      this.group.add(doc);
    });
    const beaconRing = new Mesh(new TorusGeometry(0.42, 0.009, 6, 72), new MeshBasicMaterial({color: '#6faeb2', transparent: true, opacity: 0.24, depthWrite: false}));
    const beaconCore = new Mesh(new OctahedronGeometry(0.12, 2), new MeshBasicMaterial({color: '#9cc9ca', transparent: true, opacity: 0.48, depthWrite: false}));
    beaconRing.name = 'EVIDENCE_BEACON_RING';
    beaconCore.name = 'EVIDENCE_BEACON_CORE';
    this.evidence.position.set(3.9, -1.65, -0.2);
    this.evidence.add(beaconRing, beaconCore);
    this.group.add(this.evidence);
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    if (this.reducedMotion) return;
    this.docs.forEach((doc, index) => {
      doc.position.y = DOC_SPOTS[index]![1] + Math.sin(elapsed * 0.3 + index * 1.7) * 0.15;
      doc.rotation.y = Math.sin(elapsed * 0.1 + index) * 0.2;
    });
    this.evidence.rotation.z += delta * 0.18;
    this.evidence.scale.setScalar(0.9 + Math.sin(elapsed * 1.4) * 0.05 + (this.simulationTime >= 0 ? 0.12 : 0));
  }

  protected override onSimulationStart(): void { this.trace('DOCUMENT INGESTED / LOCAL MOCK DATA'); }
  protected override onStep(index: number): void {
    this.trace(['PARSE / 14 RULE BLOCKS', 'EXTRACT / 32 ENTITIES', 'ALIGN / 7 ALIASES MERGED', 'GRAPH / 48 EDGES', 'RETRIEVE / TOP-K EVIDENCE', 'ANSWER / SOURCE NODES ATTACHED'][index] ?? 'ARCHIVE PROCESSING');
  }
  protected override onSimulationComplete(): void { this.trace('ANSWER WITH EVIDENCE / DEMO COMPLETE'); }
}
