import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  type BufferGeometry,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Vec3 = readonly [number, number, number];

const cache = new Map<string, BufferGeometry>();

const memo = (key: string, create: () => BufferGeometry): BufferGeometry => {
  const existing = cache.get(key);
  if (existing) return existing;
  const geometry = create();
  cache.set(key, geometry);
  return geometry;
};

export const boxGeometry = (size: Vec3): BufferGeometry =>
  memo(`box:${size.join(',')}`, () => new BoxGeometry(size[0], size[1], size[2]));

export const roundedBoxGeometry = (size: Vec3, radius = 0.02, segments = 3): BufferGeometry =>
  memo(`rbox:${size.join(',')}:${radius}:${segments}`, () => new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius));

export const cylinderGeometry = (radiusTop: number, radiusBottom: number, height: number, segments = 16): BufferGeometry =>
  memo(`cyl:${radiusTop}:${radiusBottom}:${height}:${segments}`, () => new CylinderGeometry(radiusTop, radiusBottom, height, segments));

export const sphereGeometry = (radius: number, widthSegments = 18, heightSegments = 14): BufferGeometry =>
  memo(`sphere:${radius}:${widthSegments}:${heightSegments}`, () => new SphereGeometry(radius, widthSegments, heightSegments));

export const planeGeometry = (width: number, height: number): BufferGeometry =>
  memo(`plane:${width}:${height}`, () => new PlaneGeometry(width, height));

export const ringGeometry = (inner: number, outer: number, segments = 32): BufferGeometry =>
  memo(`ring:${inner}:${outer}:${segments}`, () => new RingGeometry(inner, outer, segments));

export const torusGeometry = (radius: number, tube: number, radialSegments = 8, tubularSegments = 24): BufferGeometry =>
  memo(`torus:${radius}:${tube}:${radialSegments}:${tubularSegments}`, () => new TorusGeometry(radius, tube, radialSegments, tubularSegments));

export const coneGeometry = (radius: number, height: number, segments = 16, openEnded = false): BufferGeometry =>
  memo(`cone:${radius}:${height}:${segments}:${openEnded}`, () => new ConeGeometry(radius, height, segments, 1, openEnded));
