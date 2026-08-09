import {describe, expect, it} from 'vitest';
import {qualityProfileForLevel} from './QualityManager';

describe('qualityProfileForLevel', () => {
  it('removes expensive crystal effects on low quality', () => {
    const profile = qualityProfileForLevel('low', true, 3);
    expect(profile.modelDetail).toBe(0);
    expect(profile.transmission).toBe(false);
    expect(profile.ao).toBe(false);
    expect(profile.selectiveBloom).toBe(false);
    expect(profile.pixelRatio).toBe(1);
  });

  it('enables the complete model and post stack on high quality', () => {
    const profile = qualityProfileForLevel('high', false, 2);
    expect(profile.modelDetail).toBe(2);
    expect(profile.transmission).toBe(true);
    expect(profile.ao).toBe(true);
    expect(profile.curveSegments).toBe(12);
    expect(profile.pixelRatio).toBe(1.5);
  });
});
