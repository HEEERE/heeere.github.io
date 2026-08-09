/* global Buffer, process */
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

class NodeFileReader {
  result = null;
  onloadend = null;

  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
    });
  }
}

globalThis.FileReader = NodeFileReader;

const OUTPUT = resolve('public/models');
const COLORS = {
  core: '#86cbb9',
  pmu: '#9ad83f',
  ekg: '#45bdc7',
  security: '#d86359',
  defense: '#a8da5a',
};

const crystal = (color, opacity = 0.72) => {
  const material = new MeshPhysicalMaterial({
    name: `CRYSTAL_${color.replace('#', '')}`,
    color: new Color(color).multiplyScalar(0.58),
    emissive: new Color(color).multiplyScalar(0.018),
    emissiveIntensity: 0.5,
    roughness: 0.14,
    metalness: 0.02,
    clearcoat: 0.82,
    clearcoatRoughness: 0.12,
    transmission: 0.34,
    thickness: 0.72,
    ior: 1.42,
    iridescence: 0.08,
    transparent: true,
    opacity,
    side: DoubleSide,
  });
  material.userData.bloom = false;
  return material;
};

const membrane = (color, opacity = 0.13) => {
  const material = new MeshPhysicalMaterial({
    name: `MEMBRANE_${color.replace('#', '')}`,
    color: new Color(color).multiplyScalar(0.24),
    emissive: new Color(color).multiplyScalar(0.008),
    emissiveIntensity: 0.35,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.65,
    transmission: 0.2,
    thickness: 0.3,
    transparent: true,
    opacity,
    side: DoubleSide,
  });
  material.userData.bloom = false;
  return material;
};

const shell = (color = '#15201d') => {
  const material = new MeshStandardMaterial({
    name: 'SATIN_STRUCTURE',
    color,
    emissive: new Color(color).multiplyScalar(0.08),
    emissiveIntensity: 0.32,
    roughness: 0.3,
    metalness: 0.36,
    side: DoubleSide,
  });
  material.userData.bloom = false;
  return material;
};

const signal = (color, intensity = 0.72) => {
  const material = new MeshStandardMaterial({
    name: `SIGNAL_${color.replace('#', '')}`,
    color: new Color(color).multiplyScalar(0.66),
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.25,
    metalness: 0.05,
  });
  material.userData.bloom = true;
  return material;
};

const tieredRoot = (name) => {
  const root = new Group();
  root.name = name;
  const base = new Group();
  const detail = new Group();
  const micro = new Group();
  base.name = 'BASE';
  detail.name = 'DETAIL';
  micro.name = 'MICRO';
  root.add(base, detail, micro);
  return {root, base, detail, micro};
};

const tube = (points, radius, material, segments = 28) => new Mesh(
  new TubeGeometry(new CatmullRomCurve3(points, false, 'centripetal'), segments, radius, 6, false),
  material,
);

const addFineRings = (parent, prefix, radius, count, color) => {
  const geometry = new TorusGeometry(radius, 0.0035, 4, 68);
  const material = membrane(color, 0.1);
  for (let index = 0; index < count; index++) {
    const ring = new Mesh(geometry, material);
    ring.name = `${prefix}_${String(index).padStart(2, '0')}`;
    ring.rotation.set(0.28 + index * 0.52, 0.16 + index * 0.43, index * 0.31);
    ring.scale.setScalar(0.94 + index * 0.025);
    parent.add(ring);
  }
};

const buildCore = () => {
  const {root, base, detail, micro} = tieredRoot('AGENT_CORE_CRYSTAL');
  const inner = new Mesh(new SphereGeometry(0.62, 48, 32), crystal(COLORS.core, 0.74));
  inner.name = 'INNER_CRYSTAL';
  inner.scale.set(0.92, 1.08, 0.92);
  const innerSeed = new Mesh(new IcosahedronGeometry(0.22, 2), signal(COLORS.core, 0.42));
  innerSeed.name = 'MEMORY_SEED';
  const outerMembrane = new Mesh(new SphereGeometry(0.82, 48, 32), membrane(COLORS.core, 0.1));
  outerMembrane.name = 'LIVING_MEMBRANE';
  base.add(inner, innerSeed, outerMembrane);

  const petalGeometry = new SphereGeometry(1.08, 30, 16, -0.48, 0.96, 0.34, 2.46);
  const petalMaterials = [crystal('#52776e', 0.46), crystal('#3e5f57', 0.38)];
  for (let index = 0; index < 3; index++) {
    const petal = new Mesh(petalGeometry, petalMaterials[index % 2]);
    petal.name = `PETAL_${String(index).padStart(2, '0')}`;
    petal.rotation.set((index % 2 ? -1 : 1) * 0.16, index / 3 * Math.PI * 2, 0.1 + index * 0.05);
    petal.scale.set(0.94, 1.04, 0.94);
    detail.add(petal);
  }

  const gimbal = new Mesh(new TorusGeometry(1.28, 0.009, 5, 128), shell('#26332e'));
  gimbal.name = 'GIMBAL_0';
  gimbal.rotation.set(1.02, 0.24, 0.16);
  detail.add(gimbal);

  const ports = [
    ['PMU', COLORS.pmu, new Vector3(-1.08, -0.5, 0.16)],
    ['EKG', COLORS.ekg, new Vector3(0.04, 1.2, -0.08)],
    ['SECURITY', COLORS.security, new Vector3(1.1, -0.46, 0.12)],
  ];
  ports.forEach(([id, color, position], index) => {
    const point = position;
    const port = new Group();
    port.name = `PORT_${id}`;
    port.position.copy(point);
    const socket = new Mesh(new TorusGeometry(0.11, 0.016, 5, 28), shell('#1c2723'));
    socket.rotation.set(index === 1 ? 0 : Math.PI / 2, 0, index === 1 ? 0 : Math.atan2(point.y, point.x));
    const lens = new Mesh(new SphereGeometry(0.055, 16, 12), signal(color, 0.58));
    port.add(socket, lens);
    detail.add(port);
    const filament = tube([
      new Vector3(0, 0, 0),
      point.clone().multiplyScalar(0.48).add(new Vector3(0, index === 1 ? 0.08 : -0.04, 0.05)),
      point.clone(),
    ], 0.007, signal(color, 0.42), 24);
    filament.name = `FILAMENT_${id}`;
    detail.add(filament);
  });
  addFineRings(micro, 'VASCULAR_RING', 0.52, 2, COLORS.core);
  return root;
};

const buildPmu = () => {
  const {root, base, detail, micro} = tieredRoot('PMU_SEEDPOD');
  const seed = new Mesh(new SphereGeometry(0.48, 40, 28), crystal(COLORS.pmu, 0.76));
  seed.name = 'MEMORY_EMBRYO';
  seed.scale.set(0.78, 1.25, 0.78);
  const seedCore = new Mesh(new IcosahedronGeometry(0.2, 2), signal(COLORS.pmu, 0.3));
  seedCore.name = 'ACTIVE_MEMORY';
  seedCore.position.y = -0.04;
  const membraneShell = new Mesh(new SphereGeometry(0.61, 36, 24), membrane(COLORS.pmu, 0.1));
  membraneShell.name = 'SEED_MEMBRANE';
  membraneShell.scale.set(0.82, 1.23, 0.82);
  base.add(seed, seedCore, membraneShell);

  const petalGeometry = new SphereGeometry(0.82, 28, 15, -0.42, 0.84, 0.38, 2.34);
  const petalMaterials = [crystal('#789452', 0.48), crystal('#4f673f', 0.42)];
  for (let index = 0; index < 3; index++) {
    const petal = new Mesh(petalGeometry, petalMaterials[index % 2]);
    petal.name = `PETAL_${String(index).padStart(2, '0')}`;
    petal.rotation.set(index === 1 ? -0.08 : 0.08, index / 3 * Math.PI * 2, 0.05);
    petal.scale.set(0.88, 1.18, 0.88);
    base.add(petal);
  }

  const stems = [
    [new Vector3(0, 0.58, 0), new Vector3(0.08, 0.9, 0.02), new Vector3(0.32, 1.12, 0)],
    [new Vector3(0.04, 0.78, 0), new Vector3(-0.17, 1.02, 0.02), new Vector3(-0.43, 1.18, 0.03)],
    [new Vector3(0.15, 0.9, 0), new Vector3(0.36, 1.13, -0.03), new Vector3(0.55, 1.34, 0.01)],
  ];
  stems.forEach((points, index) => {
    const stem = tube(points, 0.009, index === 0 ? signal(COLORS.pmu, 0.42) : shell('#293923'), 24);
    stem.name = `SKILL_STEM_${index}`;
    detail.add(stem);
    const bud = new Mesh(new SphereGeometry(0.065 + index * 0.008, 16, 12), crystal(COLORS.pmu, 0.7));
    bud.name = `SKILL_BUD_${index}`;
    bud.position.copy(points.at(-1));
    detail.add(bud);
  });
  addFineRings(micro, 'GERMINATION_VEIN', 0.42, 2, COLORS.pmu);
  return root;
};

const buildEkg = () => {
  const {root, base, detail} = tieredRoot('EKG_DATA_PRISM');
  const prism = new Mesh(new OctahedronGeometry(0.58, 2), crystal(COLORS.ekg, 0.7));
  prism.name = 'PARSER_PRISM';
  prism.scale.set(1.38, 0.82, 0.82);
  const core = new Mesh(new OctahedronGeometry(0.19, 2), signal(COLORS.ekg, 0.52));
  core.name = 'ENTITY_CORE';
  const lens = new Mesh(new OctahedronGeometry(0.68, 2), membrane(COLORS.ekg, 0.08));
  lens.name = 'PARSER_MEMBRANE';
  lens.scale.set(1.36, 0.82, 0.82);
  base.add(prism, core, lens);

  const docGeometry = new BoxGeometry(0.032, 0.68, 0.44, 1, 3, 2);
  for (let index = 0; index < 3; index++) {
    const doc = new Mesh(docGeometry, crystal(index === 1 ? '#a3ced0' : COLORS.ekg, 0.36));
    doc.name = `DOCUMENT_${String(index).padStart(2, '0')}`;
    doc.position.set(-0.78 - index * 0.16, (index - 1) * 0.19, (index - 1) * 0.11);
    doc.rotation.set(0.03 * index, 0.08 * index, -0.05 + index * 0.05);
    base.add(doc);
  }

  const entities = [
    new Vector3(0.76, 0.42, 0),
    new Vector3(1.08, 0.05, -0.04),
    new Vector3(0.78, -0.42, 0.04),
    new Vector3(1.38, 0.36, 0),
    new Vector3(1.38, -0.34, 0),
  ];
  entities.forEach((position, index) => {
    const entity = new Mesh(new SphereGeometry(index === 1 ? 0.09 : 0.06, 16, 12), crystal(index === 1 ? '#b9e2e2' : COLORS.ekg, 0.72));
    entity.name = `ENTITY_${String(index).padStart(2, '0')}`;
    entity.position.copy(position);
    detail.add(entity);
    if (index > 0) {
      const parent = entities[index < 3 ? 1 : index - 3];
      const relation = tube([parent, parent.clone().lerp(position, 0.5), position], 0.005, shell('#294044'), 16);
      relation.name = `RELATION_${String(index).padStart(2, '0')}`;
      detail.add(relation);
    }
  });
  const scan = new Mesh(new TorusGeometry(0.68, 0.006, 5, 112, Math.PI * 1.6), signal(COLORS.ekg, 0.35));
  scan.name = 'SEMANTIC_SCAN_RING_00';
  scan.rotation.set(Math.PI / 2, 0.12, Math.PI / 2);
  detail.add(scan);
  return root;
};

const buildSecurity = () => {
  const {root, base, detail, micro} = tieredRoot('SECURITY_IMMUNE_BODY');
  const cell = new Mesh(new SphereGeometry(0.5, 42, 28), crystal(COLORS.security, 0.68));
  cell.name = 'IMMUNE_CELL';
  cell.scale.set(1.04, 0.96, 1.04);
  const nucleus = new Mesh(new IcosahedronGeometry(0.18, 2), signal(COLORS.security, 0.52));
  nucleus.name = 'TRACE_NUCLEUS';
  const membraneBody = new Mesh(new SphereGeometry(0.68, 40, 26), membrane(COLORS.security, 0.09));
  membraneBody.name = 'CONTAINMENT_MEMBRANE';
  base.add(cell, nucleus, membraneBody);

  const shieldGeometry = new SphereGeometry(0.88, 28, 14, -0.38, 0.76, 0.48, 2.18);
  for (let index = 0; index < 6; index++) {
    const plate = new Mesh(shieldGeometry, index % 3 === 0 ? crystal('#9d5c58', 0.42) : crystal('#5b3e3c', 0.4));
    plate.name = `SHIELD_${String(index).padStart(2, '0')}`;
    plate.rotation.set((index % 2 ? -1 : 1) * 0.12, index / 6 * Math.PI * 2, 0.04);
    plate.scale.set(0.96, 0.93, 0.96);
    base.add(plate);
  }

  [0.56, 0.73, 0.9].forEach((radius, index) => {
    const ring = new Mesh(new TorusGeometry(radius, 0.006 + index * 0.001, 5, 96, Math.PI * 1.65), index === 2 ? signal(COLORS.defense, 0.34) : shell('#3a2928'));
    ring.name = `DETECTION_L${index + 1}`;
    ring.rotation.set(Math.PI / 2, 0.12 + index * 0.18, -0.32 + index * 0.28);
    detail.add(ring);
  });
  addFineRings(micro, 'IMMUNE_LATTICE', 0.96, 3, COLORS.security);
  return root;
};

const writeModel = async (name, root) => {
  const exporter = new GLTFExporter();
  const data = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: false,
    truncateDrawRange: true,
    maxTextureSize: 1024,
  });
  const bytes = Buffer.from(data);
  await writeFile(resolve(OUTPUT, name), bytes);
  return bytes.byteLength;
};

await mkdir(OUTPUT, {recursive: true});
const assets = [
  ['agent-core.glb', buildCore()],
  ['pmu-seedpod.glb', buildPmu()],
  ['ekg-prism.glb', buildEkg()],
  ['security-immune.glb', buildSecurity()],
];
let total = 0;
for (const [name, root] of assets) {
  const size = await writeModel(name, root);
  total += size;
  process.stdout.write(`${name}: ${(size / 1024).toFixed(1)} KiB\n`);
}
process.stdout.write(`total: ${(total / 1024).toFixed(1)} KiB\n`);
