import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type {ProjectId} from '../data/projects';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const range = (value: number, start: number, end: number): number => clamp01((value - start) / (end - start));

/**
 * A small project-specific visual grammar that appears around a hub node.
 * It intentionally uses primitives already present in the world so hover
 * reveals meaning without introducing a second visual system.
 */
export class ProjectResponse extends Group {
  private readonly color: Color;
  private readonly materials: Array<MeshBasicMaterial | LineBasicMaterial> = [];
  private readonly pmuNodes: Mesh[] = [];
  private readonly pmuStems: Mesh[] = [];
  private readonly pmuSkills: Mesh[] = [];
  private readonly ekgDocs: Mesh[] = [];
  private readonly ekgFragments: Mesh[] = [];
  private readonly ekgFragmentStarts: Vector3[] = [];
  private readonly ekgFragmentEnds: Vector3[] = [];
  private ekgGraph?: LineSegments;
  private readonly securityNodes: Mesh[] = [];
  private securityEdges?: LineSegments;
  private securityPulse?: Mesh;
  private containment?: Mesh;
  private progress = 0;
  private target = 0;

  public constructor(private readonly responseId: ProjectId, color: string) {
    super();
    this.name = `${responseId.toUpperCase()}_HOVER_LANGUAGE`;
    this.color = new Color(color);
    this.visible = false;
    if (responseId === 'pmu') this.buildPmu();
    if (responseId === 'ekg') this.buildEkg();
    if (responseId === 'security') this.buildSecurity();
  }

  public setActive(value: boolean): void { this.target = value ? 1 : 0; }

  private material(color: Color | string = this.color, opacity = 1): MeshBasicMaterial {
    const material = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    material.userData.baseOpacity = opacity;
    material.userData.bloom = true;
    this.materials.push(material);
    return material;
  }

  private buildPmu(): void {
    const positions = [
      new Vector3(1.35, -1.05, 0),
      new Vector3(1.35, -0.35, 0),
      new Vector3(1.35, 0.35, 0),
      new Vector3(1.35, 1.05, 0),
    ];
    const nodeGeometry = new SphereGeometry(0.09, 10, 10);
    const stemGeometry = new CylinderGeometry(0.012, 0.012, 1, 6);
    positions.forEach((position, index) => {
      const node = new Mesh(nodeGeometry, this.material(index === positions.length - 1 ? '#ffffff' : this.color, 0.9));
      node.position.copy(position);
      node.scale.setScalar(0.001);
      this.pmuNodes.push(node);
      this.add(node);
      if (index === 0) return;
      const from = positions[index - 1]!;
      const direction = position.clone().sub(from);
      const stem = new Mesh(stemGeometry, this.material(this.color, 0.55));
      stem.position.copy(from).addScaledVector(direction, 0.5);
      stem.scale.set(1, 0.001, 1);
      this.pmuStems.push(stem);
      this.add(stem);
    });
    const skillGeometry = new SphereGeometry(0.035, 7, 7);
    [-0.62, -0.22, 0.22, 0.62].forEach((angle, index) => {
      const skill = new Mesh(skillGeometry, this.material(this.color.clone().multiplyScalar(1.7), 0.7));
      skill.position.set(1.35 + Math.cos(angle) * (0.58 + index % 2 * 0.15), 1.05 + Math.sin(angle) * 0.72, 0);
      skill.scale.setScalar(0.001);
      this.pmuSkills.push(skill);
      this.add(skill);
    });
  }

  private buildEkg(): void {
    const docGeometry = new PlaneGeometry(0.34, 0.46, 1, 2);
    [-0.58, 0, 0.58].forEach((y, index) => {
      const doc = new Mesh(docGeometry, this.material(this.color, 0.34));
      doc.position.set(-1.55 - index * 0.12, y, -0.05 * index);
      doc.rotation.z = -0.08 + index * 0.08;
      this.ekgDocs.push(doc);
      this.add(doc);
    });

    const fragmentGeometry = new SphereGeometry(0.045, 8, 8);
    const ends = [
      new Vector3(0.72, 0.68, 0),
      new Vector3(1.18, 0.1, 0),
      new Vector3(0.62, -0.55, 0),
      new Vector3(1.52, -0.48, 0),
      new Vector3(1.58, 0.58, 0),
      new Vector3(0.95, -1.02, 0),
    ];
    ends.forEach((end, index) => {
      const start = new Vector3(-1.12 + (index % 2) * 0.2, 0.62 - (index % 3) * 0.58, 0);
      const fragment = new Mesh(fragmentGeometry, this.material(index % 2 ? '#ffffff' : this.color.clone().multiplyScalar(1.6), 0.86));
      fragment.position.copy(start);
      fragment.scale.setScalar(0.001);
      this.ekgFragments.push(fragment);
      this.ekgFragmentStarts.push(start);
      this.ekgFragmentEnds.push(end);
      this.add(fragment);
    });
    const linePositions: number[] = [];
    [[0, 1], [0, 2], [1, 4], [1, 3], [2, 3], [2, 5], [3, 4], [3, 5]].forEach(([a, b]) => {
      const from = ends[a!]!;
      const to = ends[b!]!;
      linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(linePositions), 3));
    const lineMaterial = new LineBasicMaterial({color: this.color, transparent: true, opacity: 0, blending: AdditiveBlending});
    lineMaterial.userData.baseOpacity = 0.55;
    lineMaterial.userData.bloom = true;
    this.materials.push(lineMaterial);
    this.ekgGraph = new LineSegments(geometry, lineMaterial);
    this.add(this.ekgGraph);
  }

  private buildSecurity(): void {
    const positions = [
      new Vector3(-1.45, 0.72, 0),
      new Vector3(-0.55, 0.08, 0),
      new Vector3(0.45, 0.42, 0),
      new Vector3(0.35, -0.72, 0),
    ];
    const nodeGeometry = new SphereGeometry(0.085, 9, 9);
    positions.forEach((position, index) => {
      const node = new Mesh(nodeGeometry, this.material(index === 3 ? '#b8ff3d' : this.color, 0.72));
      node.position.copy(position);
      this.securityNodes.push(node);
      this.add(node);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([
      ...positions[0]!.toArray(), ...positions[1]!.toArray(),
      ...positions[1]!.toArray(), ...positions[2]!.toArray(),
      ...positions[1]!.toArray(), ...positions[3]!.toArray(),
    ]), 3));
    const edgeMaterial = new LineBasicMaterial({color: this.color, transparent: true, opacity: 0, blending: AdditiveBlending});
    edgeMaterial.userData.baseOpacity = 0.62;
    edgeMaterial.userData.bloom = true;
    this.materials.push(edgeMaterial);
    this.securityEdges = new LineSegments(geometry, edgeMaterial);
    this.add(this.securityEdges);

    this.securityPulse = new Mesh(new SphereGeometry(0.075, 10, 10), this.material(this.color.clone().multiplyScalar(2), 1));
    this.securityPulse.visible = false;
    this.add(this.securityPulse);
    this.containment = new Mesh(
      new TorusGeometry(1.1, 0.025, 8, 64),
      this.material(new Color('#b8ff3d').multiplyScalar(1.4), 0.8),
    );
    this.containment.rotation.x = 0.24;
    this.containment.scale.setScalar(0.001);
    this.add(this.containment);
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    const response = 1 - Math.exp(-delta * (this.target > this.progress ? 8 : 4));
    this.progress += (this.target - this.progress) * response;
    this.visible = this.progress > 0.008;
    if (!this.visible) return;
    this.materials.forEach((material) => {
      const baseOpacity = material.userData.baseOpacity as number;
      material.opacity = baseOpacity * this.progress;
    });
    if (reducedMotion) {
      this.scale.setScalar(this.progress);
      return;
    }
    this.scale.setScalar(1);
    if (this.responseId === 'pmu') this.updatePmu(elapsed);
    if (this.responseId === 'ekg') this.updateEkg(elapsed);
    if (this.responseId === 'security') this.updateSecurity(elapsed);
  }

  private updatePmu(elapsed: number): void {
    this.pmuNodes.forEach((node, index) => {
      const reveal = range(this.progress, index * 0.16, index * 0.16 + 0.3);
      node.scale.setScalar(Math.max(0.001, reveal * (1 + Math.sin(elapsed * 2.6 + index) * 0.08)));
    });
    this.pmuStems.forEach((stem, index) => {
      const reveal = range(this.progress, 0.12 + index * 0.17, 0.36 + index * 0.17);
      stem.scale.set(1, Math.max(0.001, reveal * 0.7), 1);
    });
    this.pmuSkills.forEach((skill, index) => {
      const reveal = range(this.progress, 0.7 + index * 0.035, 0.9 + index * 0.025);
      skill.scale.setScalar(Math.max(0.001, reveal * (0.88 + Math.sin(elapsed * 3 + index) * 0.12)));
    });
  }

  private updateEkg(elapsed: number): void {
    this.ekgDocs.forEach((doc, index) => {
      doc.position.x = -1.55 - index * 0.12 + range(this.progress, 0, 0.35) * 0.3;
      doc.position.y += Math.sin(elapsed * 0.8 + index) * 0.0008;
    });
    this.ekgFragments.forEach((fragment, index) => {
      const travel = range(this.progress, 0.22 + index * 0.025, 0.68 + index * 0.025);
      fragment.position.lerpVectors(this.ekgFragmentStarts[index]!, this.ekgFragmentEnds[index]!, travel);
      fragment.scale.setScalar(Math.max(0.001, range(this.progress, 0.16 + index * 0.02, 0.35 + index * 0.02)));
    });
    if (this.ekgGraph) (this.ekgGraph.material as LineBasicMaterial).opacity = 0.58 * range(this.progress, 0.62, 0.96);
  }

  private updateSecurity(elapsed: number): void {
    if (!this.securityPulse || !this.containment) return;
    const propagation = range(this.progress, 0.08, 0.72);
    const path = [this.securityNodes[0]!.position, this.securityNodes[1]!.position, this.securityNodes[2]!.position];
    const phase = Math.min(1.999, propagation * 2);
    const segment = Math.min(1, Math.floor(phase));
    this.securityPulse.position.lerpVectors(path[segment]!, path[segment + 1]!, phase - segment);
    this.securityPulse.visible = propagation > 0.02 && this.progress < 0.88;
    const contaminateUntil = Math.min(2, Math.floor(propagation * 3));
    this.securityNodes.forEach((node, index) => {
      const material = node.material as MeshBasicMaterial;
      if (index <= contaminateUntil) material.color.lerp(this.color, 0.12);
      node.scale.setScalar(1 + (index <= contaminateUntil ? Math.sin(elapsed * 7 + index) * 0.12 : 0));
    });
    const contain = range(this.progress, 0.68, 0.94);
    this.containment.scale.setScalar(Math.max(0.001, 0.45 + contain * 0.85));
    this.containment.rotation.z = elapsed * 0.35;
    if (this.securityEdges) {
      const edgeMaterial = this.securityEdges.material as LineBasicMaterial;
      edgeMaterial.color.lerp(contain > 0.55 ? new Color('#b8ff3d') : this.color, 0.08);
      edgeMaterial.opacity = (0.62 - contain * 0.28) * this.progress;
    }
  }

  public disposeResponse(): void {
    this.traverse((object) => {
      if (object instanceof Mesh || object instanceof LineSegments) object.geometry.dispose();
    });
    this.materials.forEach((material) => material.dispose());
  }
}
