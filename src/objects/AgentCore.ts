import {
  AdditiveBlending,
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
    float bands = 0.5 + 0.5 * sin(vObjectPosition.y * 14.0 + sin(vObjectPosition.x * 6.0 + uTime) * 1.8 - uTime * 1.45);
    float veins = smoothstep(0.72, 1.0, sin((vObjectPosition.x + vObjectPosition.z) * 18.0 - uTime * 1.2) * 0.5 + 0.5);
    vec3 body = mix(uColor * 0.22, uRim * (0.42 + bands * 0.32), fresnel * 0.72 + veins * 0.16);
    vec3 color = body * (0.48 + uEnergy * 0.48) + uRim * fresnel * 0.82;
    gl_FragColor = vec4(color, 0.92);
  }
`;

type RestTransform = {position: Vector3; rotation: Euler; scale: Vector3};

export class AgentCore extends Group {
  private readonly fallbackCage: Mesh;
  private readonly coreMaterial: ShaderMaterial;
  private readonly shockwave: Mesh;
  private readonly rings: Mesh[] = [];
  private readonly baseRim = new Color('#b8ff3d');
  private readonly accent = new Color('#b8ff3d');
  private readonly currentRim = new Color('#b8ff3d');
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
        uColor: {value: new Color('#061311')},
        uRim: {value: new Color('#b8ff3d')},
      },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.coreMaterial.userData.bloom = true;
    const fluidCore = new Mesh(new SphereGeometry(0.72, 56, 40), this.coreMaterial);
    fluidCore.name = 'RUNTIME_FLUID_CORE';
    this.add(fluidCore);

    this.fallbackCage = new Mesh(
      new IcosahedronGeometry(1.12, 3),
      new MeshStandardMaterial({color: '#0d1c18', emissive: '#4c7d26', emissiveIntensity: 0.9, roughness: 0.28, metalness: 0.58, wireframe: true, transparent: true, opacity: 0.72}),
    );
    this.fallbackCage.name = 'CORE_PROCEDURAL_FALLBACK';
    this.add(this.fallbackCage);

    const haloColors = ['#b8ff3d', '#44d9e6', '#ff6f61'];
    haloColors.forEach((color, index) => {
      const ring = new Mesh(
        index === 0 ? new TorusGeometry(1.52, 0.013, 8, 112) : new RingGeometry(1.7 + index * 0.24, 1.71 + index * 0.24, 112),
        new MeshBasicMaterial({color, transparent: true, opacity: 0.38 - index * 0.07, side: DoubleSide, blending: AdditiveBlending, depthWrite: false}),
      );
      ring.name = `RUNTIME_HALO_${index}`;
      ring.rotation.set(index * 0.72, 0.4 + index * 0.62, index * 0.41);
      this.rings.push(ring);
      this.add(ring);
    });

    this.shockwave = new Mesh(
      new RingGeometry(0.96, 1, 72),
      new MeshBasicMaterial({color: '#b8ff3d', transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false}),
    );
    this.shockwave.rotation.x = -Math.PI * 0.5 * 0.35;
    this.shockwave.visible = false;
    this.add(this.shockwave);
    this.light = new PointLight('#b8ff3d', 3.8, 9, 2);
    this.add(this.light);
    this.position.set(1.8, 0, 0);
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
    this.rings[2]!.visible = profile.modelDetail >= 1;
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
    this.light.intensity += ((3.4 + this.energy * 0.9) - this.light.intensity) * Math.min(1, delta * 3);

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
      (this.shockwave.material as MeshBasicMaterial).opacity = 0.34 * (1 - this.waveTime) ** 2 * Math.min(1, this.energy);
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
          material.emissiveIntensity += (((material.userData.baseEmissiveIntensity as number) + (active ? 3.2 * this.accentStrength : 0)) - material.emissiveIntensity) * Math.min(1, delta * 5);
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
