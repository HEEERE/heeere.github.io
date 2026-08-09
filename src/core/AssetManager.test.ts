import {Group} from 'three';
import {describe, expect, it, vi} from 'vitest';
import {AssetManager} from './AssetManager';

describe('AssetManager', () => {
  it('loads available models and keeps a null fallback for a failed asset', async () => {
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const progress: number[] = [];
    const manager = new AssetManager(
      (value) => progress.push(value),
      async (url) => {
        if (url.includes('security')) throw new Error('offline');
        const group = new Group();
        group.name = url;
        return group;
      },
    );
    const library = await manager.preload();
    expect(library.core?.name).toContain('agent-core');
    expect(library.projects.pmu?.name).toContain('pmu-seedpod');
    expect(library.projects.security).toBeNull();
    expect(progress.at(-1)).toBe(1);
    warnings.mockRestore();
  });

  it('skips model requests in simple mode', async () => {
    const loader = vi.fn(async () => new Group());
    const manager = new AssetManager(() => undefined, loader);
    const library = await manager.preload({skip: true});
    expect(loader).not.toHaveBeenCalled();
    expect(library.core).toBeNull();
  });
});
