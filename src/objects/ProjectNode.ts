import {Group, Mesh, MeshBasicMaterial, PointLight, SphereGeometry, Vector2} from 'three';
import type {QualityProfile} from '../core/QualityManager';
import type {ProjectId} from '../data/projects';
import {createProjectVisual, type ProjectVisual} from './ProjectVisual';

export class ProjectNode extends Group {
  public readonly hitTarget: Mesh;
  private readonly light: PointLight;
  private readonly visual: ProjectVisual;
  private readonly baseX: number;
  private readonly baseY: number;
  private readonly phase: number;
  private readonly magnet = new Vector2();
  private readonly magnetTarget = new Vector2();
  private hovered = false;
  private active = false;

  public constructor(
    public readonly projectId: ProjectId,
    private readonly color: string,
    position: [number, number, number],
    profile: QualityProfile,
  ) {
    super();
    this.name = `PROJECT_${projectId.toUpperCase()}`;
    this.position.set(...position);
    this.baseX = position[0];
    this.baseY = position[1];
    this.phase = position[0] * 1.7;
    this.visual = createProjectVisual(projectId, color, profile);
    this.hitTarget = new Mesh(
      new SphereGeometry(1.22, 14, 10),
      new MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false}),
    );
    this.hitTarget.userData.projectId = projectId;
    this.light = new PointLight(color, 2.4, 5.5, 2);
    this.add(this.visual.root, this.hitTarget, this.light);
  }

  public attachModel(model: Group, profile: QualityProfile): void { this.visual.attachModel(model, profile); }
  public setHovered(value: boolean): void { this.hovered = value; this.visual.setHovered(value); }
  public setActive(value: boolean): void { this.active = value; this.visual.setActive(value); }
  public setPresence(value: number): void { this.visual.setPresence(value); }
  public setQuality(profile: QualityProfile): void { this.visual.setQuality(profile); }
  public setMagnet(x: number, y: number, strength: number): void {
    this.magnetTarget.set(x * strength * 0.08, y * strength * 0.08);
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean, motionScale = 1): void {
    const lerp = 1 - Math.exp(-delta * 8);
    const magnetLerp = 1 - Math.exp(-delta * (this.magnetTarget.lengthSq() > this.magnet.lengthSq() ? 13 : 7));
    this.magnet.lerp(this.magnetTarget, magnetLerp);
    const targetScale = this.active ? 1.22 : this.hovered ? 1.12 : 1;
    this.scale.setScalar(this.scale.x + (targetScale - this.scale.x) * lerp);
    if (!reducedMotion) {
      this.position.x = this.baseX + this.magnet.x;
      this.position.y = this.baseY + Math.sin(elapsed * 0.7 * motionScale + this.phase) * 0.12 + this.magnet.y;
    } else {
      this.position.x = this.baseX;
      this.position.y = this.baseY;
    }
    const lightTarget = this.hovered ? 3.6 : this.active ? 3.15 : 2.4;
    this.light.intensity += (lightTarget - this.light.intensity) * lerp;
    this.visual.update(delta, elapsed, reducedMotion, motionScale);
  }

  public dispose(): void {
    this.visual.dispose();
    this.hitTarget.geometry.dispose();
    (this.hitTarget.material as MeshBasicMaterial).dispose();
    this.light.dispose();
  }
}
