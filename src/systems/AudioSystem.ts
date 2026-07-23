import type {EventBus} from '../core/EventBus';
import type {AppEvents} from '../core/types';

export class AudioSystem {
  private context: AudioContext | null = null;
  private enabled = false;
  private unsubscribe: (() => void) | null = null;

  public constructor(private readonly bus: EventBus<AppEvents>) {
    this.unsubscribe = bus.on('audio:cue', (cue) => this.playCue(cue));
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  public async toggle(): Promise<boolean> {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      await this.context.resume();
      this.playCue('activate');
    }
    return this.enabled;
  }

  private readonly onVisibility = (): void => {
    if (!this.context) return;
    if (document.hidden) void this.context.suspend();
    else if (this.enabled) void this.context.resume();
  };

  private playCue(cue: 'activate' | 'pulse' | 'warning' | 'contain'): void {
    if (!this.enabled || !this.context) return;
    const frequencies = {activate: 220, pulse: 330, warning: 120, contain: 82};
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = cue === 'warning' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequencies[cue], now);
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[cue] * 1.65, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue === 'warning' ? 0.045 : 0.025, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.26);
  }

  public dispose(): void {
    this.unsubscribe?.();
    document.removeEventListener('visibilitychange', this.onVisibility);
    void this.context?.close();
  }
}
