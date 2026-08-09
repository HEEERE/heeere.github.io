import {AmbientLight, Group, HemisphereLight} from 'three';
import type {CameraRig} from '../core/CameraRig';
import type {ModelLibrary} from '../core/ModelLibrary';
import type {QualityManager, QualityProfile} from '../core/QualityManager';
import type {SceneController} from '../core/types';
import {getProject, type ProjectId} from '../data/projects';
import {AgentCore} from '../objects/AgentCore';
import {KnowledgeGraph} from '../objects/KnowledgeGraph';
import {ParticleField} from '../objects/ParticleField';
import {ProjectNode} from '../objects/ProjectNode';
import {SignalPulse} from '../objects/SignalPulse';

export class HubScene implements SceneController {
  public readonly group = new Group();
  public readonly core = new AgentCore();
  public graph: KnowledgeGraph;
  public particles: ParticleField;
  public readonly projectNodes: ProjectNode[];
  private readonly corePulses: Record<ProjectId, SignalPulse>;
  private reducedMotion = false;
  private hovered: ProjectId | null = null;
  private selected: ProjectId | null = null;
  private idle = false;
  private qualityProfile: QualityProfile;

  public constructor(private readonly cameraRig: CameraRig, quality: QualityManager) {
    this.qualityProfile = quality.profile;
    this.group.name = 'HUB_SCENE';
    this.graph = new KnowledgeGraph(quality.profile.graphNodes, quality.profile.roamers, quality.profile.curveSegments);
    this.particles = new ParticleField(quality.profile.particleCount);
    this.projectNodes = [
      new ProjectNode('pmu', '#b8ff3d', [-3.4, -1.25, -0.6], quality.profile),
      new ProjectNode('ekg', '#44d9e6', [1.8, 3.05, -1.6], quality.profile),
      new ProjectNode('security', '#ff6f61', [6.1, -1.1, -1.1], quality.profile),
    ];
    this.corePulses = {
      pmu: new SignalPulse('#b8ff3d'),
      ekg: new SignalPulse('#44d9e6'),
      security: new SignalPulse('#ff6f61'),
    };
    this.projectNodes.forEach((node) => node.setQuality(quality.profile));
    this.group.add(this.graph, this.particles, this.core, ...this.projectNodes, ...Object.values(this.corePulses), new AmbientLight('#53615b', 0.9), new HemisphereLight('#a9c9c3', '#080a0b', 1.35));
  }

  public setReducedMotion(value: boolean): void { this.reducedMotion = value; }

  public applyModelLibrary(library: ModelLibrary): void {
    if (library.core) this.core.attachModel(library.core, this.qualityProfile);
    this.projectNodes.forEach((node) => {
      const model = library.projects[node.projectId];
      if (model) node.attachModel(model, this.qualityProfile);
    });
  }

  public updateQuality(profile: QualityProfile): void {
    this.qualityProfile = profile;
    if (this.graph.nodes.count !== profile.graphNodes) {
      this.group.remove(this.graph);
      this.graph.disposeGraph();
      this.graph = new KnowledgeGraph(profile.graphNodes, profile.roamers, profile.curveSegments);
      this.group.add(this.graph);
      this.applyEnvironmentState(false);
    }
    if (this.particles.geometry.getAttribute('position').count !== profile.particleCount) {
      this.group.remove(this.particles);
      this.particles.disposeField();
      this.particles = new ParticleField(profile.particleCount);
      this.group.add(this.particles);
    }
    this.core.setQuality(profile);
    this.projectNodes.forEach((node) => node.setQuality(profile));
  }

  public async enter(): Promise<void> {
    this.group.visible = true;
    this.setProjectState(null);
    await this.cameraRig.home();
  }

  public async exit(): Promise<void> {}

  public setHoveredProject(id: ProjectId | null): void {
    if (this.selected) return;
    const changed = this.hovered !== id;
    this.hovered = id;
    this.applyEnvironmentState(changed && Boolean(id));
  }

  public setProjectState(id: ProjectId | null): void {
    this.selected = id;
    this.hovered = null;
    this.projectNodes.forEach((node) => node.setActive(node.projectId === id));
    this.applyEnvironmentState(false);
  }

  public setIdle(value: boolean): void {
    this.idle = value;
    document.documentElement.dataset.idle = value ? 'true' : 'false';
    if (!this.selected && !this.hovered) this.core.setEnergy(value ? 1.02 : 0.9);
  }

  private applyEnvironmentState(pulseCore: boolean): void {
    const focus = this.selected ?? this.hovered;
    this.projectNodes.forEach((node) => {
      const presence = !focus ? 1 : node.projectId === focus ? 1 : this.selected ? 0.25 : 0.45;
      node.setPresence(presence);
    });
    if (!focus) {
      this.graph.setFocus(null);
      this.core.setAccent(null, 0, null);
      this.core.setEnergy(this.idle ? 1.02 : 0.9);
      return;
    }
    const project = getProject(focus);
    const node = this.projectNodes.find((candidate) => candidate.projectId === focus)!;
    this.graph.setFocus(focus, node.position, project.color, this.selected ? 'selected' : 'hover');
    this.core.setAccent(project.color, this.selected ? 0.46 : 0.24, focus);
    this.core.setEnergy(this.selected ? 1.12 : 1.26);
    if (pulseCore && !this.reducedMotion) this.corePulses[focus].trigger(this.core.position, node.position);
  }

  public update(delta: number, elapsed: number): void {
    if (!this.group.visible) return;
    const motionScale = this.idle ? 0.7 : 1;
    const particleScale = (this.selected ? 0.42 : 1) * (this.idle ? 0.65 : 1);
    this.core.update(delta, elapsed, this.reducedMotion, motionScale, this.idle);
    this.graph.update(delta, elapsed, this.reducedMotion, motionScale, this.idle);
    this.particles.update(delta, this.reducedMotion, particleScale);
    this.projectNodes.forEach((node) => node.update(delta, elapsed, this.reducedMotion, motionScale));
    Object.values(this.corePulses).forEach((pulse) => pulse.update(delta));
  }

  public resize(_width: number, _height: number): void {}

  public dispose(): void {
    this.core.dispose();
    this.graph.disposeGraph();
    this.particles.disposeField();
    this.projectNodes.forEach((node) => node.dispose());
    Object.values(this.corePulses).forEach((pulse) => pulse.disposePulse());
  }
}
