import type {CameraRig} from '../core/CameraRig';
import type {SceneController} from '../core/types';
import type {HubScene} from './HubScene';

export class IntroScene implements SceneController {
  public constructor(private readonly cameraRig: CameraRig, private readonly hub: HubScene) {}
  public async enter(): Promise<void> {
    this.hub.group.visible = true;
    this.hub.core.setEnergy(1.7);
    await this.cameraRig.flyTo([-1.5, 0.4, 18], [1.5, 0, -4], 0.1);
  }
  public async dive(): Promise<void> { await this.cameraRig.flyTo([0.2, 1.1, 10.5], [1.8, 0, 0], 2.2); }
  public async reveal(): Promise<void> { await this.cameraRig.flyTo([0, 1.6, 13], [1.5, 0, 0], 1.7); }
  public async exit(): Promise<void> { this.hub.core.setEnergy(0.78); }
  public update(): void {}
  public resize(): void {}
  public dispose(): void {}
}
