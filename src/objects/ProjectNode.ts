import {AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, OctahedronGeometry, PointLight, SphereGeometry, TorusGeometry, Vector2} from 'three';
import type {ProjectId} from '../data/projects';
import {ProjectResponse} from './ProjectResponse';

export class ProjectNode extends Group {
  public readonly hitTarget: Mesh;
  private readonly orb: Mesh;
  private readonly ring: Mesh;
  private readonly light: PointLight;
  private readonly response: ProjectResponse;
  private readonly satellites: Group[] = [];
  private readonly baseX: number;
  private readonly baseY: number;
  private readonly phase: number;
  private readonly magnet = new Vector2();
  private readonly magnetTarget = new Vector2();
  private hovered = false;
  private active = false;
  private spin = 1;
  private presence = 1;
  private targetPresence = 1;

  public constructor(public readonly projectId: ProjectId, color: string, position: [number, number, number]) {
    super();
    this.name = `PROJECT_${projectId.toUpperCase()}`;
    this.position.set(...position);
    this.baseX = position[0];
    this.baseY = position[1];
    this.phase = position[0] * 1.7;
    this.orb = new Mesh(
      new OctahedronGeometry(0.58, 1),
      new MeshBasicMaterial({color: new Color(color), transparent: true, opacity: 0.68, wireframe: true}),
    );
    this.hitTarget = new Mesh(
      new OctahedronGeometry(1, 1),
      new MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false}),
    );
    this.hitTarget.userData.projectId = projectId;
    this.ring = new Mesh(new TorusGeometry(0.9, 0.015, 6, 64), new MeshBasicMaterial({color, transparent: true, opacity: 0.45}));
    this.ring.rotation.x = Math.PI / 2.4;
    this.light = new PointLight(color, 2.8, 5, 2);
    this.response = new ProjectResponse(projectId, color);
    this.add(this.orb, this.hitTarget, this.ring, this.light, this.response);

    const satelliteGeometry = new SphereGeometry(0.035, 8, 8);
    const satelliteMaterial = new MeshBasicMaterial({color: new Color(color).multiplyScalar(1.6), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false});
    [0.5, -0.9].forEach((tilt, index) => {
      const pivot = new Group();
      pivot.rotation.set(tilt, this.phase + index * 2.1, 0);
      const dot = new Mesh(satelliteGeometry, satelliteMaterial);
      dot.position.x = 0.95 + index * 0.16;
      pivot.add(dot);
      this.satellites.push(pivot);
      this.add(pivot);
    });
  }

  public setHovered(value: boolean): void { this.hovered = value; }
  public setActive(value: boolean): void { this.active = value; }
  public setPresence(value: number): void { this.targetPresence = value; }
  public setMagnet(x: number, y: number, strength: number): void {
    this.magnetTarget.set(x * strength * 0.08, y * strength * 0.08);
  }
  public setDetail(value: boolean): void { this.satellites.forEach((pivot) => { pivot.visible = value; }); }

  public update(delta: number, elapsed: number, reducedMotion: boolean, motionScale = 1): void {
    const lerp = Math.min(1, delta * 8);
    const presenceLerp = 1 - Math.exp(-delta * (this.targetPresence > this.presence ? 8 : 4));
    this.presence += (this.targetPresence - this.presence) * presenceLerp;
    const magnetLerp = 1 - Math.exp(-delta * (this.magnetTarget.lengthSq() > this.magnet.lengthSq() ? 13 : 7));
    this.magnet.lerp(this.magnetTarget, magnetLerp);
    const target = this.active ? 1.32 : this.hovered ? 1.17 : 1;
    this.scale.setScalar(this.scale.x + (target - this.scale.x) * lerp);
    this.spin += ((this.hovered || this.active ? 2.4 : 1) - this.spin) * Math.min(1, delta * 4);
    if (!reducedMotion) {
      this.orb.rotation.x += delta * 0.2 * this.spin * motionScale;
      this.orb.rotation.y += delta * 0.34 * this.spin * motionScale;
      this.ring.rotation.z += delta * 0.12 * motionScale;
      this.position.x = this.baseX + this.magnet.x;
      this.position.y = this.baseY + Math.sin(elapsed * 0.7 * motionScale + this.phase) * 0.12 + this.magnet.y;
      this.satellites[0]!.rotation.y += delta * 1.1 * this.spin * motionScale;
      this.satellites[1]!.rotation.y -= delta * 0.8 * this.spin * motionScale;
    } else {
      this.position.x = this.baseX;
      this.position.y = this.baseY;
    }
    const ringMaterial = this.ring.material as MeshBasicMaterial;
    const orbMaterial = this.orb.material as MeshBasicMaterial;
    const ringScale = this.hovered || this.active ? 1.28 : 1;
    this.ring.scale.setScalar(this.ring.scale.x + (ringScale - this.ring.scale.x) * lerp);
    const ringOpacity = (this.active ? 0.6 + Math.sin(elapsed * 3) * 0.25 : this.hovered ? 0.85 : 0.45) * this.presence;
    ringMaterial.opacity += (ringOpacity - ringMaterial.opacity) * lerp;
    const orbOpacity = (this.hovered || this.active ? 1 : 0.68) * this.presence;
    orbMaterial.opacity += (orbOpacity - orbMaterial.opacity) * lerp;
    this.light.intensity += ((this.hovered ? 3.5 : this.active ? 3.1 : 2.8) * this.presence - this.light.intensity) * lerp;
    this.response.setActive(this.hovered || this.active);
    this.response.update(delta, elapsed, reducedMotion);
  }

  public dispose(): void {
    this.remove(this.response);
    this.response.disposeResponse();
    this.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }
}
