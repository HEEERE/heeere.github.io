import {surface} from '../../three/surfaces';
import {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CatmullRomCurve3, Vector3, type Group, type Mesh, type MeshToonMaterial, type PointLight} from 'three';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {Box, Cable, Cone, ContactShadow, Cyl, Glow, Panel, Pipe, RBox, Torus, type Vec3} from '../../three/kit/primitives';
import {RoomLights} from '../../three/kit/lighting';
import {flat, glass, toon} from '../../three/materials';
import {canvasTexture, FONT_MONO, FONT_SANS, grain, rng, rr, text, verticalGradient, withAlpha} from '../../three/canvas';
import {sphereGeometry} from '../../three/geometry';
import {
  agentPodTexture,
  agentScreenTexture,
  deskMatTexture,
  detectionScreenTexture,
  glassSheenTexture,
  hazardStripeTexture,
  keyboardTexture,
  labelTagTexture,
  ledStripTexture,
  lightPoolTexture,
  paperSheetTexture,
  serverRackTexture,
  warningBoardTexture,
  zoneSignTexture,
} from '../../three/textures';
import {getScene} from '../../data/scenes';
import {useQuality} from '../../three/quality';

type SceneDemo = {step: number; variant: number};

/* ------------------------------------------------------------------ */
/* Room metrics                                                        */
/* ------------------------------------------------------------------ */

const FLOOR_Y = 0.06;
const WALL_T = 0.09;
const WALL_H = 1.69;
const WALL_TOP = FLOOR_Y + WALL_H;
const BACK_Z = -1.72;
const SIDE_X = 1.72;
const BACK_FACE = BACK_Z + WALL_T / 2;
const SIDE_FACE = SIDE_X - WALL_T / 2;
const DESK_TOP = 0.75;
const DESK_Z = -1.31;

const CELL = {x0: 0.42, x1: 1.54, z0: -1.58, z1: -0.54};
const CELL_CX = (CELL.x0 + CELL.x1) / 2;
const CELL_CZ = (CELL.z0 + CELL.z1) / 2;
const CELL_BASE_TOP = FLOOR_Y + 0.1;
const CELL_ROOF_TOP = 1.12;
const GATE_X0 = 0.7;
const GATE_X1 = 1.26;
const GATE_CX = (GATE_X0 + GATE_X1) / 2;
const GATE_Z = CELL.z1 + 0.04;

const POD_SEEDS = [2, 3, 4] as const;

/* ------------------------------------------------------------------ */
/* Local canvas textures — lab paintwork                               */
/* ------------------------------------------------------------------ */

const labFloorTexture = () =>
  canvasTexture('security/floor', 1024, 1024, (ctx, width, height) => {
    const px = (x: number) => ((x + 1.78) / 3.56) * width;
    const py = (z: number) => ((z + 1.78) / 3.56) * height;
    const u = (n: number) => (n / 3.56) * width;

    // Epoxy screed base with a cool cast.
    ctx.fillStyle = '#374048';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(10,16,22,0.4)'],
      [0.42, 'rgba(18,24,30,0.12)'],
      [1, 'rgba(6,10,14,0.26)'],
    ]);

    // 8 × 8 poured slabs.
    const tile = u(0.445);
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const random = rng(row * 41 + col * 17 + 5);
        ctx.fillStyle = `rgba(${86 + random() * 22}, ${96 + random() * 20}, ${104 + random() * 18}, 0.34)`;
        ctx.fillRect(col * tile + 1.5, row * tile + 1.5, tile - 3, tile - 3);
        ctx.fillStyle = 'rgba(210, 226, 236, 0.045)';
        ctx.fillRect(col * tile + 1.5, row * tile + 1.5, tile - 3, 2);
      }
    }
    ctx.strokeStyle = 'rgba(22, 28, 33, 0.62)';
    ctx.lineWidth = 3;
    for (let index = 0; index <= 8; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * tile, 0);
      ctx.lineTo(index * tile, height);
      ctx.moveTo(0, index * tile);
      ctx.lineTo(width, index * tile);
      ctx.stroke();
    }

    // Recessed cable trench along the back wall.
    ctx.fillStyle = 'rgba(30, 37, 42, 0.72)';
    ctx.fillRect(px(-1.62), py(-1.66), u(3.16), u(0.19));
    ctx.strokeStyle = 'rgba(158, 172, 180, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px(-1.62), py(-1.66), u(3.16), u(0.19));
    for (let index = 0; index < 11; index += 1) {
      const x = -1.55 + index * 0.29;
      ctx.fillStyle = 'rgba(170, 182, 190, 0.2)';
      ctx.beginPath();
      ctx.arc(px(x), py(-1.565), 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blue team lane — defence side of the room.
    ctx.save();
    ctx.fillStyle = 'rgba(74, 118, 150, 0.28)';
    ctx.fillRect(px(-1.56), py(-0.52), u(0.5), u(2.2));
    ctx.strokeStyle = 'rgba(140, 184, 212, 0.56)';
    ctx.lineWidth = 3;
    ctx.strokeRect(px(-1.56), py(-0.52), u(0.5), u(2.2));
    ctx.translate(px(-1.31), py(0.62));
    ctx.rotate(-Math.PI / 2);
    text(ctx, 'BLUE TEAM', 0, 0, {size: 24, weight: 800, font: FONT_SANS, color: 'rgba(168, 206, 230, 0.62)', align: 'center', tracking: 5});
    text(ctx, '防御 / DEFEND', 0, 22, {size: 13, weight: 600, font: FONT_SANS, color: 'rgba(168, 206, 230, 0.4)', align: 'center', tracking: 3});
    ctx.restore();

    // Red team lane — attack vector crawls toward the gate.
    ctx.save();
    ctx.fillStyle = 'rgba(150, 66, 54, 0.16)';
    ctx.fillRect(px(0.16), py(-0.3), u(0.48), u(2.0));
    ctx.strokeStyle = 'rgba(206, 110, 90, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(px(0.16), py(-0.3), u(0.48), u(2.0));
    ctx.translate(px(0.4), py(0.86));
    ctx.rotate(-Math.PI / 2);
    text(ctx, 'RED TEAM', 0, 0, {size: 24, weight: 800, font: FONT_SANS, color: 'rgba(224, 142, 122, 0.58)', align: 'center', tracking: 5});
    text(ctx, '攻击 / ATTACK', 0, 22, {size: 13, weight: 600, font: FONT_SANS, color: 'rgba(224, 142, 122, 0.36)', align: 'center', tracking: 3});
    ctx.restore();

    // Painted quarantine box around the containment cell.
    ctx.save();
    ctx.setLineDash([26, 18]);
    ctx.strokeStyle = 'rgba(198, 92, 72, 0.55)';
    ctx.lineWidth = 5;
    ctx.strokeRect(px(0.24), py(-1.7), u(1.46), u(1.42));
    ctx.restore();
    // Hazard hatch on the threshold strip.
    ctx.save();
    ctx.beginPath();
    ctx.rect(px(0.58), py(-0.46), u(0.82), u(0.17));
    ctx.clip();
    ctx.strokeStyle = 'rgba(198, 92, 72, 0.3)';
    ctx.lineWidth = 7;
    for (let index = -200; index < 900; index += 34) {
      ctx.beginPath();
      ctx.moveTo(px(0.2) + index, py(-0.46));
      ctx.lineTo(px(0.2) + index + 90, py(-0.29));
      ctx.stroke();
    }
    ctx.restore();

    // Painted arrows toward the gate.
    ctx.strokeStyle = 'rgba(216, 226, 232, 0.26)';
    ctx.lineWidth = 5;
    for (let index = 0; index < 3; index += 1) {
      const x = px(0.16 + index * 0.17);
      const y = py(-0.34);
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 16, y);
      ctx.lineTo(x, y - 14);
      ctx.stroke();
    }

    // Zone stencil near the front edge.
    ctx.save();
    ctx.translate(px(1.34), py(1.28));
    ctx.rotate(-Math.PI / 2);
    text(ctx, 'SEC-05 · DEFENSE LAB', 0, 0, {size: 18, weight: 700, font: FONT_MONO, color: 'rgba(188, 200, 208, 0.26)', align: 'center', tracking: 4});
    ctx.restore();

    // Wear: scuffs, drag marks, drips, a few stray fixings.
    const random = rng(913);
    for (let index = 0; index < 26; index += 1) {
      ctx.save();
      ctx.globalAlpha = 0.06 + random() * 0.1;
      ctx.fillStyle = random() > 0.55 ? '#0d1318' : '#aab6be';
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 12 + random() * 80, 6 + random() * 40, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (let index = 0; index < 16; index += 1) {
      ctx.strokeStyle = `rgba(14, 20, 25, ${0.08 + random() * 0.1})`;
      ctx.lineWidth = 1 + random() * 3;
      const x = px(-1.6 + random() * 1.4);
      const y = py(-1.2 + random() * 1.9);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (random() - 0.5) * 90, y + 10 + random() * 30);
      ctx.stroke();
    }
    // Drip stain under the wall tray.
    const drip = ctx.createLinearGradient(0, py(-1.55), 0, py(-0.9));
    drip.addColorStop(0, 'rgba(20, 26, 30, 0.22)');
    drip.addColorStop(1, 'rgba(20, 26, 30, 0)');
    ctx.fillStyle = drip;
    ctx.fillRect(px(0.62), py(-1.55), u(0.1), u(0.7));
    grain(ctx, width, height, {seed: 51, count: 5200, alpha: 0.05, size: 1.6, colors: ['#cfe0ea', '#0a1014']});
  });

const labWallTexture = () =>
  canvasTexture('security/wall', 1024, 512, (ctx, width, height) => {
    ctx.fillStyle = '#57646f';
    ctx.fillRect(0, 0, width, height);
    // Panel-by-panel tonal drift.
    for (let index = 0; index < 4; index += 1) {
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(index * 256, 0, 256, height);
    }
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(6, 11, 16, 0.58)'],
      [0.32, 'rgba(8, 14, 20, 0.26)'],
      [0.72, 'rgba(8, 14, 20, 0.06)'],
      [1, 'rgba(6, 10, 14, 0.24)'],
    ]);

    // Wainscot.
    ctx.fillStyle = '#3f4a54';
    ctx.fillRect(0, height - 122, width, 122);
    ctx.fillStyle = 'rgba(166, 184, 196, 0.16)';
    ctx.fillRect(0, height - 124, width, 3);
    ctx.fillStyle = 'rgba(8, 14, 18, 0.3)';
    ctx.fillRect(0, height - 8, width, 8);

    // Seams.
    ctx.strokeStyle = 'rgba(28, 36, 42, 0.5)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= width; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (const y of [94, 268, height - 122]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(214, 228, 236, 0.09)';
    ctx.lineWidth = 1.5;
    for (let x = 2; x <= width; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Red warning band under the wall cap.
    ctx.fillStyle = 'rgba(176, 78, 58, 0.55)';
    ctx.fillRect(0, 20, width, 9);
    ctx.fillStyle = 'rgba(230, 156, 136, 0.28)';
    ctx.fillRect(0, 20, width, 2);

    // Fixings along the seams.
    const random = rng(404);
    for (let x = 16; x < width; x += 64) {
      for (const y of [78, 282, height - 104]) {
        ctx.fillStyle = 'rgba(188, 202, 210, 0.26)';
        ctx.beginPath();
        ctx.arc(x + (random() - 0.5) * 4, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(14, 20, 24, 0.28)';
        ctx.beginPath();
        ctx.arc(x + (random() - 0.5) * 4, y + 1.6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Grime streaks, handprints, small labels.
    for (let index = 0; index < 18; index += 1) {
      const x = random() * width;
      const gradient = ctx.createLinearGradient(x, 40, x, 300 + random() * 120);
      gradient.addColorStop(0, 'rgba(12, 18, 22, 0.16)');
      gradient.addColorStop(1, 'rgba(12, 18, 22, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 40, 3 + random() * 12, 200 + random() * 160);
    }
    ctx.fillStyle = 'rgba(20, 26, 30, 0.14)';
    ctx.beginPath();
    ctx.ellipse(600, 350, 26, 34, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Stencils.
    ctx.save();
    ctx.translate(72, height - 54);
    text(ctx, 'B2 / LAB-05', 0, 0, {size: 17, weight: 700, font: FONT_MONO, color: 'rgba(196, 210, 218, 0.28)', tracking: 3});
    ctx.restore();
    ctx.save();
    ctx.translate(842, height - 48);
    text(ctx, 'HVAC · 06', 0, 0, {size: 12, weight: 600, font: FONT_MONO, color: 'rgba(196, 210, 218, 0.2)', tracking: 2});
    ctx.restore();
    // A taped notice and a cable label plate.
    ctx.fillStyle = 'rgba(232, 230, 220, 0.3)';
    ctx.fillRect(516, 300, 78, 54);
    ctx.fillStyle = 'rgba(30, 36, 40, 0.3)';
    for (let index = 0; index < 4; index += 1) ctx.fillRect(524, 310 + index * 10, 56 - index * 5, 3);
    grain(ctx, width, height, {seed: 61, count: 4200, alpha: 0.045, size: 1.5, colors: ['#ffffff', '#1a2228']});
  });

const voteScreenTexture = () =>
  canvasTexture('security/vote', 512, 320, (ctx, width, height) => {
    ctx.fillStyle = '#0b141a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#15212a';
    ctx.fillRect(0, 0, width, 38);
    listDots(ctx, 14, 19);
    text(ctx, 'GUARD VOTE', 54, 25, {size: 15, weight: 700, font: FONT_MONO, color: '#dbe6ea', tracking: 3});
    text(ctx, 'QUORUM 7/7', width - 16, 25, {size: 12, weight: 600, font: FONT_MONO, color: '#7fc8b8', align: 'right', tracking: 1});

    const votes = [
      ['A1', 'BLOCK', '#e0877a'],
      ['A2', 'BLOCK', '#e0877a'],
      ['A3', 'BLOCK', '#e0877a'],
      ['A4', 'BLOCK', '#e0877a'],
      ['A5', 'ALLOW', '#7fc8b8'],
      ['A6', 'ALLOW', '#7fc8b8'],
      ['A7', 'BLOCK', '#e0877a'],
    ] as const;
    votes.forEach(([agent, vote, color], index) => {
      const y = 66 + index * 27;
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(16, y - 15, 250, 22);
      text(ctx, agent, 26, y, {size: 11, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(96, y - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, vote, 110, y, {size: 10, weight: 700, font: FONT_MONO, color});
      text(ctx, `sig ${(0.61 + index * 0.041).toFixed(2)}`, 178, y, {size: 9, weight: 500, font: FONT_MONO, color: '#5f7f8a'});
    });

    // Quorum dial.
    const cx = 392;
    const cy = 142;
    ctx.strokeStyle = 'rgba(127, 200, 184, 0.16)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#e0877a';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, -Math.PI / 2, -Math.PI / 2 + (4 / 7) * Math.PI * 2);
    ctx.stroke();
    text(ctx, '4 / 7', cx, cy + 6, {size: 30, weight: 800, font: FONT_MONO, color: '#f0e2dc', align: 'center'});
    text(ctx, 'VETO', cx, cy + 28, {size: 12, weight: 700, font: FONT_MONO, color: '#e0877a', align: 'center', tracking: 3});

    // Verdict bar.
    ctx.fillStyle = 'rgba(224, 135, 122, 0.14)';
    rr(ctx, 274, 228, 222, 62, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(224, 135, 122, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'CONTAIN', 288, 258, {size: 20, weight: 800, font: FONT_MONO, color: '#f0b8a8', tracking: 3});
    text(ctx, 'signal: rag-poison · 0.94', 288, 278, {size: 9, weight: 500, font: FONT_MONO, color: '#b78a7e'});
    // Scanlines.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 38; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    grain(ctx, width, height, {seed: 27, count: 600, alpha: 0.035, size: 1.2});
  });

const linkScreenTexture = () =>
  canvasTexture('security/link', 512, 320, (ctx, width, height) => {
    ctx.fillStyle = '#0a1218';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#14202a';
    ctx.fillRect(0, 0, width, 38);
    listDots(ctx, 14, 19);
    text(ctx, 'LINK MONITOR', 54, 25, {size: 15, weight: 700, font: FONT_MONO, color: '#cfe0e6', tracking: 3});
    text(ctx, 'bus · 12 ms', width - 16, 25, {size: 11, weight: 600, font: FONT_MONO, color: '#8fb9c9', align: 'right'});

    // Topology.
    const nodes = [
      ['A1', 116, 92, '#7fc8b8'],
      ['A2', 232, 74, '#7fc8b8'],
      ['A3', 300, 150, '#e0b45a'],
      ['A4', 196, 196, '#e0877a'],
      ['A5', 88, 188, '#7fc8b8'],
    ] as const;
    const edges = [
      [0, 1, '#7fc8b8'],
      [1, 2, '#7fc8b8'],
      [2, 3, '#e0877a'],
      [3, 4, '#7fc8b8'],
      [0, 4, '#7fc8b8'],
      [1, 3, '#5f7f8a'],
    ] as const;
    for (const [from, to, color] of edges) {
      const a = nodes[from];
      const b = nodes[to];
      if (!a || !b) continue;
      ctx.strokeStyle = withAlpha(color, 0.65);
      ctx.lineWidth = color === '#e0877a' ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(a[1], a[2]);
      ctx.lineTo(b[1], b[2]);
      ctx.stroke();
    }
    // Severed edge marker.
    ctx.strokeStyle = '#e0877a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(268, 118);
    ctx.lineTo(280, 130);
    ctx.moveTo(280, 118);
    ctx.lineTo(268, 130);
    ctx.stroke();
    for (const [id, x, y, color] of nodes) {
      ctx.fillStyle = 'rgba(12, 20, 26, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.85);
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, id, x, y + 4, {size: 11, weight: 700, font: FONT_MONO, color: '#d8e4e8', align: 'center'});
    }
    text(ctx, 'node:A4', 196, 232, {size: 9, weight: 600, font: FONT_MONO, color: '#e0877a', align: 'center'});

    // Link metrics.
    const metrics = [
      ['BUS', 0.42, '#7fc8b8'],
      ['QUEUE', 0.68, '#e0b45a'],
      ['LOSS', 0.92, '#e0877a'],
    ] as const;
    metrics.forEach(([label, value, color], index) => {
      const y = 76 + index * 66;
      text(ctx, label, 348, y, {size: 11, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
      text(ctx, value.toFixed(2), 500, y, {size: 11, weight: 700, font: FONT_MONO, color, align: 'right'});
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, 348, y + 10, 152, 10, 3);
      ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, 348, y + 10, 152 * value, 10, 3);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(224, 135, 122, 0.12)';
    rr(ctx, 336, 254, 164, 52, 4);
    ctx.fill();
    text(ctx, 'EDGE A3→A4', 348, 274, {size: 11, weight: 700, font: FONT_MONO, color: '#e0877a'});
    text(ctx, 'severed by quorum', 348, 292, {size: 9, weight: 500, font: FONT_MONO, color: '#b78a7e'});
    // Waveform strip.
    ctx.strokeStyle = 'rgba(127, 200, 184, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= 320; x += 4) {
      const y = 300 + Math.sin(x * 0.09) * 5 + Math.sin(x * 0.31) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 38; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    grain(ctx, width, height, {seed: 33, count: 600, alpha: 0.035, size: 1.2});
  });

const gatePlateTexture = () =>
  canvasTexture('security/gatePlate', 512, 96, (ctx, width, height) => {
    ctx.fillStyle = '#1b232a';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#d9a94a';
    for (let x = -20; x < 92; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + 13, height);
      ctx.lineTo(x + 13 + height, 0);
      ctx.lineTo(x + height, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#12181d';
    for (let x = -20; x < 92; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x + 13, height);
      ctx.lineTo(x + 26, height);
      ctx.lineTo(x + 26 + height, 0);
      ctx.lineTo(x + 13 + height, 0);
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, '隔离闸门 04', 108, 40, {size: 26, weight: 800, font: FONT_SANS, color: '#eef2f0', tracking: 2});
    text(ctx, 'SCAN GATE · L1-L3', 108, 66, {size: 13, weight: 700, font: FONT_MONO, color: '#e0a08a', tracking: 2});
    ctx.strokeStyle = 'rgba(224, 135, 122, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(96, 18, width - 108, height - 36);
  });

const keypadTexture = () =>
  canvasTexture('security/keypad', 256, 192, (ctx, width, height) => {
    ctx.fillStyle = '#1b2329';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(154, 170, 178, 0.24)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = 22 + col * 44;
        const y = 30 + row * 34;
        ctx.fillStyle = '#2c363d';
        rr(ctx, x, y, 36, 26, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, x, y, 36, 10, 4);
        ctx.fill();
        text(ctx, row === 3 ? ['*', '0', '#'][col] ?? '' : String(row * 3 + col + 1), x + 18, y + 19, {
          size: 12,
          weight: 700,
          font: FONT_MONO,
          color: '#9fb2bc',
          align: 'center',
        });
      }
    }
    // Badge reader.
    ctx.fillStyle = '#232c33';
    rr(ctx, 166, 30, 72, 96, 5);
    ctx.fill();
    ctx.fillStyle = '#0d1216';
    ctx.fillRect(176, 42, 52, 8);
    ctx.fillStyle = '#e0877a';
    ctx.beginPath();
    ctx.arc(202, 86, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'BADGE', 202, 110, {size: 9, weight: 700, font: FONT_MONO, color: '#7f99a4', align: 'center', tracking: 2});
    text(ctx, 'AUTH REQUIRED', 22, 176, {size: 10, weight: 600, font: FONT_MONO, color: '#5f7f8a', tracking: 1});
  });

const blastWallTexture = () =>
  canvasTexture('security/blastWall', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#333d45';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(220, 236, 244, 0.06)'],
      [1, 'rgba(6, 10, 14, 0.3)'],
    ]);
    // Ribs.
    for (let y = 26; y < height - 96; y += 42) {
      ctx.fillStyle = 'rgba(16, 22, 27, 0.32)';
      ctx.fillRect(0, y, width, 14);
      ctx.fillStyle = 'rgba(206, 222, 230, 0.12)';
      ctx.fillRect(0, y + 14, width, 3);
      ctx.fillStyle = 'rgba(8, 12, 16, 0.22)';
      ctx.fillRect(0, y + 17, width, 3);
    }
    // Fixings.
    for (let x = 20; x < width; x += 62) {
      for (let y = 22; y < height - 100; y += 84) {
        ctx.fillStyle = 'rgba(200, 214, 222, 0.18)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Hazard band.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, height - 84, width, 84);
    ctx.clip();
    ctx.fillStyle = '#c9a248';
    ctx.fillRect(0, height - 84, width, 84);
    ctx.fillStyle = '#1b2227';
    for (let x = -80; x < width + 80; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + 28, height);
      ctx.lineTo(x + 28 + 84, height - 84);
      ctx.lineTo(x + 84, height - 84);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Stencil.
    text(ctx, 'FIREWALL', 28, 116, {size: 34, weight: 800, font: FONT_SANS, color: 'rgba(226, 236, 242, 0.62)', tracking: 4});
    text(ctx, 'BLAST / 阻断层', 30, 144, {size: 15, weight: 600, font: FONT_SANS, color: 'rgba(224, 146, 126, 0.72)', tracking: 3});
    text(ctx, 'SHUTTER · MANUAL RELEASE', 30, 176, {size: 10, weight: 600, font: FONT_MONO, color: 'rgba(196, 212, 220, 0.4)', tracking: 1});
    grain(ctx, width, height, {seed: 77, count: 2200, alpha: 0.05, size: 1.4});
  });

const cellFloorTexture = () =>
  canvasTexture('security/cellFloor', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#2b343a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(190, 204, 212, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(198, 92, 72, 0.38)';
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, width - 108, height - 108);
    ctx.save();
    ctx.translate(70, 90);
    text(ctx, 'Q-04', 0, 0, {size: 26, weight: 800, font: FONT_MONO, color: 'rgba(224, 142, 122, 0.34)', tracking: 3});
    text(ctx, 'ISOLATION CELL', 0, 26, {size: 11, weight: 600, font: FONT_MONO, color: 'rgba(200, 214, 222, 0.2)', tracking: 2});
    ctx.restore();
    // Grate.
    ctx.fillStyle = 'rgba(10, 14, 18, 0.4)';
    ctx.fillRect(330, 330, 120, 120);
    for (let index = 0; index < 6; index += 1) {
      ctx.fillStyle = 'rgba(120, 136, 146, 0.14)';
      ctx.fillRect(336, 338 + index * 18, 108, 5);
    }
    grain(ctx, width, height, {seed: 91, count: 1400, alpha: 0.04, size: 1.2});
  });

const roofPlateTexture = () =>
  canvasTexture('security/roofPlate', 512, 192, (ctx, width, height) => {
    ctx.fillStyle = '#323d46';
    ctx.fillRect(0, 0, width, height);
    // Hazard block on the left edge.
    ctx.fillStyle = '#b8973c';
    ctx.fillRect(0, 0, 58, height);
    ctx.fillStyle = '#1b2126';
    for (let y = -height; y < height * 2; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(30, y);
      ctx.lineTo(66, y + 52);
      ctx.lineTo(36, y + 52);
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, 'Q-04', 86, 78, {size: 54, weight: 800, font: FONT_MONO, color: '#c9d8de', tracking: 2});
    text(ctx, 'ISOLATION CELL / 隔离舱', 88, 118, {size: 20, weight: 700, font: FONT_SANS, color: '#e0877a', tracking: 1});
    text(ctx, '3 AGENT UNITS · -12 Pa · SEALED', 88, 150, {size: 14, weight: 600, font: FONT_MONO, color: '#7f99a4'});
    ctx.strokeStyle = 'rgba(224, 135, 122, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    grain(ctx, width, height, {seed: 37, count: 900, alpha: 0.05, size: 1.3});
  });

const cellBackTexture = () =>
  canvasTexture('security/cellBack', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#242e36';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(4, 8, 12, 0.34)'],
      [1, 'rgba(120, 150, 166, 0.06)'],
    ]);
    // Vertical cooling ribs.
    for (let x = 16; x < width; x += 64) {
      ctx.fillStyle = 'rgba(8, 12, 16, 0.5)';
      ctx.fillRect(x, 40, 26, height - 140);
      ctx.fillStyle = 'rgba(150, 170, 182, 0.08)';
      ctx.fillRect(x + 26, 40, 3, height - 140);
    }
    // Conduit and clamps.
    ctx.fillStyle = '#3f4a53';
    ctx.fillRect(0, 96, width, 10);
    ctx.fillStyle = 'rgba(200, 216, 226, 0.12)';
    ctx.fillRect(0, 96, width, 2);
    for (let x = 40; x < width; x += 120) {
      ctx.fillStyle = '#54606a';
      ctx.fillRect(x, 88, 14, 26);
    }
    // Warning plate.
    ctx.fillStyle = '#c2a43c';
    ctx.fillRect(96, 208, 200, 54);
    ctx.fillStyle = '#1b232a';
    for (let x = 96; x < 296; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 262);
      ctx.lineTo(x + 13, 262);
      ctx.lineTo(x + 13 + 54, 208);
      ctx.lineTo(x + 54, 208);
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, 'Q-04 · LOCKED', 106, 238, {size: 21, weight: 800, font: FONT_MONO, color: '#2a2620'});
    text(ctx, 'PRESSURE -12 Pa', 106, 280, {size: 12, weight: 600, font: FONT_MONO, color: 'rgba(198, 214, 222, 0.42)'});
    text(ctx, 'AGENT ISOLATION / 主体隔离', 106, 302, {size: 11, weight: 600, font: FONT_SANS, color: 'rgba(198, 214, 222, 0.34)'});
    // Grime.
    const random = rng(63);
    for (let index = 0; index < 16; index += 1) {
      ctx.fillStyle = `rgba(6, 10, 14, ${0.06 + random() * 0.1})`;
      ctx.fillRect(random() * width, height - 180 + random() * 160, 4 + random() * 30, 30 + random() * 90);
    }
    grain(ctx, width, height, {seed: 13, count: 1800, alpha: 0.04, size: 1.4});
  });

/** Three little status lamps in a screen header. */
function listDots(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const colors = ['#e0877a', '#e0b45a', '#7fc8b8'];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + index * 11, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ------------------------------------------------------------------ */
/* Room shell                                                          */
/* ------------------------------------------------------------------ */

const LabShell = () => {
  const wall = surface('#ffffff', 'paint', labWallTexture());
  const sideWall = surface('#b3bfc8', 'paint', labWallTexture());
  return (
    <group>
      {/* Raised technical floor. */}
      <Box size={[3.56, 0.06, 3.56]} color="#252c32" p={[0, 0.03, 0]} ink={false} />
      <Panel size={[3.54, 3.54]} material={surface('#ffffff', 'tile', labFloorTexture())} lit r={[-Math.PI / 2, 0, 0]} p={[0, FLOOR_Y + 0.002, 0]} />

      {/* Back wall. */}
      <Box size={[3.56, WALL_H, WALL_T]} material={wall} p={[0, FLOOR_Y + WALL_H / 2, BACK_Z]} ink inkWidth={0.01} />
      <Box size={[3.5, 0.1, 0.03]} color="#252c32" p={[0, FLOOR_Y + 0.05, BACK_FACE + 0.012]} ink={false} />
      <Box size={[3.62, 0.05, WALL_T + 0.04]} color="#3f4a52" p={[0, WALL_TOP + 0.024, BACK_Z]} ink={false} />
      <Box size={[3.56, 0.012, 0.012]} color="#b4503a" p={[0, WALL_TOP + 0.002, BACK_FACE + 0.006]} ink={false} shadow={false} />

      {/* Side wall (right). */}
      <Box size={[WALL_T, WALL_H, 3.56]} material={sideWall} p={[SIDE_X, FLOOR_Y + WALL_H / 2, 0]} ink inkWidth={0.01} shadow={false} />
      <Box size={[0.03, 0.1, 3.5]} color="#252c32" p={[SIDE_FACE - 0.012, FLOOR_Y + 0.05, 0]} ink={false} />
      <Box size={[WALL_T + 0.04, 0.05, 3.62]} color="#3f4a52" p={[SIDE_X, WALL_TOP + 0.024, 0]} ink={false} />
      <Box size={[0.012, 0.012, 3.56]} color="#b4503a" p={[SIDE_FACE - 0.006, WALL_TOP + 0.002, 0]} ink={false} shadow={false} />

      {/* Wall cap labels. */}
      <Panel size={[0.34, 0.085]} texture={zoneSignTexture('防御实验室', 'DEFENSE LAB', '#e0877a')} p={[-1.52, 1.31, BACK_FACE + 0.006]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Wall services                                                       */
/* ------------------------------------------------------------------ */

const WallServices = () => (
  <group>
    {/* Back-wall cable tray. */}
    <Box size={[3.12, 0.018, 0.17]} color="#38434b" p={[0.1, 1.575, -1.56]} ink={false} />
    <Box size={[3.12, 0.075, 0.014]} color="#3d4850" p={[0.1, 1.617, -1.64]} ink={false} />
    <Box size={[3.12, 0.075, 0.014]} color="#3d4850" p={[0.1, 1.617, -1.48]} ink={false} />
    <Cable points={[[-1.5, 1.6, -1.57], [-0.7, 1.585, -1.55], [0.2, 1.6, -1.56], [1.28, 1.59, -1.57]]} radius={0.012} color="#1d2429" />
    <Cable points={[[-1.5, 1.6, -1.52], [-0.6, 1.59, -1.5], [0.4, 1.6, -1.51], [1.34, 1.595, -1.52]]} radius={0.009} color="#2a3238" />

    {/* Conduit drop to the airlock panel. */}
    <Pipe from={[0.2, 1.58, -1.6]} to={[0.2, 1.13, -1.6]} radius={0.013} color="#5a666f" />

    {/* Warning board + beacon lamp. */}
    <Box size={[0.56, 0.3, 0.035]} color="#1e252a" p={[-0.56, 1.44, -1.658]} ink={false} />
    <Panel size={[0.53, 0.27]} texture={warningBoardTexture()} p={[-0.56, 1.44, -1.638]} />
    <BlinkLed p={[-0.79, 1.565, -1.636]} color="#ff5a3a" radius={0.009} period={2.4} phase={0.3} />

    {/* Zone signs. */}
    <Panel size={[0.34, 0.17]} texture={zoneSignTexture('检测区', 'DETECTION ZONE', '#7fc8b8')} p={[-1.34, 1.5, -1.643]} />
    <Panel size={[0.34, 0.17]} texture={zoneSignTexture('隔离舱', 'QUARANTINE / Q-04', '#e0877a')} p={[1.03, 1.45, -1.643]} />

    {/* Airlock / emergency stop panel. */}
    <Box size={[0.19, 0.22, 0.045]} color="#c2a43c" p={[0.2, 1.02, -1.652]} ink={false} />
    <Panel size={[0.15, 0.056]} texture={labelTagTexture('E-STOP', '#c8402f', 'AIRLOCK')} p={[0.2, 1.095, -1.628]} />
    <Torus radius={0.04} tube={0.006} color="#8a939a" r={[Math.PI / 2, 0, 0]} p={[0.2, 0.995, -1.625]} />
    <Cyl radius={0.029} height={0.026} color="#b23c2b" r={[Math.PI / 2, 0, 0]} p={[0.2, 0.995, -1.62]} ink={false} />
    <Glow color="#ff6a48" size={0.2} opacity={0.12} p={[0.2, 0.99, -1.6]} />

    {/* Security camera in the top-left corner. */}
    <Pipe from={[-1.58, 1.62, -1.62]} to={[-1.5, 1.55, -1.55]} radius={0.012} color="#4d5962" />
    <RBox size={[0.07, 0.055, 0.11]} color="#2b3339" p={[-1.46, 1.51, -1.52]} r={[-0.35, 0.4, 0]} ink={false} />

    {/* Side-wall blast shutter + vent + extinguisher. */}
    <Panel size={[1.02, 1.14]} texture={blastWallTexture()} r={[0, -Math.PI / 2, 0]} p={[SIDE_FACE - 0.006, 0.66, 1.12]} />
    <Box size={[0.05, 0.11, 0.05]} color="#b23c2b" p={[SIDE_FACE - 0.03, 0.52, 0.74]} ink={false} />

    <Box size={[0.035, 0.32, 0.44]} color="#2a3238" p={[SIDE_FACE + 0.02, 1.33, -0.42]} ink={false} />
    <Box size={[0.045, 0.035, 0.38]} color="#5b6770" p={[SIDE_FACE - 0.014, 1.33, -0.42]} ink={false} shadow={false} />

  </group>
);

/* ------------------------------------------------------------------ */
/* Small animated parts                                                */
/* ------------------------------------------------------------------ */

/** A tiny lamp that pulses; used for warning lamps and status LEDs. */
const BlinkLed = ({p, color = '#ff6a48', radius = 0.009, period = 1.6, phase = 0}: {p: Vec3; color?: string; radius?: number; period?: number; phase?: number}) => {
  const ref = useRef<Mesh>(null);
  useFrame(({clock}) => {
    const node = ref.current;
    if (!node) return;
    node.visible = ((clock.elapsedTime + phase) % period) < period * 0.58;
  });
  return <mesh ref={ref} position={p} geometry={sphereGeometry(radius, 8, 6)} material={flat(color)} />;
};

/** Rotating warning beacon on the isolation cell. */
const Beacon = ({p}: {p: Vec3}) => {
  const rotor = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const lens = useRef<Mesh>(null);
  const lensMaterial = useMemo(
    () => toon('#ff7a52', {emissive: '#ff3a16', emissiveIntensity: 1.2, transparent: true, opacity: 0.88}),
    [],
  );
  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    if (rotor.current) rotor.current.rotation.y = time * 2.6;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.4);
    if (light.current) light.current.intensity = 0.7 + pulse * 1.25;
    const material = lens.current?.material as MeshToonMaterial | undefined;
    if (material) material.emissiveIntensity = 1.0 + pulse * 1.4;
  });
  return (
    <group position={p}>
      <Cyl radius={0.072} height={0.02} color="#333d44" p={[0, 0.01, 0]} ink={false} />
      <Cyl radius={0.052} height={0.036} color="#262f35" p={[0, 0.036, 0]} radiusTop={0.048} ink={false} />
      <group ref={rotor} position={[0, 0.1, 0]}>
        <Cyl radius={0.05} radiusTop={0.024} height={0.078} segments={18} color="#ff7a52" material={lensMaterial} ink={false} />
        <Box size={[0.02, 0.068, 0.052]} color="#1a2026" p={[0, 0, 0]} ink={false} shadow={false} />
      </group>
      <Torus radius={0.052} tube={0.004} color="#4d5962" r={[Math.PI / 2, 0, 0]} p={[0, 0.074, 0]} ink={false} shadow={false} />
      <Cyl radius={0.03} height={0.012} color="#333d44" p={[0, 0.145, 0]} ink={false} />
      <Glow color="#ff6a3c" size={0.5} opacity={0.24} p={[0, 0.1, 0]} />
      <pointLight ref={light} position={[0, 0.11, 0]} color="#ff5a2c" intensity={1.2} distance={1.7} decay={2} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Monitoring console                                                  */
/* ------------------------------------------------------------------ */

const Monitor = ({
  p,
  ry = 0,
  rx = -0.1,
  width,
  height,
  texture,
  baseY = DESK_TOP,
}: {
  p: Vec3;
  ry?: number;
  rx?: number;
  width: number;
  height: number;
  texture: ReturnType<typeof canvasTexture>;
  baseY?: number;
}) => {
  const stem = Math.max(0.05, p[1] - height / 2 - baseY);
  return (
    <group position={p} rotation={[rx, ry, 0]}>
      <RBox size={[width + 0.035, height + 0.035, 0.045]} radius={0.012} color="#232b31" ink inkWidth={0.005} />
      <Panel size={[width, height]} texture={texture} p={[0, 0, 0.025]} />
      <Glow color="#9fd4e8" size={width * 1.55} opacity={0.14} p={[0, 0, 0.12]} />
      <Cyl radius={0.011} height={stem} color="#4c5760" p={[0, -height / 2 - 0.05 - stem / 2, -0.012]} ink={false} shadow={false} />
      <RBox size={[0.19, 0.013, 0.15]} radius={0.006} color="#333c43" p={[0, -height / 2 - 0.05 - stem, -0.012]} ink={false} shadow={false} />
    </group>
  );
};

const Console = () => {
  const screenScan = useRef<Group>(null);
  useFrame(({clock}) => {
    if (!screenScan.current) return;
    const cycle = (clock.elapsedTime * 0.32) % 1;
    screenScan.current.position.y = 1.215 - cycle * 0.31;
  });
  return (
    <group>
      {/* Bench. */}
      <Box size={[1.54, 0.05, 0.66]} color="#5f6a72" p={[-0.9, DESK_TOP - 0.025, DESK_Z]} ink inkWidth={0.006} />
      <Box size={[1.54, 0.018, 0.66]} color="#2f383f" p={[-0.9, DESK_TOP - 0.062, DESK_Z]} ink={false} shadow={false} />
      {[-1.64, -0.16].map((x) => (
        <Box key={x} size={[0.04, 0.69, 0.64]} color="#333c43" p={[x, 0.405, -1.31]} ink={false} />
      ))}
      <Box size={[1.5, 0.03, 0.03]} color="#333c43" p={[-0.9, 0.15, -1.61]} ink={false} shadow={false} />
      <Box size={[1.42, 0.3, 0.02]} color="#39434a" p={[-0.9, 0.52, -1.605]} ink={false} />

      {/* Under-bench rack. */}
      <RBox size={[0.26, 0.44, 0.4]} radius={0.008} color="#262d33" p={[-1.5, 0.28, -1.34]} ink={false} />
      <Panel size={[0.22, 0.38]} texture={serverRackTexture(4)} p={[-1.5, 0.28, -1.138]} />
      <BlinkLed p={[-1.57, 0.44, -1.134]} color="#7fc8b8" radius={0.006} period={2.7} />

      {/* Monitor stack. */}
      <Monitor p={[-0.86, 1.07, -1.31]} width={0.58} height={0.36} texture={agentScreenTexture()} rx={-0.1} ry={0.07} />
      <Monitor p={[-1.42, 1.03, -1.24]} width={0.42} height={0.265} texture={detectionScreenTexture()} rx={-0.09} ry={0.37} />
      <Monitor p={[-0.34, 1.01, -1.22]} width={0.4} height={0.25} texture={linkScreenTexture()} rx={-0.11} ry={-0.3} />

      {/* Scan pulse travelling down the main trace screen. */}
      <group ref={screenScan} position={[-0.86, 1.215, -1.283]} rotation={[-0.1, 0.07, 0]}>
        <Panel size={[0.56, 0.05]} color="#d8f2ff" additive opacity={0.42} />
      </group>

      {/* Desk mat, keyboard, mouse. */}
      <Panel size={[0.64, 0.31]} texture={deskMatTexture()} color="#8b9a94" r={[-Math.PI / 2, 0, 0.02]} p={[-0.86, DESK_TOP + 0.002, -1.08]} />
      <Panel size={[0.34, 0.115]} texture={keyboardTexture()} r={[-Math.PI / 2, 0, 0.02]} p={[-0.87, DESK_TOP + 0.018, -1.11]} />
      <RBox size={[0.05, 0.022, 0.078]} radius={0.008} color="#2a3238" p={[-0.55, DESK_TOP + 0.013, -1.06]} r={[0, 0.2, 0]} ink={false} />

      {/* Sticky notes on the main bezel. */}
      <Panel size={[0.05, 0.05]} color="#e8d27a" p={[-1.09, 1.02, -1.277]} r={[-0.1, 0.07, 0.06]} />

      {/* Paperwork and a file tray. */}
      <Panel size={[0.2, 0.26]} texture={paperSheetTexture('INCIDENT A-04', 14)} color="#b9b5a8" p={[-1.58, DESK_TOP + 0.022, -1.16]} r={[-Math.PI / 2, 0, 0.08]} />
      <Panel size={[0.18, 0.23]} texture={paperSheetTexture('TRACE / A3', 10)} color="#b0aca0" p={[-1.53, DESK_TOP + 0.03, -1.08]} r={[-Math.PI / 2, 0, -0.22]} />
      <Cyl radius={0.032} height={0.075} color="#b9b2a2" p={[-0.24, DESK_TOP + 0.038, -1.05]} ink={false} />

      {/* Wall-mounted task lamp over the paperwork. */}
      <Pipe from={[-1.6, 1.33, -1.64]} to={[-1.56, 1.29, -1.5]} radius={0.008} color="#59656e" />
      <Cone radius={0.072} height={0.075} color="#3b454c" r={[0.95, 0.3, 0.1]} p={[-1.56, 1.24, -1.46]} ink={false} />
      <Cyl radius={0.058} height={0.008} material={flat('#ffd9a4')} r={[0.95, 0.3, 0.1]} p={[-1.555, 1.21, -1.45]} ink={false} shadow={false} />
      <pointLight position={[-1.54, 1.16, -1.42]} color="#ffb877" intensity={0.5} distance={0.9} decay={2} />
      <Glow color="#ffc188" size={0.2} opacity={0.12} p={[-1.54, 1.18, -1.42]} />

      {/* Warm and cool pools on the worktop. */}
      <Panel size={[0.5, 0.4]} texture={lightPoolTexture('#ffb877', 0.5)} additive opacity={0.14} r={[-Math.PI / 2, 0, 0]} p={[-1.48, DESK_TOP + 0.004, -1.1]} />
      <Panel size={[1.2, 0.5]} texture={lightPoolTexture('#a8d8ec', 0.55)} additive opacity={0.12} r={[-Math.PI / 2, 0, 0]} p={[-0.78, DESK_TOP + 0.004, -1.05]} />

      <ContactShadow p={[-0.9, FLOOR_Y, -1.28]} radius={0.85} opacity={0.5} />

      {/* Screen bounce on the wall behind the bench. */}
      <Panel size={[1.9, 0.62]} texture={lightPoolTexture('#9fd4e8', 0.36)} additive opacity={0.2} p={[-0.86, 1.06, BACK_FACE + 0.004]} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Containment cell                                                    */
/* ------------------------------------------------------------------ */

const AgentPod = ({p, seed, tint, tag}: {p: Vec3; seed: number; tint: string; tag: string}) => (
  <group position={p}>
    <Box size={[0.175, 0.3, 0.1]} color="#2a353d" ink={false} />
    <Panel size={[0.165, 0.285]} texture={agentPodTexture(seed)} p={[0, 0, 0.051]} />
    <Panel size={[0.016, 0.27]} texture={ledStripTexture(seed, tint)} p={[-0.078, 0, 0.052]} />
    <Panel size={[0.13, 0.016]} material={flat(tint)} p={[0, 0.162, 0.053]} />
    <Panel size={[0.075, 0.03]} texture={labelTagTexture(tag, tint, undefined)} p={[0, -0.185, 0.056]} />
  </group>
);

const ContainmentCell = () => {
  const scan = useRef<Group>(null);
  useFrame(({clock}) => {
    const cycle = (clock.elapsedTime * 0.22) % 1;
    if (scan.current) {
      scan.current.position.y = 0.2 + cycle * 0.68;
      scan.current.scale.y = 0.6 + Math.sin(cycle * Math.PI) * 0.5;
    }
  });
  return (
    <group>
      {/* Plinth and shell. */}
      <Box size={[1.12, 0.1, 1.04]} color="#2b343b" p={[CELL_CX, FLOOR_Y + 0.05, CELL_CZ]} ink inkWidth={0.006} />
      <Panel size={[0.88, 0.05]} texture={hazardStripeTexture()} p={[CELL_CX, FLOOR_Y + 0.05, CELL.z1 + 0.001]} />
      <Panel size={[1.0, 0.84]} texture={cellBackTexture()} p={[CELL_CX, 0.62, CELL.z0 + 0.046]} />
      <Panel size={[0.98, 0.8]} texture={cellFloorTexture()} lit r={[-Math.PI / 2, 0, 0]} p={[CELL_CX, CELL_BASE_TOP + 0.002, CELL_CZ]} />

      {/* Side support columns inside the cell. */}
      <Box size={[0.16, 0.8, 0.36]} color="#252e35" p={[0.52, 0.56, -1.34]} ink={false} />
      <Box size={[0.16, 0.8, 0.36]} color="#252e35" p={[1.44, 0.56, -1.34]} ink={false} />

      {/* Glass. */}
      <Panel size={[0.255, 0.85]} material={glass('#a8c8d8', 0.11)} p={[0.5475, 0.595, CELL.z1]} />
      <Panel size={[0.255, 0.85]} material={glass('#a8c8d8', 0.11)} p={[1.4125, 0.595, CELL.z1]} />
      <Panel size={[1.04, 0.85]} material={glass('#a8c8d8', 0.05)} r={[0, -Math.PI / 2, 0]} p={[CELL.x0, 0.595, CELL_CZ]} />
      <Panel size={[1.0, 0.8]} texture={glassSheenTexture()} additive opacity={0.22} p={[CELL_CX, 0.6, CELL.z1 + 0.006]} />
      <Box size={[1.04, 0.008, 0.014]} material={flat('#7fa6b8')} p={[CELL_CX, 1.012, CELL.z1 + 0.006]} ink={false} shadow={false} />

      {/* Steel corner posts and roof. */}
      {[
        [CELL.x0 + 0.025, CELL.z1 - 0.025],
        [CELL.x1 - 0.025, CELL.z1 - 0.025],
      ].map(([x, z]) => (
        <Box key={`${x}-${z}`} size={[0.055, 0.88, 0.055]} color="#39434b" p={[x ?? 0, 0.61, z ?? 0]} ink={false} />
      ))}
      <Box size={[1.18, 0.09, 1.1]} color="#333d44" p={[CELL_CX, CELL_ROOF_TOP - 0.045, CELL_CZ]} ink inkWidth={0.007} />
      <Panel size={[0.52, 0.195]} texture={roofPlateTexture()} r={[-Math.PI / 2, 0, 0]} p={[0.86, CELL_ROOF_TOP + 0.006, -0.86]} />
      <Box size={[0.26, 0.045, 0.22]} color="#3f4a53" p={[1.16, CELL_ROOF_TOP + 0.0225, -1.3]} ink={false} />

      {/* Cold cell light and interior glow. */}
      <Box size={[0.9, 0.02, 0.035]} material={flat('#dcf2ff')} p={[CELL_CX, 0.985, -0.62]} ink={false} shadow={false} />
      <Glow color="#cfeaff" size={0.8} opacity={0.2} p={[CELL_CX, 0.9, -0.72]} />
      <pointLight position={[CELL_CX, 0.8, -0.62]} color="#d2ecff" intensity={1.8} distance={1.5} decay={2} />
      <Panel size={[0.72, 0.44]} texture={lightPoolTexture('#cfeaff', 0.5)} additive opacity={0.18} r={[-Math.PI / 2, 0, 0]} p={[CELL_CX, CELL_BASE_TOP + 0.004, -0.9]} />

      {/* Agent rack. */}
      <Box size={[0.035, 0.62, 0.035]} color="#46525b" p={[0.66, 0.47, -1.19]} ink={false} />
      <Box size={[0.035, 0.62, 0.035]} color="#46525b" p={[1.3, 0.47, -1.19]} ink={false} />
      <Box size={[0.7, 0.022, 0.26]} color="#3b464e" p={[CELL_CX, 0.44, -1.08]} ink={false} />
      {POD_SEEDS.map((seed, index) => (
        <AgentPod
          key={seed}
          p={[0.79 + index * 0.19, 0.605, -1.06]}
          seed={seed}
          tint={seed === 3 ? '#e0877a' : '#7fc8b8'}
          tag={seed === 3 ? 'A3 · HOLD' : `A${seed} · OK`}
        />
      ))}

      {/* Shutter drum above the gate. */}
      <Cyl radius={0.042} height={1.14} color="#333d45" r={[0, 0, Math.PI / 2]} p={[CELL_CX, 1.17, CELL.z1 + 0.025]} ink={false} />
      <Box size={[0.52, 0.024, 0.012]} color="#56626b" p={[GATE_CX, 0.975, CELL.z1 - 0.005]} ink={false} shadow={false} />
      <Box size={[0.52, 0.024, 0.012]} color="#4a565f" p={[GATE_CX, 0.947, CELL.z1 - 0.005]} ink={false} shadow={false} />

      {/* Detection gate. */}
      <RBox size={[0.06, 0.96, 0.12]} radius={0.008} color="#323d45" p={[GATE_X0 - 0.03, 0.54, GATE_Z]} ink={false} />
      <RBox size={[0.06, 0.96, 0.12]} radius={0.008} color="#323d45" p={[GATE_X1 + 0.03, 0.54, GATE_Z]} ink={false} />
      <RBox size={[0.66, 0.085, 0.13]} radius={0.008} color="#38434b" p={[GATE_CX, 1.06, GATE_Z]} ink={false} />
      <Panel size={[0.3, 0.056]} texture={gatePlateTexture()} p={[GATE_CX, 1.062, GATE_Z + 0.067]} />

      {/* Gate lamps and scanner. */}
      <Panel size={[0.5, 0.028]} material={flat('#ff6a48')} p={[GATE_CX, 1.0, GATE_Z + 0.062]} />
      <Glow color="#ff5a3a" size={0.52} opacity={0.24} p={[GATE_CX, 0.99, GATE_Z + 0.13]} />
      <Panel size={[0.012, 0.56]} material={flat('#e0877a')} p={[GATE_X0 + 0.006, 0.64, GATE_Z + 0.061]} />
      <group ref={scan} position={[GATE_CX, 0.3, GATE_Z + 0.058]}>
        <Panel size={[0.5, 0.012]} color="#ffb28a" additive opacity={0.45} />
      </group>
      <Panel size={[0.5, 0.05]} texture={hazardStripeTexture()} p={[GATE_CX, 0.075, GATE_Z + 0.065]} />

      {/* Exhaust stack off the cell roof. */}
      <Cyl radius={0.036} height={0.46} color="#4a565f" p={[1.34, CELL_ROOF_TOP + 0.23, -1.26]} ink={false} />
      <Cyl radius={0.056} height={0.028} color="#5b6770" p={[1.34, CELL_ROOF_TOP + 0.468, -1.26]} ink={false} />
      <Box size={[0.2, 0.022, 0.022]} color="#46525b" p={[1.5, CELL_ROOF_TOP + 0.36, -1.26]} ink={false} shadow={false} />

      {/* Status tower on the cell roof. */}
      <Cyl radius={0.012} height={0.3} color="#4a565e" p={[1.4, CELL_ROOF_TOP + 0.165, -0.78]} ink={false} />
      <Cyl radius={0.032} height={0.022} color="#2c353b" p={[1.4, CELL_ROOF_TOP + 0.011, -0.78]} ink={false} />
      <Cyl radius={0.024} height={0.04} color="#b23c2b" p={[1.4, CELL_ROOF_TOP + 0.31, -0.78]} ink={false} />
      <Cyl radius={0.024} height={0.04} color="#b58a34" p={[1.4, CELL_ROOF_TOP + 0.353, -0.78]} ink={false} />
      <Cyl radius={0.024} height={0.04} color="#3f6b57" p={[1.4, CELL_ROOF_TOP + 0.396, -0.78]} ink={false} />
      <BlinkLed p={[1.4, CELL_ROOF_TOP + 0.312, -0.756]} color="#ff5a3a" radius={0.008} period={1.5} phase={0.6} />

      <Beacon p={[0.58, CELL_ROOF_TOP + 0.004, -0.66]} />

      {/* Cold light spilling out of the gate onto the aisle. */}
      <ContactShadow p={[CELL_CX, FLOOR_Y, CELL_CZ]} radius={0.85} opacity={0.5} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Security terminal                                                   */
/* ------------------------------------------------------------------ */

const SecurityTerminal = () => (
  <group position={[0.2, FLOOR_Y, -0.98]} rotation={[0, -0.16, 0]}>
    <RBox size={[0.26, 0.04, 0.26]} radius={0.008} color="#2c353b" p={[0, 0.02, 0]} ink={false} />
    <RBox size={[0.16, 0.86, 0.16]} radius={0.008} material={surface('#3a444b', 'paint')} p={[0, 0.47, 0]} ink={false} />
    <Panel size={[0.12, 0.085]} texture={keypadTexture()} p={[0, 0.8, 0.081]} />
    <Torus radius={0.036} tube={0.006} color="#8a939a" r={[0, 0, 0]} p={[0, 0.69, 0.084]} />
    <Cyl radius={0.027} height={0.026} color="#b23c2b" r={[Math.PI / 2, 0, 0]} p={[0, 0.69, 0.086]} ink={false} />
    <Glow color="#ff5a3a" size={0.18} opacity={0.14} p={[0, 0.69, 0.1]} />
    <group position={[0, 1.02, 0.01]} rotation={[-0.36, 0, 0]}>
      <RBox size={[0.34, 0.25, 0.05]} radius={0.012} color="#232b31" ink={false} />
      <Panel size={[0.31, 0.22]} texture={voteScreenTexture()} p={[0, 0, 0.028]} />
      <Glow color="#e0877a" size={0.42} opacity={0.12} p={[0, 0, 0.12]} />
    </group>
    <Box size={[0.08, 0.09, 0.05]} color="#333c43" p={[0, 0.93, -0.01]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Floor furniture and props                                           */
/* ------------------------------------------------------------------ */

const Chair = () => {
  const spokes = Array.from({length: 4}, (_, index) => {
    const angle = (index / 4) * Math.PI * 2 + 0.3;
    return {angle, x: Math.sin(angle) * 0.13, z: Math.cos(angle) * 0.13};
  });
  return (
    <group position={[-0.8, FLOOR_Y, -0.55]} rotation={[0, -0.62, 0]}>
      <RBox size={[0.34, 0.07, 0.31]} radius={0.03} color="#3c4d5c" p={[0, 0.46, 0]} ink={false} />
      <RBox size={[0.32, 0.3, 0.055]} radius={0.025} color="#3c4d5c" p={[0, 0.66, 0.15]} r={[0.14, 0, 0]} ink={false} />
      <Box size={[0.05, 0.2, 0.05]} color="#4b5760" p={[0, 0.55, 0.13]} r={[0.16, 0, 0]} ink={false} />
      <Cyl radius={0.022} height={0.32} color="#4b5760" p={[0, 0.28, 0]} ink={false} />
      <Cyl radius={0.055} height={0.03} color="#333c43" p={[0, 0.11, 0]} ink={false} />
      {spokes.map((spoke) => (
        <Box key={spoke.angle} size={[0.03, 0.024, 0.3]} color="#48545d" p={[spoke.x, 0.09, spoke.z]} r={[0, spoke.angle, 0]} ink={false} />
      ))}
      <ContactShadow p={[0, 0, 0]} radius={0.34} opacity={0.4} />
    </group>
  );
};

const cautionSignTexture = () =>
  canvasTexture('security/caution', 256, 320, (ctx, width, height) => {
    ctx.fillStyle = '#d3ad3e';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1b2126';
    ctx.fillRect(0, 0, width, 50);
    text(ctx, '注意', 14, 36, {size: 25, weight: 800, font: FONT_SANS, color: '#e8c45a'});
    text(ctx, 'CAUTION', width - 14, 34, {size: 13, weight: 700, font: FONT_MONO, color: '#e8c45a', align: 'right', tracking: 2});
    ctx.strokeStyle = '#1b2126';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(width / 2, 84);
    ctx.lineTo(width / 2 + 62, 190);
    ctx.lineTo(width / 2 - 62, 190);
    ctx.closePath();
    ctx.stroke();
    text(ctx, '!', width / 2, 176, {size: 62, weight: 800, font: FONT_SANS, color: '#1b2126', align: 'center'});
    text(ctx, '隔离进行中', width / 2, 236, {size: 25, weight: 800, font: FONT_SANS, color: '#1b2126', align: 'center', tracking: 2});
    text(ctx, 'CONTAINMENT IN PROGRESS', width / 2, 262, {size: 10, weight: 700, font: FONT_MONO, color: '#3f3520', align: 'center', tracking: 1});
    ctx.fillStyle = '#1b2126';
    ctx.fillRect(0, height - 40, width, 40);
    text(ctx, 'KEEP CLEAR · 禁止靠近', width / 2, height - 15, {size: 11, weight: 700, font: FONT_MONO, color: '#e8c45a', align: 'center', tracking: 1});
    grain(ctx, width, height, {seed: 19, count: 900, alpha: 0.06, size: 1.2});
  });

const CautionSign = () => (
  <group position={[-0.52, FLOOR_Y, 1.12]} rotation={[0, 0.28, 0]}>
    <Panel size={[0.3, 0.42]} texture={cautionSignTexture()} color="#ddd3b4" doubleSide r={[-0.22, 0, 0]} p={[0, 0.19, 0.045]} />
    <Panel size={[0.3, 0.42]} texture={cautionSignTexture()} color="#ddd3b4" doubleSide r={[0.22, 0, 0]} p={[0, 0.19, -0.045]} />
    <Box size={[0.31, 0.02, 0.026]} color="#3a3a30" p={[0, 0.392, 0]} ink={false} shadow={false} />
    <ContactShadow p={[0, 0, 0]} radius={0.24} opacity={0.35} />
  </group>
);

const Stool = () => (
  <group position={[0.22, FLOOR_Y, 0.16]} rotation={[0, 0.5, 0]}>
    <Cyl radius={0.155} height={0.06} color="#40515f" p={[0, 0.48, 0]} ink={false} />
    <Cyl radius={0.13} height={0.022} color="#2f3d48" p={[0, 0.447, 0]} ink={false} />
    <Cyl radius={0.02} height={0.36} color="#4b5760" p={[0, 0.27, 0]} ink={false} />
    <Cyl radius={0.17} height={0.028} color="#333c43" p={[0, 0.04, 0]} ink={false} />
  </group>
);

const ToolCart = () => (
  <group position={[-1.36, FLOOR_Y, 0.5]} rotation={[0, 0.22, 0]}>
    <RBox size={[0.42, 0.52, 0.34]} radius={0.012} color="#3f5d6b" p={[0, 0.36, 0]} ink={false} />
    <RBox size={[0.46, 0.028, 0.37]} radius={0.006} color="#5b656d" p={[0, 0.635, 0]} ink={false} />
    {[0.24, 0.4, 0.54].map((y) => (
      <Box key={y} size={[0.38, 0.1, 0.012]} color="#35505d" p={[0, y, 0.172]} ink={false} />
    ))}
    <Box size={[0.13, 0.016, 0.02]} color="#9fb0b8" p={[0, 0.425, 0.181]} ink={false} shadow={false} />
    <Box size={[0.36, 0.075, 0.28]} color="#263036" p={[0, 0.038, 0]} ink={false} />
    <Cyl radius={0.03} height={0.024} color="#1c2327" r={[0, 0, Math.PI / 2]} p={[0.14, 0.03, 0.15]} ink={false} />
    <Cyl radius={0.03} height={0.024} color="#1c2327" r={[0, 0, Math.PI / 2]} p={[-0.14, 0.03, 0.15]} ink={false} />
    <Box size={[0.34, 0.018, 0.018]} color="#8d99a2" p={[0, 0.64, -0.19]} ink={false} shadow={false} />
    <RBox size={[0.2, 0.03, 0.14]} radius={0.006} color="#2c353b" p={[-0.08, 0.664, 0.03]} ink={false} />
    <Box size={[0.03, 0.018, 0.03]} color="#b58a34" p={[-0.12, 0.688, 0.03]} ink={false} shadow={false} />
    <ContactShadow p={[0, 0, 0]} radius={0.36} opacity={0.45} />
  </group>
);

const QuarantineShelf = () => (
  <group position={[1.26, FLOOR_Y, 0.34]} rotation={[0, -0.26, 0]}>
    <Box size={[0.035, 0.94, 0.28]} material={surface('#414c54', 'paint')} p={[-0.32, 0.47, 0]} ink={false} />
    <Box size={[0.035, 0.94, 0.28]} material={surface('#414c54', 'paint')} p={[0.32, 0.47, 0]} ink={false} />
    {[0.22, 0.54, 0.86].map((y) => (
      <Box key={y} size={[0.68, 0.022, 0.28]} color="#4c575f" p={[0, y, 0]} ink={false} />
    ))}
    {/* Sealed crates. */}
    <RBox size={[0.26, 0.22, 0.19]} radius={0.006} color="#b99a6a" p={[-0.16, 0.341, 0.01]} ink={false} />
    <Panel size={[0.15, 0.056]} texture={labelTagTexture('A3 · CTX', '#e0877a', 'SEALED')} p={[-0.16, 0.35, 0.107]} />
    <Box size={[0.27, 0.02, 0.2]} color="#8f7350" p={[-0.16, 0.45, 0.01]} ink={false} shadow={false} />
    <RBox size={[0.22, 0.18, 0.19]} radius={0.006} color="#8f9ba1" p={[0.17, 0.321, 0.01]} ink={false} />
    <Panel size={[0.14, 0.05]} texture={labelTagTexture('RAG', '#e0b45a', 'POISON')} p={[0.17, 0.33, 0.107]} />
    <RBox size={[0.3, 0.16, 0.2]} radius={0.006} color="#4a565e" p={[-0.1, 0.63, 0.01]} ink={false} />
    <Panel size={[0.18, 0.06]} texture={labelTagTexture('MEMORY', '#7fc8b8', 'FROZEN')} p={[-0.1, 0.63, 0.112]} />
    <RBox size={[0.2, 0.12, 0.18]} radius={0.006} color="#8d979d" p={[0.19, 0.92, 0.01]} r={[0, 0.16, 0]} ink={false} />
    <ContactShadow p={[0, 0, 0]} radius={0.4} opacity={0.42} />
  </group>
);

const FloorProps = () => (
  <group>
    {/* Hazard walkway from the bench to the gate. */}
    {Array.from({length: 4}, (_, index) => {
      const t = (index + 0.5) / 4;
      const x = -0.58 + 1.38 * t;
      const z = -0.78 + 0.38 * t;
      const angle = -Math.atan2(0.38, 1.38);
      return (
        <Panel
          key={index}
          size={[0.22, 0.14]}
          texture={hazardStripeTexture()}
          r={[-Math.PI / 2, 0, angle]}
          p={[x, FLOOR_Y + 0.004, z]}
        />
      );
    })}
    <Panel
      size={[0.36, 0.055]}
      texture={hazardStripeTexture()}
      r={[-Math.PI / 2, 0, 0]}
      p={[GATE_CX, FLOOR_Y + 0.005, CELL.z1 + 0.28]}
      opacity={1}
    />

    {/* Cable ramp where the trace line crosses the aisle. */}
    <RBox size={[0.34, 0.028, 0.16]} radius={0.008} material={surface('#3a444b', 'paint')} p={[0.04, FLOOR_Y + 0.014, -0.62]} r={[0, -0.25, 0]} ink={false} />
    <Panel size={[0.3, 0.032]} texture={hazardStripeTexture()} p={[0.04, FLOOR_Y + 0.029, -0.62]} r={[-Math.PI / 2, 0, -0.25]} />

    {/* Loose floor cables and a coil. */}
    <Cable points={[[-1.5, FLOOR_Y + 0.012, -1.4], [-1.62, FLOOR_Y + 0.012, -0.6], [-1.5, FLOOR_Y + 0.012, 0.2], [-1.58, FLOOR_Y + 0.012, 1.0]]} radius={0.007} color="#262e34" />
    <Torus radius={0.11} tube={0.012} color="#20272c" r={[Math.PI / 2, 0, 0]} p={[-1.16, FLOOR_Y + 0.014, 1.02]} ink={false} />

    {/* Biohazard bin by the walkway. */}
    <Cyl radius={0.085} height={0.27} color="#3b464d" p={[0.64, FLOOR_Y + 0.135, 0.86]} ink={false} />
    <Cyl radius={0.092} height={0.05} color="#a8382a" p={[0.64, FLOOR_Y + 0.292, 0.86]} ink={false} />
    <Panel size={[0.12, 0.08]} texture={labelTagTexture('BIO', '#e0b45a', 'CONTAIN')} p={[0.64, FLOOR_Y + 0.19, 0.947]} />
    <ContactShadow p={[0.64, FLOOR_Y, 0.86]} radius={0.15} opacity={0.35} />

    {/* Waste bin with a couple of paper balls. */}
    <Cyl radius={0.09} height={0.17} color="#3d474d" p={[-1.2, FLOOR_Y + 0.085, -0.86]} ink={false} />
    <Cyl radius={0.095} height={0.012} color="#59656e" p={[-1.2, FLOOR_Y + 0.172, -0.86]} ink={false} shadow={false} />

    {/* Extinguisher by the open edge. */}
    <Cyl radius={0.048} height={0.26} color="#a8382a" p={[-1.66, FLOOR_Y + 0.13, -0.35]} ink={false} />
    <Cyl radius={0.03} height={0.032} color="#7f2a20" p={[-1.66, FLOOR_Y + 0.276, -0.35]} ink={false} />
    <Box size={[0.05, 0.025, 0.05]} color="#2c353b" p={[-1.66, FLOOR_Y + 0.3, -0.35]} ink={false} />
    <Cable points={[[-1.64, FLOOR_Y + 0.25, -0.33], [-1.58, FLOOR_Y + 0.34, -0.3], [-1.6, FLOOR_Y + 0.3, -0.26]]} radius={0.008} color="#22282c" />
    <ContactShadow p={[-1.66, FLOOR_Y, -0.35]} radius={0.16} opacity={0.4} />

    {/* Red pools of beacon light on the floor. */}
    <Panel size={[1.5, 1.3]} texture={lightPoolTexture('#d4635a', 0.4)} additive opacity={0.12} r={[-Math.PI / 2, 0, 0]} p={[0.72, FLOOR_Y + 0.006, -0.02]} />
    <Panel size={[1.7, 1.5]} texture={lightPoolTexture('#9fd4e8', 0.35)} additive opacity={0.16} r={[-Math.PI / 2, 0, 0]} p={[-0.7, FLOOR_Y + 0.006, -0.85]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Ceiling services                                                    */
/* ------------------------------------------------------------------ */

const CeilingServices = () => (
  <group>
    {/* Linear LED fixture over the bench, on a wall arm. */}
    <Pipe from={[-0.86, 1.68, -1.665]} to={[-0.86, 1.68, -1.12]} radius={0.011} color="#5a666f" />
    <Pipe from={[-0.86, 1.68, -1.12]} to={[-0.86, 1.575, -1.12]} radius={0.011} color="#5a666f" />
    <Box size={[0.92, 0.045, 0.12]} color="#3c464e" p={[-0.86, 1.555, -1.12]} ink inkWidth={0.005} shadow={false} />
    <Box size={[0.84, 0.012, 0.08]} material={flat('#e2f2ff')} p={[-0.86, 1.53, -1.12]} ink={false} shadow={false} />
    <Glow color="#cfe8f8" size={1.05} opacity={0.16} p={[-0.86, 1.5, -1.11]} />
    <pointLight position={[-0.86, 1.4, -0.98]} color="#d6ecfa" intensity={1.15} distance={2.4} decay={2} />

    {/* Round duct along the side wall. */}
    <Cyl radius={0.065} height={2.7} color="#47545e" r={[Math.PI / 2, 0, 0]} p={[SIDE_FACE - 0.12, 1.655, -0.28]} ink={false} />
    {[-0.9, 0.5].map((z) => (
      <Box key={z} size={[0.13, 0.03, 0.03]} color="#4a565e" p={[SIDE_FACE - 0.06, 1.66, z]} ink={false} shadow={false} />
    ))}

    {/* Ceiling cable drop to the cell roof. */}
    <Cable points={[[1.2, 1.58, -1.57], [1.16, 1.42, -1.2], [1.08, 1.2, -1.0], [1.02, 1.13, -0.94]]} radius={0.011} color="#1e252a" />
    <Cable points={[[1.35, 1.58, -1.57], [1.3, 1.36, -1.1], [1.24, 1.15, -0.86]]} radius={0.008} color="#2a3238" />
    <Box size={[0.1, 0.05, 0.13]} material={surface('#3a444b', 'paint')} p={[1.14, 1.15, -0.9]} ink={false} />

  </group>
);

/* ------------------------------------------------------------------ */
/* Contamination trace                                                 */
/* ------------------------------------------------------------------ */

const TRACE_POINTS: Vec3[] = [
  [-0.98, 0.66, -1.02],
  [-1.1, 0.32, -0.95],
  [-1.13, 0.1, -0.8],
  [-0.82, 0.078, -0.6],
  [-0.34, 0.078, -0.55],
  [0.1, 0.086, -0.62],
  [0.52, 0.078, -0.55],
  [0.72, 0.09, -0.47],
  [0.735, 0.46, -0.45],
  [0.74, 0.74, -0.46],
];
const TRACE_CURVE = new CatmullRomCurve3(TRACE_POINTS.map((point) => new Vector3(point[0], point[1], point[2])));
const TRACE_DOTS = 5;

const ContaminationTrace = ({demo}: {demo?: SceneDemo}) => {
  const quality = useQuality();
  const clean = demo?.variant === 1;
  const traceColor = clean ? '#8fd4c8' : '#ff6a44';
  const dots = useRef<Array<Mesh | null>>([]);
  const gateLight = useRef<PointLight>(null);
  const gateGlow = useRef<Group>(null);
  useFrame(({clock}) => {
    const cycle = quality.reducedMotion ? 9 : clock.elapsedTime % 14;
    const travel = demo ? (demo.step + 1) / 3 : Math.min(1, Math.max(0, (cycle - 0.8) / 7.4));
    const appear = Math.min(1, cycle / 0.9) * (cycle > 12.2 ? Math.max(0, 1 - (cycle - 12.2) / 1.4) : 1);
    const arrived = travel >= 1;
    dots.current.forEach((node, index) => {
      if (!node) return;
      const local = Math.min(1, Math.max(0, travel * 1.3 - index * 0.052));
      TRACE_CURVE.getPointAt(local, node.position);
      const pulse = arrived && !quality.reducedMotion ? 0.82 + Math.sin(clock.elapsedTime * 3 + index * 1.1) * 0.18 : 1;
      node.scale.setScalar(appear * pulse);
      node.visible = appear > 0.02;
    });
    if (gateLight.current) gateLight.current.intensity = arrived ? 0.7 : 0.14;
    if (gateGlow.current) gateGlow.current.scale.setScalar(arrived ? 1.4 : 0.7);
  });
  return (
    <group>
      <Cable points={TRACE_POINTS} radius={0.008} color="#1a2025" />
      <Cable points={TRACE_POINTS} radius={0.013} color="#3a2a28" />
      {Array.from({length: TRACE_DOTS}, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            dots.current[index] = node;
          }}
          geometry={sphereGeometry(0.019, 10, 8)}
          material={flat(traceColor)}
        />
      ))}
      <group ref={gateGlow} position={[0.74, 0.78, -0.45]}>
        <Glow color={traceColor} size={0.34} opacity={0.28} p={[0, 0, 0.02]} />
        <pointLight ref={gateLight} color={traceColor} intensity={0.2} distance={0.85} decay={2} />
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * Scene 05 — 防御实验室 / DEFENSE LAB.
 * A small agent-contamination testbed at night: a monitoring bench tracing the
 * agent chain, a glass isolation cell with a detection gate, warning beacon,
 * quarantine crates and the red trace that crawls along the floor cable until
 * the gate blocks it.
 */
export const SecurityScene = ({demo}: {demo?: SceneDemo}) => {
  const meta = getScene('security');
  return (
    <group>
      <RoomLights shadowMapSize={2048} color="#d9e6f0" intensity={1.8} fill="#546b80" />
      <DioramaBase meta={meta} footprint={[3.6, 3.6]} subtitle="1:18 / SECURITY LAB" />
      <LabShell />
      <CeilingServices />
      <WallServices />
      <Console />
      <ContainmentCell />
      <SecurityTerminal />
      <Chair />
      <Stool />
      <CautionSign />
      <ToolCart />
      <QuarantineShelf />
      <FloorProps />
      <ContaminationTrace demo={demo} />
    </group>
  );
};
