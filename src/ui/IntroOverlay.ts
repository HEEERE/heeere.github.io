import gsap from 'gsap';

export class IntroOverlay {
  private readonly layer = document.querySelector<HTMLElement>('#cinematic-layer')!;
  private readonly identity = document.querySelector<HTMLElement>('.identity-reveal')!;
  private readonly progress = document.querySelector<HTMLElement>('[data-load-progress]')!;
  private readonly bar = document.querySelector<HTMLElement>('[data-load-bar]')!;
  private readonly logs = Array.from(document.querySelectorAll<HTMLElement>('.boot-log li'));
  private timeline: gsap.core.Timeline | null = null;
  private ready = false;
  private pendingPlay = false;

  public constructor(
    private readonly onDive: () => void,
    private readonly onCore: () => void,
    private readonly onIdentity: () => void,
    private readonly onEnter: () => void,
  ) {
    document.querySelector<HTMLElement>('[data-skip-intro]')?.addEventListener('click', () => this.skip());
    document.querySelector<HTMLElement>('[data-enter-system]')?.addEventListener('click', () => this.enter());
    document.querySelector<HTMLElement>('[data-replay-intro]')?.addEventListener('click', () => this.play(true));
  }

  public updateProgress(value: number): void {
    const percent = Math.round(value * 100);
    this.progress.textContent = String(percent).padStart(3, '0');
    this.bar.style.scale = `${Math.max(0, Math.min(1, value))} 1`;
    const activeCount = Math.min(this.logs.length, Math.ceil(value * this.logs.length));
    this.logs.forEach((log, index) => log.classList.toggle('is-active', index < activeCount));
    if (value >= 1) {
      this.ready = true;
      if (this.pendingPlay) this.startTimeline();
    }
  }

  public play(force = false): void {
    if (!force && sessionStorage.getItem('jzy-intro-complete') === '1') {
      this.hide();
      this.onEnter();
      return;
    }
    this.pendingPlay = true;
    this.layer.hidden = false;
    this.identity.classList.remove('is-visible');
    gsap.set(this.identity, {autoAlpha: 0, y: 24});
    gsap.set('.boot-copy', {autoAlpha: 1});
    if (this.ready) this.startTimeline();
  }

  private startTimeline(): void {
    this.pendingPlay = false;
    this.timeline?.kill();
    this.timeline = gsap.timeline({defaults: {ease: 'power3.inOut'}});
    this.timeline
      .to('.boot-copy', {autoAlpha: 0, y: -18, duration: 0.3}, 0.9)
      .call(this.onDive, [], 1.2)
      .to('.boot-noise', {opacity: 0.28, duration: 0.24, yoyo: true, repeat: 1}, 2.7)
      .call(this.onCore, [], 3.4)
      .to(this.layer, {backgroundColor: 'rgba(5,6,7,0.56)', duration: 1.2}, 3.5)
      .call(this.onIdentity, [], 5.35)
      .set(this.identity, {visibility: 'visible'}, 5.4)
      .to(this.identity, {autoAlpha: 1, y: 0, duration: 1.1, ease: 'power4.out'}, 5.4)
      .add(() => {
        this.identity.classList.add('is-visible');
        sessionStorage.setItem('jzy-intro-complete', '1');
      }, 6.7);
  }

  public skip(): void {
    this.timeline?.kill();
    this.onIdentity();
    sessionStorage.setItem('jzy-intro-complete', '1');
    this.enter();
  }

  private enter(): void {
    this.timeline?.kill();
    gsap.to(this.layer, {autoAlpha: 0, duration: 0.5, onComplete: () => this.hide()});
    this.onEnter();
  }

  private hide(): void {
    this.layer.hidden = true;
    gsap.set(this.layer, {autoAlpha: 1});
  }

  public hideImmediately(): void { this.timeline?.kill(); this.hide(); }

  public dispose(): void { this.timeline?.kill(); }
}
