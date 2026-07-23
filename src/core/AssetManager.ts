export class AssetManager {
  private progress = 0;

  public constructor(private readonly onProgress: (value: number) => void) {}

  public async preload(): Promise<void> {
    this.progress = 1;
    this.onProgress(1);
  }

  public getProgress(): number { return this.progress; }

  public dispose(): void {}
}
