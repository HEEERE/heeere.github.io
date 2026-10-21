/**
 * PWA helpers shared by the public site and the private vault.
 *
 * The service worker is intentionally tiny: it only implements the Web Share
 * Target hand-off so content shared from a phone lands inside the vault.
 * It never caches the app shell, so updating the site is still a plain refresh.
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
};

export const registerVaultServiceWorker = (): void => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/vault-sw.js', {scope: '/vault/', updateViaCache: 'none'}).catch(() => {
      /* the vault remains fully usable without a service worker */
    });
  });
};

export const captureInstallPrompt = (): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
};

export const canInstall = (): boolean => Boolean(deferredPrompt);

export const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  deferredPrompt = null;
  await prompt.prompt();
  const result = await prompt.userChoice;
  return result.outcome;
};

export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & {standalone?: boolean}).standalone === true);
