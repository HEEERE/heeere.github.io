/* global Buffer, process */
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TetrahedronGeometry,
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
  core: '#9df7ce',
  pmu: '#b8ff3d',
  ekg: '#44d9e6',
  security: '#ff6f61',
  defense: '#b8ff3d',
};

const crystal = (color, opacity = 0.86) => new MeshPhysicalMaterial({
  name: `CRYSTAL_${color.replace('#', '')}`,
  color,
  emissive: new Color(color).multiplyScalar(0.08),
  emissiveIntensity: 0.75,
  roughness: 0.16,
  metalness: 0.04,
  transmission: 0.48,
  thickness: 1.15,
  ior: 1.46,
  iridescence: 0.32,
  iridescenceIOR: 1.28,
  transparent: true,
  opacity,
});

const membrane = (color, opacity = 0.28) => new MeshPhysicalMaterial({
  name: `MEMBRANE_${color.replace('#', '')}`,
  color: new Color(color).multiplyScalar(0.42),
  emissive: new Color(color).multiplyScalar(0.055),
  emissiveIntensity: 0.7,
  roughness: 0.38,
  metalness: 0.08,
  transmission: 0.28,
  thickness: 0.45,
  transparent: true,
  opacity,
  side: 2,
});

const cartilage = (color = '#10201c') => new MeshStandardMaterial({
  name: 'DARK_CARTILAGE',
  color,
  emissive: '#07100e',
  emissiveIntensity: 0.65,
  roughness: 0.36,
  metalness: 0.46,
});

const signal = (color) => {
  const material = new MeshStandardMaterial({
    name: `SIGNAL_${color.replace('#', '')}`,
    color: new Color(color).multiplyScalar(0.58),
    emissive: color,
    emissiveIntensity: 1.35,
    roughness: 0.2,
    metalness: 0.08,
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

const radialShard = (material, index, count, radius, length, width, z = 0) => {
  const angle = index / count * Math.PI * 2;
  const shard = new Mesh(new ConeGeometry(width, length, 5, 2), material);
  shard.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z + Math.sin(angle * 2) * 0.08);
  shard.rotation.set(Math.sin(angle) * 0.18, Math.cos(angle) * 0.14, angle - Math.PI / 2);
  return shard;
};

const tube = (points, radius, material, segments = 28) => new Mesh(
  new TubeGeometry(new CatmullRomCurve3(points), segments, radius, 7, false),
  material,
);

const buildCore = () => {
  const {root, base, detail, micro} = tieredRoot('AGENT_CORE_CRYSTAL');
  const inner = new Mesh(new IcosahedronGeometry(0.78, 4), crystal(COLORS.core, 0.9));
  inner.name = 'INNER_CRYSTAL';
  const innerSeed = new Mesh(new OctahedronGeometry(0.48, 3), signal(COLORS.pmu));
  innerSeed.name = 'MEMORY_SEED';
  const outerMembrane = new Mesh(new SphereGeometry(0.98, 48, 32), membrane(COLORS.core, 0.2));
  outerMembrane.name = 'LIVING_MEMBRANE';
  base.add(inner, innerSeed, outerMembrane);

  for (let index = 0; index < 10; index++) {
    const shard = radialShard(crystal(index % 3 === 0 ? COLORS.pmu : COLORS.core, 0.72), index, 10, 1.16, 0.72, 0.2, (index % 2 - 0.5) * 0.22);
    shard.name = `PETAL_${String(index).padStart(2, '0')}`;
    shard.userData.baseAngle = index / 10 * Math.PI * 2;
    base.add(shard);
  }

  const ringSpecs = [[1.36, 0.035, 0.18], [1.62, 0.025, -0.68], [1.87, 0.018, 0.92]];
  ringSpecs.forEach(([radius, width, tilt], index) => {
    const ring = new Mesh(new TorusGeometry(radius, width, 7, 96), index === 0 ? signal(COLORS.core) : cartilage());
    ring.name = `GIMBAL_${index}`;
    ring.rotation.set(tilt, 0.34 + index * 0.48, index * 0.26);
    detail.add(ring);
  });

  const ports = [
    ['PMU', COLORS.pmu, new Vector3(-1.45, -0.48, 0.08)],
    ['EKG', COLORS.ekg, new Vector3(0.02, 1.62, -0.14)],
    ['SECURITY', COLORS.security, new Vector3(1.55, -0.42, 0.04)],
  ];
  ports.forEach(([id, color, position], index) => {
    const point = position;
    const port = new Group();
    port.name = `PORT_${id}`;
    port.position.copy(point);
    const socket = new Mesh(new TorusGeometry(0.16, 0.035, 7, 32), cartilage());
    socket.rotation.set(index === 1 ? 0 : Math.PI / 2, 0, index === 1 ? 0 : Math.atan2(point.y, point.x));
    const lens = new Mesh(new IcosahedronGeometry(0.1, 2), signal(color));
    port.add(socket, lens);
    detail.add(port);
    const filament = tube([
      new Vector3(0, 0, 0),
      point.clone().multiplyScalar(0.34).add(new Vector3(0, index === 1 ? 0.18 : -0.1, 0.18)),
      point.clone().multiplyScalar(0.72),
      point.clone(),
    ], 0.014, signal(color), 34);
    filament.name = `FILAMENT_${id}`;
    detail.add(filament);
  });

  for (let index = 0; index < 30; index++) {
    const angle = index / 30 * Math.PI * 2;
    const bud = new Mesh(new TetrahedronGeometry(index % 5 === 0 ? 0.055 : 0.032, 0), signal(index % 3 === 0 ? COLORS.ekg : COLORS.core));
    bud.name = `SYNAPSE_${String(index).padStart(2, '0')}`;
    bud.position.set(Math.cos(angle) * (1.38 + index % 3 * 0.16), Math.sin(angle) * (1.04 + index % 4 * 0.11), Math.sin(angle * 3) * 0.34);
    micro.add(bud);
  }
  const vascularGeometry = new TorusGeometry(2.02, 0.006, 5, 120);
  const vascularMaterial = membrane(COLORS.core, 0.16);
  for (let index = 0; index < 4; index++) {
    const vascularRing = new Mesh(vascularGeometry, vascularMaterial);
    vascularRing.name = `VASCULAR_RING_${String(index).padStart(2, '0')}`;
    vascularRing.rotation.set(index * 0.42, 0.28 + index * 0.47, index * 0.31);
    vascularRing.scale.setScalar(0.92 + index * 0.035);
    micro.add(vascularRing);
  }
  return root;
};

const buildPmu = () => {
  const {root, base, detail, micro} = tieredRoot('PMU_SEEDPOD');
  const seed = new Mesh(new IcosahedronGeometry(0.54, 3), crystal(COLORS.pmu, 0.88));
  seed.name = 'MEMORY_EMBRYO';
  seed.scale.set(0.82, 1.22, 0.82);
  const membraneShell = new Mesh(new SphereGeometry(0.68, 32, 22), membrane(COLORS.pmu, 0.2));
  membraneShell.name = 'SEED_MEMBRANE';
  membraneShell.scale.set(0.9, 1.25, 0.9);
  base.add(seed, membraneShell);
  for (let index = 0; index < 6; index++) {
    const petal = radialShard(index % 2 ? cartilage('#162415') : crystal(COLORS.pmu, 0.68), index, 6, 0.72, 0.76, 0.2);
    petal.name = `PETAL_${String(index).padStart(2, '0')}`;
    petal.scale.y = 1.35;
    base.add(petal);
  }
  const roots = [
    [new Vector3(0, 0.3, 0), new Vector3(0.45, 0.82, 0.12), new Vector3(0.82, 1.28, 0)],
    [new Vector3(0, 0.42, 0), new Vector3(-0.42, 0.9, -0.08), new Vector3(-0.74, 1.36, 0.08)],
    [new Vector3(0, -0.2, 0), new Vector3(0.1, -0.86, 0.18), new Vector3(-0.3, -1.3, 0)],
  ];
  roots.forEach((points, index) => {
    const stem = tube(points, 0.022, signal(COLORS.pmu), 24);
    stem.name = `SKILL_STEM_${index}`;
    detail.add(stem);
    const bud = new Mesh(new IcosahedronGeometry(0.12, 1), crystal(COLORS.pmu));
    bud.name = `SKILL_BUD_${index}`;
    bud.position.copy(points.at(-1));
    detail.add(bud);
  });
  for (let index = 0; index < 16; index++) {
    const angle = index / 16 * Math.PI * 2;
    const bud = new Mesh(new TetrahedronGeometry(0.04 + index % 3 * 0.012), signal(COLORS.pmu));
    bud.name = `MEMORY_SPORE_${String(index).padStart(2, '0')}`;
    bud.position.set(Math.cos(angle) * (0.92 + index % 2 * 0.16), Math.sin(angle) * 0.82, Math.sin(angle * 3) * 0.28);
    micro.add(bud);
  }
  const germinationGeometry = new TorusGeometry(0.86, 0.006, 5, 120);
  const germinationMaterial = membrane(COLORS.pmu, 0.15);
  for (let index = 0; index < 3; index++) {
    const vein = new Mesh(germinationGeometry, germinationMaterial);
    vein.name = `GERMINATION_VEIN_${String(index).padStart(2, '0')}`;
    vein.rotation.set(0.36 + index * 0.55, index * 0.44, index * 0.72);
    vein.scale.set(1, 1.08 + index * 0.05, 0.92);
    micro.add(vein);
  }
  return root;
};

const buildEkg = () => {
  const {root, base, detail, micro} = tieredRoot('EKG_DATA_PRISM');
  const prism = new Mesh(new CylinderGeometry(0.58, 0.72, 1.35, 6, 3), crystal(COLORS.ekg, 0.82));
  prism.name = 'PARSER_PRISM';
  prism.rotation.z = Math.PI / 2;
  const core = new Mesh(new OctahedronGeometry(0.36, 2), signal(COLORS.ekg));
  core.name = 'ENTITY_CORE';
  base.add(prism, core);
  for (let index = 0; index < 4; index++) {
    const doc = new Mesh(new BoxGeometry(0.055, 0.74, 0.48), index % 2 ? membrane(COLORS.ekg, 0.42) : crystal(COLORS.ekg, 0.58));
    doc.name = `DOCUMENT_${String(index).padStart(2, '0')}`;
    doc.position.set(-0.92 - index * 0.14, (index - 1.5) * 0.2, (index % 2 - 0.5) * 0.26);
    doc.rotation.set(0.05 * index, 0.12 * index, -0.08 + index * 0.045);
    base.add(doc);
  }
  const entities = [
    new Vector3(0.84, 0.58, 0.06), new Vector3(1.2, 0.05, -0.12), new Vector3(0.78, -0.62, 0.08),
    new Vector3(1.52, 0.52, 0.02), new Vector3(1.55, -0.46, -0.06), new Vector3(1.08, -0.98, 0.1),
  ];
  entities.forEach((position, index) => {
    const entity = new Mesh(new OctahedronGeometry(index % 3 === 0 ? 0.13 : 0.085, 1), crystal(index % 2 ? '#d8ffff' : COLORS.ekg));
    entity.name = `ENTITY_${String(index).padStart(2, '0')}`;
    entity.position.copy(position);
    detail.add(entity);
    if (index > 0) {
      const parent = entities[Math.floor((index - 1) / 2)] ?? entities[0];
      const edge = tube([parent, parent.clone().lerp(position, 0.5).add(new Vector3(0, 0.08, 0.08)), position], 0.012, signal(COLORS.ekg), 18);
      edge.name = `RELATION_${String(index).padStart(2, '0')}`;
      detail.add(edge);
    }
  });
  for (let index = 0; index < 18; index++) {
    const fragment = new Mesh(new BoxGeometry(0.035, 0.07 + index % 4 * 0.02, 0.025), signal(index % 4 === 0 ? '#ffffff' : COLORS.ekg));
    fragment.name = `TOKEN_${String(index).padStart(2, '0')}`;
    fragment.position.set(-0.55 + index % 6 * 0.2, 0.92 - Math.floor(index / 6) * 0.18, Math.sin(index) * 0.22);
    micro.add(fragment);
  }
  const scanGeometry = new TorusGeometry(0.82, 0.006, 5, 120);
  const scanMaterial = membrane(COLORS.ekg, 0.16);
  for (let index = 0; index < 3; index++) {
    const scanRing = new Mesh(scanGeometry, scanMaterial);
    scanRing.name = `SEMANTIC_SCAN_RING_${String(index).padStart(2, '0')}`;
    scanRing.rotation.set(Math.PI / 2, index * 0.38, Math.PI / 2 + index * 0.24);
    scanRing.position.x = -0.12 + index * 0.12;
    scanRing.scale.set(0.92 + index * 0.08, 1, 1.08);
    micro.add(scanRing);
  }
  return root;
};

const buildSecurity = () => {
  const {root, base, detail, micro} = tieredRoot('SECURITY_IMMUNE_BODY');
  const cell = new Mesh(new DodecahedronGeometry(0.62, 2), crystal(COLORS.security, 0.72));
  cell.name = 'IMMUNE_CELL';
  const nucleus = new Mesh(new IcosahedronGeometry(0.34, 2), signal(COLORS.security));
  nucleus.name = 'TRACE_NUCLEUS';
  const membraneBody = new Mesh(new SphereGeometry(0.76, 36, 24), membrane(COLORS.security, 0.17));
  membraneBody.name = 'CONTAINMENT_MEMBRANE';
  base.add(cell, nucleus, membraneBody);
  for (let index = 0; index < 8; index++) {
    const angle = index / 8 * Math.PI * 2;
    const plate = new Mesh(new CylinderGeometry(0.25, 0.34, 0.13, 6, 1), index % 3 === 0 ? crystal(COLORS.security, 0.62) : cartilage('#241413'));
    plate.name = `SHIELD_${String(index).padStart(2, '0')}`;
    plate.position.set(Math.cos(angle) * 0.94, Math.sin(angle) * 0.94, Math.sin(angle * 2) * 0.15);
    plate.rotation.set(Math.PI / 2, angle, angle - Math.PI / 2);
    base.add(plate);
  }
  [0.98, 1.16, 1.34].forEach((radius, index) => {
    const ring = new Mesh(new TorusGeometry(radius, 0.022 + index * 0.004, 7, 80), signal(index === 2 ? COLORS.defense : COLORS.security));
    ring.name = `DETECTION_L${index + 1}`;
    ring.rotation.set(index * 0.58, index * 0.34, index * 0.24);
    detail.add(ring);
  });
  for (let index = 0; index < 10; index++) {
    const angle = index / 10 * Math.PI * 2;
    const receptor = new Mesh(new ConeGeometry(0.065, 0.32, 5), index < 7 ? signal(COLORS.security) : signal(COLORS.defense));
    receptor.name = `RECEPTOR_${String(index).padStart(2, '0')}`;
    receptor.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, Math.cos(angle * 3) * 0.2);
    receptor.rotation.z = angle - Math.PI / 2;
    micro.add(receptor);
  }
  const immuneLatticeGeometry = new TorusGeometry(1.44, 0.006, 5, 120);
  const immuneLatticeMaterial = membrane(COLORS.security, 0.14);
  for (let index = 0; index < 3; index++) {
    const lattice = new Mesh(immuneLatticeGeometry, immuneLatticeMaterial);
    lattice.name = `IMMUNE_LATTICE_${String(index).padStart(2, '0')}`;
    lattice.rotation.set(index * 0.62, 0.34 + index * 0.45, index * 0.26);
    lattice.scale.setScalar(0.92 + index * 0.055);
    micro.add(lattice);
  }
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
