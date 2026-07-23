import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';
import {BaseProjectScene} from './BaseProjectScene';

export class SecurityScene extends BaseProjectScene {
  public constructor(cameraRig: CameraRig, bus: EventBus<AppEvents>, private readonly trace: (message: string) => void) {
    super('security', cameraRig, bus, 'ring');
  }
  protected override onSimulationStart(): void { this.trace('SIMULATION ONLY / TEST CONTAMINATION RELEASED'); }
  protected override onStep(index: number): void {
    this.trace(['L1 REGEX / SIGNAL FLAGGED', 'L2 SEMANTIC / RISK 0.82', 'L3 INTENT / ESCALATE', 'GUARD CONSENSUS / QUORUM', 'CONTAINMENT / EDGE CUT', 'TRACE REPLAY / BLOCK VERIFIED'][index] ?? 'SAFE DEMO RUNNING');
  }
  protected override onSimulationComplete(): void { this.bus.emit('audio:cue', 'contain'); this.trace('CONTAMINATION CONTAINED / SIMULATION COMPLETE'); }
}
