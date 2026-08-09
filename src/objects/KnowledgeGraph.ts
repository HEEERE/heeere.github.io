import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import type {ProjectId} from '../data/projects';
import {mulberry32} from '../utils/random';
import {SignalPulse} from './SignalPulse';

type Roamer = {mesh: Mesh; from: number; to: number; t: number; speed: number};
type FocusPulse = {mesh: Mesh; path: Vector3[]; progress: number; delay: number};
type FocusMode = 'hover' | 'selected';

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class KnowledgeGraph extends LineSegments {
  public readonly nodes: InstancedMesh;
  private readonly positions: Vector3[] = [];
  private readonly edges: Array<[number, number]> = [];
  private readonly adjacency = new Map<number, number[]>();
  private readonly roamers: Roamer[] = [];
  private readonly random: () => number;
  private readonly time = {value: 0};
  private readonly instanceTransform = new Matrix4();
  private readonly instanceScale = new Vector3();
  private readonly baseNodeColor = new Color('#79c9bd');
  private readonly currentColors: Color[] = [];
  private readonly focusColor = new Color('#b8ff3d');
  private readonly focusPoint = new Vector3();
  private readonly focusIndices = new Set<number>();
  private readonly focusPulses: FocusPulse[] = [];
  private readonly focusPulseMaterial: MeshBasicMaterial;
  private readonly roamerMaterial: MeshBasicMaterial;
  private readonly idleSignal = new SignalPulse('#79c9bd');
  private focusId: ProjectId | null = null;
  private focusMode: FocusMode = 'hover';
  private focusAmount = 0;
  private focusTarget = 0;
  private idlePulseClock = 2;

  public constructor(count: number, roamers: number, seed = 7321) {
    const random = mulberry32(seed);
    const linePositions: number[] = [];
    const edges: Array<[number, number]> = [];
    const positions: Vector3[] = [];
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const radius = 3 + random() * 12;
      positions.push(new Vector3(Math.cos(angle) * radius + 2, (random() - 0.5) * 9, Math.sin(angle) * radius - 4));
    }
    for (let index = 0; index < count; index++) {
      const from = positions[index]!;
      for (let offset = 1; offset <= 2; offset++) {
        const target = (index + offset * 7) % count;
        const to = positions[target]!;
        if (from.distanceToSquared(to) < 72) {
          linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
          edges.push([index, target]);
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(linePositions), 3));
    super(geometry, new LineBasicMaterial({color: '#35504d', transparent: true, opacity: 0.32, blending: AdditiveBlending}));
    this.positions = positions;
    this.edges = edges;
    this.random = mulberry32(seed + 1);
    edges.forEach(([from, to]) => {
      this.adjacency.set(from, [...(this.adjacency.get(from) ?? []), to]);
      this.adjacency.set(to, [...(this.adjacency.get(to) ?? []), from]);
    });

    const nodeMaterial = new MeshBasicMaterial({color: '#ffffff', vertexColors: true, transparent: true, opacity: 0.72});
    nodeMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.time;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float aPhase;\nvarying float vTwinkle;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTwinkle = 0.7 + 0.3 * sin(uTime * 1.1 + aPhase);');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vTwinkle;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTwinkle;');
    };
    nodeMaterial.customProgramCacheKey = () => 'kg-node-twinkle-focus';
    const nodeGeometry = new SphereGeometry(0.06, 7, 7);
    const phases = new Float32Array(count);
    for (let index = 0; index < count; index++) phases[index] = this.random() * Math.PI * 2;
    nodeGeometry.setAttribute('aPhase', new InstancedBufferAttribute(phases, 1));
    this.nodes = new InstancedMesh(nodeGeometry, nodeMaterial, count);
    this.nodes.instanceMatrix.setUsage(DynamicDrawUsage);
    positions.forEach((position, index) => {
      this.instanceScale.setScalar(index % 11 === 0 ? 2.5 : 1);
      this.instanceTransform.compose(position, this.quaternion, this.instanceScale);
      this.nodes.setMatrixAt(index, this.instanceTransform);
      const color = this.baseNodeColor.clone();
      this.currentColors.push(color);
      this.nodes.setColorAt(index, color);
    });
    this.nodes.instanceColor!.setUsage(DynamicDrawUsage);
    this.add(this.nodes);

    const roamerGeometry = new SphereGeometry(0.045, 8, 8);
    this.roamerMaterial = new MeshBasicMaterial({color: this.baseNodeColor.clone().multiplyScalar(1.8), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false});
    for (let index = 0; index < roamers; index++) {
      const from = Math.floor(this.random() * count);
      const mesh = new Mesh(roamerGeometry, this.roamerMaterial);
      mesh.position.copy(positions[from]!);
      this.add(mesh);
      this.roamers.push({mesh, from, to: this.nextTarget(from), t: this.random() * 0.6, speed: 0.35 + this.random() * 0.3});
    }

    const focusGeometry = new SphereGeometry(0.072, 10, 10);
    this.focusPulseMaterial = new MeshBasicMaterial({color: this.focusColor, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false});
    for (let index = 0; index < 6; index++) {
      const mesh = new Mesh(focusGeometry, this.focusPulseMaterial);
      mesh.visible = false;
      this.add(mesh);
      this.focusPulses.push({mesh, path: [], progress: 0, delay: index * 0.12});
    }
    this.add(this.idleSignal);
  }

  private nextTarget(from: number): number {
    const neighbors = this.adjacency.get(from);
    if (!neighbors?.length) return Math.floor(this.random() * this.positions.length);
    return neighbors[Math.floor(this.random() * neighbors.length)]!;
  }

  public setFocus(id: ProjectId | null, position?: Vector3, color?: string, mode: FocusMode = 'hover'): void {
    if (!id || !position || !color) {
      this.focusId = null;
      this.focusTarget = 0;
      return;
    }
    const changed = this.focusId !== id || this.focusMode !== mode;
    this.focusId = id;
    this.focusMode = mode;
    this.focusTarget = 1;
    this.focusPoint.copy(position);
    this.focusColor.set(color);
    this.focusPulseMaterial.color.copy(this.focusColor).multiplyScalar(1.8);
    if (!changed) return;

    const nearest = this.positions
      .map((point, index) => ({index, distance: point.distanceToSquared(position)}))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(10, this.positions.length));
    this.focusIndices.clear();
    nearest.forEach(({index}) => this.focusIndices.add(index));
    this.focusPulses.forEach((pulse, index) => {
      const target = nearest[index % nearest.length]?.index ?? 0;
      const middle = this.adjacency.get(target)?.[index % (this.adjacency.get(target)?.length ?? 1)] ?? target;
      const outer = this.adjacency.get(middle)?.find((candidate) => candidate !== target) ?? middle;
      pulse.path = [this.positions[outer]!, this.positions[middle]!, this.positions[target]!, position.clone()];
      pulse.progress = 0;
      pulse.delay = index * 0.13;
      pulse.mesh.visible = false;
    });
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean, motionScale = 1, idle = false): void {
    const focusLerp = 1 - Math.exp(-delta * (this.focusTarget > this.focusAmount ? 8 : 3.2));
    this.focusAmount += (this.focusTarget - this.focusAmount) * focusLerp;
    const lineMaterial = this.material as LineBasicMaterial;
    const baseLineOpacity = this.focusMode === 'selected' && this.focusTarget > 0 ? 0.13 : 0.32;
    const lineTarget = baseLineOpacity * (1 - this.focusAmount * (this.focusMode === 'selected' ? 0.08 : 0.45));
    lineMaterial.opacity += (lineTarget - lineMaterial.opacity) * Math.min(1, delta * 5);

    const dimScale = this.focusMode === 'selected' ? 0.18 : 0.42;
    this.currentColors.forEach((current, index) => {
      const target = this.focusAmount > 0.005
        ? this.focusIndices.has(index)
          ? this.focusColor.clone().multiplyScalar(1.28)
          : this.baseNodeColor.clone().multiplyScalar(dimScale)
        : this.baseNodeColor;
      current.lerp(target, Math.min(1, delta * 5));
      this.nodes.setColorAt(index, current);
    });
    if (this.nodes.instanceColor) this.nodes.instanceColor.needsUpdate = true;

    this.roamerMaterial.color.lerp(this.focusAmount > 0.05 ? this.focusColor : this.baseNodeColor.clone().multiplyScalar(1.8), Math.min(1, delta * 4));
    this.roamerMaterial.opacity += ((0.9 - this.focusAmount * 0.55) - this.roamerMaterial.opacity) * Math.min(1, delta * 4);
    this.updateFocusPulses(delta, reducedMotion);
    this.updateIdlePulse(delta, idle && this.focusAmount < 0.02 && !reducedMotion);
    this.idleSignal.update(delta);

    if (reducedMotion) return;
    this.rotation.y += delta * 0.012 * motionScale;
    this.time.value += delta * motionScale;
    this.roamers.forEach((roamer) => {
      roamer.t += delta * roamer.speed * motionScale;
      if (roamer.t >= 1) {
        roamer.t %= 1;
        roamer.from = roamer.to;
        roamer.to = this.nextTarget(roamer.from);
      }
      roamer.mesh.position.lerpVectors(this.positions[roamer.from]!, this.positions[roamer.to]!, easeInOut(roamer.t));
    });
    if (this.focusAmount < 0.02) lineMaterial.opacity += (0.32 + Math.sin(elapsed * 0.35) * 0.06 - lineMaterial.opacity) * Math.min(1, delta * 2);
  }

  private updateFocusPulses(delta: number, reducedMotion: boolean): void {
    this.focusPulses.forEach((pulse) => {
      if (reducedMotion || this.focusAmount < 0.02 || pulse.path.length < 2) {
        pulse.mesh.visible = false;
        return;
      }
      pulse.progress += delta * (this.focusMode === 'selected' ? 0.38 : 0.54);
      const local = pulse.progress - pulse.delay;
      if (local < 0) return;
      if (local >= 1) {
        if (this.focusMode === 'selected' && this.focusTarget > 0) {
          pulse.progress = -0.8 - pulse.delay;
        } else {
          pulse.mesh.visible = false;
        }
        return;
      }
      const scaled = easeInOut(local) * (pulse.path.length - 1);
      const segment = Math.min(pulse.path.length - 2, Math.floor(scaled));
      pulse.mesh.position.lerpVectors(pulse.path[segment]!, pulse.path[segment + 1]!, scaled - segment);
      pulse.mesh.scale.setScalar(0.7 + Math.sin(local * Math.PI) * 0.7);
      pulse.mesh.visible = true;
    });
  }

  private updateIdlePulse(delta: number, enabled: boolean): void {
    if (!enabled) {
      this.idlePulseClock = Math.min(this.idlePulseClock, 2);
      return;
    }
    this.idlePulseClock -= delta;
    if (this.idlePulseClock > 0 || this.idleSignal.running || !this.edges.length) return;
    const edge = this.edges[Math.floor(this.random() * this.edges.length)]!;
    this.idleSignal.trigger(this.positions[edge[0]]!, this.positions[edge[1]]!);
    this.idlePulseClock = 4 + this.random() * 3;
  }

  public disposeGraph(): void {
    this.geometry.dispose();
    (this.material as LineBasicMaterial).dispose();
    this.nodes.geometry.dispose();
    (this.nodes.material as MeshBasicMaterial).dispose();
    const first = this.roamers[0];
    if (first) first.mesh.geometry.dispose();
    this.roamerMaterial.dispose();
    this.focusPulses[0]?.mesh.geometry.dispose();
    this.focusPulseMaterial.dispose();
    this.idleSignal.disposePulse();
  }
}
