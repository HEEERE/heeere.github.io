import {AmbientLight, Group, HemisphereLight} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {QualityManager, QualityProfile} from '../core/QualityManager';
import type {SceneController} from '../core/types';
import {AgentCore} from '../objects/AgentCore';
import {KnowledgeGraph} from '../objects/KnowledgeGraph';
import {ParticleField} from '../objects/ParticleField';
import {ProjectNode} from '../objects/ProjectNode';

export class HubScene implements SceneController {
  public readonly group = new Group();
  public readonly core = new AgentCore();
  public graph: KnowledgeGraph;
  public particles: ParticleField;
  public readonly projectNodes: ProjectNode[];
  private reducedMotion = false;

  public constructor(private readonly cameraRig: CameraRig, quality: QualityManager) {
    this.group.name = 'HUB_SCENE';
    this.graph = new KnowledgeGraph(quality.profile.graphNodes);
    this.particles = new ParticleField(quality.profile.particleCount);
    this.projectNodes = [
      new ProjectNode('pmu', '#b8ff3d', [-3.4, -1.25, -0.6]),
      new ProjectNode('ekg', '#44d9e6', [1.8, 3.05, -1.6]),
      new ProjectNode('security', '#ff6f61', [6.1, -1.1, -1.1]),
    ];
    this.group.add(this.graph, this.particles, this.core, ...this.projectNodes, new AmbientLight('#53615b', 0.72), new HemisphereLight('#a9c9c3', '#080a0b', 1.1));
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }

  public updateQuality(profile: QualityProfile): void {
    if (this.graph.nodes.count !== profile.graphNodes) {
      this.group.remove(this.graph);
      this.graph.disposeGraph();
      this.graph = new KnowledgeGraph(profile.graphNodes);
      this.group.add(this.graph);
    }
    if (this.particles.geometry.getAttribute('position').count !== profile.particleCount) {
      this.group.remove(this.particles);
      this.particles.disposeField();
      this.particles = new ParticleField(profile.particleCount);
      this.group.add(this.particles);
    }
  }

  public async enter(): Promise<void> {
    this.group.visible = true;
    this.projectNodes.forEach((node) => node.setActive(false));
    this.core.setEnergy(0.78);
    await this.cameraRig.home();
  }

  public async exit(): Promise<void> { this.core.setEnergy(1.4); }

  public update(delta: number, elapsed: number): void {
    if (!this.group.visible) return;
    this.core.update(delta, elapsed, this.reducedMotion);
    this.graph.update(elapsed, this.reducedMotion);
    this.particles.update(elapsed, this.reducedMotion);
    this.projectNodes.forEach((node) => node.update(delta, elapsed, this.reducedMotion));
  }

  public resize(_width: number, _height: number): void {}

  public dispose(): void {
    this.core.dispose();
    this.graph.disposeGraph();
    this.particles.disposeField();
    this.projectNodes.forEach((node) => node.dispose());
  }
}
