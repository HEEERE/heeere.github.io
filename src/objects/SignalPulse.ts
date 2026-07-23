import {Mesh, MeshBasicMaterial, SphereGeometry, Vector3} from 'three';

export class SignalPulse extends Mesh {
  private readonly start = new Vector3();
  private readonly end = new Vector3();
  private progress = 0;
  private running = false;

  public constructor(color = '#b8ff3d') {
    super(new SphereGeometry(0.1, 12, 12), new MeshBasicMaterial({color}));
    this.visible = false;
  }

  public trigger(start: Vector3, end: Vector3): void {
    this.start.copy(start); this.end.copy(end); this.progress = 0; this.running = true; this.visible = true; this.position.copy(start);
  }

  public update(delta: number): void {
    if (!this.running) return;
    this.progress += delta * 0.65;
    this.position.lerpVectors(this.start, this.end, Math.min(this.progress, 1));
    if (this.progress >= 1) { this.running = false; this.visible = false; }
  }

  public disposePulse(): void { this.geometry.dispose(); (this.material as MeshBasicMaterial).dispose(); }
}
