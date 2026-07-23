import {Clock, Color, Scene, WebGLRenderer} from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {Vector2} from 'three';
import type {CameraRig} from './CameraRig';
import type {QualityManager} from './QualityManager';

export class Renderer {
  public readonly scene = new Scene();
  public readonly clock = new Clock();
  public readonly webgl: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private paused = false;

  public constructor(canvas: HTMLCanvasElement, private readonly cameraRig: CameraRig, private readonly quality: QualityManager) {
    this.scene.background = new Color('#090b0d');
    this.scene.fog = null;
    this.webgl = new WebGLRenderer({canvas, antialias: quality.profile.antialias, powerPreference: 'high-performance', alpha: false});
    this.webgl.setPixelRatio(quality.profile.pixelRatio);
    this.webgl.outputColorSpace = 'srgb';
    this.webgl.shadowMap.enabled = false;
    this.composer = new EffectComposer(this.webgl);
    this.composer.addPass(new RenderPass(this.scene, cameraRig.camera));
    this.bloom = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), quality.profile.bloomStrength, 0.58, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  public resize(width: number, height: number): void {
    this.webgl.setPixelRatio(this.quality.profile.pixelRatio);
    this.webgl.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.cameraRig.resize(width, height);
  }

  public updateQuality(): void {
    this.webgl.setPixelRatio(this.quality.profile.pixelRatio);
    this.bloom.strength = this.quality.profile.bloomStrength;
    this.resize(innerWidth, innerHeight);
  }

  public render(): void {
    if (!this.paused) this.composer.render();
  }

  public setPaused(value: boolean): void { this.paused = value; }

  public dispose(): void {
    this.composer.dispose();
    this.webgl.dispose();
  }
}
