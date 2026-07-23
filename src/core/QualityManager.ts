import type {EventBus} from './EventBus';
import type {AppEvents, QualityLevel} from './types';

export type QualityProfile = {
  level: QualityLevel;
  pixelRatio: number;
  particleCount: number;
  graphNodes: number;
  bloomStrength: number;
  antialias: boolean;
};

export class QualityManager {
  public profile: QualityProfile;
  private samples: number[] = [];
  private sampleElapsed = 0;

  public constructor(private readonly bus: EventBus<AppEvents>) {
    this.profile = this.detect();
  }

  private detect(): QualityProfile {
    const mobile = matchMedia('(max-width: 720px)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & {deviceMemory?: number}).deviceMemory ?? 4;
    const level: QualityLevel = mobile || cores <= 4 || memory <= 4 ? 'low' : cores >= 8 && memory >= 8 ? 'high' : 'medium';
    return this.forLevel(level);
  }

  private forLevel(level: QualityLevel): QualityProfile {
    const mobile = matchMedia('(max-width: 720px)').matches;
    if (level === 'low') return {level, pixelRatio: Math.min(devicePixelRatio, mobile ? 1 : 1.15), particleCount: 180, graphNodes: 42, bloomStrength: 0.32, antialias: false};
    if (level === 'medium') return {level, pixelRatio: Math.min(devicePixelRatio, mobile ? 1.15 : 1.35), particleCount: 420, graphNodes: 76, bloomStrength: 0.48, antialias: false};
    return {level, pixelRatio: Math.min(devicePixelRatio, 1.5), particleCount: 720, graphNodes: 112, bloomStrength: 0.58, antialias: true};
  }

  public sample(delta: number): void {
    this.sampleElapsed += delta;
    if (delta > 0) this.samples.push(1 / delta);
    if (this.sampleElapsed < 4 || this.samples.length < 90) return;
    const average = this.samples.reduce((sum, fps) => sum + fps, 0) / this.samples.length;
    this.samples = [];
    this.sampleElapsed = 0;
    if (average < 36 && this.profile.level !== 'low') this.setLevel('low');
  }

  public setLevel(level: QualityLevel): void {
    if (level === this.profile.level) return;
    this.profile = this.forLevel(level);
    this.bus.emit('quality:change', level);
  }
}
