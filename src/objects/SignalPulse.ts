import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';

let glowTexture: CanvasTexture | null = null;

const getGlowTexture = (): CanvasTexture => {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(canvas);
  glowTexture.colorSpace = SRGBColorSpace;
  return glowTexture;
};

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class SignalPulse extends Group {
  private readonly start = new Vector3();
  private readonly end = new Vector3();
  private readonly head: Mesh;
  private readonly glow: Sprite;
  private readonly trail: Sprite[];
  private readonly flash: Mesh;
  private readonly history = Array.from({length: 12}, () => new Vector3());
  private progress = 0;
  private moving = false;
  private flashTime = -1;

  public constructor(color = '#b8ff3d') {
    super();
    const texture = getGlowTexture();
    this.head = new Mesh(new SphereGeometry(0.07, 12, 12), new MeshBasicMaterial({color: new Color(color).multiplyScalar(2.2)}));
    this.glow = new Sprite(new SpriteMaterial({map: texture, color, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false}));
    this.glow.scale.setScalar(0.55);
    this.trail = Array.from({length: 5}, (_, index) => {
      const sprite = new Sprite(new SpriteMaterial({map: texture, color, transparent: true, opacity: 0.32 - index * 0.055, blending: AdditiveBlending, depthWrite: false}));
      sprite.scale.setScalar(0.3 - index * 0.04);
      sprite.visible = false;
      return sprite;
    });
    this.flash = new Mesh(
      new RingGeometry(0.1, 0.13, 32),
      new MeshBasicMaterial({color: new Color(color).multiplyScalar(1.6), transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false}),
    );
    this.head.visible = false;
    this.glow.visible = false;
    this.flash.visible = false;
    this.add(this.head, this.glow, this.flash, ...this.trail);
  }

  public get running(): boolean { return this.moving; }

  public trigger(start: Vector3, end: Vector3): void {
    this.start.copy(start);
    this.end.copy(end);
    this.progress = 0;
    this.moving = true;
    this.head.visible = true;
    this.glow.visible = true;
    this.head.position.copy(start);
    this.glow.position.copy(start);
    this.history.forEach((point) => point.copy(start));
    this.trail.forEach((sprite) => { sprite.visible = false; });
  }

  public update(delta: number): void {
    if (this.flashTime >= 0) {
      this.flashTime += delta;
      const t = this.flashTime / 0.4;
      if (t >= 1) {
        this.flashTime = -1;
        this.flash.visible = false;
      } else {
        this.flash.scale.setScalar(1 + t * 6);
        (this.flash.material as MeshBasicMaterial).opacity = 0.7 * (1 - t) * (1 - t);
      }
    }
    if (!this.moving) return;
    for (let index = this.history.length - 1; index > 0; index--) this.history[index]!.copy(this.history[index - 1]!);
    this.history[0]!.copy(this.head.position);
    this.progress += delta * 0.65;
    const t = Math.min(this.progress, 1);
    this.head.position.lerpVectors(this.start, this.end, easeInOut(t));
    this.glow.position.copy(this.head.position);
    this.trail.forEach((sprite, index) => {
      sprite.visible = true;
      sprite.position.copy(this.history[Math.min((index + 1) * 2, this.history.length - 1)]!);
    });
    if (this.progress >= 1) {
      this.moving = false;
      this.head.visible = false;
      this.glow.visible = false;
      this.trail.forEach((sprite) => { sprite.visible = false; });
      this.flash.position.copy(this.end);
      this.flash.scale.setScalar(1);
      this.flash.visible = true;
      this.flashTime = 0;
    }
  }

  public disposePulse(): void {
    this.head.geometry.dispose();
    (this.head.material as MeshBasicMaterial).dispose();
    this.flash.geometry.dispose();
    (this.flash.material as MeshBasicMaterial).dispose();
    this.glow.material.dispose();
    this.trail.forEach((sprite) => sprite.material.dispose());
  }
}
