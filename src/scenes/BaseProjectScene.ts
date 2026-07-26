import gsap from 'gsap';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  Points,
  RingGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {EventBus} from '../core/EventBus';
import type {AppEvents, SceneController} from '../core/types';
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
  protected reducedMotion = false;
  protected simulationTime = -1;
  private lastStep = -1;
  private readonly paths: Array<[Vector3, Vector3]> = [];
  private readonly activeColor: Color;
  private readonly inactiveColor: Color;

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
    const lineArray: number[] = [];
    positions.forEach((position, index) => {
      const node = new Mesh(
        index % 2 === 0 ? new OctahedronGeometry(0.46, 1) : new TorusGeometry(0.42, 0.06, 8, 40),
        new MeshBasicMaterial({color: this.inactiveColor, wireframe: true, transparent: true, opacity: 0.8}),
      );
      node.position.copy(position);
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
    this.group.add(new LineSegments(geometry, new LineBasicMaterial({color: '#34413c', transparent: true, opacity: 0.52})));
    this.pulse = new SignalPulse(this.project.color);
    this.group.add(this.pulse);
    this.outerRing = new Mesh(new RingGeometry(5.7, 5.71, 128), new MeshBasicMaterial({color: this.project.color, transparent: true, opacity: 0.12, side: DoubleSide}));
    this.outerRing.rotation.x = Math.PI / 2;
    this.group.add(this.outerRing);
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }

  private makePositions(count: number, layout: Layout): Vector3[] {
    if (layout === 'line') return Array.from({length: count}, (_, index) => new Vector3((index - (count - 1) / 2) * 1.65, Math.sin(index * 1.4) * 0.7, 0));
    if (layout === 'archive') return Array.from({length: count}, (_, index) => new Vector3((index % 3 - 1) * 2.3, (1 - Math.floor(index / 3)) * 1.6, (index % 2) * -0.6));
    return Array.from({length: count}, (_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      return new Vector3(Math.cos(angle) * 3.8, Math.sin(angle) * 2.5, 0);
    });
  }

  public async enter(): Promise<void> {
    this.group.visible = true;
    this.group.scale.setScalar(1);
    if (this.reducedMotion) {
      this.nodes.forEach((node) => node.scale.setScalar(1));
    } else {
      gsap.killTweensOf(this.nodes.map((node) => node.scale));
      this.nodes.forEach((node, index) => {
        node.scale.setScalar(0.01);
        gsap.to(node.scale, {x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.8)', delay: 0.18 + index * 0.07});
      });
    }
    await this.cameraRig.flyTo([0, 0.8, 11], [0, 0, -3], 1.5);
  }

  public async exit(): Promise<void> {
    gsap.killTweensOf(this.nodes.map((node) => node.scale));
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
      (node.material as MeshBasicMaterial).color.set('#ffffff');
    }
    this.nodes.forEach((node, index) => {
      const active = index <= step;
      const material = node.material as MeshBasicMaterial;
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
      (node.material as MeshBasicMaterial).color.copy(this.inactiveColor);
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
