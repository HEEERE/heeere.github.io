export class SimpleMode {
  private readonly root = document.documentElement;

  public enter(updateHash = true): void {
    this.root.dataset.mode = 'simple';
    if (updateHash && !window.location.hash.includes('simple')) {
      window.history.pushState({}, '', '#/simple');
    }
    document.querySelector<HTMLElement>('#accessible-content')?.focus({preventScroll: true});
  }

  public exit(): void {
    this.root.dataset.mode = 'cinematic';
    window.history.pushState({}, '', '#/hub');
  }

  public bind(): void {
    document.querySelectorAll<HTMLElement>('[data-simple-mode]').forEach((button) => {
      button.addEventListener('click', () => this.enter());
    });
    document.querySelectorAll<HTMLElement>('[data-cinematic-mode]').forEach((button) => {
      button.addEventListener('click', () => this.exit());
    });
  }
}
