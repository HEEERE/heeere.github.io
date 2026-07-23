import {
  AdditiveBlending,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  RingGeometry,
  TorusGeometry,
} from 'three';

export class AgentCore extends Group {
  private readonly shell: Mesh;
  private readonly rings: Mesh[] = [];
  private targetEnergy = 0.7;

  public constructor() {
    super();
    this.name = 'AGENT_CORE';
    const inner = new Mesh(
      new IcosahedronGeometry(1.12, 2),
      new MeshStandardMaterial({color: '#0e1816', emissive: new Color('#7dbb2d'), emissiveIntensity: 1.1, roughness: 0.18, metalness: 0.72, wireframe: true}),
    );
    this.shell = inner;
    this.add(inner);

    const haloColors = ['#b8ff3d', '#44d9e6', '#ff6f61'];
    haloColors.forEach((color, index) => {
      const ring = new Mesh(
        index === 0 ? new TorusGeometry(1.6, 0.018, 8, 100) : new RingGeometry(1.72 + index * 0.26, 1.735 + index * 0.26, 96),
        new MeshBasicMaterial({color, transparent: true, opacity: 0.48 - index * 0.09, side: 2, blending: AdditiveBlending}),
      );
      ring.rotation.set(index * 0.72, 0.4 + index * 0.62, index * 0.41);
      this.rings.push(ring);
      this.add(ring);
    });
    this.add(new PointLight('#b8ff3d', 6, 9, 2));
    this.position.set(1.8, 0, 0);
  }

  public setEnergy(value: number): void { this.targetEnergy = value; }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    if (!reducedMotion) {
      this.rotation.y += delta * 0.12;
      this.rotation.x = Math.sin(elapsed * 0.23) * 0.045;
      this.rings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.06 + index * 0.025) * (index % 2 ? -1 : 1);
      });
    }
    const scale = 1 + Math.sin(elapsed * 1.25) * 0.025 * this.targetEnergy;
    this.shell.scale.setScalar(scale);
    const material = this.shell.material as MeshStandardMaterial;
    material.emissiveIntensity += (this.targetEnergy - material.emissiveIntensity) * Math.min(1, delta * 3);
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
