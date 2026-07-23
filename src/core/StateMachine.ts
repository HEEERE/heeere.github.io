import type {ExperienceState, SceneController} from './types';

export class StateMachine {
  private current: ExperienceState = 'boot';
  private locked = false;
  private readonly scenes = new Map<ExperienceState, SceneController>();

  public get state(): ExperienceState { return this.current; }
  public get isTransitioning(): boolean { return this.locked; }

  public register(state: ExperienceState, controller: SceneController): void {
    this.scenes.set(state, controller);
  }

  public async transition(next: ExperienceState): Promise<boolean> {
    if (this.locked || next === this.current) return false;
    this.locked = true;
    const previous = this.current;
    try {
      await this.scenes.get(previous)?.exit();
      this.current = next;
      await this.scenes.get(next)?.enter();
      return true;
    } finally {
      this.locked = false;
    }
  }
}
