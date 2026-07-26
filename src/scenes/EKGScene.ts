import {Mesh, MeshBasicMaterial, PlaneGeometry} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

const DOC_SPOTS: ReadonlyArray<[number, number, number]> = [[-3.2, 1.4, -3.2], [2.8, -0.9, -3.6], [-1.2, -1.6, -2.9], [3.6, 1.8, -4]];

export class EKGScene extends BaseProjectScene {
  private readonly docs: Mesh[] = [];

  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('ekg', cameraRig, bus, 'archive');
    const geometry = new PlaneGeometry(0.9, 1.2, 2, 3);
    const material = new MeshBasicMaterial({color: '#44d9e6', wireframe: true, transparent: true, opacity: 0.07});
    DOC_SPOTS.forEach((spot) => {
      const doc = new Mesh(geometry, material);
      doc.position.set(...spot);
      this.docs.push(doc);
      this.group.add(doc);
    });
  }

  public override update(delta: number, elapsed: number): void {
    super.update(delta, elapsed);
    if (this.reducedMotion) return;
    this.docs.forEach((doc, index) => {
      doc.position.y = DOC_SPOTS[index]![1] + Math.sin(elapsed * 0.3 + index * 1.7) * 0.15;
      doc.rotation.y = Math.sin(elapsed * 0.1 + index) * 0.2;
    });
  }

  protected override onSimulationStart(): void { this.trace('DOCUMENT INGESTED / LOCAL MOCK DATA'); }
  protected override onStep(index: number): void {
    this.trace(['PARSE / 14 RULE BLOCKS', 'EXTRACT / 32 ENTITIES', 'ALIGN / 7 ALIASES MERGED', 'GRAPH / 48 EDGES', 'RETRIEVE / TOP-K EVIDENCE', 'ANSWER / SOURCE NODES ATTACHED'][index] ?? 'ARCHIVE PROCESSING');
  }
  protected override onSimulationComplete(): void { this.trace('ANSWER WITH EVIDENCE / DEMO COMPLETE'); }
}
