import {FONT_MONO, FONT_SANS, FONT_SERIF, canvasTexture, grain, horizontalGradient, rng, rr, softGlow, text, verticalGradient, withAlpha} from '../canvas';

/* ------------------------------------------------------------------ */
/* Desk objects                                                        */
/* ------------------------------------------------------------------ */

export const keyboardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/keyboard', 512, 192, (ctx, width, height) => {
    ctx.fillStyle = '#232830';
    ctx.fillRect(0, 0, width, height);
    const rows = [
      ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
      ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
      ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'enter'],
      ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
      ['fn', 'ctrl', 'alt', 'cmd', 'space', 'cmd', 'alt', '←', '↑', '↓', '→'],
    ] as const;
    rows.forEach((keys, rowIndex) => {
      let x = 10;
      const y = 12 + rowIndex * 35;
      keys.forEach((key) => {
        const widthFactor = key === 'space' ? 5.4 : key === 'shift' || key === 'enter' ? 1.9 : key === 'esc' ? 1.2 : 1;
        const keyWidth = 27 * widthFactor + 3;
        ctx.fillStyle = '#30363f';
        rr(ctx, x, y, keyWidth, 29, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, x, y, keyWidth, 12, 5);
        ctx.fill();
        if (key.length <= 3) {
          text(ctx, key, x + keyWidth / 2, y + 21, {size: 12, weight: 600, font: FONT_MONO, color: '#9aa8b4', align: 'center'});
        }
        // Warm backlight under the keys.
        ctx.fillStyle = 'rgba(240, 170, 90, 0.10)';
        ctx.fillRect(x + 2, y + 29, keyWidth - 4, 2);
        x += keyWidth + 3;
      });
    });
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.04)'],
      [1, 'rgba(0,0,0,0.18)'],
    ]);
  });

export const deskMatTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/deskMat', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#3e4a46';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 71, count: 3200, alpha: 0.12, size: 1.6, colors: ['#ffffff', '#0b1210']});
    ctx.strokeStyle = 'rgba(214, 226, 216, 0.14)';
    ctx.setLineDash([7, 7]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(26, 22, width - 52, height - 44);
    ctx.setLineDash([]);
    text(ctx, 'JZY', 42, height - 46, {size: 44, weight: 800, font: FONT_SANS, color: 'rgba(222, 232, 220, 0.20)', tracking: 3});
    text(ctx, 'HAKONIWA / 2026', width - 42, height - 46, {size: 12, weight: 600, font: FONT_MONO, color: 'rgba(222, 232, 220, 0.22)', align: 'right', tracking: 2});
  });

export const laptopLidTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/laptopLid', 256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#b8bcc0';
    ctx.fillRect(0, 0, width, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.22)'],
      [1, 'rgba(0,0,0,0.12)'],
    ]);
    const random = rng(404);
    const stickers = [
      ['#d8a04a', 54, 62, 54, 32],
      ['#5f8fa8', 138, 50, 42, 42],
      ['#c85f5a', 82, 128, 72, 26],
      ['#7fa87a', 172, 120, 34, 34],
      ['#e8e0c8', 44, 190, 60, 22],
      ['#8a7fb0', 150, 186, 46, 28],
    ] as const;
    for (const [color, x, y, w, h] of stickers) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((random() - 0.5) * 0.35);
      ctx.fillStyle = color;
      if (random() > 0.5) {
        rr(ctx, 0, 0, w, h, 5);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    text(ctx, 'AGENT', 60, 146, {size: 11, weight: 700, font: FONT_MONO, color: '#2a2f33'});
    text(ctx, 'build', 186, 140, {size: 10, weight: 700, font: FONT_MONO, color: '#f0ece0'});
    text(ctx, 'GRAPH', 46, 208, {size: 9, weight: 700, font: FONT_MONO, color: '#2a2f33'});
  });

export const bookCoverTexture = (title: string, author: string, color: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`prop/book/${title}`, 256, 360, (ctx, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    const dark = withAlpha('#000000', 0.18);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 14, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.12)'],
      [1, 'rgba(0,0,0,0.16)'],
    ]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, width - 56, height - 56);
    text(ctx, title, 42, 128, {size: 30, weight: 700, font: FONT_SERIF, color: '#f2ede0'});
    text(ctx, author, 42, 162, {size: 14, weight: 500, font: FONT_SANS, color: 'rgba(245,240,230,0.7)'});
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(42, 190, 80, 2);
    text(ctx, 'JZY / SHELF', 42, height - 46, {size: 10, weight: 600, font: FONT_MONO, color: 'rgba(255,255,255,0.5)', tracking: 2});
  });

export const paperSheetTexture = (heading: string, lines = 12): ReturnType<typeof canvasTexture> =>
  canvasTexture(`prop/paper/${heading}/${lines}`, 256, 360, (ctx, width, height) => {
    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, 0, width, height);
    verticalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.4)'],
      [1, 'rgba(160,150,130,0.10)'],
    ]);
    text(ctx, heading, 22, 40, {size: 15, weight: 700, font: FONT_MONO, color: '#3a4046'});
    ctx.fillStyle = 'rgba(60,68,74,0.22)';
    ctx.fillRect(22, 50, width - 44, 2);
    for (let index = 0; index < lines; index += 1) {
      const random = rng(index * 13 + 7);
      ctx.fillStyle = 'rgba(70,78,84,0.36)';
      ctx.fillRect(22, 66 + index * 21, (width - 44) * (0.45 + random() * 0.5), 3);
    }
    ctx.fillStyle = 'rgba(70,78,84,0.35)';
    ctx.fillRect(22, 66 + lines * 21 + 6, 60, 2);
  });

export const stickyNotesTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/stickyNotes', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#a8895f';
    ctx.fillRect(0, 0, width, height);
    const random = rng(77);
    for (let index = 0; index < 3000; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(70,50,30,0.2)' : 'rgba(240,220,180,0.22)';
      ctx.fillRect(random() * width, random() * height, 2, 2);
    }
    const notes = [
      ['#f0d88a', 40, 44, 116, 106, ['RAG eval', 'recall@5', '↑ lift']],
      ['#e8b8b0', 190, 36, 102, 96, ['PMU', 'judge loop']],
      ['#bfd8c8', 330, 52, 122, 112, ['Neo4j', 'index', 'entity']],
      ['#e8d8a8', 56, 190, 108, 100, ['agent', 'tool call']],
      ['#c8d0e0', 200, 176, 96, 94, ['trace', 'replay']],
      ['#f2c8a0', 350, 200, 112, 104, ['docker', 'sandbox']],
      ['#e0d0b8', 96, 330, 128, 96, ['read', 'paper']],
      ['#d8e0c8', 268, 344, 106, 92, ['idea', 'sketch']],
    ] as const;
    for (const [color, x, y, w, h, lines] of notes) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((random() - 0.5) * 0.12);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(4, 5, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(60,50,40,0.6)';
      lines.forEach((line, index) => {
        text(ctx, line, 10, 26 + index * 22, {size: 14, weight: 500, font: FONT_SANS, color: 'rgba(55,48,40,0.75)'});
      });
      ctx.fillStyle = withAlpha('#d8503f', 0.85);
      ctx.beginPath();
      ctx.arc(w / 2, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

export const calendarTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/calendar', 256, 360, (ctx, width, height) => {
    ctx.fillStyle = '#f2eee2';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#3f5f6a';
    ctx.fillRect(0, 0, width, 92);
    text(ctx, '2026', 22, 40, {size: 16, weight: 600, font: FONT_MONO, color: '#a8c4cc', tracking: 3});
    text(ctx, 'OCT', 22, 78, {size: 34, weight: 700, font: FONT_SANS, color: '#f2eee2', tracking: 2});
    text(ctx, '十月', width - 22, 78, {size: 20, weight: 500, font: FONT_SERIF, color: '#c8d8dc', align: 'right'});
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    days.forEach((day, index) => {
      text(ctx, day, 26 + index * 31, 122, {size: 12, weight: 700, font: FONT_MONO, color: '#8a8f8a'});
    });
    const random = rng(31);
    for (let index = 0; index < 31; index += 1) {
      const column = index % 7;
      const rowIndex = Math.floor(index / 7);
      const x = 26 + column * 31;
      const y = 156 + rowIndex * 30;
      const marked = random() > 0.78;
      if (marked) {
        ctx.fillStyle = '#d8a04a';
        ctx.beginPath();
        ctx.arc(x + 5, y - 5, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, `${index + 1}`, x, y, {size: 12, weight: marked ? 700 : 500, font: FONT_MONO, color: marked ? '#f6efe0' : '#3a4046'});
    }
    ctx.fillStyle = 'rgba(60,68,74,0.2)';
    ctx.fillRect(22, height - 58, width - 44, 2);
    text(ctx, 'deadline / demo day', 22, height - 34, {size: 11, weight: 500, font: FONT_SANS, color: '#6a7076'});
  });

export const photoTexture = (kind: 'night' | 'campus' | 'sea'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`prop/photo/${kind}`, 256, 320, (ctx, width, height) => {
    if (kind === 'night') {
      verticalGradient(ctx, 0, 0, width, height, [
        [0, '#122030'],
        [0.55, '#1d3040'],
        [1, '#0c141c'],
      ]);
      softGlow(ctx, 70, 190, 60, 'rgba(255, 190, 120, 0.8)');
      softGlow(ctx, 170, 176, 46, 'rgba(150, 210, 255, 0.5)');
      ctx.fillStyle = 'rgba(255, 214, 160, 0.75)';
      ctx.fillRect(44, 196, 52, 30);
      ctx.fillRect(156, 186, 42, 26);
      ctx.fillStyle = 'rgba(10, 16, 22, 0.8)';
      for (let index = 0; index < 8; index += 1) {
        ctx.fillRect(0, 232 + index * 12, width, 4);
      }
      ctx.strokeStyle = 'rgba(190, 215, 235, 0.25)';
      ctx.lineWidth = 1;
      for (let index = 0; index < 40; index += 1) {
        const random = rng(index + 4);
        ctx.beginPath();
        ctx.moveTo(random() * width, random() * height);
        ctx.lineTo(random() * width, random() * height);
        ctx.stroke();
      }
    } else if (kind === 'campus') {
      verticalGradient(ctx, 0, 0, width, height, [
        [0, '#cfe0e8'],
        [0.6, '#e8e4d0'],
        [1, '#8fa07a'],
      ]);
      ctx.fillStyle = '#7f9a76';
      ctx.beginPath();
      ctx.ellipse(80, 240, 90, 66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(190, 250, 80, 60, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8d0bc';
      ctx.fillRect(96, 150, 64, 90);
      ctx.fillStyle = '#8a8274';
      ctx.fillRect(104, 160, 20, 26);
      ctx.fillRect(132, 160, 20, 26);
      ctx.fillStyle = '#5f6a5a';
      ctx.fillRect(96, 140, 64, 12);
    } else {
      verticalGradient(ctx, 0, 0, width, height, [
        [0, '#a8c8dc'],
        [0.55, '#d8e4e0'],
        [0.56, '#7fa8b8'],
        [1, '#4a7a8a'],
      ]);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      for (let index = 0; index < 7; index += 1) {
        ctx.beginPath();
        ctx.moveTo(0, 190 + index * 14);
        ctx.bezierCurveTo(60, 184 + index * 14, 120, 196 + index * 14, width, 190 + index * 14);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 240, 210, 0.9)';
      ctx.beginPath();
      ctx.arc(190, 92, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Frame + caption strip.
    ctx.fillStyle = '#f0ece0';
    ctx.fillRect(0, height - 46, width, 46);
    text(ctx, kind === 'night' ? 'HAIKOU / 23:40' : kind === 'campus' ? 'HAINAN UNIV.' : 'HAIKOU BAY', 16, height - 20, {
      size: 11,
      weight: 600,
      font: FONT_MONO,
      color: '#6a7076',
      tracking: 1,
    });
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, width, height);
  });

export const wallNotesTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/wallNotes', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#d8d2c4';
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, {seed: 42, count: 2200, alpha: 0.05, size: 1.4});
    const card = (x: number, y: number, w: number, h: number, color: string, lines: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(x + 3, y + 4, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(60,66,72,0.45)';
      for (let index = 0; index < lines; index += 1) {
        const random = rng(index * 7 + x + y);
        ctx.fillRect(x + 12, y + 18 + index * 16, (w - 24) * (0.4 + random() * 0.5), 3);
      }
    };
    card(26, 30, 200, 130, '#f2eee2', 5);
    card(246, 52, 150, 108, '#e8dfc8', 4);
    card(418, 26, 68, 68, '#f0d88a', 2);
    card(40, 186, 120, 120, '#d8e0e8', 5);
    card(178, 190, 210, 92, '#f6f2e6', 3);
    card(406, 128, 80, 140, '#e8c8c0', 4);
    card(60, 330, 250, 130, '#e2e8df', 6);
    card(330, 292, 150, 178, '#f2e8d8', 6);
    ctx.strokeStyle = 'rgba(120, 116, 106, 0.5)';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, width, height);
  });

/* ------------------------------------------------------------------ */
/* Street / contact props                                              */
/* ------------------------------------------------------------------ */

export const postboxFrontTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/postbox', 256, 512, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#c8452f'],
      [0.5, '#b83a28'],
      [1, '#a03022'],
    ]);
    // Rounded body highlight.
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.16)'],
      [0.3, 'rgba(255,255,255,0.03)'],
      [1, 'rgba(0,0,0,0.18)'],
    ]);
    // Postal mark.
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(58, 44, 140, 96);
    text(ctx, '〒', width / 2, 116, {size: 70, weight: 700, font: FONT_SERIF, color: '#b83a28', align: 'center'});
    // Slot.
    ctx.fillStyle = '#2a201c';
    rr(ctx, 44, 168, 168, 22, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(52, 170, 152, 4);
    text(ctx, 'POST', width / 2, 238, {size: 34, weight: 800, font: FONT_SANS, color: '#f6e8d8', align: 'center', tracking: 4});
    text(ctx, '郵便ポスト', width / 2, 264, {size: 16, weight: 500, font: FONT_SERIF, color: '#f0c8b8', align: 'center'});
    // Collection times plate.
    ctx.fillStyle = '#f2ead8';
    rr(ctx, 34, 296, 188, 110, 6);
    ctx.fill();
    text(ctx, 'COLLECTION', width / 2, 324, {size: 13, weight: 700, font: FONT_MONO, color: '#6a4a3a', align: 'center', tracking: 2});
    const times = ['平日 10:30', '平日 16:00', '土日 12:00'];
    times.forEach((time, index) => {
      text(ctx, time, 52, 352 + index * 22, {size: 14, weight: 600, font: FONT_SANS, color: '#3a2c22'});
    });
    // Bottom plinth.
    ctx.fillStyle = 'rgba(20, 16, 14, 0.35)';
    ctx.fillRect(0, height - 34, width, 34);
    text(ctx, 'HAIKOU · CHINA', width / 2, height - 12, {size: 10, weight: 600, font: FONT_MONO, color: 'rgba(246,232,216,0.55)', align: 'center', tracking: 2});
    grain(ctx, width, height, {seed: 61, count: 1200, alpha: 0.05, size: 1.2});
  });

export const phoneBoothSignTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/phoneSign', 256, 128, (ctx, width, height) => {
    ctx.fillStyle = '#1f3a2e';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#a8d8b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.save();
    ctx.shadowColor = '#8fd8a8';
    ctx.shadowBlur = 18;
    text(ctx, 'TELEPHONE', width / 2, 62, {size: 34, weight: 800, font: FONT_SANS, color: '#d8f0e0', align: 'center', tracking: 2});
    text(ctx, '公衆電話', width / 2, 98, {size: 20, weight: 500, font: FONT_SERIF, color: '#a8d8b8', align: 'center'});
    ctx.restore();
  });

export const phoneBoothInteriorTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/phoneInterior', 256, 512, (ctx, width, height) => {
    ctx.fillStyle = '#d8e0d8';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c8d4c8';
    ctx.fillRect(20, 20, width - 40, height - 60);
    // Phone unit.
    ctx.fillStyle = '#5f6a66';
    rr(ctx, 46, 84, 164, 92, 10);
    ctx.fill();
    ctx.fillStyle = '#2e3532';
    rr(ctx, 60, 100, 60, 60, 6);
    ctx.fill();
    ctx.fillStyle = '#8f9a94';
    ctx.fillRect(136, 96, 54, 26);
    for (let index = 0; index < 3; index += 1) {
      for (let column = 0; column < 3; column += 1) {
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath();
        ctx.arc(146 + column * 16, 140 + index * 16, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Poster on the wall.
    ctx.fillStyle = '#f2eee0';
    ctx.fillRect(44, 220, 168, 190);
    text(ctx, '使い方', 60, 254, {size: 22, weight: 700, font: FONT_SERIF, color: '#3a4038'});
    ctx.fillStyle = 'rgba(60,66,60,0.35)';
    for (let index = 0; index < 8; index += 1) {
      ctx.fillRect(60, 276 + index * 15, 136 - (index % 3) * 20, 4);
    }
    ctx.fillStyle = '#2f6f52';
    ctx.fillRect(44, height - 70, 168, 5);
  });

export const streetPlateTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/streetPlate', 256, 96, (ctx, width, height) => {
    ctx.fillStyle = '#2f5f4a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#d8e4d8';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    text(ctx, '海甸岛 · 三西路', width / 2, 44, {size: 20, weight: 600, font: FONT_SANS, color: '#e8f0e4', align: 'center'});
    text(ctx, 'HAIDIAN / 3RD WEST RD.', width / 2, 70, {size: 10, weight: 600, font: FONT_MONO, color: '#b8d0bc', align: 'center', tracking: 1});
  });

export const hazardStripeTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture(
    'prop/hazard',
    256,
    128,
    (ctx, width, height) => {
      ctx.fillStyle = '#e0b45a';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#26221c';
      for (let index = -height; index < width + height; index += 56) {
        ctx.beginPath();
        ctx.moveTo(index, height);
        ctx.lineTo(index + 28, height);
        ctx.lineTo(index + 28 + height, 0);
        ctx.lineTo(index + height, 0);
        ctx.closePath();
        ctx.fill();
      }
      grain(ctx, width, height, {seed: 8, count: 400, alpha: 0.06, size: 1});
    },
    {repeat: [1, 1]},
  );

export const agentPodTexture = (seed: number): ReturnType<typeof canvasTexture> =>
  canvasTexture(`prop/agentPod/${seed}`, 256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#182026';
    ctx.fillRect(0, 0, width, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(120, 150, 160, 0.16)'],
      [1, 'rgba(0,0,0,0.2)'],
    ]);
    const random = rng(seed * 41 + 5);
    text(ctx, `AGENT / A${seed}`, 16, 30, {size: 12, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
    ctx.strokeStyle = 'rgba(143, 164, 174, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    for (let index = 0; index < 6; index += 1) {
      const y = 58 + index * 28;
      const active = random() > 0.32;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(18, y, width - 36, 16);
      ctx.fillStyle = active ? (random() > 0.7 ? '#e0b45a' : '#7fbf9a') : 'rgba(90,110,118,0.3)';
      ctx.beginPath();
      ctx.arc(32, y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(150, 170, 178, 0.4)';
      ctx.fillRect(48, y + 6, 60 + random() * 80, 4);
    }
    text(ctx, 'STATUS', 18, 232, {size: 10, weight: 600, font: FONT_MONO, color: '#5f7f8a'});
    text(ctx, seed % 2 === 0 ? 'CLEAN' : 'WATCH', 18, 250, {size: 20, weight: 700, font: FONT_MONO, color: seed % 2 === 0 ? '#7fbf9a' : '#e0b45a'});
  });

export const binderSpinesTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('prop/binders', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#2a2f33';
    ctx.fillRect(0, 0, width, height);
    const colors = ['#8f5f4a', '#3f6f7a', '#6a7a4a', '#7a5a8a', '#a08a5a', '#4a5f8a', '#8a4a4a'];
    const random = rng(99);
    let x = 8;
    while (x < width - 26) {
      const w = 22 + random() * 26;
      const color = colors[Math.floor(random() * colors.length)] ?? '#8f5f4a';
      ctx.fillStyle = color;
      rr(ctx, x, 12, w, height - 26, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(x + 3, 16, 3, height - 34);
      ctx.fillStyle = '#f2eee0';
      ctx.fillRect(x + 5, 66, w - 10, 34);
      ctx.fillStyle = 'rgba(50,60,66,0.6)';
      ctx.fillRect(x + 7, 76, w - 14, 3);
      ctx.fillRect(x + 7, 84, w - 18, 2);
      ctx.fillStyle = 'rgba(50,60,66,0.5)';
      ctx.fillRect(x + 7, 120, w - 14, 2);
      ctx.fillRect(x + 7, 128, w - 16, 2);
      x += w + 3;
    }
    ctx.fillStyle = 'rgba(20, 24, 28, 0.5)';
    ctx.fillRect(0, height - 18, width, 18);
  });

export const serverRackTexture = (seed: number): ReturnType<typeof canvasTexture> =>
  canvasTexture(`prop/serverRack/${seed}`, 256, 512, (ctx, width, height) => {
    ctx.fillStyle = '#1c2226';
    ctx.fillRect(0, 0, width, height);
    const random = rng(seed * 23 + 9);
    for (let unit = 0; unit < 10; unit += 1) {
      const y = 14 + unit * 48;
      ctx.fillStyle = '#242c31';
      ctx.fillRect(10, y, width - 20, 40);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, y, width - 20, 40);
      // vents
      ctx.fillStyle = 'rgba(10, 14, 16, 0.6)';
      for (let vent = 0; vent < 8; vent += 1) {
        ctx.fillRect(22 + vent * 16, y + 12, 8, 16);
      }
      const color = random() > 0.6 ? '#7fbf9a' : random() > 0.5 ? '#e0b45a' : '#5f8fa8';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(width - 26, y + 16, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.05)'],
      [1, 'rgba(0,0,0,0.22)'],
    ]);
  });
