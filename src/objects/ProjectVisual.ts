import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Euler,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  TorusGeometry,
  Vector3,
  type Object3D,
} from 'three';
import type {QualityProfile} from '../core/QualityManager';
import type {ProjectId} from '../data/projects';
import {cloneModelMaterials, configureModelQuality, disposeObject, setModelPresence} from './ModelUtils';
import {ProjectResponse} from './ProjectResponse';

type RestTransform = {position: Vector3; rotation: Euler; scale: Vector3};

export interface ProjectVisual {
  readonly root: Group;
  attachModel(model: Group, profile: QualityProfile): void;
  setHovered(value: boolean): void;
  setActive(value: boolean): void;
  setPresence(value: number): void;
  setQuality(profile: QualityProfile): void;
  update(delta: number, elapsed: number, reducedMotion: boolean, motionScale: number): void;
  dispose(): void;
}

const crystal = (color: string, opacity = 0.78): MeshPhysicalMaterial => new MeshPhysicalMaterial({
  color,
  emissive: new Color(color).multiplyScalar(0.08),
  emissiveIntensity: 0.8,
  roughness: 0.18,
  metalness: 0.05,
  transmission: 0.42,
  thickness: 0.8,
  ior: 1.45,
  iridescence: 0.28,
  transparent: true,
  opacity,
});

const dark = (): MeshStandardMaterial => new MeshStandardMaterial({
  color: '#101b18',
  emissive: '#07100d',
  emissiveIntensity: 0.7,
  roughness: 0.38,
  metalness: 0.42,
});

const glow = (color: string): MeshBasicMaterial => {
  const material = new MeshBasicMaterial({
    color: new Color(color).multiplyScalar(1.08),
    transparent: true,
    opacity: 0.42,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  material.userData.bloom = false;
  return material;
};

const tieredFallback = (id: ProjectId): Group => {
  const root = new Group();
  root.name = `${id.toUpperCase()}_PROCEDURAL_FALLBACK`;
  const base = new Group();
  const detail = new Group();
  const micro = new Group();
  base.name = 'BASE';
  detail.name = 'DETAIL';
  micro.name = 'MICRO';
  root.add(base, detail, micro);
  return root;
};

const createPmuFallback = (color: string): Group => {
  const root = tieredFallback('pmu');
  const base = root.getObjectByName('BASE')!;
  const detail = root.getObjectByName('DETAIL')!;
  const embryo = new Mesh(new IcosahedronGeometry(0.48, 2), crystal(color));
  embryo.name = 'MEMORY_EMBRYO';
  embryo.scale.y = 1.25;
  base.add(embryo);
  for (let index = 0; index < 6; index++) {
    const angle = index / 6 * Math.PI * 2;
    const petal = new Mesh(new ConeGeometry(0.16, 0.62, 5), index % 2 ? dark() : crystal(color, 0.64));
    petal.name = `PETAL_${String(index).padStart(2, '0')}`;
    petal.position.set(Math.cos(angle) * 0.62, Math.sin(angle) * 0.62, 0);
    petal.rotation.z = angle - Math.PI / 2;
    base.add(petal);
  }
  [-0.4, 0, 0.4].forEach((x, index) => {
    const bud = new Mesh(new OctahedronGeometry(0.08, 1), glow(color));
    bud.name = `SKILL_BUD_${index}`;
    bud.position.set(x, 0.92 + Math.abs(x) * 0.45, 0);
    detail.add(bud);
  });
  return root;
};

const createEkgFallback = (color: string): Group => {
  const root = tieredFallback('ekg');
  const base = root.getObjectByName('BASE')!;
  const detail = root.getObjectByName('DETAIL')!;
  const prism = new Mesh(new CylinderGeometry(0.46, 0.58, 1.02, 6), crystal(color));
  prism.name = 'PARSER_PRISM';
  prism.rotation.z = Math.PI / 2;
  base.add(prism);
  for (let index = 0; index < 3; index++) {
    const doc = new Mesh(new BoxGeometry(0.045, 0.62, 0.38), crystal(color, 0.46));
    doc.name = `DOCUMENT_${String(index).padStart(2, '0')}`;
    doc.position.set(-0.72 - index * 0.12, (index - 1) * 0.22, index % 2 * 0.18);
    base.add(doc);
  }
  for (let index = 0; index < 6; index++) {
    const angle = index / 6 * Math.PI * 2;
    const entity = new Mesh(new OctahedronGeometry(0.07 + index % 2 * 0.025, 1), glow(color));
    entity.name = `ENTITY_${String(index).padStart(2, '0')}`;
    entity.position.set(0.82 + Math.cos(angle) * 0.48, Math.sin(angle) * 0.58, 0);
    detail.add(entity);
  }
  return root;
};

const createSecurityFallback = (color: string): Group => {
  const root = tieredFallback('security');
  const base = root.getObjectByName('BASE')!;
  const detail = root.getObjectByName('DETAIL')!;
  const cell = new Mesh(new DodecahedronGeometry(0.52, 1), crystal(color, 0.72));
  cell.name = 'IMMUNE_CELL';
  base.add(cell);
  for (let index = 0; index < 8; index++) {
    const angle = index / 8 * Math.PI * 2;
    const shield = new Mesh(new CylinderGeometry(0.2, 0.27, 0.11, 6), index % 3 === 0 ? crystal(color, 0.58) : dark());
    shield.name = `SHIELD_${String(index).padStart(2, '0')}`;
    shield.position.set(Math.cos(angle) * 0.76, Math.sin(angle) * 0.76, 0);
    shield.rotation.set(Math.PI / 2, angle, angle - Math.PI / 2);
    base.add(shield);
  }
  [0.82, 0.98, 1.14].forEach((radius, index) => {
    const ring = new Mesh(new TorusGeometry(radius, 0.018, 6, 54), glow(index === 2 ? '#b8ff3d' : color));
    ring.name = `DETECTION_L${index + 1}`;
    ring.rotation.set(index * 0.5, index * 0.32, index * 0.2);
    detail.add(ring);
  });
  return root;
};

abstract class BaseProjectVisual implements ProjectVisual {
  public readonly root = new Group();
  protected readonly fallback: Group;
  protected readonly response: ProjectResponse;
  protected model: Group | null = null;
  protected activity = 0;
  protected presence = 1;
  private hovered = false;
  private active = false;
  private targetPresence = 1;
  private profile: QualityProfile;
  protected readonly rest = new Map<Object3D, RestTransform>();

  public constructor(protected readonly id: ProjectId, protected readonly color: string, profile: QualityProfile) {
    this.profile = profile;
    this.root.name = `${id.toUpperCase()}_VISUAL`;
    this.fallback = id === 'pmu' ? createPmuFallback(color) : id === 'ekg' ? createEkgFallback(color) : createSecurityFallback(color);
    this.response = new ProjectResponse(id, color);
    this.root.add(this.fallback, this.response);
    this.captureRest(this.fallback);
    configureModelQuality(this.fallback, profile);
  }

  public attachModel(source: Group, profile: QualityProfile): void {
    if (this.model) {
      this.root.remove(this.model);
      disposeObject(this.model);
    }
    this.model = cloneModelMaterials(source);
    this.model.name = `${this.id.toUpperCase()}_GLB_VISUAL`;
    const modelScale = this.id === 'pmu' ? 0.72 : this.id === 'ekg' ? 0.68 : 0.72;
    this.model.scale.setScalar(modelScale);
    this.fallback.visible = false;
    this.root.add(this.model);
    this.rest.clear();
    this.captureRest(this.model);
    this.setQuality(profile);
  }

  private captureRest(root: Object3D): void {
    root.traverse((object) => {
      this.rest.set(object, {position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone()});
    });
  }

  protected parts(prefix: string): Object3D[] {
    const found: Object3D[] = [];
    (this.model ?? this.fallback).traverse((object) => { if (object.name.startsWith(prefix)) found.push(object); });
    return found;
  }

  protected part(name: string): Object3D | undefined { return (this.model ?? this.fallback).getObjectByName(name); }
  protected restFor(object: Object3D): RestTransform { return this.rest.get(object)!; }

  public setHovered(value: boolean): void { this.hovered = value; }
  public setActive(value: boolean): void { this.active = value; }
  public setPresence(value: number): void {
    this.targetPresence = value;
    const visibleRoot = this.model ?? this.fallback;
    if (value === 0) {
      this.presence = 0;
      setModelPresence(visibleRoot, 0);
      visibleRoot.visible = false;
    } else {
      visibleRoot.visible = true;
    }
  }
  public setQuality(profile: QualityProfile): void {
    this.profile = profile;
    configureModelQuality(this.fallback, profile);
    if (this.model) configureModelQuality(this.model, profile);
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean, motionScale: number): void {
    const target = this.hovered || this.active ? 1 : 0;
    this.activity += (target - this.activity) * (1 - Math.exp(-delta * (target > this.activity ? 7 : 3.5)));
    this.presence += (this.targetPresence - this.presence) * (1 - Math.exp(-delta * (this.targetPresence > this.presence ? 8 : 4)));
    const visibleRoot = this.model ?? this.fallback;
    setModelPresence(visibleRoot, this.presence);
    visibleRoot.visible = this.presence > 0.015;
    this.response.setActive(target > 0);
    this.response.update(delta, elapsed, reducedMotion);
    if (reducedMotion) return;
    visibleRoot.rotation.y += delta * (0.045 + this.activity * 0.085) * motionScale;
    visibleRoot.rotation.x = Math.sin(elapsed * 0.32 + this.root.id) * 0.025;
    this.animate(delta, elapsed, motionScale);
  }

  protected abstract animate(delta: number, elapsed: number, motionScale: number): void;

  public dispose(): void {
    this.root.remove(this.response);
    this.response.disposeResponse();
    disposeObject(this.fallback);
    if (this.model) disposeObject(this.model);
  }
}

class PmuVisual extends BaseProjectVisual {
  protected animate(_delta: number, elapsed: number): void {
    this.parts('PETAL_').forEach((petal, index) => {
      const rest = this.restFor(petal);
      petal.rotation.z = rest.rotation.z + (index % 2 ? -1 : 1) * this.activity * 0.2;
      const bloom = 1 + this.activity * 0.08 + Math.sin(elapsed * 1.8 + index) * 0.018;
      petal.scale.copy(rest.scale).multiplyScalar(bloom);
    });
    this.parts('SKILL_BUD_').forEach((bud, index) => {
      const rest = this.restFor(bud);
      const reveal = Math.max(0.08, Math.min(1, this.activity * 1.6 - index * 0.18));
      bud.scale.copy(rest.scale).multiplyScalar(reveal * (0.92 + Math.sin(elapsed * 2.5 + index) * 0.08));
    });
    const embryo = this.part('MEMORY_EMBRYO');
    if (embryo) {
      const rest = this.restFor(embryo);
      embryo.scale.copy(rest.scale).multiplyScalar(1 + Math.sin(elapsed * 1.5) * (0.025 + this.activity * 0.035));
    }
  }
}

class EkgVisual extends BaseProjectVisual {
  protected animate(_delta: number, elapsed: number): void {
    this.parts('DOCUMENT_').forEach((doc, index) => {
      const rest = this.restFor(doc);
      doc.position.copy(rest.position);
      doc.position.x -= this.activity * (0.08 + index * 0.055);
      doc.position.y += Math.sin(elapsed * 0.9 + index) * 0.025;
      doc.rotation.z = rest.rotation.z + this.activity * (-0.06 + index * 0.04);
    });
    this.parts('ENTITY_').forEach((entity, index) => {
      const rest = this.restFor(entity);
      const reveal = Math.max(0.05, Math.min(1, this.activity * 1.8 - index * 0.1));
      entity.scale.copy(rest.scale).multiplyScalar(reveal * (0.94 + Math.sin(elapsed * 2.2 + index) * 0.06));
    });
    const prism = this.part('PARSER_PRISM');
    if (prism) {
      const rest = this.restFor(prism);
      prism.rotation.x = rest.rotation.x + elapsed * 0.09 + this.activity * 0.1;
    }
  }
}

class SecurityVisual extends BaseProjectVisual {
  protected animate(_delta: number, elapsed: number): void {
    const spread = Math.sin(this.activity * Math.PI);
    this.parts('SHIELD_').forEach((shield, index) => {
      const rest = this.restFor(shield);
      shield.position.copy(rest.position).multiplyScalar(1 + spread * 0.13);
      shield.rotation.z = rest.rotation.z + (index % 2 ? -1 : 1) * this.activity * 0.12;
      shield.scale.copy(rest.scale).multiplyScalar(1 + Math.sin(elapsed * 3.2 + index) * 0.025 * this.activity);
    });
    this.parts('DETECTION_').forEach((ring, index) => {
      const rest = this.restFor(ring);
      ring.rotation.z = rest.rotation.z + elapsed * (0.18 + index * 0.08) * (index % 2 ? -1 : 1);
      ring.scale.copy(rest.scale).multiplyScalar(1 + this.activity * index * 0.025);
    });
    this.parts('RECEPTOR_').forEach((receptor, index) => {
      const rest = this.restFor(receptor);
      receptor.scale.copy(rest.scale).multiplyScalar(0.78 + this.activity * 0.22 + Math.sin(elapsed * 4 + index) * 0.05);
    });
  }
}

export const createProjectVisual = (id: ProjectId, color: string, profile: QualityProfile): ProjectVisual => {
  if (id === 'pmu') return new PmuVisual(id, color, profile);
  if (id === 'ekg') return new EkgVisual(id, color, profile);
  return new SecurityVisual(id, color, profile);
};
