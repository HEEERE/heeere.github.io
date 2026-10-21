import {describe, expect, it} from 'vitest';
import {getScene, konbiniScene, mainScenes, scenes} from './scenes';
import {projects} from './projects';
import type {SceneId} from './scenes';

describe('scene catalogue', () => {
  it('has seven unique scenes with unique indexes', () => {
    expect(scenes).toHaveLength(7);
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(7);
    expect(new Set(scenes.map((scene) => scene.index)).size).toBe(7);
  });

  it('starts with the rainy konbini world', () => {
    expect(konbiniScene.id).toBe('konbini');
    expect(konbiniScene.index).toBe('01');
  });

  it('exposes six collection scenes besides the hero world', () => {
    expect(mainScenes).toHaveLength(6);
    expect(mainScenes.some((scene) => scene.id === 'konbini')).toBe(false);
  });

  it('maps every project to an existing project scene', () => {
    for (const project of projects) {
      const scene = getScene(project.scene);
      expect(scene.projectId).toBe(project.id);
      expect(scene.kind).toBe('project');
    }
  });

  it('throws for unknown scene ids', () => {
    expect(() => getScene('unknown' as SceneId)).toThrow(/Unknown scene/);
  });
});
