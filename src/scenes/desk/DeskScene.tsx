import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {AdditiveBlending, type Mesh, type MeshBasicMaterial, type PointLight} from 'three';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {Box, Cable, Cone, ContactShadow, Cyl, Glow, LightCone, Panel, Pipe, RBox, Sphere, Torus, type Vec3} from '../../three/kit/primitives';
import {RoomLights} from '../../three/kit/lighting';
import {SlidingDrops, Steam} from '../../three/kit/rain';
import {flat, glass, toon} from '../../three/materials';
import {FONT_MONO, FONT_SANS, canvasTexture, grain, rng, rr, softGlow, text, verticalGradient, withAlpha} from '../../three/canvas';
import {
  calendarTexture,
  clockFaceTexture,
  corkBoardTexture,
  deskMatTexture,
  deskWoodTexture,
  keyboardTexture,
  lightPoolTexture,
  lightSpillTexture,
  paperSheetTexture,
  photoTexture,
  posterTexture,
} from '../../three/textures';
import {planeGeometry, sphereGeometry} from '../../three/geometry';
import {getScene} from '../../data/scenes';

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

const FLOOR = 0.06;
const WALL_H = 1.42;
/** Inner face of the back wall. */
const BACK_Z = -1.7;
/** Inner face of the left wall. */
const SIDE_X = -1.7;

const DESK_X = 0.08;
const DESK_Z = -1.26;
const DESK_W = 1.16;
const DESK_D = 0.54;
const DESK_TOP = 0.42;

const MON_X = 0.02;
const MON_Y = 0.632;
const MON_Z = -1.44;

const LAMP_X = 0.52;
const LAMP_Z = -1.36;

/** Window opening on the back wall. */
const WIN = {x0: -1.5, x1: -0.5, y0: 0.64, y1: 1.26};
const WIN_X = (WIN.x0 + WIN.x1) / 2;
const WIN_Y = (WIN.y0 + WIN.y1) / 2;
const WIN_W = WIN.x1 - WIN.x0;
const WIN_H = WIN.y1 - WIN.y0;

/* ------------------------------------------------------------------ */
/* Local canvas textures                                               */
/* ------------------------------------------------------------------ */

const plankFloor = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/plankFloor', 1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = '#2b1f16';
    ctx.fillRect(0, 0, width, height);
    const random = rng(115);
    const plank = 102;
    for (let x = 0; x < width; x += plank) {
      const tone = 0.78 + random() * 0.4;
      ctx.fillStyle = `rgb(${Math.round(82 * tone)}, ${Math.round(58 * tone)}, ${Math.round(40 * tone)})`;
      ctx.fillRect(x + 2, 0, plank - 4, height);
      for (let index = 0; index < 24; index += 1) {
        const gx = x + 7 + random() * (plank - 14);
        ctx.strokeStyle = `rgba(${random() > 0.45 ? '34,22,14' : '176,136,98'}, ${0.05 + random() * 0.09})`;
        ctx.lineWidth = 0.6 + random() * 1.6;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + (random() - 0.5) * 16, height * 0.33, gx + (random() - 0.5) * 16, height * 0.66, gx + (random() - 0.5) * 8, height);
        ctx.stroke();
      }
      const joints = 1 + Math.floor(random() * 2);
      for (let joint = 0; joint < joints; joint += 1) {
        const y = random() * height;
        ctx.fillStyle = 'rgba(14,9,5,0.6)';
        ctx.fillRect(x + 2, y, plank - 4, 2.5);
        ctx.fillStyle = 'rgba(196,156,116,0.12)';
        ctx.fillRect(x + 2, y + 2.5, plank - 4, 1.5);
      }
      ctx.fillStyle = 'rgba(10,7,4,0.7)';
      ctx.fillRect(x, 0, 2.6, height);
    }
    grain(ctx, width, height, {seed: 5, count: 5400, alpha: 0.06, size: 1.6});
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.6, width * 0.16, width * 0.5, height * 0.6, width * 0.8);
    vignette.addColorStop(0, 'rgba(255,214,164,0.07)');
    vignette.addColorStop(1, 'rgba(5,6,10,0.34)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  });

const plasterWall = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/plasterWall', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#b6a68e';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 23, count: 4600, alpha: 0.05, size: 1.5, colors: ['#ffffff', '#6a6152']});
    const random = rng(66);
    for (let index = 0; index < 18; index += 1) {
      ctx.fillStyle = `rgba(${random() > 0.5 ? '255,250,238' : '96,86,72'}, ${0.012 + random() * 0.022})`;
      ctx.fillRect(random() * width, 0, 10 + random() * 46, height);
    }
    for (let index = 0; index < 7; index += 1) {
      ctx.strokeStyle = `rgba(90,80,66,${0.04 + random() * 0.05})`;
      ctx.lineWidth = 1 + random() * 2;
      const x = random() * width;
      const y = height * (0.5 + random() * 0.42);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + random() * 54, y + (random() - 0.5) * 8);
      ctx.stroke();
    }
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.10)'],
      [0.62, 'rgba(0,0,0,0)'],
      [1, 'rgba(38,30,22,0.20)'],
    ]);
  });

const nightCity = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/nightCity', 512, 360, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#03060b'],
      [0.38, '#091420'],
      [0.72, '#1b2c3b'],
      [1, '#22303a'],
    ]);
    softGlow(ctx, width * 0.3, height * 0.66, 190, 'rgba(255,178,120,0.30)');
    softGlow(ctx, width * 0.78, height * 0.58, 150, 'rgba(140,196,246,0.22)');

    const random = rng(2401);
    const skyline = (baseline: number, minH: number, maxH: number, color: string, litChance: number, windowSize: number) => {
      let x = -10;
      while (x < width + 10) {
        const buildingWidth = 18 + random() * 46;
        const buildingHeight = minH + random() * (maxH - minH);
        ctx.fillStyle = color;
        ctx.fillRect(x, baseline - buildingHeight, buildingWidth, buildingHeight + 40);
        if (random() > 0.6) {
          ctx.fillRect(x + buildingWidth * 0.4, baseline - buildingHeight - 12, 3, 14);
          ctx.fillStyle = '#c85a48';
          ctx.fillRect(x + buildingWidth * 0.4 - 1, baseline - buildingHeight - 15, 5, 4);
        }
        for (let wy = baseline - buildingHeight + 8; wy < baseline - 8; wy += 9) {
          for (let wx = x + 4; wx < x + buildingWidth - 6; wx += 8) {
            if (random() > 1 - litChance) {
              ctx.fillStyle = random() > 0.42 ? withAlpha('#ffd7a0', 0.55 + random() * 0.4) : withAlpha('#a8d2f2', 0.45 + random() * 0.35);
              ctx.fillRect(wx, wy, windowSize, windowSize * 0.72);
            }
          }
        }
        x += buildingWidth + 3 + random() * 12;
      }
    };
    skyline(height * 0.78, 46, 150, '#101b27', 0.12, 3);
    skyline(height * 0.88, 40, 120, '#0a141d', 0.2, 3);
    skyline(height * 0.98, 30, 84, '#060c12', 0.24, 2);

    // Wet rooftop glow and haze at the bottom of the pane.
    const haze = ctx.createLinearGradient(0, height * 0.58, 0, height);
    haze.addColorStop(0, 'rgba(120,150,180,0)');
    haze.addColorStop(0.7, 'rgba(86,122,150,0.18)');
    haze.addColorStop(1, 'rgba(28,44,58,0.42)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, height * 0.58, width, height * 0.42);

    // Balcony railing silhouetted against the city.
    ctx.fillStyle = 'rgba(4,8,12,0.92)';
    ctx.fillRect(0, height * 0.7, width, 5);
    ctx.fillRect(0, height * 0.82, width, 7);
    for (let x = 8; x < width; x += 28) ctx.fillRect(x, height * 0.7, 5, height * 0.3);
    ctx.fillRect(0, height - 10, width, 10);

    // Rain on the outside of the glass.
    ctx.strokeStyle = 'rgba(198,224,242,0.14)';
    ctx.lineWidth = 1.2;
    for (let index = 0; index < 90; index += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = 10 + random() * 44;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length * 0.18, y + length);
      ctx.stroke();
    }
    for (let index = 0; index < 26; index += 1) {
      ctx.fillStyle = `rgba(214,236,250,${0.08 + random() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 1.6 + random() * 2.4, 3 + random() * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Faint reflection of the room on the glass.
    const sheen = ctx.createLinearGradient(0, 0, width, height);
    sheen.addColorStop(0, 'rgba(255,220,180,0)');
    sheen.addColorStop(0.46, 'rgba(255,214,166,0.05)');
    sheen.addColorStop(0.56, 'rgba(200,226,244,0.07)');
    sheen.addColorStop(1, 'rgba(200,226,244,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);
  });

const studyRug = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/studyRug', 512, 448, (ctx, width, height) => {
    ctx.fillStyle = '#3d504f';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 11, count: 7000, alpha: 0.1, size: 1.5, colors: ['#9fb4ac', '#14201f']});
    const random = rng(88);
    // Woven bands.
    for (let y = 0; y < height; y += 6) {
      ctx.fillStyle = `rgba(0,0,0,${0.02 + random() * 0.05})`;
      ctx.fillRect(0, y, width, 2);
    }
    // Borders.
    ctx.strokeStyle = 'rgba(206,178,128,0.62)';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.strokeStyle = 'rgba(206,178,128,0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);
    // Diamond motif field.
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const x = 86 + col * 86;
        const y = 92 + row * 86;
        ctx.strokeStyle = `rgba(${row % 2 === 0 ? '199,170,120' : '152,176,168'}, 0.42)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y - 24);
        ctx.lineTo(x + 24, y);
        ctx.lineTo(x, y + 24);
        ctx.lineTo(x - 24, y);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(24,34,33,0.30)';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Fringes along the short edges.
    for (let x = 12; x < width; x += 9) {
      ctx.fillStyle = 'rgba(214,196,160,0.5)';
      ctx.fillRect(x, 0, 3, 16);
      ctx.fillRect(x, height - 16, 3, 16);
    }
  });

const curtainCloth = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/curtain', 128, 512, (ctx, width, height) => {
    for (let x = 0; x < width; x += 1) {
      const fold = 0.68 + 0.32 * (0.5 + 0.5 * Math.sin((x / width) * Math.PI * 5.2));
      ctx.fillStyle = `rgb(${Math.round(158 * fold)}, ${Math.round(142 * fold)}, ${Math.round(116 * fold)})`;
      ctx.fillRect(x, 0, 1, height);
    }
    grain(ctx, width, height, {seed: 3, count: 2400, alpha: 0.06, size: 1.4});
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,246,226,0.10)'],
      [0.7, 'rgba(0,0,0,0.05)'],
      [1, 'rgba(0,0,0,0.3)'],
    ]);
    ctx.fillStyle = 'rgba(120,104,82,0.5)';
    ctx.fillRect(0, height - 16, width, 3);
  });

const flowDiagram = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/flowDiagram', 360, 300, (ctx, width, height) => {
    ctx.fillStyle = '#eae2d0';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 17, count: 1400, alpha: 0.05, size: 1.3, colors: ['#ffffff', '#7a725f']});
    text(ctx, 'AGENT LOOP / v3', 22, 40, {size: 19, weight: 700, font: FONT_MONO, color: '#33403f'});
    text(ctx, '04:12  trace on', width - 22, 38, {size: 10, weight: 600, font: FONT_MONO, color: '#7f8a84', align: 'right'});
    ctx.fillStyle = 'rgba(60,72,70,0.35)';
    ctx.fillRect(22, 50, width - 44, 1.5);

    const node = (x: number, y: number, w: number, h: number, label: string, tint: string) => {
      ctx.strokeStyle = tint;
      ctx.lineWidth = 2;
      ctx.fillStyle = withAlpha(tint, 0.1);
      rr(ctx, x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();
      text(ctx, label, x + w / 2, y + h / 2 + 4, {size: 11, weight: 700, font: FONT_MONO, color: tint, align: 'center'});
    };
    node(24, 68, 74, 34, 'INPUT', '#3f6f7a');
    node(132, 68, 96, 34, 'RETRIEVE', '#4a6a52');
    node(260, 68, 76, 34, 'JUDGE', '#7a5f3a');
    node(132, 140, 96, 34, 'ACT', '#8a4f45');
    node(260, 140, 76, 34, 'TRACE', '#4a5570');

    ctx.strokeStyle = 'rgba(58,72,74,0.7)';
    ctx.lineWidth = 1.8;
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(angle - 0.42), y2 - 8 * Math.sin(angle - 0.42));
      ctx.lineTo(x2 - 8 * Math.cos(angle + 0.42), y2 - 8 * Math.sin(angle + 0.42));
      ctx.closePath();
      ctx.fillStyle = 'rgba(58,72,74,0.7)';
      ctx.fill();
    };
    arrow(100, 85, 130, 85);
    arrow(230, 85, 258, 85);
    arrow(180, 104, 180, 138);
    arrow(230, 157, 258, 157);
    arrow(298, 104, 298, 138);

    ctx.fillStyle = 'rgba(58,72,74,0.55)';
    for (let index = 0; index < 4; index += 1) {
      ctx.fillRect(24, 208 + index * 16, 210 - index * 34, 3);
    }
    ctx.fillStyle = 'rgba(58,72,74,0.4)';
    ctx.fillRect(24, 272, 70, 3);
    text(ctx, 'verified 28 / repair 1', 24, 262, {size: 10, weight: 600, font: FONT_MONO, color: '#5a6a66'});

    ctx.fillStyle = '#b8452f';
    ctx.beginPath();
    ctx.arc(18, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - 18, 16, 4, 0, Math.PI * 2);
    ctx.fill();
  });

const notebookPage = (side: 'left' | 'right'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`desk/notebook/${side}`, 256, 340, (ctx, width, height) => {
    ctx.fillStyle = '#f0e9da';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.35)'],
      [1, 'rgba(150,136,112,0.14)'],
    ]);
    ctx.strokeStyle = 'rgba(120,142,158,0.3)';
    ctx.lineWidth = 1.4;
    for (let y = 56; y < height - 12; y += 17) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(width - 14, y);
      ctx.stroke();
    }
    if (side === 'left') {
      ctx.fillStyle = 'rgba(200,95,74,0.28)';
      ctx.fillRect(30, 0, 1.5, height);
      text(ctx, 'agent loop', 20, 34, {size: 15, weight: 700, font: FONT_SANS, color: 'rgba(52,62,66,0.8)'});
      const random = rng(77);
      for (let line = 0; line < 7; line += 1) {
        ctx.fillStyle = 'rgba(52,62,70,0.5)';
        ctx.fillRect(38, 72 + line * 34, 90 + random() * 90, 2.4);
      }
      // A little sketch of the loop.
      ctx.strokeStyle = 'rgba(60,90,96,0.55)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 3; index += 1) {
        ctx.strokeRect(28 + index * 60, 268, 46, 26);
      }
      ctx.beginPath();
      ctx.moveTo(74, 281);
      ctx.lineTo(88, 281);
      ctx.moveTo(134, 281);
      ctx.lineTo(148, 281);
      ctx.stroke();
    } else {
      text(ctx, 'todo', 24, 30, {size: 13, weight: 700, font: FONT_MONO, color: 'rgba(120,96,64,0.8)'});
      const items = ['- judge prompt', '- fix trace', '- read paper', '- sleep?'];
      items.forEach((item, index) => {
        text(ctx, item, 22, 66 + index * 30, {size: 14, weight: 500, font: FONT_MONO, color: 'rgba(52,58,62,0.6)'});
        if (index < 2) {
          ctx.strokeStyle = 'rgba(90,110,112,0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(20, 61 + index * 30);
          ctx.lineTo(100, 61 + index * 30);
          ctx.stroke();
        }
      });
    }
    ctx.fillStyle = 'rgba(120,110,92,0.25)';
    ctx.fillRect(0, 0, 8, height);
  });

const codeEditor = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/codeEditor', 512, 320, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#0d1620'],
      [1, '#0a1017'],
    ]);
    // Title bar.
    ctx.fillStyle = '#16232c';
    ctx.fillRect(0, 0, width, 30);
    ['#e0705f', '#e0b45a', '#7fbf9a'].forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(20 + index * 17, 15, 4.6, 0, Math.PI * 2);
      ctx.fill();
    });
    text(ctx, 'agent_loop.py', 88, 20, {size: 13, weight: 600, font: FONT_MONO, color: '#a8bcc6'});
    text(ctx, 'pmu · main', width - 18, 20, {size: 10, weight: 600, font: FONT_MONO, color: '#5f7d8a', align: 'right'});

    // File tree.
    ctx.fillStyle = '#0c141a';
    ctx.fillRect(0, 30, 118, height - 30);
    const files = ['app/', '  main.py', '  judge.py', 'core/', '  memory.py', '  trace.py', 'tests/'];
    files.forEach((file, index) => {
      const active = index === 1;
      if (active) {
        ctx.fillStyle = 'rgba(127, 191, 154, 0.14)';
        ctx.fillRect(0, 44 + index * 20, 118, 19);
      }
      text(ctx, file, 12, 58 + index * 20, {size: 10, weight: active ? 700 : 500, font: FONT_MONO, color: active ? '#9fd8b8' : '#68818c'});
    });

    // Code: bold colour bars read as syntax at miniature scale.
    const line = (y: number, tokens: ReadonlyArray<readonly [number, number, string]>) => {
      let x = 138;
      for (const [length, offset, color] of tokens) {
        ctx.fillStyle = color;
        rr(ctx, x + offset, y, length, 7, 3);
        ctx.fill();
        x += offset + length + 8;
      }
    };
    const ROWS: ReadonlyArray<ReadonlyArray<readonly [number, number, string]>> = [
      [[26, 0, '#c48a5f'], [58, 6, '#8fb8d8'], [34, 6, '#c8d6dc']],
      [[42, 0, '#7f9aa6'], [80, 6, '#a8c8d8'], [24, 6, '#e0b45a']],
      [],
      [[30, 0, '#c48a5f'], [44, 6, '#e8e0c8'], [66, 6, '#6f8a92']],
      [[22, 22, '#a8c8d8'], [36, 6, '#d8b878']],
      [[22, 22, '#a8c8d8'], [46, 6, '#d8b878'], [22, 6, '#7fbf9a']],
      [],
      [[40, 0, '#7fbf9a'], [26, 6, '#8fb8d8'], [58, 6, '#c8d6dc']],
      [[30, 22, '#c48a5f'], [38, 6, '#e8e0c8'], [52, 6, '#6f8a92']],
      [[34, 22, '#a8c8d8'], [46, 6, '#d8b878'], [30, 6, '#7fbf9a']],
      [[64, 22, '#6f8a92']],
    ];
    // Highlighted active line.
    ctx.fillStyle = 'rgba(127, 191, 154, 0.10)';
    ctx.fillRect(130, 142, width - 148, 22);
    ROWS.forEach((tokens, index) => {
      const y = 60 + index * 22;
      text(ctx, `${index + 1}`.padStart(2, ' '), 128, y + 8, {size: 9, weight: 500, font: FONT_MONO, color: '#3d5862', align: 'right'});
      line(y, tokens);
    });

    // Caret + status bar.
    ctx.fillStyle = '#bfe8f8';
    ctx.fillRect(336, 146, 3, 15);
    ctx.fillStyle = '#12242c';
    ctx.fillRect(0, height - 24, width, 24);
    ctx.fillStyle = '#7fbf9a';
    ctx.fillRect(0, height - 24, 72, 24);
    text(ctx, 'RUN', 12, height - 8, {size: 10, weight: 700, font: FONT_MONO, color: '#0c1a16'});
    text(ctx, 'trace replay · 04:12', 92, height - 8, {size: 10, weight: 600, font: FONT_MONO, color: '#7f9aa4'});

    // Minimap strip.
    const random = rng(31);
    for (let index = 0; index < 26; index += 1) {
      ctx.fillStyle = withAlpha(['#6f9fb8', '#e0c48a', '#7fbf9a'][Math.floor(random() * 3)] ?? '#6f9fb8', 0.45);
      ctx.fillRect(width - 62 + random() * 8, 44 + index * 8, 18 + random() * 38, 3);
    }
    grain(ctx, width, height, {seed: 2, count: 600, alpha: 0.03, size: 1.1});
  });

const stickyNote = (key: string, color: string, lines: readonly string[]): ReturnType<typeof canvasTexture> =>
  canvasTexture(`desk/sticky/${key}`, 128, 128, (ctx, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, height - 7, width, 7);
    lines.forEach((line, index) => {
      text(ctx, line, 12, 32 + index * 22, {size: 15, weight: 600, font: FONT_SANS, color: 'rgba(52,46,38,0.8)'});
    });
    ctx.fillStyle = 'rgba(236,232,218,0.5)';
    ctx.fillRect(width * 0.28, 0, width * 0.44, 10);
  });

const bookRow = (seed: number): ReturnType<typeof canvasTexture> =>
  canvasTexture(`desk/bookRow/${seed}`, 512, 140, (ctx, width, height) => {
    ctx.fillStyle = '#181410';
    ctx.fillRect(0, 0, width, height);
    const random = rng(seed * 71 + 5);
    const colors = ['#8a5a44', '#3f5f6a', '#6b7a4e', '#7a4a4a', '#4a5570', '#a08a5a', '#5a4a3a', '#6f5f7a', '#3f6a5a'];
    let x = 2;
    while (x < width - 8) {
      const bookWidth = 13 + random() * 20;
      const bookHeight = height * (0.62 + random() * 0.3);
      const color = colors[Math.floor(random() * colors.length)] ?? '#8a5a44';
      ctx.fillStyle = color;
      ctx.fillRect(x, height - bookHeight - 6, bookWidth, bookHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, height - bookHeight - 6, 2.5, bookHeight);
      ctx.fillStyle = 'rgba(240,232,210,0.5)';
      ctx.fillRect(x + bookWidth * 0.2, height - bookHeight * 0.58, Math.max(2, bookWidth * 0.6), 3);
      x += bookWidth + 1.5 + random() * 2;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, height - 6, width, 6);
  });

const nodeFace = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('desk/nodeFace', 256, 160, (ctx, width, height) => {
    ctx.fillStyle = '#242b30';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 9, count: 900, alpha: 0.05, size: 1.2});
    for (let index = 0; index < 7; index += 1) {
      ctx.fillStyle = 'rgba(8,12,14,0.7)';
      ctx.fillRect(18, 22 + index * 8, width - 96, 3);
    }
    ['#7fbf9a', '#e0b45a', '#7fbf9a'].forEach((color, index) => {
      softGlow(ctx, width - 54 + index * 22, 40, 16, withAlpha(color, 0.7));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(width - 54 + index * 22, 40, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(140,158,166,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, width - 24, height - 24);
    text(ctx, 'NODE-07', 18, 128, {size: 15, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
    text(ctx, 'ALWAYS ON', width - 18, 128, {size: 9, weight: 700, font: FONT_MONO, color: '#5f7f8a', align: 'right'});
  });

const SnakePlant = ({p, scale = 1, potColor = '#8f6550', leaves = 5}: {p: Vec3; scale?: number; potColor?: string; leaves?: number}) => (
  <group position={p} scale={scale}>
    <Cyl radius={0.052} radiusTop={0.06} height={0.088} color={potColor} segments={12} p={[0, 0.044, 0]} ink={false} />
    <Cyl radius={0.062} height={0.012} color={potColor} p={[0, 0.092, 0]} ink={false} shadow={false} />
    <Cyl radius={0.05} height={0.008} color="#382c20" p={[0, 0.098, 0]} ink={false} shadow={false} />
    {([
      [-0.022, -0.012, 0.26, -0.2, '#6f9468'],
      [0.024, 0.008, 0.3, 0.24, '#5f855a'],
      [0.0, 0.026, 0.21, 0.06, '#7a9c70'],
      [-0.03, 0.02, 0.18, -0.32, '#5f855a'],
      [0.028, -0.02, 0.2, 0.36, '#6f9468'],
    ] as const)
      .slice(0, leaves)
      .map(([x, z, height, tilt, color], index) => (
        <Cone
          key={index}
          radius={0.028}
          height={height}
          segments={5}
          color={color}
          s={[1, 1, 0.55]}
          p={[x, 0.1 + height / 2, z]}
          r={[tilt * 0.35, index * 1.1, tilt]}
          ink={false}
        />
      ))}
  </group>
);

/* ------------------------------------------------------------------ */
/* Room shell                                                          */
/* ------------------------------------------------------------------ */

const RoomShell = () => {
  const floor = plankFloor();
  const wall = toon('#ffffff', {map: plasterWall()});
  return (
    <group>
      {/* Raised floor with a wood plank top. */}
      <Box size={[3.6, 0.048, 3.6]} color="#241a12" p={[0, 0.024, 0]} ink={false} receive />
      <Box size={[3.58, 0.012, 3.58]} material={toon('#ffffff', {map: floor})} p={[0, 0.054, 0]} ink={false} shadow={false} />

      {/* Back wall built around the window opening. */}
      <Box size={[0.38, WALL_H, 0.08]} material={wall} p={[-1.61, WALL_H / 2, BACK_Z - 0.04]} ink inkWidth={0.006} />
      <Box size={[2.34, WALL_H, 0.08]} material={wall} p={[0.63, WALL_H / 2, BACK_Z - 0.04]} ink inkWidth={0.006} />
      <Box size={[0.88, WIN.y0, 0.08]} material={wall} p={[WIN_X, WIN.y0 / 2, BACK_Z - 0.04]} ink={false} />
      <Box size={[0.88, WALL_H - WIN.y1, 0.08]} material={wall} p={[WIN_X, (WALL_H + WIN.y1) / 2, BACK_Z - 0.04]} ink={false} />

      {/* Left wall. */}
      <Box size={[0.08, WALL_H, 3.6]} material={wall} p={[SIDE_X - 0.04, WALL_H / 2, 0]} ink inkWidth={0.006} />

      {/* Cut edges: a dark cap makes the walls read as a sliced model. */}
      <Box size={[3.62, 0.028, 0.1]} color="#3f2d20" p={[0, WALL_H + 0.012, BACK_Z - 0.04]} ink={false} shadow={false} />
      <Box size={[0.1, 0.028, 3.62]} color="#3f2d20" p={[SIDE_X - 0.04, WALL_H + 0.012, 0]} ink={false} shadow={false} />

      {/* Skirting boards. */}
      <Box size={[3.58, 0.075, 0.024]} color="#4a3728" p={[0, FLOOR + 0.038, BACK_Z + 0.012]} ink={false} shadow={false} />
      <Box size={[0.024, 0.075, 3.58]} color="#4a3728" p={[SIDE_X + 0.012, FLOOR + 0.038, 0]} ink={false} shadow={false} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Window + window seat                                                */
/* ------------------------------------------------------------------ */

const WindowNook = () => {
  const frame = '#493729';
  return (
    <group>
      {/* City beyond the glass. */}
      <Panel size={[WIN_W + 0.4, WIN_H + 0.34]} texture={nightCity()} p={[WIN_X, WIN_Y, BACK_Z - 0.096]} />
      <Panel size={[WIN_W, WIN_H]} material={glass('#b8d4e6', 0.08)} p={[WIN_X, WIN_Y, BACK_Z - 0.036]} />
      <Panel
        size={[WIN_W - 0.02, WIN_H - 0.02]}
        texture={lightPoolTexture('#9fc4e0', 0.4)}
        additive
        opacity={0.16}
        p={[WIN_X, WIN_Y, BACK_Z - 0.03]}
      />
      <SlidingDrops origin={[WIN_X, WIN_Y, BACK_Z - 0.024]} width={WIN_W - 0.16} height={WIN_H - 0.12} count={3} />

      {/* Frame + mullions. */}
      <Box size={[0.05, WIN_H + 0.04, 0.07]} color={frame} p={[WIN.x0, WIN_Y, BACK_Z]} ink inkWidth={0.004} shadow={false} />
      <Box size={[0.05, WIN_H + 0.04, 0.07]} color={frame} p={[WIN.x1, WIN_Y, BACK_Z]} ink inkWidth={0.004} shadow={false} />
      <Box size={[WIN_W + 0.05, 0.05, 0.07]} color={frame} p={[WIN_X, WIN.y1, BACK_Z]} ink={false} shadow={false} />
      <Box size={[0.022, WIN_H, 0.045]} color={frame} p={[WIN_X, WIN_Y, BACK_Z + 0.004]} ink={false} shadow={false} />

      {/* Sill + little plant. */}
      <Box size={[WIN_W + 0.11, 0.03, 0.15]} color="#8a7052" p={[WIN_X, WIN.y0 + 0.005, BACK_Z + 0.055]} ink inkWidth={0.004} shadow={false} />
      <SnakePlant p={[-0.66, WIN.y0 + 0.02, BACK_Z + 0.06]} scale={0.6} potColor="#a97a5c" leaves={3} />

      {/* Curtain rod, curtains and a half-lowered blind. */}
      <Cyl radius={0.007} height={WIN_W + 0.3} color="#6a5540" r={[0, 0, Math.PI / 2]} p={[WIN_X, WIN.y1 + 0.07, BACK_Z + 0.06]} ink={false} shadow={false} />
      <Panel size={[0.2, WIN_H + 0.02]} texture={curtainCloth()} lit r={[0, 0, 0.02]} p={[WIN.x0 + 0.06, WIN_Y - 0.02, BACK_Z + 0.075]} />
      <Panel size={[0.18, WIN_H + 0.02]} texture={curtainCloth()} lit r={[0, 0, -0.02]} p={[WIN.x1 - 0.05, WIN_Y - 0.02, BACK_Z + 0.075]} />
      <Panel size={[WIN_W - 0.04, 0.1]} texture={curtainCloth()} lit p={[WIN_X, WIN.y1 - 0.04, BACK_Z + 0.05]} />

      {/* Window seat under the sill. */}
      <RBox size={[0.78, 0.28, 0.32]} radius={0.008} color="#9a6f48" p={[-1.0, FLOOR + 0.14, -1.46]} ink inkWidth={0.005} />
      <RBox size={[0.8, 0.06, 0.34]} radius={0.012} color="#6f827c" p={[-1.0, FLOOR + 0.31, -1.46]} ink={false} />
      <Box size={[0.15, 0.05, 0.2]} color="#c9b48c" p={[-1.18, FLOOR + 0.36, -1.45]} r={[0, 0.18, 0]} ink={false} shadow={false} />
      <Box size={[0.16, 0.06, 0.22]} color="#7f8f88" p={[-0.84, FLOOR + 0.365, -1.47]} r={[0, -0.1, 0]} ink={false} shadow={false} />

      {/* Cool light spilling in from the street. */}
      <Panel
        size={[1.15, 1.15]}
        texture={lightPoolTexture('#8fb8dc', 0.34)}
        additive
        opacity={0.5}
        r={[-Math.PI / 2, 0, 0]}
        p={[-1.02, FLOOR + 0.003, -1.0]}
      />
      <Glow color="#a8cce8" size={1.1} opacity={0.14} p={[WIN_X, WIN_Y, BACK_Z + 0.05]} />
      <Panel
        size={[1.5, 1.05]}
        texture={lightSpillTexture('#9fc4e0', 0.26)}
        additive
        opacity={0.4}
        p={[-0.74, 0.62, BACK_Z + 0.004]}
      />
      <pointLight position={[WIN_X, WIN_Y, BACK_Z - 0.12]} color="#8fb6dc" intensity={1.7} distance={3} decay={2} />
      <pointLight position={[-1.05, 0.95, -1.2]} color="#9ec6e4" intensity={0.36} distance={1.8} decay={2} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Desk                                                                */
/* ------------------------------------------------------------------ */

const researchSpine = () => canvasTexture('desk/research-spine', 512, 80, ctx => {
  ctx.fillStyle = '#3f5f6a'; ctx.fillRect(0, 0, 512, 80);
  text(ctx, 'AGENT / MEMORY / GRAPH', 256, 52, {size: 28, font: FONT_MONO, align: 'center', color: '#e6d7ae'});
});

const BookStack = ({origin}: {origin: Vec3}) => (
  <group position={origin}>
    <Box size={[0.18, 0.03, 0.24]} color="#7c4f3c" ink={false} r={[0, 0.1, 0]} />
    <Box size={[0.168, 0.019, 0.232]} color="#e8dfc8" p={[0, 0, 0.006]} ink={false} shadow={false} r={[0, 0.1, 0]} />
    <Box size={[0.165, 0.026, 0.225]} color="#3f5f6a" p={[0.012, 0.032, 0]} r={[0, -0.05, 0]} ink={false} />
    <Box size={[0.155, 0.016, 0.216]} color="#ddd4bc" p={[0.012, 0.032, 0.005]} ink={false} shadow={false} r={[0, -0.05, 0]} />
    <Panel size={[.15, .022]} texture={researchSpine()} p={[.006, .032, .114]} r={[0, -.05, 0]} />
    <Box size={[0.155, 0.022, 0.205]} color="#c4a05a" p={[-0.008, 0.058, 0.004]} r={[0, 0.2, 0]} ink={false} />
    <Box size={[0.145, 0.014, 0.196]} color="#e8dfc8" p={[-0.008, 0.058, 0.012]} ink={false} shadow={false} r={[0, 0.2, 0]} />
    {/* Empty cup on the stack. */}
    <Cyl radius={0.026} radiusTop={0.03} height={0.058} color="#e2d8c4" p={[0.02, 0.098, -0.01]} ink={false} />
  </group>
);

const DeskFrame = () => {
  const wood = toon('#c69a6b', {map: deskWoodTexture()});
  const legY = FLOOR + (DESK_TOP - 0.042 - FLOOR) / 2;
  const legH = DESK_TOP - 0.042 - FLOOR;
  return (
    <group>
      <RBox size={[DESK_W, 0.042, DESK_D]} radius={0.008} material={wood} p={[DESK_X, DESK_TOP - 0.021, DESK_Z]} ink inkWidth={0.005} />
      <Box size={[DESK_W - 0.08, 0.028, 0.02]} color="#8a6140" p={[DESK_X, DESK_TOP - 0.038, DESK_Z + DESK_D / 2 - 0.03]} ink={false} shadow={false} />
      <Box size={[DESK_W - 0.1, 0.05, 0.018]} color="#8a6140" p={[DESK_X, DESK_TOP - 0.055, DESK_Z - DESK_D / 2 + 0.035]} ink={false} shadow={false} />
      {([
        [-0.42, -1.46],
        [0.58, -1.46],
        [-0.42, -1.06],
        [0.58, -1.06],
      ] as const).map(([x, z]) => (
        <Cyl key={`${x}-${z}`} radius={0.016} radiusTop={0.011} height={legH} color="#a3754c" segments={10} p={[x, legY, z]} ink={false} />
      ))}
      {/* Small drawer under the top. */}
      <Box size={[0.3, 0.075, DESK_D - 0.08]} color="#8f6440" p={[DESK_X + 0.3, DESK_TOP - 0.1, DESK_Z]} ink={false} />
      <Box size={[0.28, 0.05, 0.012]} color="#b98a5e" p={[DESK_X + 0.3, DESK_TOP - 0.1, DESK_Z + DESK_D / 2 - 0.036]} ink={false} shadow={false} />
      <ContactShadow p={[DESK_X, FLOOR, DESK_Z]} radius={0.95} opacity={0.4} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Monitor                                                             */
/* ------------------------------------------------------------------ */

const Monitor = () => (
  <group>
    <RBox size={[0.16, 0.014, 0.11]} radius={0.004} color="#3a3f45" p={[MON_X, DESK_TOP + 0.007, MON_Z + 0.012]} ink={false} />
    <Box size={[0.032, 0.088, 0.026]} color="#4a5056" p={[MON_X, DESK_TOP + 0.058, MON_Z + 0.008]} ink={false} shadow={false} />
    <RBox size={[0.4, 0.235, 0.024]} radius={0.006} color="#23282d" p={[MON_X, MON_Y, MON_Z]} ink inkWidth={0.004} />
    <Panel size={[0.366, 0.202]} texture={codeEditor()} p={[MON_X, MON_Y + 0.004, MON_Z + 0.0135]} />
    <Glow color="#7fb6d4" size={0.62} opacity={0.14} p={[MON_X, MON_Y, MON_Z + 0.14]} />
    <Panel
      size={[0.6, 0.42]}
      texture={lightPoolTexture('#7fb6d4', 0.36)}
      additive
      opacity={0.3}
      p={[MON_X, MON_Y - 0.02, BACK_Z + 0.006]}
    />
    {/* Sticky note stuck to the bottom bezel. */}
    <Panel size={[0.05, 0.05]} texture={stickyNote('bezel', '#f0d88a', ['fix', 'eval'])} p={[MON_X - 0.128, MON_Y - 0.108, MON_Z + 0.0145]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Desk lamp                                                           */
/* ------------------------------------------------------------------ */

const DeskLamp = () => (
  <group>
    <RBox size={[0.115, 0.016, 0.115]} radius={0.006} color="#33383c" p={[LAMP_X, DESK_TOP + 0.008, LAMP_Z]} ink={false} />
    <Cyl radius={0.013} height={0.036} color="#4a5054" p={[LAMP_X, DESK_TOP + 0.034, LAMP_Z]} ink={false} shadow={false} />
    <Pipe from={[LAMP_X, DESK_TOP + 0.048, LAMP_Z]} to={[LAMP_X, DESK_TOP + 0.2, LAMP_Z - 0.03]} radius={0.0065} color="#3f4448" />
    <Sphere radius={0.012} color="#5a6064" p={[LAMP_X, DESK_TOP + 0.2, LAMP_Z - 0.03]} ink={false} shadow={false} />
    <Pipe from={[LAMP_X, DESK_TOP + 0.2, LAMP_Z - 0.03]} to={[LAMP_X - 0.1, DESK_TOP + 0.19, LAMP_Z + 0.17]} radius={0.0065} color="#3f4448" />
    <Cyl
      radius={0.075}
      radiusTop={0.026}
      height={0.085}
      segments={20}
      color="#3d4247"
      p={[LAMP_X - 0.108, DESK_TOP + 0.16, LAMP_Z + 0.19]}
      r={[0.22, 0, 0.16]}
      ink
      inkWidth={0.004}
    />
    <Cyl
      radius={0.052}
      height={0.006}
      color="#ffe6b8"
      material={flat('#ffe6b8')}
      p={[LAMP_X - 0.112, DESK_TOP + 0.118, LAMP_Z + 0.201]}
      r={[0.22, 0, 0.16]}
      ink={false}
      shadow={false}
    />
    <LightCone
      color="#ffcf9a"
      height={0.13}
      radiusTop={0.05}
      radiusBottom={0.19}
      opacity={0.1}
      p={[LAMP_X - 0.112, DESK_TOP + 0.12, LAMP_Z + 0.201]}
    />
    <Glow color="#ffcf9a" size={0.3} opacity={0.28} p={[LAMP_X - 0.11, DESK_TOP + 0.1, LAMP_Z + 0.2]} />
    <Panel
      size={[0.7, 0.6]}
      texture={lightPoolTexture('#ffcb90', 0.52)}
      additive
      opacity={0.36}
      r={[-Math.PI / 2, 0, 0]}
      p={[LAMP_X - 0.1, DESK_TOP + 0.0026, LAMP_Z + 0.14]}
    />
    <pointLight position={[LAMP_X - 0.1, DESK_TOP + 0.12, LAMP_Z + 0.18]} color="#ffcf9a" intensity={0.4} distance={1.55} decay={2} />
    <pointLight position={[-0.28, DESK_TOP + 0.22, -1.1]} color="#ffd9a8" intensity={0.16} distance={0.8} decay={2} />
    <pointLight position={[0.3, 1.02, -1.12]} color="#ffc48a" intensity={0.35} distance={1.7} decay={2} />
    <Panel
      size={[0.68, 0.62]}
      texture={lightPoolTexture('#ffc98a', 0.4)}
      additive
      opacity={0.36}
      p={[0.63, 0.68, BACK_Z + 0.007]}
    />
  </group>
);

/* ------------------------------------------------------------------ */
/* Desk clutter                                                        */
/* ------------------------------------------------------------------ */

const DeskTop = () => (
  <group>
    <Panel size={[0.66, 0.34]} texture={deskMatTexture()} lit p={[0.0, DESK_TOP + 0.0015, -1.18]} />

    {/* Keyboard. */}
    <RBox size={[0.3, 0.018, 0.108]} radius={0.004} color="#2b3037" p={[0.0, DESK_TOP + 0.012, -1.2]} ink={false} />
    <Panel size={[0.286, 0.096]} texture={keyboardTexture()} p={[0.0, DESK_TOP + 0.0215, -1.2]} />
    {/* Mouse. */}
    <RBox size={[0.052, 0.026, 0.082]} radius={0.012} color="#2f353b" p={[0.255, DESK_TOP + 0.014, -1.17]} r={[0, -0.1, 0]} ink={false} />
    <Cyl radius={0.005} height={0.012} color="#7fa8b8" r={[Math.PI / 2, 0, 0]} p={[0.255, DESK_TOP + 0.026, -1.19]} ink={false} shadow={false} />

    {/* Open notebook and a loose sheet. */}
    <group position={[-0.34, DESK_TOP, -1.15]} rotation={[0, 0.16, 0]}>
      <Box size={[0.26, 0.007, 0.18]} color="#3f5058" p={[0, 0.005, 0]} ink={false} />
      <Panel size={[0.118, 0.166]} texture={notebookPage('left')} r={[-Math.PI / 2, 0, 0]} p={[-0.062, 0.0095, 0]} />
      <Panel size={[0.118, 0.166]} texture={notebookPage('right')} r={[-Math.PI / 2, 0, 0]} p={[0.062, 0.0095, 0]} />
      <Cyl radius={0.0035} height={0.14} color="#c85f4a" p={[0.0, 0.0145, 0.062]} r={[0, 0.45, Math.PI / 2]} ink={false} shadow={false} />
    </group>
    <Panel size={[0.14, 0.2]} texture={paperSheetTexture('todo / 10-21', 9)} r={[-Math.PI / 2, 0, 0.26]} p={[-0.43, DESK_TOP + 0.0022, -1.01]} />

    {/* Books + cup. */}
    <BookStack origin={[-0.36, DESK_TOP, -1.4]} />

    {/* Pen cup. */}
    <Cyl radius={0.031} radiusTop={0.034} height={0.088} color="#5a6a68" p={[0.6, DESK_TOP + 0.044, -1.24]} ink={false} />
    {[0, 1, 2].map((index) => (
      <Cyl
        key={index}
        radius={0.0035}
        height={0.15}
        color={['#c85f4a', '#3f6f7a', '#d8b05a'][index] ?? '#c85f4a'}
        p={[0.59 + (index % 2) * 0.016, DESK_TOP + 0.1, -1.25 + (index % 2) * 0.014]}
        r={[(index - 1) * 0.1, 0, (index - 1) * 0.14]}
        ink={false}
        shadow={false}
      />
    ))}

    {/* Mug. */}
    <Cyl radius={0.034} radiusTop={0.038} height={0.078} color="#e6dcc8" p={[0.38, DESK_TOP + 0.039, -1.03]} ink={false} />
    <Torus radius={0.024} tube={0.005} color="#e6dcc8" p={[0.42, DESK_TOP + 0.042, -1.03]} radialSegments={6} tubularSegments={16} ink={false} />
    <Steam p={[0.38, DESK_TOP + 0.08, -1.03]} height={0.2} />

    {/* Phone + cable. */}
    <RBox size={[0.046, 0.008, 0.088]} radius={0.004} color="#20252a" p={[0.12, DESK_TOP + 0.006, -1.03]} r={[0, 0.24, 0]} ink={false} />
    <Panel size={[0.038, 0.078]} texture={lightPoolTexture('#9fc0d8', 0.9)} p={[0.12, DESK_TOP + 0.0105, -1.03]} r={[-Math.PI / 2, 0, 0.24]} opacity={0.8} />
    <Cable points={[[0.14, DESK_TOP + 0.008, -1.06], [0.4, DESK_TOP + 0.006, -1.0], [0.58, DESK_TOP - 0.01, -1.02], [0.63, DESK_TOP - 0.18, -1.06]]} radius={0.0035} color="#20242a" />

    {/* Sticky notes on the desk. */}
    <Panel size={[0.055, 0.055]} texture={stickyNote('desk1', '#f0d88a', ['retry', 'judge'])} r={[-Math.PI / 2, 0, 0.18]} p={[-0.2, DESK_TOP + 0.004, -1.02]} />
    <Panel size={[0.05, 0.05]} texture={stickyNote('desk2', '#bfd8c8', ['neo4j', 'index'])} r={[-Math.PI / 2, 0, -0.24]} p={[0.55, DESK_TOP + 0.004, -1.04]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Nightstand + headphones                                             */
/* ------------------------------------------------------------------ */

const Headphones = () => (
  <group position={[1.0, 0.388, -1.4]}>
    <Cyl radius={0.048} height={0.012} color="#3f4448" p={[0, 0.006, 0]} ink={false} />
    <Cyl radius={0.007} height={0.15} color="#4a5054" p={[0, 0.085, 0]} ink={false} shadow={false} />
    <Cable points={[[-0.052, 0.168, 0], [-0.05, 0.215, 0.004], [0, 0.232, 0.006], [0.05, 0.215, 0.004], [0.052, 0.168, 0]]} radius={0.009} color="#2f343a" />
    {[-1, 1].map((side) => (
      <Cyl key={side} radius={0.026} height={0.024} color="#2f343a" r={[0, 0, Math.PI / 2]} p={[side * 0.056, 0.16, 0.006]} ink={false} />
    ))}
  </group>
);

const RobotToy = () => (
  <group position={[0.85, 0.388, -1.26]} rotation={[0, -0.45, 0]}>
    <RBox size={[0.052, 0.058, 0.04]} radius={0.008} color="#e2dccd" p={[0, 0.032, 0]} ink={false} />
    <RBox size={[0.044, 0.036, 0.034]} radius={0.008} color="#e8e2d4" p={[0, 0.082, 0]} ink={false} />
    <Box size={[0.032, 0.012, 0.004]} color="#20262c" p={[0, 0.084, 0.019]} ink={false} shadow={false} />
    <Box size={[0.008, 0.004, 0.004]} color="#8fe0c0" material={flat('#8fe0c0')} p={[-0.009, 0.084, 0.022]} ink={false} shadow={false} />
    <Box size={[0.008, 0.004, 0.004]} color="#8fe0c0" material={flat('#8fe0c0')} p={[0.009, 0.084, 0.022]} ink={false} shadow={false} />
    <Cyl radius={0.002} height={0.024} color="#8a9096" p={[0.014, 0.112, 0]} ink={false} shadow={false} />
  </group>
);

const Nightstand = () => (
  <group>
    <RBox size={[0.34, 0.3, 0.42]} radius={0.008} color="#a5784c" p={[0.95, FLOOR + 0.16, -1.37]} ink inkWidth={0.005} />
    <Box size={[0.37, 0.028, 0.45]} color="#b98a5e" p={[0.95, FLOOR + 0.322, -1.37]} ink={false} />
    <Box size={[0.3, 0.012, 0.012]} color="#6f4a30" p={[0.95, FLOOR + 0.1, -1.155]} ink={false} shadow={false} />
    <Box size={[0.3, 0.1, 0.01]} color="#93613e" p={[0.95, FLOOR + 0.19, -1.158]} ink={false} shadow={false} />
    <Box size={[0.3, 0.1, 0.01]} color="#93613e" p={[0.95, FLOOR + 0.09, -1.158]} ink={false} shadow={false} />
    <Sphere radius={0.009} color="#d8c8a8" p={[0.95, FLOOR + 0.19, -1.15]} ink={false} shadow={false} />
    <ContactShadow p={[0.95, FLOOR, -1.37]} radius={0.42} opacity={0.4} />
    <Headphones />
    <RobotToy />
  </group>
);

/* ------------------------------------------------------------------ */
/* Bookshelf                                                           */
/* ------------------------------------------------------------------ */

const ShelfBooks = ({y, seed}: {y: number; seed: number}) => {
  const random = rng(seed * 31 + 3);
  return (
    <group>
      <Panel size={[0.45, 0.26]} texture={bookRow(seed)} lit p={[1.41, y + 0.13, -1.645]} />
      {[0, 1].map((index) => {
        const height = 0.15 + random() * 0.05;
        const width = 0.018 + random() * 0.012;
        const colors = ['#8a5a44', '#3f5f6a', '#6b7a4e', '#a08a5a'];
        return (
          <Box
            key={index}
            size={[width, height, 0.15]}
            color={colors[index % colors.length] ?? '#8a5a44'}
            p={[1.22 + index * 0.05, y + height / 2, -1.5]}
            r={[0, 0, (index - 1) * 0.02]}
            ink={false}
          />
        );
      })}
    </group>
  );
};
const Bookshelf = () => (
  <group>
    <Box size={[0.02, 0.92, 0.26]} color="#8a6440" p={[1.17, FLOOR + 0.46, -1.53]} ink={false} />
    <Box size={[0.02, 0.92, 0.26]} color="#8a6440" p={[1.65, FLOOR + 0.46, -1.53]} ink={false} />
    <Box size={[0.5, 0.02, 0.26]} color="#8a6440" p={[1.41, FLOOR + 0.01, -1.53]} ink={false} />
    <Box size={[0.5, 0.022, 0.26]} color="#8a6440" p={[1.41, FLOOR + 0.9, -1.53]} ink={false} />
    <Box size={[0.46, 0.86, 0.008]} color="#4a382a" p={[1.41, FLOOR + 0.46, -1.652]} ink={false} shadow={false} />
    <Box size={[0.46, 0.016, 0.25]} color="#9a7350" p={[1.41, FLOOR + 0.3, -1.53]} ink={false} />
    <Box size={[0.46, 0.016, 0.25]} color="#9a7350" p={[1.41, FLOOR + 0.59, -1.53]} ink={false} />
    <ShelfBooks y={FLOOR + 0.02} seed={3} />
    <ShelfBooks y={FLOOR + 0.31} seed={7} />
    <ShelfBooks y={FLOOR + 0.6} seed={11} />

    {/* Tiny always-on node on top. */}
    <group position={[1.36, FLOOR + 0.912, -1.53]} rotation={[0, -0.16, 0]}>
      <RBox size={[0.2, 0.12, 0.17]} radius={0.004} color="#2c3338" p={[0, 0.06, 0]} ink inkWidth={0.003} />
      <Panel size={[0.18, 0.1]} texture={nodeFace()} p={[0, 0.062, 0.087]} />
      <Box size={[0.2, 0.006, 0.17]} color="#1e2429" p={[0, 0.122, 0]} ink={false} shadow={false} />
      <Cable points={[[0.1, 0.08, 0], [0.16, 0.06, -0.04], [0.17, 0.01, -0.08], [0.15, -0.04, -0.12]]} radius={0.004} color="#20242a" />
    </group>
    <Glow color="#7fbf9a" size={0.18} opacity={0.22} p={[1.41, FLOOR + 1.0, -1.44]} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Chair                                                               */
/* ------------------------------------------------------------------ */

const Chair = () => (
  <group position={[-0.74, FLOOR, -0.48]} rotation={[0, 0.62, 0]}>
    {([
      [-0.14, -0.13],
      [0.14, -0.13],
      [-0.14, 0.13],
      [0.14, 0.13],
    ] as const).map(([x, z]) => (
      <Cyl key={`${x}-${z}`} radius={0.017} radiusTop={0.012} height={0.14} color="#96683f" p={[x, 0.07, z]} r={[z * 0.14, 0, -x * 0.14]} ink={false} />
    ))}
    <RBox size={[0.34, 0.03, 0.32]} radius={0.01} color="#a5764a" p={[0, 0.145, 0]} ink inkWidth={0.004} />
    <RBox size={[0.3, 0.022, 0.27]} radius={0.012} color="#6f827c" p={[0, 0.172, 0.005]} ink={false} />
    {[-1, 1].map((side) => (
      <Box key={side} size={[0.026, 0.28, 0.026]} color="#96683f" p={[side * 0.14, 0.29, -0.13]} r={[0.06, 0, 0]} ink={false} />
    ))}
    <RBox size={[0.31, 0.115, 0.03]} radius={0.012} color="#a5764a" p={[0, 0.4, -0.146]} r={[0.06, 0, 0]} ink inkWidth={0.004} />
    <ContactShadow p={[0, 0.001, 0]} radius={0.5} opacity={0.4} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Floor life                                                          */
/* ------------------------------------------------------------------ */

const FloorLife = () => (
  <group>
    <Panel
      size={[2.0, 1.9]}
      texture={studyRug()}
      lit
      r={[-Math.PI / 2, 0, 0]}
      p={[0.0, FLOOR + 0.004, -0.54]}
    />
    <Panel
      size={[1.55, 1.25]}
      texture={lightPoolTexture('#ffb46a', 0.34)}
      additive
      opacity={0.45}
      r={[-Math.PI / 2, 0, 0]}
      p={[0.22, FLOOR + 0.0065, -0.94]}
    />

    {/* Floor cushion + folded blanket. */}
    <RBox size={[0.28, 0.075, 0.28]} radius={0.03} color="#5f7280" p={[0.66, FLOOR + 0.04, 0.14]} ink={false} />
    <Box size={[0.24, 0.012, 0.24]} color="#7f8f98" p={[0.66, FLOOR + 0.079, 0.14]} r={[0, 0.3, 0]} ink={false} shadow={false} />
    <Box size={[0.2, 0.035, 0.16]} color="#8a705a" p={[0.88, FLOOR + 0.02, -0.06]} r={[0, -0.24, 0]} ink={false} />
    <Box size={[0.2, 0.03, 0.15]} color="#a8907a" p={[0.88, FLOOR + 0.052, -0.06]} r={[0, -0.2, 0]} ink={false} shadow={false} />

    {/* Low floor tray with a mug. */}
    <group position={[0.28, FLOOR, 0.46]}>
      <Cyl radius={0.19} height={0.014} color="#9a7350" segments={20} p={[0, 0.142, 0]} ink={false} />
      <Cyl radius={0.024} height={0.135} color="#7a5638" p={[0, 0.068, 0]} ink={false} shadow={false} />
      <Cyl radius={0.1} height={0.012} color="#7a5638" p={[0, 0.006, 0]} ink={false} shadow={false} />
      <Cyl radius={0.03} radiusTop={0.034} height={0.07} color="#e6dcc8" p={[0.05, 0.184, 0.02]} ink={false} />
    </group>

    {/* Laundry basket by the left wall. */}
    <Cyl radius={0.11} radiusTop={0.12} height={0.24} color="#8a765a" p={[-1.43, FLOOR + 0.12, -0.16]} segments={14} ink={false} />
    <Cyl radius={0.122} height={0.02} color="#a08a68" p={[-1.43, FLOOR + 0.24, -0.16]} ink={false} shadow={false} />
    <RBox size={[0.16, 0.05, 0.14]} radius={0.02} color="#6f7a82" p={[-1.43, FLOOR + 0.25, -0.16]} r={[0, 0.4, 0]} ink={false} shadow={false} />

    {/* Backpack. */}
    <group position={[1.02, FLOOR, -0.62]} rotation={[0, -0.42, 0]}>
      <RBox size={[0.2, 0.26, 0.13]} radius={0.045} color="#3f5058" p={[0, 0.13, 0]} ink inkWidth={0.004} />
      <RBox size={[0.17, 0.1, 0.05]} radius={0.02} color="#4a5c64" p={[0, 0.11, 0.075]} ink={false} />
      <Box size={[0.06, 0.02, 0.015]} color="#c8a45a" p={[0, 0.1, 0.1]} ink={false} shadow={false} />
    </group>

    {/* Waste bin + crumpled paper. */}
    <Cyl radius={0.075} radiusTop={0.082} height={0.16} color="#5a625f" p={[0.72, FLOOR + 0.08, -0.86]} ink={false} />
    <Sphere radius={0.026} color="#e2dac6" p={[0.66, FLOOR + 0.02, -0.74]} segments={8} ink={false} shadow={false} />

    {/* Power strip + cables. */}
    <Box size={[0.2, 0.032, 0.062]} color="#d8d2c2" p={[0.86, FLOOR + 0.016, -1.06]} r={[0, 0.16, 0]} ink={false} />
    <Box size={[0.032, 0.006, 0.04]} color="#3a3f42" p={[0.83, FLOOR + 0.034, -1.058]} r={[0, 0.16, 0]} ink={false} shadow={false} />
    <Box size={[0.032, 0.006, 0.04]} color="#3a3f42" p={[0.89, FLOOR + 0.034, -1.044]} r={[0, 0.16, 0]} ink={false} shadow={false} />
    <Cable
      points={[
        [0.94, FLOOR + 0.02, -1.06],
        [1.2, FLOOR + 0.012, -1.1],
        [1.45, FLOOR + 0.04, -1.3],
        [1.62, FLOOR + 0.2, -1.66],
      ]}
      radius={0.0055}
      color="#23272c"
    />
    <Cable
      points={[
        [0.78, FLOOR + 0.02, -1.04],
        [0.68, FLOOR + 0.012, -1.12],
        [0.62, FLOOR + 0.1, -1.3],
        [0.6, DESK_TOP - 0.02, -1.36],
      ]}
      radius={0.0045}
      color="#23272c"
    />
    <Cable
      points={[
        [0.02, DESK_TOP - 0.02, -1.46],
        [0.14, DESK_TOP - 0.12, -1.55],
        [0.3, FLOOR + 0.1, -1.5],
        [0.55, FLOOR + 0.008, -1.24],
      ]}
      radius={0.0045}
      color="#23272c"
    />
    <Cable
      points={[
        [0.52, DESK_TOP - 0.02, -1.36],
        [0.58, DESK_TOP - 0.14, -1.46],
        [0.66, FLOOR + 0.16, -1.5],
        [0.72, FLOOR + 0.008, -1.3],
      ]}
      radius={0.0045}
      color="#23272c"
    />

    {/* Wall socket on the left wall. */}
    <Box size={[0.012, 0.1, 0.08]} color="#d8d2c2" p={[SIDE_X + 0.008, 0.3, -0.3]} ink={false} shadow={false} />
    <Box size={[0.004, 0.022, 0.018]} color="#3a3f42" p={[SIDE_X + 0.015, 0.31, -0.318]} ink={false} shadow={false} />
    <Cable
      points={[
        [SIDE_X + 0.02, 0.29, -0.3],
        [SIDE_X + 0.06, 0.1, -0.32],
        [-1.5, FLOOR + 0.012, -0.42],
        [-0.9, FLOOR + 0.012, -0.64],
        [0.2, FLOOR + 0.012, -0.78],
        [0.8, FLOOR + 0.016, -1.0],
      ]}
      radius={0.005}
      color="#23272c"
    />

    {/* Tall plant in the front-left corner. */}
    <SnakePlant p={[-1.38, FLOOR, 0.42]} scale={1.9} potColor="#8a6048" leaves={4} />
    <Cyl radius={0.14} height={0.018} color="#6f5038" p={[-1.38, FLOOR + 0.009, 0.42]} ink={false} shadow={false} />

    {/* Slippers. */}
    <RBox size={[0.085, 0.034, 0.17]} radius={0.014} color="#c9b48c" p={[-0.88, FLOOR + 0.018, 0.12]} r={[0, 0.42, 0]} ink={false} />
    <RBox size={[0.085, 0.034, 0.17]} radius={0.014} color="#c9b48c" p={[-0.99, FLOOR + 0.018, 0.05]} r={[0, 0.3, 0]} ink={false} />
    <Box size={[0.068, 0.012, 0.024]} color="#8a7050" p={[-0.88, FLOOR + 0.036, 0.055]} r={[0, 0.42, 0]} ink={false} shadow={false} />
    <Box size={[0.068, 0.012, 0.024]} color="#8a7050" p={[-0.99, FLOOR + 0.036, -0.015]} r={[0, 0.3, 0]} ink={false} shadow={false} />

    {/* Books on the floor by the window seat. */}
    <Box size={[0.2, 0.024, 0.15]} color="#3f5f6a" p={[-1.3, FLOOR + 0.012, -0.96]} r={[0, -0.14, 0]} ink={false} />
    <Box size={[0.19, 0.02, 0.14]} color="#c8b48c" p={[-1.3, FLOOR + 0.034, -0.96]} r={[0, -0.1, 0]} ink={false} />

    {/* Rolled mat leaning in the corner. */}
    <Cyl radius={0.045} height={0.46} color="#6f5f4a" p={[-1.6, FLOOR + 0.23, 1.22]} r={[0, 0, 0.1]} segments={12} ink={false} />
    <Cyl radius={0.038} height={0.008} color="#8a7256" p={[-1.57, FLOOR + 0.45, 1.22]} r={[0, 0, 0.1]} ink={false} shadow={false} />  </group>
);

/* ------------------------------------------------------------------ */
/* Wall decor                                                          */
/* ------------------------------------------------------------------ */

const WallDecor = () => (
  <group>
    {/* Cork pin board above the monitor. */}
    <Box size={[0.64, 0.4, 0.014]} color="#6f4f30" p={[0.22, 1.02, BACK_Z + 0.014]} ink={false} shadow={false} />
    <Panel size={[0.6, 0.36]} texture={corkBoardTexture()} p={[0.22, 1.02, BACK_Z + 0.022]} />
    <Panel size={[0.1, 0.13]} texture={photoTexture('night')} r={[0, 0, 0.05]} p={[0.03, 1.06, BACK_Z + 0.026]} />
    <Panel size={[0.09, 0.12]} texture={photoTexture('campus')} r={[0, 0, -0.08]} p={[0.17, 1.09, BACK_Z + 0.027]} />
    <Panel size={[0.19, 0.14]} texture={paperSheetTexture('04:12 / trace', 6)} p={[0.35, 0.99, BACK_Z + 0.026]} r={[0, 0, 0.03]} />
    <Panel size={[0.062, 0.062]} texture={stickyNote('wall1', '#f0d88a', ['RAG', 'eval'])} r={[0, 0, 0.1]} p={[-0.03, 0.93, BACK_Z + 0.028]} />
    <Panel size={[0.058, 0.058]} texture={stickyNote('wall2', '#e8b8b0', ['demo', 'fri'])} r={[0, 0, -0.12]} p={[0.4, 1.12, BACK_Z + 0.028]} />

    {/* Printed flow diagram to the left of the board. */}
    <Panel size={[0.34, 0.28]} texture={flowDiagram()} r={[0, 0, -0.015]} p={[-0.27, 1.02, BACK_Z + 0.012]} />

    {/* Framed print. */}
    <Box size={[0.34, 0.46, 0.016]} color="#3f3128" p={[0.82, 1.02, BACK_Z + 0.01]} ink={false} shadow={false} />
    <Panel size={[0.3, 0.42]} texture={posterTexture('deskPrint', '静かな夜', 'QUIET NIGHT / JZY', '#3f5f6a')} p={[0.82, 1.02, BACK_Z + 0.02]} />

    {/* Clock. */}
    <Torus radius={0.078} tube={0.009} color="#3f3128" p={[1.18, 1.11, BACK_Z + 0.014]} radialSegments={6} tubularSegments={26} ink={false} />
    <Panel size={[0.16, 0.16]} texture={clockFaceTexture()} opacity={1} p={[1.18, 1.11, BACK_Z + 0.012]} />

    {/* Left wall: calendar, print, tote bag. */}
    <Panel size={[0.22, 0.3]} texture={calendarTexture()} r={[0, Math.PI / 2, 0]} p={[SIDE_X + 0.008, 0.98, 0.1]} />
    <Panel size={[0.3, 0.4]} texture={posterTexture('deskSide', '海の夜', 'NIGHT SEA', '#2f4f5f')} r={[0, Math.PI / 2, 0]} p={[SIDE_X + 0.008, 1.0, -0.62]} />
    <Panel size={[0.3, 0.42]} texture={posterTexture('deskSide2', '秋の講義', 'AUTUMN / LECTURE', '#7a5334')} r={[0, Math.PI / 2, 0]} p={[SIDE_X + 0.008, 0.96, 0.96]} />
    <Cyl radius={0.01} height={0.05} color="#8a7050" r={[0, 0, Math.PI / 2]} p={[SIDE_X + 0.03, 0.86, 0.68]} ink={false} shadow={false} />
    <RBox size={[0.035, 0.19, 0.15]} radius={0.01} color="#8a9a8a" p={[SIDE_X + 0.07, 0.74, 0.68]} ink={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Warm string lights                                                  */
/* ------------------------------------------------------------------ */

const STRING: readonly Vec3[] = [
  [-0.28, 1.36, BACK_Z + 0.06],
  [-0.05, 1.325, BACK_Z + 0.06],
  [0.28, 1.305, BACK_Z + 0.06],
  [0.62, 1.325, BACK_Z + 0.06],
  [0.96, 1.305, BACK_Z + 0.06],
  [1.3, 1.325, BACK_Z + 0.06],
  [1.58, 1.355, BACK_Z + 0.06],
];

const StringLights = () => (
  <group>
    <Cable points={STRING} radius={0.0035} color="#2f3a34" />
    {STRING.filter((_, index) => index !== 2 && index !== 4).map((point, index) => (
      <mesh key={index} geometry={sphereGeometry(0.012, 8, 6)} position={[point[0], point[1] - 0.012, point[2]]}>
        <meshBasicMaterial color="#ffe2b4" toneMapped={false} />
      </mesh>
    ))}
    <Glow color="#ffcf9a" size={0.45} opacity={0.18} p={[0.28, 1.3, BACK_Z + 0.08]} />
    <Glow color="#ffcf9a" size={0.45} opacity={0.18} p={[1.3, 1.32, BACK_Z + 0.08]} />
    <pointLight position={[0.7, 1.27, BACK_Z + 0.12]} color="#ffcf9a" intensity={0.3} distance={1.5} decay={2} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Small animated details                                              */
/* ------------------------------------------------------------------ */

const LiveDetails = () => {
  const scan = useRef<Mesh>(null);
  const cursor = useRef<Mesh>(null);
  const screenLight = useRef<PointLight>(null);
  const led = useRef<Mesh>(null);
  const led2 = useRef<Mesh>(null);

  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    if (scan.current) {
      scan.current.position.y = MON_Y - 0.088 + ((time * 0.052) % 0.19);
      const material = scan.current.material as MeshBasicMaterial;
      material.opacity = 0.1 + 0.05 * Math.sin(time * 4.2);
    }
    if (cursor.current) {
      const material = cursor.current.material as MeshBasicMaterial;
      material.opacity = (time % 1.1) < 0.55 ? 0.8 : 0.06;
    }
    if (screenLight.current) screenLight.current.intensity = 0.26 + Math.sin(time * 2.1) * 0.015;
    if (led.current) {
      const material = led.current.material as MeshBasicMaterial;
      material.opacity = (time % 2.2) < 1.5 ? 1 : 0.08;
    }
    if (led2.current) {
      const material = led2.current.material as MeshBasicMaterial;
      material.opacity = (time % 1.3) < 0.5 ? 1 : 0.12;
    }
  });

  return (
    <group>
      <mesh ref={scan} geometry={planeGeometry(0.34, 0.012)} position={[MON_X, MON_Y, MON_Z + 0.016]} renderOrder={3}>
        <meshBasicMaterial color="#bfe8f8" transparent opacity={0.14} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={cursor} geometry={planeGeometry(0.012, 0.006)} position={[MON_X - 0.09, MON_Y - 0.062, MON_Z + 0.016]} renderOrder={3}>
        <meshBasicMaterial color="#c8f0ff" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={screenLight} position={[MON_X, MON_Y - 0.02, MON_Z + 0.2]} color="#7fb6d4" intensity={0.26} distance={0.9} decay={2} />
      <mesh ref={led} geometry={sphereGeometry(0.0055, 6, 5)} position={[0.795, FLOOR + 0.034, -1.075]}>
        <meshBasicMaterial color="#ff6a4a" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={led2} geometry={sphereGeometry(0.0045, 6, 5)} position={[MON_X + 0.17, MON_Y - 0.106, MON_Z + 0.014]}>
        <meshBasicMaterial color="#7fdf9f" transparent opacity={1} toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * Scene 02 — 学习工作台 / DESK WORKSPACE.
 * A student-developer's dorm desk at night: wood desk under a warm architect
 * lamp, code on the monitor, notes pinned above it, and a cool rainy city
 * outside the window on the back wall.
 */
export const DeskScene = () => {
  const meta = getScene('desk');
  return (
    <group>
      <RoomLights shadowMapSize={2048} color="#ffe0b0" intensity={0.9} fill="#465a72" />
      <DioramaBase meta={meta} footprint={[3.6, 3.6]} subtitle="1:18 / WORKSPACE" />

      <RoomShell />
      <WindowNook />
      <DeskFrame />
      <DeskTop />
      <Monitor />
      <DeskLamp />
      <Nightstand />
      <Bookshelf />
      <Chair />
      <FloorLife />
      <WallDecor />
      <StringLights />
      <LiveDetails />
    </group>
  );
};
