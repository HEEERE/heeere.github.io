import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

export class PMUScene extends BaseProjectScene {
  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('pmu', cameraRig, bus, 'line');
  }
  protected override onSimulationStart(): void { this.trace('CANDIDATE CREATED / EVIDENCE QUEUED'); }
  protected override onStep(index: number): void {
    this.trace(['EXECUTOR RUNNING', 'JUDGE VERIFYING EVIDENCE', 'REPAIR ISOLATING FAILURE', 'VERIFIED / POLICY PASSED', 'ACTIVE / GRAPH COMMITTED'][index] ?? 'TRACE ACTIVE');
  }
  protected override onSimulationComplete(): void { this.trace('ACTIVE MEMORY COMMITTED / DEMO COMPLETE'); }
}
