import {EventBus} from './EventBus';
import {AssetManager} from './AssetManager';
import {CameraRig} from './CameraRig';
import {InputManager} from './InputManager';
import {QualityManager} from './QualityManager';
import {Renderer} from './Renderer';
import {StateMachine} from './StateMachine';
import type {AppEvents} from './types';
import type {ProjectId} from '../data/projects';
import {HubScene} from '../scenes/HubScene';
import {IntroScene} from '../scenes/IntroScene';
import {PMUScene} from '../scenes/PMUScene';
import {EKGScene} from '../scenes/EKGScene';
import {SecurityScene} from '../scenes/SecurityScene';
import {InteractionSystem} from '../systems/InteractionSystem';
import {AccessibilitySystem} from '../systems/AccessibilitySystem';
import {AudioSystem} from '../systems/AudioSystem';
import {VisibilitySystem} from '../systems/VisibilitySystem';
import {IntroOverlay} from '../ui/IntroOverlay';
import {ProjectPanel} from '../ui/ProjectPanel';
import {SimpleMode} from '../ui/SimpleMode';
import {UIController} from '../ui/UIController';

export class Experience {
  private readonly bus = new EventBus<AppEvents>();
  private readonly quality = new QualityManager(this.bus);
  private readonly cameraRig = new CameraRig();
  private readonly renderer: Renderer;
  private readonly assets: AssetManager;
  private readonly machine = new StateMachine();
  private readonly hub: HubScene;
  private readonly introScene: IntroScene;
  private readonly pmu: PMUScene;
  private readonly ekg: EKGScene;
  private readonly security: SecurityScene;
  private readonly panel = new ProjectPanel();
  private readonly ui: UIController;
  private readonly intro: IntroOverlay;
  private readonly interaction: InteractionSystem;
  private readonly input: InputManager;
  private readonly audio: AudioSystem;
  private readonly visibility: VisibilitySystem;
  private readonly accessibility = new AccessibilitySystem();
  private readonly simpleMode = new SimpleMode();
  private frame = 0;
  private explorer = false;
  private selected: ProjectId | null = null;
  private disposed = false;
  private lastActivity = performance.now();
  private idle = false;

  public constructor(private readonly canvas: HTMLCanvasElement) {
    this.cameraRig.setReducedMotion(this.accessibility.reducedMotion.matches);
    this.renderer = new Renderer(canvas, this.cameraRig, this.quality);
    this.hub = new HubScene(this.cameraRig, this.quality);
    this.hub.setReducedMotion(this.accessibility.reducedMotion.matches);
    this.introScene = new IntroScene(this.cameraRig, this.hub);
    const trace = (message: string) => this.panel.setTrace(message);
    this.pmu = new PMUScene(this.cameraRig, this.bus, trace);
    this.ekg = new EKGScene(this.cameraRig, this.bus, trace);
    this.security = new SecurityScene(this.cameraRig, this.bus, trace);
    [this.pmu, this.ekg, this.security].forEach((scene) => scene.setReducedMotion(this.accessibility.reducedMotion.matches));
    this.renderer.scene.add(this.hub.group, this.pmu.group, this.ekg.group, this.security.group);

    this.machine.register('intro', this.introScene);
    this.machine.register('hub', this.hub);
    this.machine.register('pmu', this.pmu);
    this.machine.register('ekg', this.ekg);
    this.machine.register('security', this.security);

    this.audio = new AudioSystem(this.bus);
    this.ui = new UIController({
      selectProject: (id) => void this.selectProject(id),
      back: () => void this.backToHub(),
      action: () => this.triggerAction(),
      toggleExplorer: () => this.toggleExplorer(),
      toggleSound: () => this.audio.toggle(),
    });
    this.interaction = new InteractionSystem(canvas, this.cameraRig.camera, this.hub.projectNodes, (id) => {
      this.hub.setHoveredProject(id);
      this.ui.hover(id);
    }, (id) => void this.selectProject(id));
    this.input = new InputManager({
      select: (id) => void this.selectProject(id),
      back: () => void this.backToHub(),
      interact: () => this.selected ? this.triggerAction() : undefined,
      help: () => this.ui.showHelp(),
      map: () => this.ui.toggleMap(),
    });
    this.visibility = new VisibilitySystem((hidden) => this.renderer.setPaused(hidden));
    this.intro = new IntroOverlay(
      () => { void this.introScene.dive(); },
      () => { this.hub.core.setEnergy(2.6); void this.introScene.reveal(); },
      () => this.ui.showIdentity(),
      () => { void this.enterHub(); },
    );
    this.assets = new AssetManager((progress) => this.intro.updateProgress(progress));
    this.bus.on('quality:change', (level) => {
      this.hub.updateQuality(this.quality.profile);
      this.renderer.updateQuality();
      this.ui.setQuality(level);
    });
    window.addEventListener('resize', this.resize, {passive: true});
    window.addEventListener('pointermove', this.pointerMove, {passive: true});
    window.addEventListener('pointerdown', this.markActivity, {passive: true});
    window.addEventListener('keydown', this.markActivity, {passive: true});
    window.addEventListener('wheel', this.markActivity, {passive: true});
    window.addEventListener('hashchange', this.route);
    window.addEventListener('popstate', this.route);
    this.accessibility.reducedMotion.addEventListener('change', this.motionChange);
    this.resize();
  }

  public async start(): Promise<void> {
    this.intro.updateProgress(0);
    const initialHash = location.hash;
    const simple = initialHash === '#/simple' || ['#/profile', '#/stack', '#/contact'].includes(initialHash);
    const project = this.projectFromHash(initialHash);
    const instant = this.accessibility.reducedMotion.matches || simple || Boolean(project) || sessionStorage.getItem('jzy-intro-complete') === '1';
    const assetsReady = this.assets.preload(instant).catch(() => this.intro.updateProgress(1));
    this.renderer.clock.start();
    this.frame = requestAnimationFrame(this.tick);
    await assetsReady;

    if (this.accessibility.reducedMotion.matches || simple) {
      this.intro.hideImmediately();
      await this.enterHub(false);
      if (simple) this.openSimpleRoute(initialHash);
      return;
    }
    if (project) {
      this.intro.hideImmediately();
      await this.enterHub(false);
      await this.selectProject(project, false);
      return;
    }
    await this.machine.transition('intro');
    this.intro.play();
  }

  private readonly tick = (): void => {
    if (this.disposed) return;
    const delta = Math.min(this.renderer.clock.getDelta(), 0.1);
    const elapsed = this.renderer.clock.elapsedTime;
    this.cameraRig.update(delta, this.input.keys);
    this.hub.update(delta, elapsed);
    this.pmu.update(delta, elapsed);
    this.ekg.update(delta, elapsed);
    this.security.update(delta, elapsed);
    this.interaction.update();
    const canIdle = ['hub', 'pmu', 'ekg', 'security'].includes(this.machine.state);
    if (!this.idle && canIdle && performance.now() - this.lastActivity >= 5000) {
      this.idle = true;
      this.hub.setIdle(true);
      this.ui.setIdle(true);
    }
    this.quality.sample(delta);
    this.renderer.render();
    this.frame = requestAnimationFrame(this.tick);
  };

  public async selectProject(id: ProjectId, updateHash = true): Promise<void> {
    if (this.machine.isTransitioning || this.selected === id) return;
    this.markActivity();
    this.interaction.setEnabled(false);
    this.selected = id;
    this.hub.setProjectState(id);
    this.ui.showProject(id);
    this.panel.open(id);
    if (updateHash) history.pushState({}, '', `#/project/${id}`);
    await this.machine.transition(id);
    this.bus.emit('project:select', id);
    this.bus.emit('state:change', id);
  }

  public async backToHub(updateHash = true): Promise<void> {
    if (this.machine.isTransitioning || (!this.selected && this.machine.state === 'hub')) return;
    this.markActivity();
    this.panel.close();
    this.selected = null;
    this.hub.setProjectState(null);
    if (updateHash) history.pushState({}, '', '#/hub');
    await this.machine.transition('hub');
    this.interaction.setEnabled(true);
    this.ui.showHub();
    this.bus.emit('state:change', 'hub');
  }

  private async enterHub(updateHash = true): Promise<void> {
    document.documentElement.dataset.mode = 'cinematic';
    if (this.machine.state !== 'hub') await this.machine.transition('hub');
    if (updateHash && !location.hash.startsWith('#/project/')) history.replaceState({}, '', '#/hub');
    this.ui.showHub();
    this.interaction.setEnabled(true);
  }

  private triggerAction(): void {
    if (this.selected === 'pmu') this.pmu.trigger();
    if (this.selected === 'ekg') this.ekg.trigger();
    if (this.selected === 'security') this.security.trigger();
  }

  private toggleExplorer(): boolean {
    if (matchMedia('(max-width: 1024px)').matches || this.selected) return false;
    this.explorer = !this.explorer;
    this.cameraRig.setExplorer(this.explorer);
    this.accessibility.announce(this.explorer ? 'Explorer Mode：使用 WASD 缓慢移动' : 'Guided Mode');
    return this.explorer;
  }

  private projectFromHash(hash: string): ProjectId | null {
    const match = hash.match(/^#\/project\/(pmu|ekg|security)$/);
    return (match?.[1] as ProjectId | undefined) ?? null;
  }

  private openSimpleRoute(hash: string): void {
    this.simpleMode.enter(false);
    const id = hash.slice(2);
    if (id && id !== 'simple') requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }

  private readonly route = (): void => {
    const project = this.projectFromHash(location.hash);
    if (project) { document.documentElement.dataset.mode = 'cinematic'; void this.selectProject(project, false); return; }
    if (['#/simple', '#/profile', '#/stack', '#/contact'].includes(location.hash)) { this.openSimpleRoute(location.hash); return; }
    if (location.hash === '#/hub' || !location.hash) { document.documentElement.dataset.mode = 'cinematic'; void this.backToHub(false); }
  };

  private readonly pointerMove = (event: PointerEvent): void => {
    this.markActivity();
    this.cameraRig.setPointer((event.clientX / innerWidth) * 2 - 1, -((event.clientY / innerHeight) * 2 - 1));
  };
  private readonly markActivity = (): void => {
    this.lastActivity = performance.now();
    if (!this.idle) return;
    this.idle = false;
    this.hub.setIdle(false);
    this.ui.setIdle(false);
  };
  private readonly resize = (): void => this.renderer.resize(innerWidth, innerHeight);
  private readonly motionChange = (event: MediaQueryListEvent): void => {
    this.cameraRig.setReducedMotion(event.matches);
    this.hub.setReducedMotion(event.matches);
    [this.pmu, this.ekg, this.security].forEach((scene) => scene.setReducedMotion(event.matches));
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.pointerMove);
    window.removeEventListener('pointerdown', this.markActivity);
    window.removeEventListener('keydown', this.markActivity);
    window.removeEventListener('wheel', this.markActivity);
    window.removeEventListener('hashchange', this.route);
    window.removeEventListener('popstate', this.route);
    this.accessibility.reducedMotion.removeEventListener('change', this.motionChange);
    this.interaction.dispose(); this.input.dispose(); this.audio.dispose(); this.visibility.dispose(); this.intro.dispose();
    this.hub.dispose(); this.pmu.dispose(); this.ekg.dispose(); this.security.dispose(); this.assets.dispose(); this.renderer.dispose(); this.bus.clear();
  }
}
