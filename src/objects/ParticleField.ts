import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial} from 'three';
import {mulberry32} from '../utils/random';

const VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aScale;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * 0.14 + 9.0, 18.0) - 9.0;
    p.x += sin(uTime * 0.3 + aPhase) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float twinkle = 0.6 + 0.4 * sin(uTime * (0.7 + aScale * 0.5) + aPhase);
    float depthFade = exp(-pow(0.022 * -mv.z, 2.0) * 2.0);
    vAlpha = twinkle * depthFade;
    gl_PointSize = 34.0 * aScale * (0.6 + twinkle * 0.4) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.12, d) * vAlpha * 0.5;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export class ParticleField extends Points {
  public constructor(count: number) {
    const random = mulberry32(20260718);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      positions[index * 3] = (random() - 0.5) * 34;
      positions[index * 3 + 1] = (random() - 0.5) * 18;
      positions[index * 3 + 2] = (random() - 0.5) * 28;
      scales[index] = 0.6 + random();
      phases[index] = random() * Math.PI * 2;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
    super(geometry, new ShaderMaterial({
      uniforms: {uTime: {value: 0}, uColor: {value: new Color('#7b9590')}},
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }));
    this.frustumCulled = false;
  }

  public update(elapsed: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    (this.material as ShaderMaterial).uniforms.uTime!.value = elapsed;
    this.rotation.y = elapsed * 0.004;
  }

  public disposeField(): void { this.geometry.dispose(); (this.material as ShaderMaterial).dispose(); }
}
