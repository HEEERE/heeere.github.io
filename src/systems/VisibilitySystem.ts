export class VisibilitySystem {
  public constructor(onChange: (hidden: boolean) => void) {
    this.onChange = onChange;
    document.addEventListener('visibilitychange', this.handle);
  }

  private readonly onChange: (hidden: boolean) => void;
  private readonly handle = (): void => this.onChange(document.hidden);
  public dispose(): void { document.removeEventListener('visibilitychange', this.handle); }
}
