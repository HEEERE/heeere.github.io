import type {EventBus} from './EventBus';
import type {AppEvents, QualityLevel} from './types';

export type QualityProfile = {
  level: QualityLevel;
  pixelRatio: number;
  particleCount: number;
  graphNodes: number;
  bloomStrength: number;
  antialias: boolean;
  roamers: number;
  detail: boolean;
  modelDetail: 0 | 1 | 2;
  ao: boolean;
  selectiveBloom: boolean;
  transmission: boolean;
  curveSegments: number;
};

export const qualityProfileForLevel = (level: QualityLevel, mobile: boolean, pixelRatio: number): QualityProfile => {
  if (level === 'low') return {level, pixelRatio: Math.min(pixelRatio, mobile ? 1 : 1.15), particleCount: 180, graphNodes: 42, bloomStrength: 0.3, antialias: false, roamers: 0, detail: false, modelDetail: 0, ao: false, selectiveBloom: false, transmission: false, curveSegments: 5};
  if (level === 'medium') return {level, pixelRatio: Math.min(pixelRatio, mobile ? 1.15 : 1.35), particleCount: 420, graphNodes: 76, bloomStrength: 0.34, antialias: false, roamers: 2, detail: true, modelDetail: 1, ao: true, selectiveBloom: true, transmission: true, curveSegments: 8};
  return {level, pixelRatio: Math.min(pixelRatio, 1.5), particleCount: 720, graphNodes: 112, bloomStrength: 0.42, antialias: true, roamers: 4, detail: true, modelDetail: 2, ao: true, selectiveBloom: true, transmission: true, curveSegments: 12};
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
    return qualityProfileForLevel(level, mobile, devicePixelRatio);
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
