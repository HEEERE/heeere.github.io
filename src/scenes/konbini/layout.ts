/**
 * Shared measurements for the rainy konbini corner. All values are in scene
 * units where the diorama is 4.6 x 4.6 and the storefront is roughly 2.7 long.
 */
export const KONBINI = {
  footprint: 4.6,
  sidewalkHeight: 0.05,
  building: {
    minX: -1.75,
    maxX: 0.5,
    minZ: -2.28,
    maxZ: -0.5,
    wallHeight: 1.42,
    wallThickness: 0.07,
    interiorFloor: 0.06,
    ceiling: 1.06,
  },
  storefront: {
    glassMinX: -1.6,
    glassMaxX: 0.42,
    glassMinY: 0.26,
    glassMaxY: 1.04,
    doorMinX: -0.3,
    doorMaxX: 0.3,
    doorMinY: 0.06,
    doorMaxY: 1.0,
    signMinY: 1.08,
    signMaxY: 1.34,
    facadeZ: -0.5,
    glassZ: -0.47,
  },
  sidewalk: {
    minZ: -0.52,
    maxZ: 0.36,
    roadZ: 0.36,
  },
  neighbor: {
    minX: 1.14,
    maxX: 2.28,
    minZ: -2.3,
    maxZ: -0.52,
    height: 1.98,
  },
  alley: {
    minX: 0.56,
    maxX: 1.08,
    minZ: -2.3,
    maxZ: -0.52,
  },
  lamp: [0.86, 0.24] as const,
  pole: [-2.12, 0.08] as const,
  crossing: {minX: -0.98, maxX: 0.46, minZ: 0.6, maxZ: 1.92},
} as const;
