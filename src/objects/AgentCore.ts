import {
  Color,
  DoubleSide,
  Euler,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Object3D,
} from 'three';
import type {QualityProfile} from '../core/QualityManager';
import type {ProjectId} from '../data/projects';
import {cloneModelMaterials, configureModelQuality, disposeObject} from './ModelUtils';

const CORE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObjectPosition;

  void main() {
    vec3 p = position;
    float cellular = sin(p.x * 5.2 + uTime * 1.1) * sin(p.y * 4.6 - uTime * 0.72) + sin(p.z * 6.1 + uTime * 0.84);
    p += normal * cellular * 0.018 * (0.5 + uEnergy * 0.55);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vObjectPosition = p;
    gl_Position = projectionMatrix * mv;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uColor;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vObjectPosition;

  void main() {
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 2.7);
    float bands = 0.5 + 0.5 * sin(vObjectPosition.y * 11.0 + sin(vObjectPosition.x * 4.0 + uTime * 0.6) * 1.2 - uTime * 0.72);
    float veins = smoothstep(0.8, 1.0, sin((vObjectPosition.x + vObjectPosition.z) * 13.0 - uTime * 0.62) * 0.5 + 0.5);
    vec3 body = mix(uColor, uRim * (0.24 + bands * 0.12), fresnel * 0.48 + veins * 0.06);
    vec3 color = body * (0.72 + uEnergy * 0.14) + uRim * fresnel * 0.18;
    gl_FragColor = vec4(color, 0.74);
  }
`;

type RestTransform = {position: Vector3; rotation: Euler; scale: Vector3};

export class AgentCore extends Group {
  private readonly fallbackCage: Mesh;
  private readonly coreMaterial: ShaderMaterial;
  private readonly shockwave: Mesh;
  private readonly rings: Mesh[] = [];
  private readonly baseRim = new Color('#86cbb9');
  private readonly accent = new Color('#86cbb9');
  private readonly currentRim = new Color('#86cbb9');
  private readonly light: PointLight;
  private readonly rest = new Map<Object3D, RestTransform>();
  private model: Group | null = null;
  private focusedProject: ProjectId | null = null;
  private targetEnergy = 0.7;
  private energy = 0.7;
  private accentStrength = 0;
  private targetAccentStrength = 0;
  private waveTime = 0;

  public constructor() {
    super();
    this.name = 'AGENT_CORE';
    this.coreMaterial = new ShaderMaterial({
      uniforms: {
        uTime: {value: 0},
        uEnergy: {value: this.energy},
        uColor: {value: new Color('#14342f')},
        uRim: {value: new Color('#86cbb9')},
      },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    this.coreMaterial.userData.bloom = false;
    const fluidCore = new Mesh(new SphereGeometry(0.72, 56, 40), this.coreMaterial);
    fluidCore.name = 'RUNTIME_FLUID_CORE';
    this.add(fluidCore);

    this.fallbackCage = new Mesh(
      new IcosahedronGeometry(1.12, 3),
      new MeshStandardMaterial({color: '#13211e', emissive: '#07100e', emissiveIntensity: 0.35, roughness: 0.24, metalness: 0.42, transparent: true, opacity: 0.52}),
    );
    this.fallbackCage.name = 'CORE_PROCEDURAL_FALLBACK';
    this.add(this.fallbackCage);

    const halo = new Mesh(
      new TorusGeometry(1.54, 0.008, 6, 112),
      new MeshBasicMaterial({color: '#718b84', transparent: true, opacity: 0.02, depthWrite: false}),
    );
    halo.name = 'RUNTIME_HALO_0';
    halo.rotation.set(1.04, 0.28, 0.14);
    this.rings.push(halo);
    this.add(halo);

    this.shockwave = new Mesh(
      new RingGeometry(0.96, 1, 72),
      new MeshBasicMaterial({color: '#86cbb9', transparent: true, opacity: 0, side: DoubleSide, depthWrite: false}),
    );
    this.shockwave.rotation.x = -Math.PI * 0.5 * 0.35;
    this.shockwave.visible = false;
    this.add(this.shockwave);
    this.light = new PointLight('#86cbb9', 1.1, 7, 2);
    this.add(this.light);
    this.position.set(1.8, 0, 0);
    this.scale.setScalar(0.88);
  }

  public attachModel(source: Group, profile: QualityProfile): void {
    if (this.model) {
      this.remove(this.model);
      disposeObject(this.model);
    }
    this.model = cloneModelMaterials(source);
    this.model.name = 'AGENT_CORE_GLB';
    this.model.scale.setScalar(0.95);
    this.fallbackCage.visible = false;
    this.add(this.model);
    this.rest.clear();
    this.model.traverse((object) => {
      this.rest.set(object, {position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone()});
    });
    this.setQuality(profile);
  }

  public setQuality(profile: QualityProfile): void {
    if (this.model) configureModelQuality(this.model, profile);
    this.rings[0]!.visible = profile.modelDetail >= 1;
    this.fallbackCage.visible = !this.model;
  }

  public setEnergy(value: number): void { this.targetEnergy = value; }
  public setAccent(color: string | null, strength = 0, project: ProjectId | null = null): void {
    if (color) this.accent.set(color);
    this.targetAccentStrength = color ? strength : 0;
    this.focusedProject = project;
  }

  public update(delta: number, elapsed: number, reducedMotion: boolean, motionScale = 1, idle = false): void {
    this.energy += (this.targetEnergy - this.energy) * Math.min(1, delta * 3);
    this.accentStrength += (this.targetAccentStrength - this.accentStrength) * Math.min(1, delta * 4);
    this.currentRim.copy(this.baseRim).lerp(this.accent, this.accentStrength);
    this.coreMaterial.uniforms.uEnergy!.value = this.energy;
    this.coreMaterial.uniforms.uTime!.value = elapsed;
    (this.coreMaterial.uniforms.uRim!.value as Color).copy(this.currentRim);
    this.light.color.copy(this.currentRim);
    this.light.intensity += ((0.9 + this.energy * 0.28) - this.light.intensity) * Math.min(1, delta * 3);

    if (this.model) this.updateModel(delta, elapsed, reducedMotion, motionScale);
    if (!reducedMotion) {
      this.rotation.y += delta * 0.1 * motionScale;
      this.rotation.x = Math.sin(elapsed * 0.23) * 0.035;
      this.fallbackCage.rotation.y -= delta * 0.19 * motionScale;
      this.rings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.055 + index * 0.023) * motionScale * (index % 2 ? -1 : 1);
      });
      const wavePeriod = Math.max(1.5, 4.5 - this.energy * 1.3);
      this.waveTime = (this.waveTime + delta / wavePeriod) % 1;
      this.shockwave.visible = true;
      this.shockwave.scale.setScalar(1 + this.waveTime * 2.4);
      (this.shockwave.material as MeshBasicMaterial).color.copy(this.currentRim);
      (this.shockwave.material as MeshBasicMaterial).opacity = 0.075 * (1 - this.waveTime) ** 2 * Math.min(1, this.energy);
    } else {
      this.shockwave.visible = false;
    }
    const breath = 1 + Math.sin(elapsed * (idle ? 0.88 : 1.25)) * (idle ? 0.038 : 0.022) * this.targetEnergy;
    this.fallbackCage.scale.setScalar(breath);
  }

  private updateModel(delta: number, elapsed: number, reducedMotion: boolean, motionScale: number): void {
    if (!this.model) return;
    this.model.getObjectByName('INNER_CRYSTAL')?.rotateY(delta * 0.14 * motionScale);
    this.model.getObjectByName('MEMORY_SEED')?.rotateX(delta * 0.22 * motionScale);
    const petals: Object3D[] = [];
    this.model.traverse((object) => { if (object.name.startsWith('PETAL_')) petals.push(object); });
    petals.forEach((petal, index) => {
      const rest = this.rest.get(petal)!;
      const opening = this.energy * 0.035 + this.accentStrength * 0.055;
      petal.position.copy(rest.position).multiplyScalar(1 + opening);
      petal.rotation.z = rest.rotation.z + (index % 2 ? -1 : 1) * this.accentStrength * 0.06;
      petal.scale.copy(rest.scale).multiplyScalar(1 + Math.sin(elapsed * 1.2 + index) * 0.018);
    });
    ['PMU', 'EKG', 'SECURITY'].forEach((id) => {
      const active = this.focusedProject === id.toLowerCase();
      [this.model!.getObjectByName(`PORT_${id}`), this.model!.getObjectByName(`FILAMENT_${id}`)].forEach((root) => {
        root?.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          const material = object.material as MeshStandardMaterial;
          if (material.userData.baseEmissiveIntensity === undefined) material.userData.baseEmissiveIntensity = material.emissiveIntensity;
          material.emissiveIntensity += (((material.userData.baseEmissiveIntensity as number) + (active ? 1.1 * this.accentStrength : 0)) - material.emissiveIntensity) * Math.min(1, delta * 5);
        });
      });
    });
    if (reducedMotion) return;
    ['GIMBAL_0', 'GIMBAL_1', 'GIMBAL_2'].forEach((name, index) => {
      const gimbal = this.model!.getObjectByName(name);
      if (gimbal) gimbal.rotation.z += delta * (0.08 + index * 0.04) * motionScale * (index % 2 ? -1 : 1);
    });
  }

  public dispose(): void {
    disposeObject(this);
  }
}
