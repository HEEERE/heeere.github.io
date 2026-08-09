import {BoxGeometry, Group, Mesh, MeshPhysicalMaterial} from 'three';
import {describe, expect, it, vi} from 'vitest';
import {qualityProfileForLevel} from '../core/QualityManager';
import {configureModelQuality, disposeObject} from './ModelUtils';

describe('model quality and disposal', () => {
  it('toggles detail tiers and restores physical crystal properties', () => {
    const root = new Group();
    const detail = new Group();
    const micro = new Group();
    detail.name = 'DETAIL';
    micro.name = 'MICRO';
    const material = new MeshPhysicalMaterial({transmission: 0.45, iridescence: 0.3});
    detail.add(new Mesh(new BoxGeometry(), material));
    root.add(detail, micro);
    configureModelQuality(root, qualityProfileForLevel('low', true, 2));
    expect(detail.visible).toBe(false);
    expect(micro.visible).toBe(false);
    expect(material.transmission).toBe(0);
    configureModelQuality(root, qualityProfileForLevel('high', false, 2));
    expect(detail.visible).toBe(true);
    expect(micro.visible).toBe(true);
    expect(material.transmission).toBeCloseTo(0.45);
    expect(material.iridescence).toBeCloseTo(0.3);
  });

  it('disposes shared geometry and material once', () => {
    const root = new Group();
    const geometry = new BoxGeometry();
    const material = new MeshPhysicalMaterial();
    root.add(new Mesh(geometry, material), new Mesh(geometry, material));
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    disposeObject(root);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });
});
