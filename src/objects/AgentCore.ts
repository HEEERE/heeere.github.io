import {
  AdditiveBlending,
  Color,
  DoubleSide,
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
} from 'three';

const CORE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 p = position;
    float wobble = sin(p.x * 4.1 + uTime * 1.3) + sin(p.y * 3.7 + uTime * 1.1) + sin(p.z * 4.5 + uTime * 0.9);
    p += normal * wobble * 0.015 * (0.6 + uEnergy * 0.5);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  uniform float uEnergy;
  uniform vec3 uColor;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 2.6);
    vec3 col = mix(uColor * 0.25, uRim, fres) * (0.55 + uEnergy * 0.75);
    gl_FragColor = vec4(col * (1.0 + fres * 1.8), 1.0);
  }
`;

export class AgentCore extends Group {
  private readonly cage: Mesh;
  private readonly coreMaterial: ShaderMaterial;
  private readonly shockwave: Mesh;
  private readonly rings: Mesh[] = [];
  private targetEnergy = 0.7;
  private energy = 0.7;
  private waveTime = 0;

  public constructor() {
    super();
    this.name = 'AGENT_CORE';
    this.coreMaterial = new ShaderMaterial({
      uniforms: {
        uTime: {value: 0},
        uEnergy: {value: this.energy},
        uColor: {value: new Color('#0e1816')},
        uRim: {value: new Color('#b8ff3d')},
      },
      vertexShader: CORE_VERTEX,
      fragmentShader: CORE_FRAGMENT,
    });
    this.add(new Mesh(new SphereGeometry(0.92, 48, 48), this.coreMaterial));

    this.cage = new Mesh(
      new IcosahedronGeometry(1.12, 2),
      new MeshStandardMaterial({color: '#0e1816', emissive: new Color('#7dbb2d'), emissiveIntensity: 1.1, roughness: 0.18, metalness: 0.72, wireframe: true, transparent: true, opacity: 0.85}),
    );
    this.add(this.cage);

    const haloColors = ['#b8ff3d', '#44d9e6', '#ff6f61'];
    haloColors.forEach((color, index) => {
      const ring = new Mesh(
        index === 0 ? new TorusGeometry(1.6, 0.012, 8, 100) : new RingGeometry(1.72 + index * 0.26, 1.73 + index * 0.26, 96),
        new MeshBasicMaterial({color, transparent: true, opacity: 0.48 - index * 0.09, side: DoubleSide, blending: AdditiveBlending}),
      );
      ring.rotation.set(index * 0.72, 0.4 + index * 0.62, index * 0.41);
      this.rings.push(ring);
      this.add(ring);
    });

    this.shockwave = new Mesh(
      new RingGeometry(0.96, 1, 64),
      new MeshBasicMaterial({color: '#b8ff3d', transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false}),
    );
    this.shockwave.rotation.x = -Math.PI * 0.5 * 0.35;
    this.shockwave.visible = false;
    this.add(this.shockwave);

    this.add(new PointLight('#b8ff3d', 6, 9, 2));
    this.position.set(1.8, 0, 0);
  }

  public setEnergy(value: number): void { this.targetEnergy = value; }

  public update(delta: number, elapsed: number, reducedMotion: boolean): void {
    this.energy += (this.targetEnergy - this.energy) * Math.min(1, delta * 3);
    this.coreMaterial.uniforms.uEnergy!.value = this.energy;
    (this.cage.material as MeshStandardMaterial).emissiveIntensity = this.energy;

    if (!reducedMotion) {
      this.coreMaterial.uniforms.uTime!.value = elapsed;
      this.rotation.y += delta * 0.12;
      this.rotation.x = Math.sin(elapsed * 0.23) * 0.045;
      this.cage.rotation.y -= delta * 0.19;
      this.rings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.06 + index * 0.025) * (index % 2 ? -1 : 1);
      });

      const wavePeriod = Math.max(1.2, 4.2 - this.energy * 1.4);
      this.waveTime += delta / wavePeriod;
      if (this.waveTime >= 1) this.waveTime %= 1;
      this.shockwave.visible = true;
      this.shockwave.scale.setScalar(1 + this.waveTime * 2.6);
      (this.shockwave.material as MeshBasicMaterial).opacity = 0.5 * (1 - this.waveTime) * (1 - this.waveTime) * Math.min(1, this.energy);
    } else {
      this.shockwave.visible = false;
    }

    const scale = 1 + Math.sin(elapsed * 1.25) * 0.025 * this.targetEnergy;
    this.cage.scale.setScalar(scale);
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
