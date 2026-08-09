import {Group, LoadingManager} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MODEL_URLS, emptyModelLibrary, type ModelLibrary} from './ModelLibrary';

export type AssetLoadOptions = {
  skip?: boolean;
  minimumDuration?: number;
};

export type ModelLoader = (url: string) => Promise<Group>;

const delay = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class AssetManager {
  private progress = 0;
  private readonly loadingManager = new LoadingManager();
  private readonly loadModel: ModelLoader;
  private disposed = false;

  public constructor(private readonly onProgress: (value: number) => void, loader?: ModelLoader) {
    if (loader) {
      this.loadModel = loader;
    } else {
      const gltf = new GLTFLoader(this.loadingManager);
      this.loadModel = async (url) => (await gltf.loadAsync(url)).scene;
    }
  }

  public async preload(options: AssetLoadOptions = {}): Promise<ModelLibrary> {
    this.setProgress(0);
    if (options.skip) {
      this.setProgress(1);
      return emptyModelLibrary();
    }
    const started = performance.now();
    const entries = Object.entries(MODEL_URLS) as Array<[keyof typeof MODEL_URLS, string]>;
    let completed = 0;
    const loadSafe = async (url: string): Promise<Group | null> => {
      try {
        return await this.loadModel(url);
      } catch (error) {
        console.warn(`Model asset unavailable: ${url}. Using procedural fallback.`, error);
        return null;
      } finally {
        completed += 1;
        this.setProgress(0.08 + completed / entries.length * 0.92);
      }
    };
    const [core, pmu, ekg, security] = await Promise.all(entries.map(([, url]) => loadSafe(url)));
    const remaining = Math.max(0, (options.minimumDuration ?? 0) - (performance.now() - started));
    if (remaining > 0) await delay(remaining);
    this.setProgress(1);
    return {core: core ?? null, projects: {pmu: pmu ?? null, ekg: ekg ?? null, security: security ?? null}};
  }

  private setProgress(value: number): void {
    if (this.disposed) return;
    this.progress = value;
    this.onProgress(value);
  }

  public getProgress(): number { return this.progress; }
  public dispose(): void { this.disposed = true; }
}
