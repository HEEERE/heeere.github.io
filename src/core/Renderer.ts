import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Clock,
  Color,
  FogExp2,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type {CameraRig} from './CameraRig';
import type {QualityManager} from './QualityManager';

const BLOOM_LAYER = 1;

const COMPOSITE_SHADER = {
  uniforms: {
    tDiffuse: {value: null},
    bloomTexture: {value: null},
    bloomMix: {value: 1},
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D bloomTexture;
    uniform float bloomMix;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec4 bloom = texture2D(bloomTexture, vUv);
      gl_FragColor = vec4(base.rgb + bloom.rgb * bloomMix, base.a);
    }
  `,
};

export class Renderer {
  public readonly scene = new Scene();
  public readonly clock = new Clock();
  public readonly webgl: WebGLRenderer;
  private readonly finalComposer: EffectComposer;
  private readonly bloomComposer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly gtao: GTAOPass;
  private readonly composite: ShaderPass;
  private readonly environmentTexture: Texture;
  private paused = false;

  public constructor(canvas: HTMLCanvasElement, private readonly cameraRig: CameraRig, private readonly quality: QualityManager) {
    this.scene.background = new Color('#070a0b');
    this.scene.fog = new FogExp2('#070a0b', 0.024);
    this.webgl = new WebGLRenderer({canvas, antialias: quality.profile.antialias, powerPreference: 'high-performance', alpha: false});
    this.webgl.setPixelRatio(quality.profile.pixelRatio);
    this.webgl.outputColorSpace = 'srgb';
    this.webgl.toneMapping = ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 0.96;
    this.webgl.shadowMap.enabled = false;

    const pmrem = new PMREMGenerator(this.webgl);
    this.environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environment = this.environmentTexture;
    pmrem.dispose();

    const bloomTarget = new WebGLRenderTarget(innerWidth, innerHeight, {depthBuffer: false});
    this.bloomComposer = new EffectComposer(this.webgl, bloomTarget);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(new RenderPass(this.scene, cameraRig.camera));
    this.bloom = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), quality.profile.bloomStrength, 0.32, 0.9);
    this.bloomComposer.addPass(this.bloom);

    this.finalComposer = new EffectComposer(this.webgl);
    this.finalComposer.addPass(new RenderPass(this.scene, cameraRig.camera));
    this.gtao = new GTAOPass(this.scene, cameraRig.camera, innerWidth, innerHeight);
    this.gtao.blendIntensity = 0.62;
    this.gtao.enabled = quality.profile.ao;
    this.finalComposer.addPass(this.gtao);
    const compositeMaterial = new ShaderMaterial(COMPOSITE_SHADER);
    compositeMaterial.uniforms.bloomTexture!.value = this.bloomComposer.renderTarget2.texture;
    this.composite = new ShaderPass(compositeMaterial, 'tDiffuse');
    this.finalComposer.addPass(this.composite);
    this.finalComposer.addPass(new OutputPass());
    this.updateQuality();
  }

  public resize(width: number, height: number): void {
    this.webgl.setPixelRatio(this.quality.profile.pixelRatio);
    this.webgl.setSize(width, height, false);
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);
    this.cameraRig.resize(width, height);
  }

  public updateQuality(): void {
    const profile = this.quality.profile;
    this.webgl.setPixelRatio(profile.pixelRatio);
    this.bloom.strength = profile.bloomStrength;
    this.gtao.enabled = profile.ao;
    this.composite.uniforms.bloomMix!.value = profile.selectiveBloom ? 0.58 : 0;
    this.resize(innerWidth, innerHeight);
  }

  private shouldBloom(object: Object3D): boolean {
    if (!(object instanceof Mesh || object instanceof Points)) return false;
    const materials = (Array.isArray(object.material) ? object.material : [object.material]) as Material[];
    return materials.some((material) => {
      if (material.userData.bloom === false) return false;
      const emissive = material instanceof MeshStandardMaterial ? material.emissiveIntensity : 0;
      return material.userData.bloom === true || material.name.startsWith('SIGNAL_') || material.blending === AdditiveBlending || emissive > 1.2;
    });
  }

  private syncBloomLayers(): void {
    this.scene.traverse((object) => {
      if (object.userData.bloomLayerReady) return;
      object.userData.bloomLayerReady = true;
      if (this.shouldBloom(object)) object.layers.enable(BLOOM_LAYER);
    });
  }

  public render(): void {
    if (this.paused) return;
    const camera = this.cameraRig.camera;
    if (this.quality.profile.selectiveBloom) {
      this.syncBloomLayers();
      camera.layers.set(BLOOM_LAYER);
      this.bloomComposer.render();
    }
    camera.layers.enable(0);
    camera.layers.enable(BLOOM_LAYER);
    this.finalComposer.render();
  }

  public setPaused(value: boolean): void { this.paused = value; }

  public dispose(): void {
    this.environmentTexture.dispose();
    this.bloomComposer.dispose();
    this.finalComposer.dispose();
    this.gtao.dispose();
    this.webgl.dispose();
  }
}
