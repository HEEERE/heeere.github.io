import gsap from 'gsap';
import {PerspectiveCamera, Vector2, Vector3} from 'three';

const HOME = new Vector3(0, 1.6, 13);
const LOOK_HOME = new Vector3(1.5, 0, 0);

export class CameraRig {
  public readonly camera = new PerspectiveCamera(48, 1, 0.1, 120);
  private readonly base = HOME.clone();
  private readonly lookAt = LOOK_HOME.clone();
  private readonly pointer = new Vector2();
  private readonly velocity = new Vector3();
  private readonly targetPosition = HOME.clone();
  private explorer = false;
  private reducedMotion = false;

  public constructor() {
    this.camera.position.copy(HOME);
    this.camera.lookAt(LOOK_HOME);
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }
  public setPointer(x: number, y: number): void { this.pointer.set(x, y); }
  public setExplorer(value: boolean): void { this.explorer = value; this.velocity.setScalar(0); }

  public async flyTo(position: [number, number, number], target: [number, number, number], duration = 1.6): Promise<void> {
    gsap.killTweensOf([this.base, this.lookAt]);
    const time = this.reducedMotion ? 0.18 : duration;
    await Promise.all([
      new Promise<void>((resolve) => gsap.to(this.base, {x: position[0], y: position[1], z: position[2], duration: time, ease: 'power3.inOut', onComplete: resolve})),
      new Promise<void>((resolve) => gsap.to(this.lookAt, {x: target[0], y: target[1], z: target[2], duration: time, ease: 'power3.inOut', onComplete: resolve})),
    ]);
  }

  public async home(): Promise<void> {
    await this.flyTo([HOME.x, HOME.y, HOME.z], [LOOK_HOME.x, LOOK_HOME.y, LOOK_HOME.z]);
  }

  public update(delta: number, keys: ReadonlySet<string>): void {
    if (this.explorer) {
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4.2 : 2.1;
      this.velocity.set(
        Number(keys.has('KeyD')) - Number(keys.has('KeyA')),
        0,
        Number(keys.has('KeyS')) - Number(keys.has('KeyW')),
      ).normalize().multiplyScalar(delta * speed);
      this.base.add(this.velocity);
      this.base.x = Math.max(-8, Math.min(8, this.base.x));
      this.base.z = Math.max(5, Math.min(18, this.base.z));
    }
    this.targetPosition.copy(this.base);
    if (!this.reducedMotion) {
      this.targetPosition.x += this.pointer.x * 0.2;
      this.targetPosition.y += this.pointer.y * 0.13;
    }
    this.camera.position.lerp(this.targetPosition, 1 - Math.exp(-delta * 6));
    this.camera.lookAt(this.lookAt);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }
}
