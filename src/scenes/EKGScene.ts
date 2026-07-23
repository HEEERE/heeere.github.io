import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

export class EKGScene extends BaseProjectScene {
  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('ekg', cameraRig, bus, 'archive');
  }
  protected override onSimulationStart(): void { this.trace('DOCUMENT INGESTED / LOCAL MOCK DATA'); }
  protected override onStep(index: number): void {
    this.trace(['PARSE / 14 RULE BLOCKS', 'EXTRACT / 32 ENTITIES', 'ALIGN / 7 ALIASES MERGED', 'GRAPH / 48 EDGES', 'RETRIEVE / TOP-K EVIDENCE', 'ANSWER / SOURCE NODES ATTACHED'][index] ?? 'ARCHIVE PROCESSING');
  }
  protected override onSimulationComplete(): void { this.trace('ANSWER WITH EVIDENCE / DEMO COMPLETE'); }
}
