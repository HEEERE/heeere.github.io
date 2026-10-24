export type SoundPreferences = {enabled: boolean; ambience: boolean; music: boolean; volume: number};
export const soundDefaults: SoundPreferences = {enabled: false, ambience: true, music: false, volume: 0.3};
export const readLocal = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export const writeLocal = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* Private browsing may deny storage. */ }
};
export const readSound = (): SoundPreferences => {
  try {
    const value: unknown = JSON.parse(readLocal('hakoniwa.sound.v1') ?? 'null');
    if (!value || typeof value !== 'object') return {...soundDefaults};
    const data = value as Record<string, unknown>;
    return {
      enabled: data.enabled === true,
      ambience: typeof data.ambience === 'boolean' ? data.ambience : true,
      music: data.music === true,
      volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.max(0, Math.min(1, data.volume)) : 0.3,
    };
  } catch { return {...soundDefaults}; }
};
