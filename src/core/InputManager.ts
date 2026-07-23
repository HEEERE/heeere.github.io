import type {ProjectId} from '../data/projects';

export type InputHandlers = {
  select: (id: ProjectId) => void;
  back: () => void;
  interact: () => void;
  help: () => void;
  map: () => void;
};

export class InputManager {
  public readonly keys = new Set<string>();
  private readonly onDown: (event: KeyboardEvent) => void;
  private readonly onUp: (event: KeyboardEvent) => void;

  public constructor(handlers: InputHandlers) {
    this.onDown = (event) => {
      this.keys.add(event.code);
      const target = event.target;
      if (target instanceof Element && target.matches('input, textarea, select, button, a')) return;
      if (event.code === 'Digit1') handlers.select('pmu');
      if (event.code === 'Digit2') handlers.select('ekg');
      if (event.code === 'Digit3') handlers.select('security');
      if (event.code === 'Escape') handlers.back();
      if (event.code === 'KeyE' || event.code === 'Enter') handlers.interact();
      if (event.code === 'KeyH') handlers.help();
      if (event.code === 'KeyM') handlers.map();
    };
    this.onUp = (event) => this.keys.delete(event.code);
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
    this.keys.clear();
  }
}
