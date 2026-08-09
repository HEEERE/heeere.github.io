import gsap from 'gsap';
import {
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Points,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents, SceneController} from '../core/types';
import type {QualityProfile} from '../core/QualityManager';
import type {ProjectId} from '../data/projects';
import {getProject} from '../data/projects';
import {SignalPulse} from '../objects/SignalPulse';

type Layout = 'line' | 'archive' | 'ring';

export abstract class BaseProjectScene implements SceneController {
  public readonly group = new Group();
  protected readonly project;
  protected readonly nodes: Mesh[] = [];
  protected readonly pulse: SignalPulse;
  protected readonly outerRing: Mesh;
  protected readonly connections: LineSegments;
  protected reducedMotion = false;
  protected simulationTime = -1;
  private lastStep = -1;
  private readonly paths: Array<[Vector3, Vector3]> = [];
  private readonly basePositions: Vector3[] = [];
  private readonly lineReveal = {value: 1};
  private readonly activeColor: Color;
  private readonly inactiveColor: Color;
  private transmissionEnabled = true;

  protected constructor(
    public readonly id: ProjectId,
    protected readonly cameraRig: CameraRig,
    protected readonly bus: EventBus<AppEvents>,
    layout: Layout,
  ) {
    this.project = getProject(id);
    this.activeColor = new Color(this.project.color);
    this.inactiveColor = this.activeColor.clone().multiplyScalar(0.18);
    this.group.name = `${id.toUpperCase()}_SCENE`;
    this.group.visible = false;
    this.group.position.set(0, 0, -3);
    const positions = this.makePositions(this.project.flow.length, layout);
    this.basePositions.push(...positions.map((position) => position.clone()));
    const lineArray: number[] = [];
    positions.forEach((position, index) => {
      const node = new Mesh(
        this.createNodeGeometry(index),
        new MeshPhysicalMaterial({
          color: this.inactiveColor,
          emissive: this.inactiveColor,
          emissiveIntensity: 0.24,
          roughness: this.id === 'security' ? 0.3 : 0.16,
          metalness: this.id === 'security' ? 0.28 : 0.04,
          clearcoat: 0.72,
          transmission: this.id === 'security' ? 0 : this.id === 'ekg' ? 0.2 : 0.15,
          thickness: 0.42,
          iridescence: 0.04,
          transparent: true,
          opacity: 0.56,
        }),
      );
      node.position.copy(position);
      if (this.id === 'pmu' && index % 3 !== 0) node.rotation.z = (index % 2 ? -1 : 1) * 0.34;
      if (this.id === 'ekg' && index < 2) node.rotation.set(-0.08 + index * 0.16, 0.2 * index, -0.1 + index * 0.12);
      if (this.id === 'security' && index % 2) node.rotation.x = Math.PI / 2;
      this.nodes.push(node);
      this.group.add(node);
      if (index > 0) {
        const previous = positions[index - 1]!;
        lineArray.push(previous.x, previous.y, previous.z, position.x, position.y, position.z);
        this.paths.push([previous, position]);
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(lineArray), 3));
    this.connections = new LineSegments(geometry, new LineBasicMaterial({color: '#34413c', transparent: true, opacity: 0.22}));
    this.group.add(this.connections);
    this.pulse = new SignalPulse(this.project.color);
    this.group.add(this.pulse);
    this.outerRing = new Mesh(new RingGeometry(5.7, 5.705, 128), new MeshBasicMaterial({color: this.project.color, transparent: true, opacity: 0.025, side: DoubleSide}));
    this.outerRing.rotation.x = Math.PI / 2;
    this.group.add(this.outerRing);
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }

  public setQuality(profile: QualityProfile): void {
    this.transmissionEnabled = profile.transmission;
    this.nodes.forEach((node) => {
      const material = node.material as MeshPhysicalMaterial;
      material.transmission = this.transmissionEnabled ? this.id === 'ekg' ? 0.2 : this.id === 'pmu' ? 0.15 : 0 : 0;
      material.iridescence = this.transmissionEnabled && this.id !== 'security' ? 0.04 : 0;
      material.needsUpdate = true;
    });
  }

  private createNodeGeometry(index: number): BufferGeometry {
    if (this.id === 'pmu') return index % 3 === 0 ? new IcosahedronGeometry(0.3, 2) : new SphereGeometry(0.26 + index % 2 * 0.035, 24, 16);
    if (this.id === 'ekg') {
      if (index < 2) return new BoxGeometry(0.62, 0.44, 0.055, 2, 2, 1);
      return index % 2 ? new SphereGeometry(0.27, 24, 16) : new CylinderGeometry(0.25, 0.29, 0.48, 16, 2);
    }
    return index % 2 ? new CylinderGeometry(0.27, 0.3, 0.12, 24) : new SphereGeometry(0.28, 24, 16);
  }

  private makePositions(count: number, layout: Layout): Vector3[] {
    if (layout === 'line') return Array.from({length: count}, (_, index) => new Vector3((index - (count - 1) / 2) * 1.3, Math.sin(index * 1.4) * 0.38, 0));
    if (layout === 'archive') return Array.from({length: count}, (_, index) => new Vector3((index % 3 - 1) * 1.8, (1 - Math.floor(index / 3)) * 1.25, (index % 2) * -0.32));
    return Array.from({length: count}, (_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      return new Vector3(Math.cos(angle) * 3.2, Math.sin(angle) * 2.08, 0);
    });
  }

  public async enter(): Promise<void> {
    this.group.visible = true;
    this.group.scale.setScalar(1);
    gsap.killTweensOf(this.lineReveal);
    const lineCount = this.connections.geometry.getAttribute('position').count;
    if (this.reducedMotion) {
      this.nodes.forEach((node, index) => {
        node.scale.setScalar(1);
        node.position.copy(this.basePositions[index]!);
      });
      this.connections.geometry.setDrawRange(0, lineCount);
    } else {
      gsap.killTweensOf(this.nodes.map((node) => node.scale));
      this.nodes.forEach((node, index) => {
        const base = this.basePositions[index]!;
        const material = node.material as MeshPhysicalMaterial;
        node.position.copy(base);
        if (this.id === 'pmu') {
          node.scale.setScalar(0.01);
          material.opacity = 0.18;
          gsap.to(node.scale, {x: 1, y: 1, z: 1, duration: 0.62, ease: 'back.out(1.35)', delay: 0.14 + index * 0.1});
          gsap.to(material, {opacity: 0.56, duration: 0.38, delay: 0.14 + index * 0.1});
        } else if (this.id === 'ekg') {
          node.position.x = base.x - 2.2 - index * 0.12;
          node.position.y = base.y + (index % 2 ? -0.24 : 0.24);
          node.scale.setScalar(0.72);
          material.opacity = 0.08;
          gsap.to(node.position, {x: base.x, y: base.y, duration: 0.86, ease: 'power3.out', delay: 0.12 + index * 0.055});
          gsap.to(node.scale, {x: 1, y: 1, z: 1, duration: 0.72, ease: 'power2.out', delay: 0.12 + index * 0.055});
          gsap.to(material, {opacity: 0.56, duration: 0.5, delay: 0.12 + index * 0.055});
        } else {
          node.scale.setScalar(0.34);
          material.opacity = 0.06;
          gsap.to(node.scale, {x: 1, y: 1, z: 1, duration: 0.42, ease: 'power4.out', delay: 0.16 + index * 0.045});
          gsap.to(material, {opacity: 0.56, duration: 0.24, delay: 0.16 + index * 0.045});
        }
      });
      this.lineReveal.value = 0;
      this.connections.geometry.setDrawRange(0, 0);
      gsap.to(this.lineReveal, {
        value: 1,
        duration: this.id === 'pmu' ? 1.2 : this.id === 'ekg' ? 0.86 : 0.54,
        delay: this.id === 'security' ? 0.24 : 0.3,
        ease: this.id === 'security' ? 'power4.out' : 'power2.inOut',
        onUpdate: () => this.connections.geometry.setDrawRange(0, Math.floor(lineCount * this.lineReveal.value / 2) * 2),
      });
    }
    await this.cameraRig.flyTo([0, 0.8, 11], [0, 0, -3], 1.5);
  }

  public async exit(): Promise<void> {
    gsap.killTweensOf(this.nodes.map((node) => node.scale));
    gsap.killTweensOf(this.lineReveal);
    this.simulationTime = -1;
    this.lastStep = -1;
    this.resetNodes();
    this.group.visible = false;
  }

  public trigger(): void {
    if (this.simulationTime >= 0) return;
    gsap.killTweensOf(this.nodes.map((node) => node.scale));
    this.simulationTime = 0;
    this.lastStep = -1;
    this.bus.emit('audio:cue', this.id === 'security' ? 'warning' : 'activate');
    this.onSimulationStart();
  }

  protected onSimulationStart(): void {}
  protected onStep(_index: number): void {}
  protected onSimulationComplete(): void {}

  public update(delta: number, elapsed: number): void {
    if (!this.group.visible) return;
    if (!this.reducedMotion) {
      this.group.rotation.y = Math.sin(elapsed * 0.2) * 0.035;
      this.nodes.forEach((node, index) => {
        node.rotation.x += delta * (0.08 + index * 0.009);
        node.rotation.y += delta * (0.12 + index * 0.012);
      });
    }
    this.pulse.update(delta);
    if (this.simulationTime < 0) return;
    this.simulationTime += delta;
    const stepDuration = this.id === 'security' ? 0.82 : 0.9;
    const step = Math.min(this.nodes.length - 1, Math.floor(this.simulationTime / stepDuration));
    if (step > this.lastStep) {
      this.lastStep = step;
      const node = this.nodes[step]!;
      node.scale.setScalar(1.55);
      (node.material as MeshPhysicalMaterial).color.set('#ffffff');
    }
    this.nodes.forEach((node, index) => {
      const active = index <= step;
      const material = node.material as MeshPhysicalMaterial;
      material.color.lerp(active ? this.activeColor : this.inactiveColor, Math.min(1, delta * 10));
      const targetScale = active ? 1.18 : 1;
      node.scale.setScalar(node.scale.x + (targetScale - node.scale.x) * Math.min(1, delta * 8));
    });
    const pathIndex = Math.min(step, this.paths.length - 1);
    if (pathIndex >= 0 && !this.pulse.running && step < this.nodes.length - 1) {
      const path = this.paths[pathIndex]!;
      this.pulse.trigger(path[0], path[1]);
      this.bus.emit('audio:cue', 'pulse');
      this.onStep(step);
    }
    if (step === this.nodes.length - 1 && this.simulationTime > this.nodes.length * stepDuration + 0.6) {
      this.simulationTime = -1;
      this.lastStep = -1;
      this.onSimulationComplete();
    }
  }

  private resetNodes(): void {
    this.nodes.forEach((node) => {
      (node.material as MeshPhysicalMaterial).color.copy(this.inactiveColor);
      node.scale.setScalar(1);
    });
  }

  public resize(_width: number, _height: number): void {}

  public dispose(): void {
    this.pulse.disposePulse();
    this.group.traverse((object) => {
      if (object instanceof Mesh || object instanceof Line || object instanceof Points) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }
}
