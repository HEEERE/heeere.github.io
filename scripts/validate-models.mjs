/* global process */
import {readFile, stat} from 'node:fs/promises';
import {resolve} from 'node:path';

const requirements = {
  'agent-core.glb': ['AGENT_CORE_CRYSTAL', 'BASE', 'DETAIL', 'MICRO', 'INNER_CRYSTAL', 'PORT_PMU', 'PORT_EKG', 'PORT_SECURITY'],
  'pmu-seedpod.glb': ['PMU_SEEDPOD', 'BASE', 'DETAIL', 'MICRO', 'MEMORY_EMBRYO', 'PETAL_00'],
  'ekg-prism.glb': ['EKG_DATA_PRISM', 'BASE', 'DETAIL', 'MICRO', 'PARSER_PRISM', 'DOCUMENT_00'],
  'security-immune.glb': ['SECURITY_IMMUNE_BODY', 'BASE', 'DETAIL', 'MICRO', 'IMMUNE_CELL', 'SHIELD_00'],
};

let total = 0;
let totalTriangles = 0;
for (const [file, expectedNames] of Object.entries(requirements)) {
  const path = resolve('public/models', file);
  const bytes = await readFile(path);
  const info = await stat(path);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${file}: invalid GLB header`);
  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.toString('ascii', 16, 20);
  if (jsonType !== 'JSON') throw new Error(`${file}: missing JSON chunk`);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trim());
  const nodeNames = new Set((json.nodes ?? []).map((node) => node.name));
  expectedNames.forEach((name) => {
    if (!nodeNames.has(name)) throw new Error(`${file}: missing node ${name}`);
  });
  const meshTriangles = (json.meshes ?? []).map((mesh) => (mesh.primitives ?? []).reduce((sum, primitive) => {
    const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
    const count = json.accessors?.[accessorIndex]?.count ?? 0;
    return sum + Math.floor(count / 3);
  }, 0));
  const triangles = (json.nodes ?? []).reduce((sum, node) => sum + (node.mesh === undefined ? 0 : meshTriangles[node.mesh] ?? 0), 0);
  totalTriangles += triangles;
  total += info.size;
  process.stdout.write(`${file}: ${json.nodes?.length ?? 0} nodes, ${triangles.toLocaleString()} triangles, ${(info.size / 1024).toFixed(1)} KiB\n`);
}
if (total > 1.2 * 1024 * 1024) throw new Error(`model budget exceeded: ${total} bytes`);
if (totalTriangles < 35_000 || totalTriangles > 45_000) throw new Error(`triangle budget missed: ${totalTriangles}`);
process.stdout.write(`validated ${totalTriangles.toLocaleString()} triangles, ${(total / 1024).toFixed(1)} KiB total\n`);
