import {afterEach, describe, expect, it, vi} from 'vitest';
import {readSound, soundDefaults, writeLocal} from './preferences';

afterEach(() => vi.unstubAllGlobals());
describe('sound preferences on real-world storage', () => {
  it('stays silent when preferences are corrupt', () => {
    vi.stubGlobal('localStorage', {getItem: () => '{broken'});
    expect(readSound()).toEqual(soundDefaults);
  });
  it('validates saved choices instead of coercing strings into enabled audio', () => {
    vi.stubGlobal('localStorage', {getItem: () => JSON.stringify({enabled: 'true', ambience: false, music: true, volume: 3})});
    expect(readSound()).toEqual({enabled: false, ambience: false, music: true, volume: 1});
  });
  it('works when the browser denies storage access', () => {
    vi.stubGlobal('localStorage', {getItem: () => { throw new Error('Denied'); }, setItem: () => { throw new Error('Denied'); }});
    expect(readSound()).toEqual(soundDefaults);
    expect(() => writeLocal('hakoniwa.arrived', '1')).not.toThrow();
  });
});
