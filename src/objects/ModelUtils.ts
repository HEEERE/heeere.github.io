import {Group, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Object3D} from 'three';
import type {QualityProfile} from '../core/QualityManager';

export const configureModelQuality = (root: Object3D, profile: QualityProfile): void => {
  const detail = root.getObjectByName('DETAIL');
  const micro = root.getObjectByName('MICRO');
  if (detail) detail.visible = profile.modelDetail >= 1;
  if (micro) micro.visible = profile.modelDetail >= 2;
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!(material instanceof MeshStandardMaterial)) return;
      if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
      if (material.userData.baseTransmission === undefined && material instanceof MeshPhysicalMaterial) material.userData.baseTransmission = material.transmission;
      if (material.userData.baseIridescence === undefined && material instanceof MeshPhysicalMaterial) material.userData.baseIridescence = material.iridescence;
      material.envMapIntensity = profile.level === 'high' ? 1.15 : profile.level === 'medium' ? 0.82 : 0.35;
      if (material instanceof MeshPhysicalMaterial) {
        material.transmission = profile.transmission ? material.userData.baseTransmission as number : 0;
        material.iridescence = profile.transmission ? material.userData.baseIridescence as number : 0;
      }
      material.needsUpdate = true;
    });
  });
};

export const setModelPresence = (root: Object3D, presence: number): void => {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const baseOpacity = material.userData.baseOpacity as number | undefined;
      if (baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
      material.transparent = true;
      material.opacity = (baseOpacity ?? material.opacity) * presence;
      material.depthWrite = presence > 0.96 && material.opacity > 0.78;
    });
  });
};

export const cloneModelMaterials = (root: Group): Group => {
  const clone = root.clone(true);
  clone.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
  });
  return clone;
};

export const disposeObject = (root: Object3D): void => {
  const geometries = new Set<{dispose(): void}>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
};
