import type {ProjectId} from '../data/projects';

export type ExperienceState =
  | 'boot'
  | 'intro'
  | 'identity'
  | 'hub'
  | 'pmu'
  | 'ekg'
  | 'security'
  | 'profile'
  | 'stack'
  | 'contact'
  | 'transitioning'
  | 'simple';

export type QualityLevel = 'low' | 'medium' | 'high';

export type AppEvents = {
  'state:change': ExperienceState;
  'project:hover': ProjectId | null;
  'project:select': ProjectId;
  'scene:action': ProjectId;
  'quality:change': QualityLevel;
  'audio:cue': 'activate' | 'pulse' | 'warning' | 'contain';
};

export interface SceneController {
  enter(): Promise<void>;
  exit(): Promise<void>;
  update(delta: number, elapsed: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}
