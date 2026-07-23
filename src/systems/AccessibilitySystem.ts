export class AccessibilitySystem {
  public readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  public announce(message: string): void {
    const target = document.querySelector<HTMLElement>('#interaction-prompt');
    if (target) target.textContent = message;
  }
}
