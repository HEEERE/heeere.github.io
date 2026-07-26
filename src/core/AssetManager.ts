export class AssetManager {
  private progress = 0;
  private frame = 0;

  public constructor(private readonly onProgress: (value: number) => void) {}

  public async preload(instant = false): Promise<void> {
    if (instant) {
      this.progress = 1;
      this.onProgress(1);
      return;
    }
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const duration = 1100;
      const tick = (): void => {
        const t = Math.min((performance.now() - start) / duration, 1);
        this.progress = 1 - Math.pow(1 - t, 3);
        this.onProgress(this.progress);
        if (t >= 1) {
          resolve();
          return;
        }
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    });
  }

  public getProgress(): number { return this.progress; }

  public dispose(): void { cancelAnimationFrame(this.frame); }
}
