import {AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, OctahedronGeometry, PointLight, SphereGeometry, TorusGeometry} from 'three';
import type {ProjectId} from '../data/projects';

export class ProjectNode extends Group {
  public readonly hitTarget: Mesh;
  private readonly orb: Mesh;
  private readonly ring: Mesh;
  private readonly satellites: Group[] = [];
  private readonly baseY: number;
  private readonly phase: number;
  private hovered = false;
  private active = false;
  private spin = 1;

  public constructor(public readonly projectId: ProjectId, color: string, position: [number, number, number]) {
    super();
    this.name = `PROJECT_${projectId.toUpperCase()}`;
    this.position.set(...position);
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
    const light = new PointLight(color, 2.8, 5, 2);
    this.add(this.orb, this.hitTarget, this.ring, light);

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
  public setDetail(value: boolean): void { this.satellites.forEach((pivot) => { pivot.visible = value; }); }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    const lerp = Math.min(1, delta * 8);
    const target = this.active ? 1.32 : this.hovered ? 1.17 : 1;
    this.scale.setScalar(this.scale.x + (target - this.scale.x) * lerp);
    this.spin += ((this.hovered || this.active ? 2.4 : 1) - this.spin) * Math.min(1, delta * 4);
    if (!reducedMotion) {
      this.orb.rotation.x += delta * 0.2 * this.spin;
      this.orb.rotation.y += delta * 0.34 * this.spin;
      this.ring.rotation.z = elapsed * 0.12;
      this.position.y = this.baseY + Math.sin(elapsed * 0.7 + this.phase) * 0.12;
      this.satellites[0]!.rotation.y += delta * 1.1 * this.spin;
      this.satellites[1]!.rotation.y -= delta * 0.8 * this.spin;
    } else {
      this.position.y = this.baseY;
    }
    const ringMaterial = this.ring.material as MeshBasicMaterial;
    const orbMaterial = this.orb.material as MeshBasicMaterial;
    const ringScale = this.hovered || this.active ? 1.28 : 1;
    this.ring.scale.setScalar(this.ring.scale.x + (ringScale - this.ring.scale.x) * lerp);
    const ringOpacity = this.active ? 0.6 + Math.sin(elapsed * 3) * 0.25 : this.hovered ? 0.85 : 0.45;
    ringMaterial.opacity += (ringOpacity - ringMaterial.opacity) * lerp;
    const orbOpacity = this.hovered || this.active ? 1 : 0.68;
    orbMaterial.opacity += (orbOpacity - orbMaterial.opacity) * lerp;
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
