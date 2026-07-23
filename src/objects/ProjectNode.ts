import {Color, Group, Mesh, MeshBasicMaterial, OctahedronGeometry, PointLight, TorusGeometry} from 'three';
import type {ProjectId} from '../data/projects';

export class ProjectNode extends Group {
  public readonly hitTarget: Mesh;
  private readonly orb: Mesh;
  private readonly ring: Mesh;
  private hovered = false;
  private active = false;

  public constructor(public readonly projectId: ProjectId, color: string, position: [number, number, number]) {
    super();
    this.name = `PROJECT_${projectId.toUpperCase()}`;
    this.position.set(...position);
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
    const light = new PointLight(color, 2.8, 5, 2);
    this.add(this.orb, this.hitTarget, this.ring, light);
  }

  public setHovered(value: boolean): void { this.hovered = value; }
  public setActive(value: boolean): void { this.active = value; }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    const target = this.active ? 1.32 : this.hovered ? 1.17 : 1;
    this.scale.setScalar(this.scale.x + (target - this.scale.x) * Math.min(1, delta * 8));
    if (!reducedMotion) {
      this.orb.rotation.x += delta * 0.2;
      this.orb.rotation.y += delta * 0.34;
      this.ring.rotation.z = elapsed * 0.12;
      this.position.y += (Math.sin(elapsed * 0.8 + this.position.x) * 0.1 - this.position.y % 1 * 0) * delta * 0.08;
    }
  }

  public dispose(): void {
    this.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }
}
