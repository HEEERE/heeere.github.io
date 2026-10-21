import {FONT_SANS, FONT_SERIF, canvasTexture, grain, horizontalGradient, rng, softGlow, text, verticalGradient, withAlpha} from '../canvas';

/* ------------------------------------------------------------------ */
/* Neutrals and surfaces                                               */
/* ------------------------------------------------------------------ */

export const asphaltTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'surface/asphalt',
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = '#2a2e34';
      ctx.fillRect(0, 0, width, height);
      grain(ctx, width, height, {seed: 31, count: 5200, alpha: 0.1, size: 1.6, colors: ['#8a939b', '#14171b']});

      const random = rng(77);
      for (let index = 0; index < 26; index += 1) {
        const x = random() * width;
        const y = random() * height;
        const radius = 18 + random() * 70;
        ctx.save();
        ctx.globalAlpha = 0.06 + random() * 0.05;
        ctx.fillStyle = random() > 0.5 ? '#3d444c' : '#1b1f24';
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * (0.4 + random() * 0.5), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.strokeStyle = 'rgba(12, 14, 18, 0.5)';
      ctx.lineWidth = 1;
      for (let index = 0; index < 14; index += 1) {
        ctx.beginPath();
        let x = random() * width;
        let y = random() * height;
        ctx.moveTo(x, y);
        for (let step = 0; step < 5; step += 1) {
          x += (random() - 0.5) * 46;
          y += (random() - 0.5) * 46;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    {repeat: [2, 2]},
  );

export const sidewalkTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'surface/sidewalk',
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = '#7d848a';
      ctx.fillRect(0, 0, width, height);
      const random = rng(9);
      const tile = 64;
      for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
          const shade = 0.9 + random() * 0.16;
          ctx.fillStyle = `rgba(126, 133, 139, ${shade})`;
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x + 2, y + 2, tile - 4, 3);
        }
      }
      grain(ctx, width, height, {seed: 4, count: 2400, alpha: 0.07, size: 1.4});
      ctx.strokeStyle = 'rgba(40, 45, 50, 0.35)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 8; index += 1) {
        ctx.beginPath();
        ctx.moveTo(random() * width, random() * height);
        ctx.lineTo(random() * width, random() * height);
        ctx.stroke();
      }
    },
    {repeat: [3, 3]},
  );

export const concreteTexture = (key = 'concrete', base = '#6f7479'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`surface/${key}`, 512, 512, (ctx, width, height) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 22, count: 3600, alpha: 0.08, size: 1.8, colors: ['#ffffff', '#2a2d31']});
    const random = rng(51);
    for (let index = 0; index < 12; index += 1) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = random() > 0.5 ? '#ffffff' : '#14171a';
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 20 + random() * 80, 30 + random() * 90, random(), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Water stains running down the wall.
    for (let index = 0; index < 7; index += 1) {
      const x = random() * width;
      const gradient = ctx.createLinearGradient(x, 0, x, height * (0.3 + random() * 0.5));
      gradient.addColorStop(0, 'rgba(20, 24, 27, 0.16)');
      gradient.addColorStop(1, 'rgba(20, 24, 27, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 4 + random() * 12, height * (0.3 + random() * 0.6));
    }
  });

export const plasterWallTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('surface/plaster', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#d9d3c7';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 13, count: 2600, alpha: 0.05, size: 1.5, colors: ['#ffffff', '#8f897d']});
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.05)'],
      [1, 'rgba(50,52,56,0.10)'],
    ]);
    // Panel seams on the shop front.
    ctx.strokeStyle = 'rgba(90, 86, 78, 0.25)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < height; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  });

export const woodFloorTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'surface/woodFloor',
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = '#b98d60';
      ctx.fillRect(0, 0, width, height);
      const random = rng(64);
      const plank = 64;
      for (let y = 0; y < height; y += plank) {
        ctx.fillStyle = `rgba(${120 + random() * 30}, ${86 + random() * 24}, ${52 + random() * 18}, 1)`;
        ctx.fillRect(0, y, width, plank - 2);
        ctx.fillStyle = 'rgba(50, 32, 18, 0.35)';
        ctx.fillRect(0, y + plank - 2, width, 2);
        for (let index = 0; index < 3; index += 1) {
          ctx.strokeStyle = 'rgba(90, 60, 34, 0.18)';
          ctx.lineWidth = 1;
          const offset = y + random() * plank;
          ctx.beginPath();
          ctx.moveTo(0, offset);
          ctx.bezierCurveTo(width * 0.3, offset + 4, width * 0.6, offset - 4, width, offset + 2);
          ctx.stroke();
        }
        // plank end seam
        const seam = random() * width;
        ctx.fillStyle = 'rgba(50, 32, 18, 0.28)';
        ctx.fillRect(seam, y, 2, plank - 2);
      }
      grain(ctx, width, height, {seed: 8, count: 1200, alpha: 0.04, size: 1.2});
    },
    {repeat: [2, 2]},
  );

export const deskWoodTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'surface/deskWood',
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = '#c69a6b';
      ctx.fillRect(0, 0, width, height);
      const random = rng(87);
      for (let index = 0; index < 26; index += 1) {
        ctx.strokeStyle = `rgba(${120 + random() * 40}, ${80 + random() * 30}, ${46 + random() * 20}, 0.35)`;
        ctx.lineWidth = 0.8 + random() * 1.8;
        const y = random() * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.33, y + (random() - 0.5) * 16, width * 0.66, y + (random() - 0.5) * 16, width, y + (random() - 0.5) * 8);
        ctx.stroke();
      }
      grain(ctx, width, height, {seed: 3, count: 1800, alpha: 0.05, size: 1.2});
      verticalGradient(ctx, 0, 0, width, height, [
        [0, 'rgba(255,240,220,0.05)'],
        [1, 'rgba(60,40,24,0.10)'],
      ]);
    },
    {repeat: [1, 1]},
  );

export const tileFloorTexture = (key = 'tileFloor', tint = '#d8d4cb'): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    `surface/${key}`,
    512,
    512,
    (ctx, width, height) => {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, width, height);
      const random = rng(17);
      const size = 128;
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          ctx.fillStyle = `rgba(${200 + random() * 20}, ${196 + random() * 20}, ${186 + random() * 20}, 0.35)`;
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        }
      }
      ctx.strokeStyle = 'rgba(120, 118, 110, 0.35)';
      ctx.lineWidth = 2;
      for (let value = 0; value <= width; value += size) {
        ctx.beginPath();
        ctx.moveTo(value, 0);
        ctx.lineTo(value, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, value);
        ctx.lineTo(width, value);
        ctx.stroke();
      }
      grain(ctx, width, height, {seed: 5, count: 1400, alpha: 0.04, size: 1.2});
    },
    {repeat: [2, 2]},
  );

export const plinthWoodTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('surface/plinthWood', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#2b2521';
    ctx.fillRect(0, 0, width, height);
    const random = rng(43);
    for (let index = 0; index < 34; index += 1) {
      ctx.strokeStyle = `rgba(${70 + random() * 40}, ${56 + random() * 30}, ${44 + random() * 22}, ${0.2 + random() * 0.3})`;
      ctx.lineWidth = 0.6 + random() * 1.8;
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.4, y + (random() - 0.5) * 8, width * 0.7, y + (random() - 0.5) * 8, width, y + (random() - 0.5) * 5);
      ctx.stroke();
    }
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.06)'],
      [0.5, 'rgba(0,0,0,0)'],
      [1, 'rgba(0,0,0,0.28)'],
    ]);
  });

export const wetSheenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('surface/wetSheen', 512, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const random = rng(101);
    for (let index = 0; index < 28; index += 1) {
      const x = random() * width;
      const top = random() * height * 0.5;
      const length = 60 + random() * 240;
      const gradient = ctx.createLinearGradient(x, top, x, top + length);
      gradient.addColorStop(0, 'rgba(180, 205, 230, 0.16)');
      gradient.addColorStop(1, 'rgba(180, 205, 230, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, top, 2 + random() * 16, length);
    }
    for (let index = 0; index < 40; index += 1) {
      ctx.fillStyle = `rgba(210, 226, 240, ${0.04 + random() * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 4 + random() * 30, 2 + random() * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

export const corkBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('surface/cork', 256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#b58b5b';
    ctx.fillRect(0, 0, width, height);
    const random = rng(24);
    for (let index = 0; index < 2600; index += 1) {
      const shade = random() > 0.5 ? 'rgba(90,62,36,0.35)' : 'rgba(240,214,178,0.35)';
      ctx.fillStyle = shade;
      ctx.fillRect(random() * width, random() * height, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.strokeStyle = 'rgba(70,48,28,0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, width, height);
  });

export const pegboardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'surface/pegboard',
    256,
    256,
    (ctx, width, height) => {
      ctx.fillStyle = '#c8a87c';
      ctx.fillRect(0, 0, width, height);
      const random = rng(33);
      for (let y = 16; y < height; y += 32) {
        for (let x = 16; x < width; x += 32) {
          ctx.fillStyle = 'rgba(60, 44, 26, 0.45)';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.beginPath();
          ctx.arc(x, y - 1.5, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      grain(ctx, width, height, {seed: 12, count: 900, alpha: 0.06, size: 1});
      void random;
    },
    {repeat: [1, 1]},
  );

export const feltTexture = (key = 'felt', base = '#3f5a52'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`surface/${key}`, 256, 256, (ctx, width, height) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 19, count: 2600, alpha: 0.09, size: 1.6, colors: ['#ffffff', '#101413']});
  });

export const rugTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('surface/rug', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#8d6f5c';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(226, 205, 176, 0.4)';
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    ctx.strokeStyle = 'rgba(226, 205, 176, 0.22)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 6; index += 1) {
      ctx.beginPath();
      ctx.moveTo(60 + index * 64, 60);
      ctx.lineTo(60 + index * 64, height - 60);
      ctx.stroke();
    }
    grain(ctx, width, height, {seed: 2, count: 2200, alpha: 0.08, size: 1.4});
  });

/* ------------------------------------------------------------------ */
/* Generic wall compositions                                           */
/* ------------------------------------------------------------------ */

/** A composite wall texture: panel seams, a couple of posters and a wall clock. */
export const officeWallTexture = (key: string, base: string, accent: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`wall/${key}`, 1024, 512, (ctx, width, height) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 61, count: 2600, alpha: 0.035, size: 1.6, colors: ['#ffffff', '#20262b']});
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.03)'],
      [1, 'rgba(0,0,0,0.16)'],
    ]);

    const panelWidth = width / 4;
    ctx.strokeStyle = withAlpha('#000000', 0.14);
    ctx.lineWidth = 2;
    for (let index = 1; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * panelWidth, 0);
      ctx.lineTo(index * panelWidth, height);
      ctx.stroke();
    }
    ctx.fillStyle = withAlpha('#000000', 0.18);
    ctx.fillRect(0, 0, width, 26);

    // Accent strip near the ceiling.
    ctx.fillStyle = withAlpha(accent, 0.55);
    ctx.fillRect(0, 30, width, 8);

    // Simple posters.
    const poster = (x: number, y: number, w: number, h: number, tint: string, lines: number) => {
      ctx.save();
      ctx.fillStyle = '#f0eee7';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = tint;
      ctx.fillRect(x, y, w, h * 0.3);
      ctx.fillStyle = 'rgba(40,44,48,0.75)';
      for (let line = 0; line < lines; line += 1) {
        ctx.fillRect(x + 12, y + h * 0.4 + line * 16, w - 24 - (line % 3) * 18, 5);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };

    poster(width * 0.08, height * 0.2, 130, 176, withAlpha(accent, 0.7), 5);
    poster(width * 0.23, height * 0.26, 100, 132, '#6f8d9b', 4);

    // Whiteboard-ish panel.
    ctx.fillStyle = 'rgba(240, 244, 244, 0.9)';
    ctx.fillRect(width * 0.62, height * 0.18, 280, 160);
    ctx.strokeStyle = 'rgba(60, 70, 76, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.62, height * 0.18, 280, 160);
    ctx.strokeStyle = withAlpha(accent, 0.8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.64, height * 0.42);
    ctx.lineTo(width * 0.68, height * 0.3);
    ctx.lineTo(width * 0.73, height * 0.4);
    ctx.lineTo(width * 0.79, height * 0.28);
    ctx.lineTo(width * 0.86, height * 0.36);
    ctx.stroke();

    // Wall clock.
    const cx = width * 0.47;
    const cy = height * 0.2;
    ctx.fillStyle = '#f2f1ec';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,44,48,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#2b3036';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 10, cy - 10);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 6, cy + 8);
    ctx.stroke();

    grain(ctx, width, height, {seed: 70, count: 900, alpha: 0.04, size: 1.4});
  });

/** A single poster, used as a small plane on walls. */
export const posterTexture = (key: string, title: string, subtitle: string, tint: string, kind: 'notice' | 'graphic' = 'graphic'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`poster/${key}`, 256, 360, (ctx, width, height) => {
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = tint;
    if (kind === 'graphic') {
      ctx.fillRect(0, 0, width, 150);
      softGlow(ctx, width * 0.7, 80, 90, withAlpha('#ffffff', 0.4));
      ctx.strokeStyle = withAlpha('#ffffff', 0.7);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(40, 120);
      ctx.lineTo(90, 60);
      ctx.lineTo(140, 104);
      ctx.lineTo(190, 52);
      ctx.stroke();
    } else {
      ctx.fillRect(0, 0, 18, height);
    }
    text(ctx, title, 22, 200, {size: 26, weight: 700, font: FONT_SERIF, color: '#22262a'});
    text(ctx, subtitle, 22, 230, {size: 13, font: FONT_SANS, color: '#5a6167'});
    ctx.fillStyle = 'rgba(40,44,48,0.55)';
    for (let line = 0; line < 5; line += 1) {
      ctx.fillRect(22, 256 + line * 14, width - 44 - (line % 3) * 24, 4);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);
    grain(ctx, width, height, {seed: 91, count: 500, alpha: 0.05, size: 1.2});
  });

/* ------------------------------------------------------------------ */
/* Scene-specific ground layouts                                       */
/* ------------------------------------------------------------------ */

type GroundPaint = (
  ctx: CanvasRenderingContext2D,
  px: (x: number) => number,
  py: (z: number) => number,
  scale: number,
) => void;

/**
 * Paints a top-down ground layout. The plane is expected to be 4.6 x 4.6 units
 * with +X to the right and +Z toward the viewer.
 */
export const groundTexture = (key: string, size: number, paint: GroundPaint): ReturnType<typeof canvasTexture> =>
  canvasTexture(`ground/${key}`, size, size, (ctx, width) => {
    const toPixel = (value: number) => ((value + 2.3) / 4.6) * width;
    paint(ctx, toPixel, toPixel, width / 4.6);
  });

export const konbiniRoadGround = (): ReturnType<typeof canvasTexture> =>
  groundTexture('konbiniRoad', 2048, (ctx, px, py, scale) => {
    ctx.fillStyle = '#1e2329';
    ctx.fillRect(0, 0, 2048, 2048);

    const random = rng(1201);
    // Asphalt grain over the whole plinth.
    for (let index = 0; index < 24000; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(145,155,165,0.06)' : 'rgba(10,12,14,0.10)';
      ctx.fillRect(random() * 2048, random() * 2048, 1 + random() * 4, 1 + random() * 4);
    }
    // Softer asphalt patches.
    for (let index = 0; index < 40; index += 1) {
      ctx.fillStyle = `rgba(${random() > 0.6 ? '58,64,72' : '20,23,27'},0.10)`;
      ctx.beginPath();
      ctx.ellipse(random() * 2048, random() * 2048, 30 + random() * 160, 20 + random() * 110, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gutter channel along the curb.
    ctx.fillStyle = 'rgba(12,14,17,0.55)';
    ctx.fillRect(0, py(0.45), px(1.5), Math.max(3, 0.1 * scale));
    // Curb line.
    ctx.fillStyle = 'rgba(206, 208, 204, 0.7)';
    ctx.fillRect(px(-2.3), py(0.46), px(1.52) + 2.3 * scale, 0.035 * scale);

    // Zebra crossing across the front road.
    ctx.fillStyle = 'rgba(226, 228, 222, 0.62)';
    for (let index = 0; index < 7; index += 1) {
      const z = 0.72 + index * 0.2;
      ctx.fillRect(px(-1.05), py(z), 1.28 * scale, 0.1 * scale);
    }
    // Crossing across the right road.
    for (let index = 0; index < 6; index += 1) {
      const x = 1.62 + index * 0.14;
      ctx.fillRect(px(x), py(0.66), 0.07 * scale, 1.02 * scale);
    }

    // Stop line + road edge markings on the right lane.
    ctx.fillStyle = 'rgba(224, 226, 220, 0.52)';
    ctx.fillRect(px(1.5), py(0.62), 0.05 * scale, 1.24 * scale);
    ctx.fillStyle = 'rgba(232, 206, 120, 0.55)';
    for (let index = 0; index < 5; index += 1) {
      ctx.fillRect(px(1.92), py(-2.0 + index * 0.52), 0.045 * scale, 0.28 * scale);
    }

    // Parking bay markings near the alley.
    ctx.strokeStyle = 'rgba(226, 228, 222, 0.6)';
    ctx.lineWidth = 0.035 * scale;
    ctx.strokeRect(px(1.58), py(-1.5), 0.62 * scale, 1.1 * scale);
    text(ctx, 'P', px(1.89), py(-0.95), {size: 0.42 * scale, weight: 700, font: FONT_SANS, color: 'rgba(226,228,222,0.55)', align: 'center'});

    // Manhole.
    ctx.save();
    ctx.translate(px(1.78), py(1.5));
    ctx.fillStyle = 'rgba(38, 42, 46, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 0.24 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 156, 160, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 0.2 * scale, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 9; index += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 0.2 * scale, (index / 9) * Math.PI * 2, (index / 9 + 0.5) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Drain grates along the curb.
    for (const [x, z] of [
      [-1.55, 0.52],
      [0.42, 0.52],
    ] as const) {
      ctx.fillStyle = 'rgba(16, 18, 21, 0.85)';
      ctx.fillRect(px(x), py(z), 0.36 * scale, 0.14 * scale);
      ctx.fillStyle = 'rgba(130, 136, 140, 0.35)';
      for (let index = 0; index < 6; index += 1) {
        ctx.fillRect(px(x) + 2 + index * 0.055 * scale, py(z) + 2, 0.018 * scale, 0.1 * scale);
      }
    }

    // Wet reflections painted into the ground: vertical warm streaks below the storefront.
    const reflect = (x: number, width: number, color: string, strength: number, length: number) => {
      const gradient = ctx.createLinearGradient(0, py(0.56), 0, py(0.56 + length));
      gradient.addColorStop(0, withAlpha(color, strength));
      gradient.addColorStop(0.35, withAlpha(color, strength * 0.4));
      gradient.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(px(x), py(0.56), width * scale, length * scale);
    };
    reflect(-1.35, 0.85, '#ffcf9a', 0.22, 1.55);
    reflect(-0.25, 0.55, '#ffdca8', 0.18, 1.2);
    reflect(0.55, 0.5, '#ffe2b4', 0.16, 1.0);
    reflect(1.18, 0.32, '#bfe4ff', 0.14, 0.7);
    reflect(0.42, 0.5, '#9fd8ff', 0.08, 1.5);

    // Standing water.
    const puddle = (x: number, z: number, rx: number, rz: number, depth: number) => {
      const gradient = ctx.createRadialGradient(px(x), py(z), 0, px(x), py(z), rx * scale);
      gradient.addColorStop(0, `rgba(58, 72, 88, ${depth})`);
      gradient.addColorStop(0.65, `rgba(40, 50, 62, ${depth * 0.7})`);
      gradient.addColorStop(1, 'rgba(30, 36, 44, 0)');
      ctx.save();
      ctx.translate(px(x), py(z));
      ctx.scale(1, rz / rx);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, rx * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    puddle(-0.15, 0.9, 0.6, 0.3, 0.55);
    puddle(1.55, 1.05, 0.8, 0.34, 0.5);
    puddle(0.55, 1.95, 0.5, 0.2, 0.45);
    puddle(1.85, 0.15, 0.34, 0.2, 0.4);
    puddle(-1.9, 0.75, 0.3, 0.18, 0.4);
    puddle(0.6, -1.9, 0.34, 0.16, 0.35);

    // Warm reflection inside the big puddle (storefront glow).
    const warm = ctx.createLinearGradient(px(1.2), py(0.82), px(1.5), py(1.5));
    warm.addColorStop(0, 'rgba(255, 186, 110, 0.30)');
    warm.addColorStop(1, 'rgba(255, 186, 110, 0)');
    ctx.fillStyle = warm;
    ctx.fillRect(px(0.9), py(0.82), 1.2 * scale, 0.72 * scale);

    // Sidewalk grime where the building meets the pavement.
    ctx.fillStyle = 'rgba(20, 22, 25, 0.18)';
    ctx.fillRect(0, py(0.5), 2048, 0.12 * scale);
  });

export const konbiniPavement = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('ground/konbiniPavement', 1024, 256, (ctx, width, height) => {
    ctx.fillStyle = '#5f656a';
    ctx.fillRect(0, 0, width, height);
    const random = rng(311);
    const tile = 42;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const shade = 88 + random() * 22;
        ctx.fillStyle = `rgba(${shade}, ${shade + 4}, ${shade + 6}, 0.55)`;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.fillRect(x + 2, y + 2, tile - 4, 2);
      }
    }
    ctx.strokeStyle = 'rgba(58, 64, 68, 0.35)';
    ctx.lineWidth = 2;
    for (let value = 0; value <= width; value += tile) {
      ctx.beginPath();
      ctx.moveTo(value, 0);
      ctx.lineTo(value, height);
      ctx.stroke();
    }
    for (let value = 0; value <= height; value += tile) {
      ctx.beginPath();
      ctx.moveTo(0, value);
      ctx.lineTo(width, value);
      ctx.stroke();
    }
    grain(ctx, width, height, {seed: 21, count: 2600, alpha: 0.07, size: 1.6, colors: ['#ffffff', '#3a3f42']});
    // Wet paving: darker patches and warm reflection streaks below the storefront.
    for (let index = 0; index < 16; index += 1) {
      ctx.fillStyle = `rgba(40, 48, 54, ${0.06 + random() * 0.10})`;
      ctx.beginPath();
      ctx.ellipse(random() * width, random() * height, 24 + random() * 90, 8 + random() * 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const warm = ctx.createLinearGradient(0, 0, 0, height);
    warm.addColorStop(0, 'rgba(255, 198, 132, 0.16)');
    warm.addColorStop(0.55, 'rgba(255, 186, 120, 0.06)');
    warm.addColorStop(1, 'rgba(255, 186, 120, 0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, width, height);
    // Curb edge line.
    ctx.fillStyle = 'rgba(214, 216, 210, 0.55)';
    ctx.fillRect(0, height - 12, width, 5);
    ctx.fillStyle = 'rgba(40, 46, 50, 0.5)';
    ctx.fillRect(0, height - 7, width, 7);
  });

/** Tiled interior floor with the yellow/blue guide lines found in Japanese konbinis. */export const konbiniInteriorFloor = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('ground/konbiniInterior', 1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = '#c4bfb2';
    ctx.fillRect(0, 0, width, height);
    const random = rng(144);
    const tile = 128;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        ctx.fillStyle = `rgba(${214 + random() * 16}, ${210 + random() * 16}, ${198 + random() * 16}, 0.6)`;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      }
    }
    ctx.strokeStyle = 'rgba(150, 146, 136, 0.5)';
    ctx.lineWidth = 3;
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
    // Yellow guide line running along the shelves.
    ctx.fillStyle = 'rgba(226, 196, 96, 0.75)';
    ctx.fillRect(0, height * 0.66, width, 14);
    ctx.fillStyle = 'rgba(150, 190, 210, 0.5)';
    ctx.fillRect(0, height * 0.7, width, 6);
    // Entrance mat marks the doorway.
    ctx.fillStyle = 'rgba(88, 92, 88, 0.55)';
    ctx.fillRect(width * 0.38, height - 150, width * 0.3, 130);
    grain(ctx, width, height, {seed: 5, count: 2400, alpha: 0.04, size: 1.2});
  });
