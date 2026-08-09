import type {Group} from 'three';
import type {ProjectId} from '../data/projects';

export type ModelLibrary = {
  core: Group | null;
  projects: Record<ProjectId, Group | null>;
};

export const emptyModelLibrary = (): ModelLibrary => ({
  core: null,
  projects: {pmu: null, ekg: null, security: null},
});

export const MODEL_URLS = {
  core: '/models/agent-core.glb',
  pmu: '/models/pmu-seedpod.glb',
  ekg: '/models/ekg-prism.glb',
  security: '/models/security-immune.glb',
} as const;
