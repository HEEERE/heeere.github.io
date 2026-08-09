import type {ProjectId} from '../data/projects';
import {getProject} from '../data/projects';

export type UIHandlers = {
  selectProject: (id: ProjectId) => void;
  back: () => void;
  action: () => void;
  toggleExplorer: () => boolean;
  toggleSound: () => Promise<boolean>;
};

export class UIController {
  private readonly hud = document.querySelector<HTMLElement>('#site-hud')!;
  private readonly nav = document.querySelector<HTMLElement>('#project-nav')!;
  private readonly hubCopy = document.querySelector<HTMLElement>('[data-hub-copy]')!;
  private readonly prompt = document.querySelector<HTMLElement>('#interaction-prompt')!;
  private readonly hoverContext = document.querySelector<HTMLElement>('#hover-context')!;
  private readonly stateLabel = document.querySelector<HTMLElement>('[data-system-state]')!;
  private readonly qualityLabel = document.querySelector<HTMLElement>('[data-quality-label]')!;
  private readonly help = document.querySelector<HTMLDialogElement>('#help-dialog')!;
  private idle = false;

  public constructor(private readonly handlers: UIHandlers) {
    this.nav.querySelectorAll<HTMLButtonElement>('[data-project]').forEach((button) => {
      button.addEventListener('click', () => handlers.selectProject(button.dataset.project as ProjectId));
    });
    document.querySelector<HTMLElement>('[data-panel-close]')?.addEventListener('click', handlers.back);
    document.querySelector<HTMLElement>('[data-mode-toggle]')?.addEventListener('click', (event) => {
      const active = handlers.toggleExplorer();
      (event.currentTarget as HTMLButtonElement).textContent = active ? 'GUIDED MODE' : 'EXPLORER MODE';
    });
    document.querySelector<HTMLElement>('[data-sound-toggle]')?.addEventListener('click', async (event) => {
      const enabled = await handlers.toggleSound();
      const target = event.currentTarget as HTMLButtonElement;
      target.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
      target.setAttribute('aria-pressed', String(enabled));
    });
    document.querySelector<HTMLElement>('[data-help-toggle]')?.addEventListener('click', () => this.showHelp());
    document.querySelector<HTMLElement>('[data-help-close]')?.addEventListener('click', () => this.help.close());
    document.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('[data-scene-action]')) handlers.action();
    });
  }

  public showHub(): void {
    this.hud.classList.add('is-visible');
    this.nav.classList.add('is-visible');
    this.prompt.classList.add('is-visible');
    this.hubCopy.classList.add('is-visible');
    this.stateLabel.textContent = this.idle ? 'IDLE / LISTENING' : 'HUB / READY';
    this.nav.querySelectorAll('button').forEach((button) => button.classList.remove('is-active'));
  }

  public showProject(id: ProjectId): void {
    this.hubCopy.classList.remove('is-visible');
    this.hoverContext.classList.remove('is-visible');
    this.prompt.classList.remove('is-visible');
    this.stateLabel.textContent = `${id.toUpperCase()} / INSPECT`;
    this.nav.querySelectorAll<HTMLButtonElement>('button').forEach((button) => button.classList.toggle('is-active', button.dataset.project === id));
  }

  public showIdentity(): void { this.stateLabel.textContent = 'IDENTITY / RESOLVED'; }
  public setQuality(level: string): void { this.qualityLabel.textContent = `QUALITY / ${level.toUpperCase()}`; }

  public hover(id: ProjectId | null): void {
    this.prompt.textContent = id ? `${getProject(id).number} / ${getProject(id).type} — CLICK TO INSPECT` : 'SELECT A NODE / 1 · 2 · 3';
    if (!id) {
      this.hoverContext.classList.remove('is-visible');
      return;
    }
    const labels: Record<ProjectId, string> = {
      pmu: 'PROCEDURAL MEMORY',
      ekg: 'KNOWLEDGE PARSING',
      security: 'CONTAMINATION DEFENSE',
    };
    const project = getProject(id);
    this.hoverContext.dataset.project = id;
    this.hoverContext.innerHTML = `<span>${labels[id]} / ${project.number}</span><i>${project.scene}</i>`;
    this.hoverContext.classList.add('is-visible');
  }

  public setIdle(value: boolean): void {
    this.idle = value;
    this.hud.classList.toggle('is-idle', value);
    if (!this.nav.querySelector('.is-active')) this.stateLabel.textContent = value ? 'IDLE / LISTENING' : 'HUB / READY';
  }

  public showHelp(): void { if (!this.help.open) this.help.showModal(); }
  public toggleMap(): void { this.nav.classList.toggle('is-visible'); }
}
