import {surface} from '../../three/surfaces';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Mesh, MeshBasicMaterial, PointLight} from 'three';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {Box, Cable, Cyl, Glow, Panel, RBox, Sphere, type Vec3} from '../../three/kit/primitives';
import {RoomLights} from '../../three/kit/lighting';
import {
  canvasTexture,
  FONT_MONO,
  FONT_SANS,
  FONT_SERIF,
  grain,
  rng,
  rr,
  softGlow,
  text,
  withAlpha,
  verticalGradient,
} from '../../three/canvas';
import {
  binderSpinesTexture,
  clockFaceTexture,
  commandMapTexture,
  feltTexture,
  graphScreenTexture,
  keyboardTexture,
  labelTagTexture,
  sopPosterTexture,
  statusBoardTexture,
  terminalScreenTexture,
} from '../../three/textures';
import {flat, glass, toon} from '../../three/materials';
import {getScene} from '../../data/scenes';

/* ------------------------------------------------------------------ */
/* Local painted textures                                              */
/* ------------------------------------------------------------------ */

/** Cool grey-blue tile floor with a soft scuffed border. */
const commandFloor = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/floor', 1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = '#b4c0c1';
    ctx.fillRect(0, 0, width, height);
    const random = rng(244);
    const tile = 128;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const shade = 196 + random() * 12;
        ctx.fillStyle = `rgba(${shade}, ${shade + 5}, ${shade + 6}, 0.55)`;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x + 2, y + 2, tile - 4, 2);
      }
    }
    ctx.strokeStyle = 'rgba(116, 130, 132, 0.35)';
    ctx.lineWidth = 2;
    for (let value = 0; value <= width; value += tile) {
      ctx.beginPath();
      ctx.moveTo(value, 0);
      ctx.lineTo(value, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, value);
      ctx.lineTo(width, value);
      ctx.stroke();
    }
    for (let index = 0; index < 26; index += 1) {
      ctx.fillStyle = `rgba(64, 78, 80, ${0.03 + random() * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 12 + random() * 60, 5 + random() * 22, random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Darker threshold along the two walls.
    ctx.fillStyle = 'rgba(44, 58, 60, 0.16)';
    ctx.fillRect(0, 0, width, 26);
    ctx.fillRect(0, 0, 26, height);
    grain(ctx, width, height, {seed: 8, count: 2200, alpha: 0.05, size: 1.4, colors: ['#ffffff', '#425252']});
  });

/** Pale blue-white command-room wall with panel seams and a teal pinstripe. */
const commandWall = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/wall', 1024, 512, (ctx, width, height) => {
    ctx.fillStyle = '#c9d6d4';
    ctx.fillRect(0, 0, width, height);
    const random = rng(319);
    grain(ctx, width, height, {seed: 44, count: 2400, alpha: 0.035, size: 1.6, colors: ['#ffffff', '#53696c']});
    for (let index = 1; index < 4; index += 1) {
      ctx.strokeStyle = 'rgba(122, 146, 148, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((index * width) / 4, 0);
      ctx.lineTo((index * width) / 4, height);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(122, 146, 148, 0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.63);
    ctx.lineTo(width, height * 0.63);
    ctx.stroke();
    // Teal acoustic strip near the ceiling.
    ctx.fillStyle = 'rgba(143, 212, 200, 0.5)';
    ctx.fillRect(0, 24, width, 6);
    ctx.fillStyle = 'rgba(143, 212, 200, 0.16)';
    ctx.fillRect(0, 30, width, 10);
    // Scuffs around hand height.
    for (let index = 0; index < 34; index += 1) {
      ctx.fillStyle = `rgba(90, 108, 110, ${0.02 + random() * 0.04})`;
      ctx.fillRect(random() * width, height * (0.5 + random() * 0.4), 6 + random() * 26, 2 + random() * 4);
    }
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.05)'],
      [0.72, 'rgba(0,0,0,0)'],
      [1, 'rgba(48, 64, 66, 0.12)'],
    ]);
  });

/** Acrylic room sign above the wall map. */
const roomSign = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/roomSign', 1024, 128, (ctx, width, height) => {
    ctx.fillStyle = '#1e2b2f';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#8fd4c8';
    ctx.fillRect(0, 0, 12, height);
    text(ctx, 'EMERGENCY COMMAND', 36, 54, {size: 33, weight: 800, font: FONT_SANS, color: '#eef6f3', tracking: 4});
    text(ctx, '应急指挥室 / EKG · SOP-2026', 38, 95, {size: 22, weight: 600, font: FONT_SERIF, color: '#9fcac3'});
    text(ctx, 'LLM4EKG', width - 34, 54, {size: 21, weight: 700, font: FONT_MONO, color: '#8fd4c8', align: 'right', tracking: 2});
    text(ctx, 'KNOWLEDGE GRAPH OPS', width - 34, 92, {size: 13, weight: 600, font: FONT_MONO, color: '#7f9aa2', align: 'right', tracking: 1});
    ctx.strokeStyle = withAlpha('#8fd4c8', 0.35);
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, width - 4, height - 4);
  });

/** Document ingestion pipeline screen. */
const parseScreen = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/parse', 512, 320, (ctx, width, height) => {
    ctx.fillStyle = '#0d181d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#15252b';
    ctx.fillRect(0, 0, width, 38);
    ctx.fillStyle = '#8fd4c8';
    ctx.fillRect(0, 38, width, 2);
    text(ctx, 'DOC PARSE / INGEST PIPELINE', 18, 25, {size: 13, weight: 700, font: FONT_MONO, color: '#a8d8d0', tracking: 1});
    ctx.fillStyle = '#7fbf9a';
    ctx.beginPath();
    ctx.arc(width - 26, 19, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'LIVE', width - 38, 24, {size: 10, weight: 700, font: FONT_MONO, color: '#7fbf9a', align: 'right'});

    // Source document.
    ctx.fillStyle = '#e8e4d6';
    rr(ctx, 20, 56, 110, 164, 4);
    ctx.fill();
    ctx.fillStyle = '#b8402f';
    ctx.fillRect(20, 56, 110, 20);
    text(ctx, 'SOP-07', 30, 71, {size: 12, weight: 700, font: FONT_MONO, color: '#f6ece0'});
    text(ctx, 'PDF / 38p', width - 122, 96, {size: 10, weight: 600, font: FONT_MONO, color: '#7f8f92', align: 'right'});
    const random = rng(55);
    for (let index = 0; index < 14; index += 1) {
      ctx.fillStyle = index < 9 ? 'rgba(64, 70, 72, 0.42)' : 'rgba(184, 64, 47, 0.4)';
      ctx.fillRect(30, 92 + index * 9, 76 * (0.5 + random() * 0.5), 2.5);
    }
    // Arrow.
    ctx.strokeStyle = 'rgba(143, 212, 200, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(136, 138);
    ctx.lineTo(158, 138);
    ctx.stroke();
    ctx.fillStyle = 'rgba(143, 212, 200, 0.7)';
    ctx.beginPath();
    ctx.moveTo(158, 138);
    ctx.lineTo(151, 134);
    ctx.lineTo(151, 142);
    ctx.closePath();
    ctx.fill();

    // Pipeline steps.
    text(ctx, 'OCR / LAYOUT', 168, 70, {size: 11, weight: 700, font: FONT_MONO, color: '#7f9aa2', tracking: 1});
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    rr(ctx, 168, 78, 150, 7, 4);
    ctx.fill();
    ctx.fillStyle = '#5fbfae';
    rr(ctx, 168, 78, 118, 7, 4);
    ctx.fill();
    text(ctx, '2,481 tokens', 320, 85, {size: 10, weight: 600, font: FONT_MONO, color: '#8fd4c8', align: 'right'});

    const sections = [
      ['3.2', '応急対応', '12 rules'],
      ['4.1', '情報共有', '7 rules'],
      ['5.1', '避難誘導', '9 rules'],
      ['ANX-B', '連絡先', '24 ent.'],
    ] as const;
    sections.forEach(([code, label, count], index) => {
      const y = 98 + index * 29;
      ctx.fillStyle = index === 2 ? 'rgba(143, 212, 200, 0.12)' : 'rgba(255,255,255,0.035)';
      rr(ctx, 168, y, 150, 24, 3);
      ctx.fill();
      ctx.fillStyle = index === 2 ? '#8fd4c8' : '#6f8f96';
      ctx.fillRect(168, y, 3, 24);
      text(ctx, code, 178, y + 16, {size: 10, weight: 700, font: FONT_MONO, color: '#9fc4c8'});
      text(ctx, label, 220, y + 16, {size: 11, weight: 600, font: FONT_SANS, color: '#cfe0e0'});
      text(ctx, count, 312, y + 16, {size: 9, weight: 600, font: FONT_MONO, color: '#7f9aa2', align: 'right'});
    });

    // Extracted entities / rules.
    ctx.fillStyle = 'rgba(8, 20, 24, 0.85)';
    rr(ctx, 336, 56, 156, 164, 4);
    ctx.fill();
    text(ctx, 'EXTRACT', 348, 76, {size: 11, weight: 700, font: FONT_MONO, color: '#7f9aa2', tracking: 1});
    const chips = [
      ['RULE', '07-A', '#e0b45a'],
      ['ENTITY', '24', '#8fd4c8'],
      ['REL', '38', '#8fd4c8'],
      ['SOP', '07', '#8fd4c8'],
    ] as const;
    chips.forEach(([kind, value, color], index) => {
      const y = 88 + index * 28;
      ctx.fillStyle = withAlpha(color, 0.12);
      rr(ctx, 348, y, 132, 22, 3);
      ctx.fill();
      text(ctx, kind, 358, y + 15, {size: 9, weight: 700, font: FONT_MONO, color: '#8fa4aa'});
      text(ctx, value, 470, y + 15, {size: 12, weight: 700, font: FONT_MONO, color, align: 'right'});
    });
    softGlow(ctx, 400, 196, 18, withAlpha('#e0b45a', 0.5));

    // Footer status.
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, height - 52, width, 1);
    ctx.fillStyle = '#7fbf9a';
    ctx.beginPath();
    ctx.arc(24, height - 28, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'PIPELINE OK ·  4 SECTIONS COMMITTED', 36, height - 24, {size: 10, weight: 600, font: FONT_MONO, color: '#8fb0b4'});
    ctx.fillStyle = '#e0b45a';
    ctx.beginPath();
    ctx.arc(width - 88, height - 28, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '1 WARN', width - 76, height - 24, {size: 10, weight: 700, font: FONT_MONO, color: '#e0b45a'});
    grain(ctx, width, height, {seed: 3, count: 700, alpha: 0.035, size: 1.2});
  });

/** Entity + rule extraction screen. */
const entityScreen = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/entity', 512, 320, (ctx, width, height) => {
    ctx.fillStyle = '#0d181d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#15252b';
    ctx.fillRect(0, 0, width, 38);
    ctx.fillStyle = '#e0b45a';
    ctx.fillRect(0, 38, width, 2);
    text(ctx, 'ENTITY / RULE EXTRACTION', 18, 25, {size: 13, weight: 700, font: FONT_MONO, color: '#e0d8c0', tracking: 1});
    text(ctx, 'SOP-07', width - 18, 25, {size: 11, weight: 600, font: FONT_MONO, color: '#7f9aa2', align: 'right'});

    // Source paragraph with highlighted spans.
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    rr(ctx, 18, 54, 236, 220, 4);
    ctx.fill();
    text(ctx, '§3.2  応急対応', 30, 76, {size: 11, weight: 700, font: FONT_MONO, color: '#7f9aa2'});
    const lines = [
      ['台風警報が発令された場合、', '#8fd4c8'],
      ['学校は直ちに授業を中止し、', '#e0b45a'],
      ['在校生を屋内待避させる。', '#8fd4c8'],
      ['教務部は教育局へ第一報を', '#e0b45a'],
      ['30分以内に提出する。', '#8fd4c8'],
    ] as const;
    lines.forEach(([line, color], index) => {
      const y = 100 + index * 22;
      ctx.fillStyle = withAlpha(color, 0.1);
      ctx.fillRect(28, y - 13, 216, 18);
      text(ctx, line, 34, y, {size: 13, weight: 500, font: FONT_SANS, color: '#cfe0e0'});
    });
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(28, 220, 216, 1);
    text(ctx, 'ENTITIES 24  ·  RULES 7  ·  REL 38', 30, 242, {size: 10, weight: 600, font: FONT_MONO, color: '#8fb0b4'});
    text(ctx, 'span confidence  0.94', 30, 260, {size: 10, weight: 600, font: FONT_MONO, color: '#7fbf9a'});

    // Extracted triples.
    const triples = [
      ['台風', 'で', '学校', '#8fd4c8'],
      ['学校', 'は', '屋内待避', '#e0b45a'],
      ['教務部', '→', '教育局', '#8fd4c8'],
    ] as const;
    triples.forEach(([from, relation, to, color], index) => {
      const y = 76 + index * 46;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, 270, y - 22, 226, 36, 4);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, from, 280, y, {size: 12, weight: 700, font: FONT_SANS, color: '#d8e8e4'});
      text(ctx, relation, 334, y, {size: 10, weight: 600, font: FONT_MONO, color: '#7f9aa2', align: 'center'});
      text(ctx, to, 486, y, {size: 12, weight: 700, font: FONT_SANS, color, align: 'right'});
    });
    ctx.fillStyle = withAlpha('#e0b45a', 0.12);
    rr(ctx, 270, 196, 226, 58, 4);
    ctx.fill();
    text(ctx, 'RULE-07A', 282, 216, {size: 11, weight: 700, font: FONT_MONO, color: '#e0b45a'});
    text(ctx, 'IF 台風警報 THEN 授業中止', 282, 238, {size: 11, weight: 600, font: FONT_SANS, color: '#e8dcc0'});
    text(ctx, 'evidence: §3.2 / §5.1', 282, 252, {size: 9, weight: 600, font: FONT_MONO, color: '#9fae9a'});
    grain(ctx, width, height, {seed: 9, count: 700, alpha: 0.035, size: 1.2});
  });

/** A printed evacuation map sheet pinned to the wall or lying on the desk. */
const printedMap = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/printedMap', 256, 340, (ctx, width, height) => {
    ctx.fillStyle = '#e9e6d9';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f4f1e6';
    ctx.fillRect(10, 10, width - 20, height - 20);
    text(ctx, 'EVACUATION ROUTE', 20, 36, {size: 13, weight: 800, font: FONT_MONO, color: '#3a474c', tracking: 1});
    text(ctx, 'REGION-07 / SHEET 03', 20, 52, {size: 8, weight: 600, font: FONT_MONO, color: '#7f8a8a'});
    ctx.strokeStyle = 'rgba(58, 72, 76, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 62, width - 28, height - 92);
    // Blocks.
    const random = rng(73);
    const blocks = [
      ['#c3d0c8', 24, 74, 62, 46],
      ['#d6cdb9', 100, 74, 72, 34],
      ['#c3d0c8', 186, 74, 48, 58],
      ['#d6cdb9', 24, 136, 44, 64],
      ['#c3d0c8', 82, 124, 60, 40],
      ['#d6cdb9', 154, 144, 50, 54],
      ['#c3d0c8', 24, 216, 84, 52],
      ['#d6cdb9', 122, 212, 108, 56],
    ] as const;
    for (const [color, x, y, w, h] of blocks) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, y, w, 2);
    }
    // Roads.
    ctx.fillStyle = '#f2eee1';
    ctx.fillRect(14, 118, width - 28, 10);
    ctx.fillRect(88, 62, 9, height - 92);
    // Route.
    ctx.strokeStyle = '#c8503f';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 282);
    ctx.lineTo(92, 282);
    ctx.lineTo(92, 198);
    ctx.lineTo(170, 198);
    ctx.lineTo(170, 100);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c8503f';
    ctx.beginPath();
    ctx.arc(170, 100, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'A', 168, 104, {size: 9, weight: 800, font: FONT_MONO, color: '#f4f1e6', align: 'center'});
    // Legend.
    ctx.fillStyle = '#3a474c';
    ctx.fillRect(20, height - 24, 26, 3);
    text(ctx, 'ASSEMBLY / 避難所', 52, height - 18, {size: 7, weight: 600, font: FONT_SANS, color: '#4a565a'});
    ctx.fillStyle = '#c8503f';
    ctx.fillRect(150, height - 24, 26, 3);
    text(ctx, 'ROUTE', 182, height - 18, {size: 7, weight: 600, font: FONT_MONO, color: '#4a565a'});
    // Fold lines.
    ctx.strokeStyle = 'rgba(120, 118, 106, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, height / 2);
    ctx.lineTo(width - 10, height / 2);
    ctx.stroke();
    void random;
  });

/** Sloped desk console face with channel buttons. */
const consolePanel = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/console', 512, 128, (ctx, width, height) => {
    ctx.fillStyle = '#232f33';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1b2528';
    ctx.fillRect(0, 0, width, 28);
    text(ctx, 'INCIDENT CONSOLE / CH-04', 14, 19, {size: 11, weight: 700, font: FONT_MONO, color: '#9fc4c4', tracking: 1});
    const random = rng(41);
    const colors = ['#8fd4c8', '#8fd4c8', '#e0b45a', '#5f8f96', '#8fd4c8'];
    for (let index = 0; index < 10; index += 1) {
      const x = 16 + (index % 5) * 52;
      const y = 42 + Math.floor(index / 5) * 34;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, x, y, 42, 22, 3);
      ctx.fill();
      ctx.fillStyle = colors[index % colors.length] ?? '#8fd4c8';
      ctx.globalAlpha = 0.55 + random() * 0.4;
      rr(ctx, x + 6, y + 6, 30, 5, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      text(ctx, `0${index + 1}`, x + 6, y + 19, {size: 7, weight: 600, font: FONT_MONO, color: '#7f9498'});
    }
    ctx.fillStyle = '#b8402f';
    ctx.beginPath();
    ctx.arc(width - 26, 90, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'TX', width - 26, 94, {size: 9, weight: 800, font: FONT_MONO, color: '#f4e6da', align: 'center'});
    ctx.strokeStyle = withAlpha('#8fd4c8', 0.25);
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, width - 6, height - 6);
  });

/** Green emergency exit sign above the side door. */
const exitSign = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/exit', 256, 96, (ctx, width, height) => {
    ctx.fillStyle = '#1f6a4f';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = withAlpha('#d8f0dc', 0.55);
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    // Door + running arrow.
    ctx.fillStyle = '#e8f4e8';
    ctx.fillRect(22, 28, 30, 44);
    ctx.fillStyle = '#1f6a4f';
    ctx.fillRect(27, 34, 20, 38);
    ctx.fillStyle = '#e8f4e8';
    ctx.beginPath();
    ctx.moveTo(64, 50);
    ctx.lineTo(86, 50);
    ctx.lineTo(86, 38);
    ctx.lineTo(108, 56);
    ctx.lineTo(86, 74);
    ctx.lineTo(86, 62);
    ctx.lineTo(64, 62);
    ctx.closePath();
    ctx.fill();
    text(ctx, '安全出口', 122, 46, {size: 22, weight: 700, font: FONT_SANS, color: '#e8f4e8'});
    text(ctx, 'EMERGENCY EXIT', 122, 72, {size: 11, weight: 700, font: FONT_MONO, color: '#a8d8bc', tracking: 1});
    softGlow(ctx, width / 2, height / 2, 120, withAlpha('#bff0c8', 0.16));
  });

/** Small labelled system-status plate under the map. */
const statusPlate = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/statusPlate', 512, 128, (ctx, width, height) => {
    ctx.fillStyle = '#1b2529';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = withAlpha('#8fd4c8', 0.25);
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    text(ctx, 'SYSTEM STATUS', 18, 28, {size: 12, weight: 700, font: FONT_MONO, color: '#7f9aa2', tracking: 2});
    const labels = ['PWR', 'NET', 'SOP', 'KG', 'QA'];
    labels.forEach((label, index) => {
      const x = 62 + index * 92;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, x - 20, 42, 40, 22, 3);
      ctx.fill();
      text(ctx, label, x, 98, {size: 13, weight: 700, font: FONT_MONO, color: '#8fa4aa', align: 'center', tracking: 1});
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x - 40, 34, 1, 70);
    });
    ctx.fillStyle = 'rgba(143, 212, 200, 0.5)';
    ctx.fillRect(18, 58, 10, 2);
  });

/** Tiny keypad face for the desk phone. */
const phoneKeys = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/phoneKeys', 128, 96, (ctx) => {
    ctx.fillStyle = '#202a2d';
    ctx.fillRect(0, 0, 128, 96);
    for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
      for (let column = 0; column < 3; column += 1) {
        ctx.fillStyle = '#c8d2d0';
        rr(ctx, 12 + column * 30, 10 + rowIndex * 20, 22, 14, 3);
        ctx.fill();
        ctx.fillStyle = '#4a5658';
        ctx.fillRect(18 + column * 30, 16 + rowIndex * 20, 10, 2);
      }
    }
    ctx.fillStyle = '#8fd4c8';
    ctx.fillRect(104, 10, 14, 74);
    ctx.fillStyle = '#283437';
    ctx.fillRect(108, 18, 6, 10);
    ctx.fillRect(108, 34, 6, 10);
    ctx.fillRect(108, 50, 6, 10);
  });

/** Small green wall cabinet for the command room's first-aid kit. */
const firstAid = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/command/firstAid', 128, 160, (ctx, width, height) => {
    ctx.fillStyle = '#e6ece4';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c8d6d0';
    ctx.fillRect(0, 0, width, 18);
    text(ctx, 'FIRST AID', width / 2, 13, {size: 10, weight: 700, font: FONT_MONO, color: '#3d5a52', align: 'center', tracking: 1});
    ctx.fillStyle = '#b8402f';
    ctx.fillRect(width / 2 - 7, 42, 14, 58);
    ctx.fillRect(width / 2 - 30, 64, 60, 14);
    text(ctx, '応急処置', width / 2, 128, {size: 11, weight: 600, font: FONT_SANS, color: '#5f6c68', align: 'center'});
    ctx.strokeStyle = 'rgba(60, 80, 74, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.fillStyle = withAlpha('#ffffff', 0.3);
    ctx.fillRect(6, 20, width - 12, 2);
  });

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

const WALL_TOP = 1.7;

const Screen = ({
  p,
  r = [0, 0, 0],
  w,
  h,
  texture,
}: {
  p: Vec3;
  r?: Vec3;
  w: number;
  h: number;
  texture: ReturnType<typeof canvasTexture>;
}) => (
  <group position={p} rotation={r}>
    <RBox size={[w + 0.07, h + 0.07, 0.045]} radius={0.008} color="#253135" p={[0, 0, 0]} ink inkWidth={0.006} />
    <Panel size={[w, h]} texture={texture} p={[0, 0, 0.024]} />
    <Box size={[0.06, 0.022, 0.05]} color="#465559" p={[0, -h / 2 - 0.055, -0.005]} ink={false} shadow={false} />
  </group>
);

const OfficeChair = ({p, yaw = 0}: {p: Vec3; yaw?: number}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <RBox size={[0.34, 0.055, 0.32]} radius={0.02} color="#4c5d61" p={[0, 0.46, 0]} ink inkWidth={0.005} />
    <RBox size={[0.32, 0.38, 0.05]} radius={0.02} color="#55676b" p={[0, 0.7, 0.155]} r={[-0.13, 0, 0]} ink={false} />
    <Cyl radius={0.022} height={0.3} color="#8f9c9c" p={[0, 0.28, 0]} ink={false} />
    <Cyl radius={0.17} height={0.028} color="#3b494c" p={[0, 0.05, 0]} ink={false} />
    <Cyl radius={0.075} height={0.03} color="#2d393c" p={[0, 0.024, 0.1]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Wall: shell, map, screens                                           */
/* ------------------------------------------------------------------ */

const RoomShell = () => (
  <group>
    {/* Back wall */}
    <RBox
      size={[3.34, WALL_TOP, 0.12]}
      radius={0.006}
      segments={2}
      material={surface('#d7e2e1', 'plaster', commandWall())}
      p={[0, WALL_TOP / 2, -1.66]}
      ink
      inkWidth={0.012}
    />
    {/* Left wall */}
    <RBox
      size={[0.12, WALL_TOP, 3.34]}
      radius={0.006}
      segments={2}
      material={surface('#cfdcda', 'plaster', commandWall())}
      p={[-1.66, WALL_TOP / 2, 0]}
      ink
      inkWidth={0.012}
    />
    {/* Wall caps + skirting */}
    <Box size={[3.46, 0.035, 0.16]} color="#b7c5c3" p={[0, WALL_TOP + 0.017, -1.66]} ink={false} shadow={false} />
    <Box size={[0.16, 0.035, 3.46]} color="#b0bfbd" p={[-1.66, WALL_TOP + 0.017, 0]} ink={false} shadow={false} />
    <Box size={[3.3, 0.09, 0.035]} color="#a8b8b6" p={[0, 0.045, -1.585]} ink={false} />
    <Box size={[0.035, 0.09, 3.3]} color="#a0b1af" p={[-1.585, 0.045, 0]} ink={false} />

    {/* Door on the left wall, with a darker leaf so it reads as a door. */}
    <group>
      <Box size={[0.06, 0.07, 0.92]} color="#8fa3a1" p={[-1.56, 1.46, 0.78]} ink={false} />
      <Box size={[0.06, 1.46, 0.055]} color="#8fa3a1" p={[-1.56, 0.73, 0.35]} ink={false} />
      <Box size={[0.06, 1.46, 0.055]} color="#8fa3a1" p={[-1.56, 0.73, 1.21]} ink={false} />
      <Box size={[0.04, 1.4, 0.8]} color="#6f8a88" p={[-1.575, 0.7, 0.78]} ink={false} />
      <Box size={[0.015, 1.12, 0.015]} color="#46605f" p={[-1.55, 0.73, 0.4]} ink={false} shadow={false} />
      <Box size={[0.035, 0.38, 0.5]} color="#7f9896" material={glass('#bcd4d0', 0.35)} p={[-1.552, 1.02, 0.78]} ink={false} shadow={false} />
      <Box size={[0.03, 0.22, 0.78]} color="#b0c0bd" p={[-1.552, 0.11, 0.78]} ink={false} shadow={false} />
      <Box size={[0.035, 0.02, 0.1]} color="#c9d4d2" p={[-1.545, 0.74, 0.52]} ink={false} shadow={false} />
      <Box size={[0.02, 0.05, 0.52]} color="#b8c8c4" p={[-1.539, 1.02, 0.78]} ink={false} shadow={false} />
      {/* Exit sign + little alarm pull. */}
      <Panel size={[0.3, 0.115]} texture={exitSign()} r={[0, Math.PI / 2, 0]} p={[-1.585, 1.6, 0.78]} />
      <Box size={[0.02, 0.13, 0.09]} color="#b8c6c4" p={[-1.58, 1.24, 1.42]} ink={false} shadow={false} />
      <Box size={[0.016, 0.05, 0.05]} color="#b8402f" p={[-1.568, 1.24, 1.42]} ink={false} shadow={false} />
      {/* First-aid cabinet and extinguisher beside the door. */}
      <Box size={[0.055, 0.26, 0.2]} color="#e4e9e2" p={[-1.575, 1.12, 0.2]} ink={false} shadow={false} />
      <Panel size={[0.18, 0.22]} texture={firstAid()} r={[0, Math.PI / 2, 0]} p={[-1.545, 1.12, 0.2]} />
      <Cyl radius={0.048} height={0.3} color="#b83a2a" p={[-1.52, 0.16, 1.4]} ink={false} />
      <Cyl radius={0.018} height={0.06} color="#3a3a3a" p={[-1.52, 0.335, 1.4]} ink={false} shadow={false} />
      <Box size={[0.02, 0.12, 0.03]} color="#3a3a3a" p={[-1.545, 0.2, 1.4]} ink={false} shadow={false} />
    </group>

    {/* Door plate on the wall beside the frame. */}
    <Panel size={[0.24, 0.09]} texture={labelTagTexture('OPS 04', '#5fbfae', 'AUTHORIZED')} r={[0, Math.PI / 2, 0]} p={[-1.583, 1.34, 0.24]} />

    {/* Two printed maps and a binder rack on the left wall. */}
    <Panel size={[0.32, 0.42]} texture={printedMap()} r={[0.03, Math.PI / 2, 0.04]} p={[-1.588, 1.12, -0.12]} lit />
    <Panel size={[0.24, 0.32]} texture={printedMap()} r={[0.05, Math.PI / 2, -0.08]} p={[-1.582, 0.96, -0.42]} lit />
    <Panel size={[0.5, 0.36]} texture={binderSpinesTexture()} r={[0, Math.PI / 2, 0]} p={[-1.59, 0.62, -0.52]} lit />

    {/* Small server / comms indicator cabinet tucked in the right corner. */}
    <RBox size={[0.24, 0.62, 0.42]} radius={0.008} material={surface('#dfe7e5', 'paint')} p={[1.5, 0.31, -1.24]} ink inkWidth={0.006} />
    <Panel size={[0.16, 0.4]} texture={terminalScreenTexture()} r={[0, -Math.PI / 2, 0]} p={[1.375, 0.38, -1.24]} />
    <Box size={[0.02, 0.02, 0.34]} material={surface('#8f9f9d', 'paint')} p={[1.37, 0.62, -1.24]} ink={false} shadow={false} />
  </group>
);

/** Map screen with a slow scan bar, a radar ping and a blinking marker. */
const MapDisplay = () => {
  const scan = useRef<Mesh>(null);
  const ping = useRef<Mesh>(null);
  const marker = useRef<Mesh>(null);
  const mapY = 1.02;
  const mapH = 0.68;

  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    const sweep = (time * 0.14) % 1;
    const scanNode = scan.current;
    if (scanNode) {
      scanNode.position.y = mapY - mapH / 2 + sweep * mapH;
      const material = scanNode.material as MeshBasicMaterial;
      material.opacity = 0.05 + Math.sin(sweep * Math.PI) * 0.1;
    }
    const cycle = (time * 0.34) % 1;
    const pingNode = ping.current;
    if (pingNode) {
      pingNode.scale.setScalar(0.45 + cycle * 2.6);
      (pingNode.material as MeshBasicMaterial).opacity = (1 - cycle) * 0.55;
    }
    const markerNode = marker.current;
    if (markerNode) {
      (markerNode.material as MeshBasicMaterial).opacity = 0.5 + Math.abs(Math.sin(time * 1.5)) * 0.5;
    }
  });

  return (
    <group>
      <Screen p={[-0.28, mapY, -1.575]} w={1.36} h={mapH} texture={commandMapTexture()} />
      <mesh ref={scan} position={[-0.28, mapY, -1.548]} renderOrder={4}>
        <planeGeometry args={[1.34, 0.018]} />
        <meshBasicMaterial color="#b8f4ec" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ping} position={[-0.13, 1.07, -1.546]} renderOrder={4}>
        <ringGeometry args={[0.026, 0.034, 24]} />
        <meshBasicMaterial color="#8fd4c8" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={marker} position={[-0.13, 1.07, -1.545]} renderOrder={5}>
        <circleGeometry args={[0.011, 12]} />
        <meshBasicMaterial color="#e0b45a" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Light bar washing the console below the screen. */}
      <Box size={[1.18, 0.014, 0.03]} color="#d9f4ef" material={flat('#d9f4ef')} p={[-0.28, 0.634, -1.568]} ink={false} shadow={false} />
    </group>
  );
};

/** Five slowly cycling status LEDs on a labelled plate. */
const StatusLeds = () => {
  const leds = useRef<(Mesh | null)[]>([]);
  const labels = [
    ['PWR', '#7fbf9a'],
    ['NET', '#8fd4c8'],
    ['SOP', '#8fd4c8'],
    ['KG', '#8fd4c8'],
    ['QA', '#e0b45a'],
  ] as const;

  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    leds.current.forEach((led, index) => {
      if (!led) return;
      const material = led.material as MeshBasicMaterial;
      const slow = index === 0 ? 1 : 0.6 + index * 0.16;
      const blink = Math.sin(time * slow + index * 1.9) > (index === 4 ? 0.55 : -0.1);
      material.color.set(blink ? labels[index]?.[1] ?? '#8fd4c8' : '#2f3c3d');
    });
  });

  return (
    <group>
      <Box size={[0.66, 0.13, 0.018]} color="#1f2a2e" p={[-0.28, 0.55, -1.588]} ink={false} />
      <Panel size={[0.62, 0.11]} texture={statusPlate()} p={[-0.28, 0.55, -1.576]} />
      {labels.map(([label], index) => {
        const x = -0.28 - 0.264 + index * 0.132;
        return (
          <mesh
            key={label}
            ref={(node) => {
              leds.current[index] = node;
            }}
            position={[x, 0.578, -1.57]}
            renderOrder={3}
          >
            <circleGeometry args={[0.012, 12]} />
            <meshBasicMaterial color={index === 0 ? '#7fbf9a' : '#3a4a4b'} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const WallScreens = () => (
  <group>
    {/* Header sign */}
    <Box size={[1.06, 0.17, 0.025]} color="#1b262a" p={[0, 1.585, -1.59]} ink={false} />
    <Panel size={[0.98, 0.1225]} texture={roomSign()} p={[0, 1.585, -1.575]} />

    <MapDisplay />

    {/* Document parse pipeline, left of the map. */}
    <Screen p={[-1.29, 1.39, -1.575]} w={0.4} h={0.27} texture={parseScreen()} />

    {/* Entity / rule extraction, right of the map. */}
    <Screen p={[1.1, 1.3, -1.575]} w={0.44} h={0.3} texture={entityScreen()} />

    {/* Task board above the binder shelf. */}
    <group>
      <Box size={[0.58, 0.36, 0.024]} color="#c6d2d0" p={[-1.29, 1.02, -1.588]} ink={false} />
      <Panel size={[0.54, 0.32]} texture={statusBoardTexture()} p={[-1.29, 1.02, -1.574]} />
      <Box size={[0.62, 0.02, 0.03]} color="#a8b8b6" p={[-1.29, 1.205, -1.58]} ink={false} shadow={false} />
      <Box size={[0.62, 0.02, 0.03]} color="#a8b8b6" p={[-1.29, 0.835, -1.58]} ink={false} shadow={false} />
    </group>

    {/* Emergency procedure poster in the gap between map and screens. */}
    <Box size={[0.3, 0.4, 0.02]} color="#e4e9e4" p={[0.61, 0.87, -1.588]} ink={false} />
    <Panel size={[0.26, 0.36]} texture={sopPosterTexture()} p={[0.61, 0.87, -1.576]} />
    <Box size={[0.04, 0.04, 0.012]} color="#b8402f" p={[0.55, 1.05, -1.574]} ink={false} shadow={false} />

    {/* Two printed evacuation maps, right edge. */}
    <Panel size={[0.22, 0.3]} texture={printedMap()} r={[0, 0, 0.05]} p={[1.45, 1.02, -1.583]} lit />
    <Panel size={[0.18, 0.25]} texture={printedMap()} r={[0, 0, -0.07]} p={[1.36, 0.95, -1.582]} lit />
    <Cyl radius={0.012} height={0.01} color="#b8402f" r={[Math.PI / 2, 0, 0]} p={[1.45, 1.15, -1.573]} ink={false} shadow={false} />

    {/* Clock. */}
    <group position={[1.45, 1.52, -1.585]}>
      <Cyl radius={0.085} height={0.018} color="#eef2ec" r={[Math.PI / 2, 0, 0]} ink={false} shadow={false} />
      <Panel size={[0.17, 0.17]} material={flat('#ffffff', {map: clockFaceTexture(), transparent: true})} p={[0, 0, 0.012]} />
    </group>

    {/* Trunking between the screens. */}
    <Box size={[0.035, 0.9, 0.02]} color="#c6d2d0" p={[0.77, 0.9, -1.589]} ink={false} shadow={false} />

    <StatusLeds />
  </group>
);

/* ------------------------------------------------------------------ */
/* Console, binder shelf, cabinet                                      */
/* ------------------------------------------------------------------ */

const MapConsole = () => (
  <group>
    <RBox size={[1.5, 0.42, 0.3]} radius={0.01} color="#e3eae7" p={[0.05, 0.21, -1.44]} ink inkWidth={0.006} />
    <Box size={[1.56, 0.03, 0.34]} color="#eef2ed" p={[0.05, 0.435, -1.44]} ink={false} shadow={false} />
    {[-0.46, 0.56].map((x, index) => (
      <group key={x}>
        <Box size={[0.46, 0.22, 0.014]} color="#dde6e2" p={[x, 0.205, -1.283]} ink={false} />
        <Box size={[0.16, 0.014, 0.014]} color="#8fa3a0" p={[x, 0.29, -1.272]} ink={false} shadow={false} />
        {index === 1 ? <Panel size={[0.17, 0.05]} texture={labelTagTexture('SOP / 07', '#5fbfae', 'INDEX')} p={[x, 0.15, -1.274]} /> : null}
      </group>
    ))}
    {/* Binders lying flat, paper tray and printer on top. */}
    <Box size={[0.42, 0.03, 0.26]} color="#8fa9a6" p={[-0.5, 0.465, -1.42]} r={[0, 0.08, 0]} ink={false} shadow={false} />
    <Box size={[0.4, 0.03, 0.25]} color="#b9a97f" p={[-0.47, 0.495, -1.43]} r={[0, -0.05, 0]} ink={false} shadow={false} />
    <Box size={[0.24, 0.01, 0.03]} color="#eef2ea" p={[-0.5, 0.482, -1.27]} r={[0, 0.08, 0]} ink={false} shadow={false} />
    <Box size={[0.26, 0.05, 0.2]} color="#cbd6d3" p={[0.04, 0.475, -1.46]} ink={false} shadow={false} />
    <Box size={[0.24, 0.02, 0.18]} color="#e9ece4" p={[0.04, 0.505, -1.46]} ink={false} shadow={false} />
    <Panel size={[0.2, 0.26]} texture={printedMap()} r={[-Math.PI / 2 + 0.06, 0, 0.08]} p={[0.04, 0.514, -1.45]} lit />
    <RBox size={[0.24, 0.14, 0.2]} radius={0.008} color="#e8eeea" p={[0.42, 0.52, -1.46]} ink={false} />
    <Box size={[0.1, 0.012, 0.02]} color="#3d4a4b" p={[0.42, 0.592, -1.37]} ink={false} shadow={false} />
    <Panel size={[0.12, 0.06]} texture={terminalScreenTexture()} p={[0.42, 0.545, -1.359]} />
    <Box size={[0.42, 0.012, 0.014]} color="#b8e8e0" material={flat('#b8e8e0')} p={[0.05, 0.452, -1.272]} ink={false} shadow={false} />
  </group>
);

/** Open binder shelf under the task board. */
const BinderShelf = () => (
  <group>
    <RBox size={[0.9, 0.78, 0.3]} radius={0.008} color="#d7e1de" p={[-1.13, 0.39, -1.44]} ink inkWidth={0.006} />
    {/* Open shelf recess. */}
    <Box size={[0.82, 0.68, 0.02]} color="#bccac7" p={[-1.13, 0.4, -1.29]} ink={false} shadow={false} />
    {[0.16, 0.44, 0.7].map((y) => (
      <Box key={y} size={[0.82, 0.022, 0.26]} color="#b3c2bf" p={[-1.13, y, -1.36]} ink={false} shadow={false} />
    ))}
    {/* Binder spines on two shelves. */}
    <Panel size={[0.8, 0.2]} texture={binderSpinesTexture()} p={[-1.13, 0.265, -1.345]} />
    <Panel size={[0.8, 0.2]} texture={binderSpinesTexture()} p={[-1.13, 0.545, -1.345]} />
    {/* Paper stacks + a document box + label. */}
    <Box size={[0.2, 0.055, 0.16]} color="#e9ebe1" p={[-1.42, 0.73, -1.38]} ink={false} shadow={false} />
    <Box size={[0.18, 0.015, 0.15]} color="#f2f0e6" p={[-1.42, 0.765, -1.38]} r={[0, 0.12, 0]} ink={false} shadow={false} />
    <Box size={[0.26, 0.16, 0.2]} color="#b9a98c" p={[-1.0, 0.77, -1.44]} ink={false} />
    <Panel size={[0.2, 0.05]} texture={labelTagTexture('SOP ARCHIVE', '#5fbfae', '2019–2026')} p={[-1.0, 0.77, -1.338]} />
    <Panel size={[0.18, 0.05]} texture={labelTagTexture('BINDER 04', '#e0b45a')} p={[-1.13, 0.13, -1.288]} />
    <Cyl radius={0.036} height={0.09} color="#a8b0a6" p={[-0.83, 0.83, -1.44]} ink={false} shadow={false} />
    <Sphere radius={0.055} color="#6f9a78" p={[-0.83, 0.92, -1.44]} s={[1, 0.85, 1]} ink={false} shadow={false} />
    <Sphere radius={0.04} color="#5f8768" p={[-0.79, 0.88, -1.41]} ink={false} shadow={false} />
    <Cyl radius={0.032} height={0.1} color="#e8ece4" p={[-0.62, 0.32, -1.35]} ink={false} shadow={false} />
  </group>
);

const AmberBeacon = () => {
  const dome = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  useFrame(({clock}) => {
    const pulse = (Math.sin(clock.elapsedTime * 1.1) + 1) * 0.5;
    const domeNode = dome.current;
    if (domeNode) {
      const material = domeNode.material as MeshBasicMaterial;
      material.opacity = 0.45 + pulse * 0.4;
    }
    if (light.current) light.current.intensity = 0.16 + pulse * 0.2;
  });
  return (
    <group position={[0.63, 0.45, -1.36]}>
      <Cyl radius={0.032} height={0.05} color="#4a5658" p={[0, 0.025, 0]} ink={false} shadow={false} />
      <Sphere
        radius={0.04}
        color="#e0a04a"
        ink={false}
        p={[0, 0.085, 0]}
        s={[1, 0.85, 1]}
        material={flat('#e0a04a', {transparent: true, opacity: 0.75})}
      />
      <mesh ref={dome} position={[0, 0.085, 0]}>
        <sphereGeometry args={[0.038, 12, 8]} />
        <meshBasicMaterial color="#ffe0a0" transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <Glow color="#ffb86a" size={0.2} opacity={0.16} p={[0, 0.09, 0.02]} />
      <pointLight ref={light} position={[0, 0.12, 0.04]} color="#ffb264" intensity={0.2} distance={0.7} decay={2} />
    </group>
  );
};

const RightCabinet = () => (
  <group position={[1.31, 0, 0.62]} rotation={[0, -0.16, 0]}>
    <RBox size={[0.42, 0.63, 0.38]} radius={0.012} color="#dfe7e4" p={[0, 0.315, 0]} ink inkWidth={0.006} />
    <Box size={[0.44, 0.025, 0.4]} color="#eef2ed" p={[0, 0.638, 0]} ink={false} shadow={false} />
    <Box size={[0.34, 0.24, 0.014]} color="#d3dedb" p={[0, 0.48, 0.196]} ink={false} />
    <Box size={[0.34, 0.24, 0.014]} color="#dae4e0" p={[0, 0.22, 0.196]} ink={false} />
    <Box size={[0.12, 0.012, 0.012]} color="#8fa3a0" p={[0, 0.55, 0.207]} ink={false} shadow={false} />
    <Box size={[0.12, 0.012, 0.012]} color="#8fa3a0" p={[0, 0.29, 0.207]} ink={false} shadow={false} />
    <Panel size={[0.2, 0.06]} texture={labelTagTexture('EKG / OPS', '#5fbfae', 'archive drawer')} p={[0.02, 0.42, 0.205]} />
    {/* Stack of binders on top. */}
    <Box size={[0.26, 0.06, 0.2]} color="#8fa9a6" p={[-0.05, 0.68, -0.02]} r={[0, 0.12, 0]} ink={false} shadow={false} />
    <Box size={[0.26, 0.05, 0.2]} color="#c2a97f" p={[-0.02, 0.73, -0.02]} r={[0, -0.06, 0]} ink={false} shadow={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Command desk + props                                                 */
/* ------------------------------------------------------------------ */

const WorkTop = ({width}: {width: number}) => (
  <group>
    <RBox size={[width, 0.04, 0.62]} radius={0.012} color="#d7e1dc" p={[0, 0.72, 0]} ink inkWidth={0.006} />
    <Box size={[width - 0.08, 0.54, 0.03]} color="#c6d3d0" p={[0, 0.44, 0.285]} ink={false} />
    <Cyl radius={0.026} height={0.72} color="#77898a" p={[-width / 2 + 0.1, 0.36, 0.22]} ink={false} />
    <Cyl radius={0.026} height={0.72} color="#77898a" p={[width / 2 - 0.1, 0.36, 0.22]} ink={false} />
  </group>
);

const Keyboard = ({p, yaw = 0}: {p: Vec3; yaw?: number}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box size={[0.3, 0.014, 0.11]} color="#2b3438" p={[0, 0.008, 0]} ink={false} shadow={false} />
    <Panel size={[0.28, 0.1]} texture={keyboardTexture()} r={[-Math.PI / 2, 0, 0]} p={[0, 0.017, 0]} />
  </group>
);

const Mug = ({p, color = '#e9efe9'}: {p: Vec3; color?: string}) => (
  <group position={p}>
    <Cyl radius={0.032} height={0.075} color={color} p={[0, 0.038, 0]} ink={false} />
    <Cyl radius={0.026} height={0.006} color="#3b2a20" p={[0, 0.076, 0]} ink={false} shadow={false} />
    <Cyl radius={0.026} height={0.06} color={color} p={[0.04, 0.038, 0]} ink={false} shadow={false} />
    <mesh position={[0.048, 0.042, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.021, 0.006, 6, 14, Math.PI * 1.4]} />
      <primitive object={toon(color)} attach="material" />
    </mesh>
  </group>
);

const DeskPhone = () => {
  const ring = useRef<Mesh>(null);
  useFrame(({clock}) => {
    if (ring.current) {
      const material = ring.current.material as MeshBasicMaterial;
      material.opacity = Math.sin(clock.elapsedTime * 0.8) > 0.72 ? 0.7 : 0.12;
    }
  });
  return (
    <group position={[0.34, 0.74, 0.2]}>
      <RBox size={[0.18, 0.045, 0.14]} radius={0.01} color="#dce5e1" p={[0, 0.023, 0]} ink={false} />
      <Panel size={[0.09, 0.065]} texture={phoneKeys()} r={[-Math.PI / 2, 0, 0]} p={[-0.02, 0.048, 0.012]} />
      <RBox size={[0.19, 0.032, 0.045]} radius={0.012} color="#c8d4d0" p={[0, 0.062, -0.052]} ink={false} />
      <Cable points={[[0.06, 0.06, -0.06], [0.12, 0.08, -0.03], [0.11, 0.06, 0.06], [0.07, 0.05, 0.04]]} radius={0.0035} color="#4a5658" />
      <mesh ref={ring} position={[-0.06, 0.047, 0.055]} renderOrder={3}>
        <circleGeometry args={[0.009, 10]} />
        <meshBasicMaterial color="#8fd4c8" transparent opacity={0.2} toneMapped={false} />
      </mesh>
      <Cyl radius={0.006} height={0.09} color="#8fa3a0" p={[0.075, 0.02, 0.07]} r={[0.4, 0, 0.3]} ink={false} shadow={false} />
    </group>
  );
};

const Headset = () => (
  <group position={[-0.42, 0.745, 0.22]} rotation={[0, 0.5, 0]}>
    <mesh rotation={[0, 0, 0.15]}>
      <torusGeometry args={[0.055, 0.007, 6, 18, Math.PI * 1.25]} />
      <primitive object={toon('#38474a')} attach="material" />
    </mesh>
    <Cyl radius={0.024} height={0.018} color="#2f3c3f" r={[0, 0, Math.PI / 2]} p={[-0.055, -0.02, 0]} ink={false} />
    <Cyl radius={0.024} height={0.018} color="#2f3c3f" r={[0, 0, Math.PI / 2]} p={[0.055, -0.02, 0]} ink={false} />
  </group>
);

const PenCup = () => (
  <group position={[-0.68, 0.74, 0.2]}>
    <Cyl radius={0.03} height={0.085} color="#5b7073" p={[0, 0.043, 0]} ink={false} />
    <Cyl radius={0.026} height={0.006} color="#38474a" p={[0, 0.087, 0]} ink={false} shadow={false} />
    <Cyl radius={0.004} height={0.15} color="#c8b47a" p={[0.006, 0.12, 0.006]} r={[0.08, 0, 0.12]} ink={false} shadow={false} />
    <Cyl radius={0.004} height={0.13} color="#8fd4c8" p={[-0.008, 0.11, -0.004]} r={[-0.1, 0, -0.1]} ink={false} shadow={false} />
  </group>
);

const PaperStack = ({p, count = 4}: {p: Vec3; count?: number}) => (
  <group position={p}>
    {Array.from({length: count}, (_, index) => (
      <Box
        key={index}
        size={[0.2, 0.006, 0.26]}
        color={index % 2 === 0 ? '#f0eee4' : '#e6e3d6'}
        p={[index * 0.004, index * 0.006, -index * 0.003]}
        r={[0, (index - 1) * 0.02, 0]}
        ink={false}
        shadow={false}
      />
    ))}
  </group>
);

const LeftMonitor = () => (
  <group position={[-0.06, 0, 0.08]} rotation={[0, 0.48, 0]}>
    <RBox size={[0.17, 0.014, 0.12]} radius={0.006} color="#39474a" p={[0, 0.748, 0]} ink={false} shadow={false} />
    <Cyl radius={0.018} height={0.15} color="#5b6c6e" p={[0, 0.82, -0.01]} ink={false} shadow={false} />
    <RBox size={[0.48, 0.3, 0.032]} radius={0.008} color="#283336" p={[0, 1.02, 0]} ink inkWidth={0.005} />
    <Panel size={[0.44, 0.26]} texture={graphScreenTexture()} p={[0, 1.02, 0.018]} />
  </group>
);

const QaTerminal = () => (
  <group position={[0.06, 0, 0.1]} rotation={[0, -0.4, 0]}>
    <RBox size={[0.19, 0.014, 0.13]} radius={0.006} color="#39474a" p={[0, 0.748, 0]} ink={false} shadow={false} />
    <Cyl radius={0.017} height={0.12} color="#5b6c6e" p={[0, 0.81, -0.01]} ink={false} shadow={false} />
    <RBox size={[0.5, 0.28, 0.032]} radius={0.008} color="#283336" p={[0, 0.97, 0]} ink inkWidth={0.005} />
    <Panel size={[0.46, 0.24]} texture={terminalScreenTexture()} p={[0, 0.97, 0.018]} />
  </group>
);

const CommandDesk = () => (
  <group>
    {/* Main top */}
    <group position={[0, 0, 0.28]}>
      <WorkTop width={1.55} />
      <group position={[0, 0.742, 0.16]} rotation={[-1.2, 0, 0]}>
        <RBox size={[0.66, 0.05, 0.24]} radius={0.01} color="#2a363a" p={[0, 0, 0]} ink />
        <Panel size={[0.6, 0.2]} texture={consolePanel()} r={[-Math.PI / 2, 0, 0]} p={[0, 0.027, 0]} />
      </group>
      <Keyboard p={[0.02, 0.741, 0.43]} />
      <DeskPhone />
      <Headset />
      <Mug p={[0.6, 0.74, 0.32]} />
      <PenCup />
      <PaperStack p={[-0.2, 0.741, -0.02]} count={3} />
      <Panel size={[0.26, 0.34]} texture={printedMap()} r={[-Math.PI / 2 + 0.02, 0, 0.2]} p={[0.12, 0.745, 0.06]} lit />
      <Box size={[0.3, 0.008, 0.02]} color="#d8e2de" p={[0.12, 0.744, 0.25]} r={[0, 0.2, 0]} ink={false} shadow={false} />
      <AmberBeacon />
    </group>

    {/* Left wing */}
    <group position={[-1.03, 0, 0.31]} rotation={[0, 0.32, 0]}>
      <WorkTop width={0.82} />
      <LeftMonitor />
      <Keyboard p={[0.02, 0.741, 0.44]} yaw={0.04} />
      <PaperStack p={[0.26, 0.741, 0.14]} count={2} />
      <Box size={[0.16, 0.04, 0.2]} color="#b9c6c2" p={[-0.26, 0.76, 0.12]} ink={false} shadow={false} />
      <Panel size={[0.14, 0.18]} texture={printedMap()} r={[-Math.PI / 2 + 0.4, 0, 0.1]} p={[-0.26, 0.79, 0.12]} lit />
    </group>

    {/* Right wing */}
    <group position={[1.03, 0, 0.31]} rotation={[0, -0.32, 0]}>
      <WorkTop width={0.82} />
      <QaTerminal />
      <Keyboard p={[0.02, 0.741, 0.44]} yaw={-0.04} />
      <PaperStack p={[-0.24, 0.741, 0.16]} count={2} />
      <Box size={[0.34, 0.014, 0.24]} color="#334144" p={[0.24, 0.75, 0.16]} r={[0, 0.1, 0]} ink={false} shadow={false} />
    </group>

    {/* Under-desk cable tray + floor cables. */}
    <Box size={[1.2, 0.035, 0.14]} color="#7e8f8f" p={[0, 0.57, 0.1]} ink={false} shadow={false} />
    <Cable points={[[-0.3, 0.58, 0.14], [-0.42, 0.3, 0.4], [-0.5, 0.02, 0.75], [-0.2, 0.015, 1.05]]} radius={0.006} color="#2d3739" />
    <Cable points={[[0.5, 0.58, 0.1], [0.72, 0.35, 0.3], [0.9, 0.015, 0.6], [1.15, 0.012, 0.9]]} radius={0.0055} color="#323d3f" />
    <Box size={[0.22, 0.035, 0.09]} color="#d6dedb" p={[0.8, 0.02, 0.9]} r={[0, -0.4, 0]} ink={false} shadow={false} />
    <Box size={[0.16, 0.01, 0.06]} color="#4a5658" p={[0.8, 0.04, 0.9]} r={[0, -0.4, 0]} ink={false} shadow={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Floor dressing                                                      */
/* ------------------------------------------------------------------ */

const FloorDressing = () => (
  <group>
    {/* Rug under the command desk. */}
    <Panel
      size={[2.9, 1.72]}
      material={toon('#8fa0a0', {map: feltTexture('command/rug', '#5a6b6d')})}
      r={[-Math.PI / 2, 0, 0]}
      p={[0, 0.006, 0.52]}
    />
    <Box size={[2.72, 0.008, 0.018]} color="#94a5a2" p={[0, 0.012, 1.35]} ink={false} shadow={false} />
    {/* Waste bin. */}
    <group position={[-1.32, 0, 1.4]}>
      <Cyl radius={0.095} height={0.24} color="#7f908f" p={[0, 0.12, 0]} ink={false} />
      <Cyl radius={0.1} height={0.02} color="#5f7271" p={[0, 0.245, 0]} ink={false} shadow={false} />
      <Cyl radius={0.075} height={0.01} color="#3d4a4c" p={[0, 0.252, 0]} ink={false} shadow={false} />
    </group>
    {/* Archive boxes stacked by the shelf. */}
    <group position={[-0.62, 0, 1.52]} rotation={[0, 0.24, 0]}>
      <RBox size={[0.34, 0.24, 0.26]} radius={0.008} color="#c2b08c" p={[0, 0.12, 0]} ink={false} />
      <RBox size={[0.3, 0.22, 0.24]} radius={0.008} color="#b3a07c" p={[0.02, 0.36, 0.01]} r={[0, 0.12, 0]} ink={false} />
      <Panel size={[0.2, 0.06]} texture={labelTagTexture('RULES / 07', '#5fbfae', 'archive')} p={[0, 0.39, 0.135]} />
    </group>
    {/* A loose floor map and a dropped pen. */}
    <Panel size={[0.2, 0.27]} texture={printedMap()} r={[-Math.PI / 2, 0, 0.5]} p={[0.72, 0.013, 1.3]} lit />
    <Cyl radius={0.008} height={0.22} color="#3f4d4f" p={[0.78, 0.11, 1.46]} r={[0, 0, 0.9]} ink={false} shadow={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Scene                                                              */
/* ------------------------------------------------------------------ */

/**
 * Scene 04 — 应急指挥室 / EMERGENCY COMMAND ROOM.
 * A tidy decision workspace for LLM4EKG: a horseshoe desk facing a wall map,
 * document and knowledge-graph screens, binder shelves and a task board.
 */
export const CommandScene = () => {
  const meta = getScene('command');
  return (
    <group>
      <RoomLights color="#e6f2f4" intensity={2.1} fill="#8faab4" shadowMapSize={2048} />
      <fog attach="fog" args={['#0c1216', 12, 34]} />

      <DioramaBase meta={meta} footprint={[3.6, 3.6]} ground={commandFloor()} subtitle="1:18 / COMMAND" />

      <RoomShell />
      <WallScreens />
      <MapConsole />
      <BinderShelf />
      <RightCabinet />

      <CommandDesk />
      <FloorDressing />

      <OfficeChair p={[-0.95, 0, 1.02]} yaw={0.06} />
      <OfficeChair p={[0.04, 0, 1.06]} yaw={-0.03} />
      <OfficeChair p={[1.03, 0, 1.0]} yaw={-0.14} />

      {/* Practical light: cool wash from the wall map and overhead room bounce. */}
      <pointLight position={[-0.2, 1.12, -1.15]} color="#a8e4dc" intensity={0.85} distance={2.6} decay={2} />
      <pointLight position={[1.15, 1.5, -0.55]} color="#cfe8ea" intensity={0.4} distance={2.2} decay={2} />
      <pointLight position={[0, 1.62, 0.62]} color="#e4f2ee" intensity={0.75} distance={3.2} decay={2} />
      <pointLight position={[0.4, 0.95, 0.95]} color="#9fd4cc" intensity={0.3} distance={1.8} decay={2} />
    </group>
  );
};
