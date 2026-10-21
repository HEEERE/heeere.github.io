import {FONT_MONO, FONT_SANS, FONT_SERIF, canvasTexture, grain, horizontalGradient, rng, rr, softGlow, text, verticalGradient, withAlpha} from '../canvas';

const BRAND = 'HIKARI MART';
const BRAND_JP = 'ひかりマート';

/* ------------------------------------------------------------------ */
/* Hikari Mart storefront                                              */
/* ------------------------------------------------------------------ */

export const storeSignTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/storeMain', 1024, 256, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#fffdf5'],
      [0.55, '#fff4dc'],
      [1, '#ffe8c4'],
    ]);
    // Colour stripes in the corner.
    ctx.fillStyle = '#2f6f74';
    ctx.fillRect(width - 250, 0, 250, height);
    ctx.fillStyle = '#f0a24a';
    ctx.fillRect(width - 250, 0, 16, height);

    // Logo: a little rising sun lamp.
    ctx.save();
    ctx.translate(96, height / 2);
    ctx.fillStyle = '#f0a24a';
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f6f74';
    ctx.beginPath();
    ctx.arc(0, 6, 24, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0a24a';
    ctx.fillRect(-30, 10, 60, 8);
    ctx.restore();

    text(ctx, BRAND, 172, 122, {size: 74, weight: 800, font: FONT_SANS, color: '#243b40', tracking: 2});
    text(ctx, BRAND_JP, 176, 174, {size: 34, weight: 600, font: FONT_SERIF, color: '#4d666a', tracking: 6});
    text(ctx, 'COFFEE · BENTO · DAILY GOODS', 178, 216, {size: 20, weight: 600, font: FONT_SANS, color: '#8c8f88', tracking: 3});

    // The 24H block.
    text(ctx, '24', width - 198, 138, {size: 92, weight: 800, font: FONT_SANS, color: '#fffdf5', tracking: 2});
    text(ctx, 'HOURS', width - 198, 178, {size: 22, weight: 700, font: FONT_SANS, color: '#cfe3e0', tracking: 5});
    text(ctx, 'OPEN', width - 198, 210, {size: 18, weight: 700, font: FONT_SANS, color: '#f0a24a', tracking: 4});

    grain(ctx, width, height, {seed: 5, count: 500, alpha: 0.04, size: 1.2});
  });

export const verticalSignTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/vertical', 160, 512, (ctx, width, height) => {
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2f6f74';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    text(ctx, '2', width / 2, 92, {size: 66, weight: 800, font: FONT_SANS, color: '#2f6f74', align: 'center'});
    text(ctx, '4', width / 2, 158, {size: 66, weight: 800, font: FONT_SANS, color: '#2f6f74', align: 'center'});
    text(ctx, 'H', width / 2, 214, {size: 34, weight: 700, font: FONT_SANS, color: '#f0a24a', align: 'center'});
    ctx.save();
    ctx.translate(width / 2, 300);
    ctx.rotate(Math.PI / 2);
    text(ctx, 'ひかりマート', 0, 0, {size: 30, weight: 600, font: FONT_SERIF, color: '#3b5155', align: 'center'});
    ctx.restore();
    ctx.fillStyle = '#f0a24a';
    ctx.fillRect(20, height - 74, width - 40, 6);
    text(ctx, 'OPEN', width / 2, height - 30, {size: 22, weight: 700, font: FONT_SANS, color: '#2f6f74', align: 'center', tracking: 2});
  });

export const storePosterTexture = (kind: 'drink' | 'bento' | 'sale' | 'staff' | 'coffee'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`sign/storePoster/${kind}`, 256, 360, (ctx, width, height) => {
    const themes = {
      drink: {bg: '#dceef5', accent: '#2b7fa8', ink: '#173a4b', title: '冷たい\n飲みもの', en: 'COLD DRINKS'},
      bento: {bg: '#fbe6c8', accent: '#d98a34', ink: '#5a3a16', title: '新発売\nお弁当', en: 'NEW BENTO'},
      sale: {bg: '#f7d9c4', accent: '#d8503f', ink: '#5c2018', title: 'おにぎり\n100円', en: 'RICE BALL'},
      staff: {bg: '#e4eee4', accent: '#3f7a56', ink: '#1f3a2a', title: 'スタッフ\n募集中', en: 'STAFF WANTED'},
      coffee: {bg: '#f1e3d2', accent: '#7a5232', ink: '#3b2718', title: '入れたて\nコーヒー', en: 'FRESH COFFEE'},
    } as const;
    const theme = themes[kind];
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, width, 96);
    softGlow(ctx, width * 0.72, 60, 90, 'rgba(255,255,255,0.5)');

    if (kind === 'drink') {
      ctx.fillStyle = '#ffffff';
      rr(ctx, 150, 36, 46, 96, 10);
      ctx.fill();
      ctx.fillStyle = '#8fd0e8';
      ctx.fillRect(154, 88, 38, 42);
      ctx.fillStyle = '#2b7fa8';
      ctx.fillRect(150, 30, 46, 12);
    } else if (kind === 'bento') {
      ctx.fillStyle = '#ffffff';
      rr(ctx, 136, 44, 84, 52, 8);
      ctx.fill();
      ctx.fillStyle = '#7fbf7a';
      ctx.beginPath();
      ctx.arc(158, 68, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b04a';
      ctx.fillRect(176, 54, 18, 22);
      ctx.fillStyle = '#d96b4a';
      ctx.beginPath();
      ctx.arc(206, 72, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'sale') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(188, 74, 40, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2f4a3d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(188, 68, 43, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#2f4a3d';
      ctx.fillRect(166, 66, 44, 12);
    } else if (kind === 'staff') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(188, 62, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      rr(ctx, 156, 86, 64, 34, 12);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      rr(ctx, 154, 46, 54, 64, 8);
      ctx.fill();
      ctx.fillStyle = '#7a5232';
      ctx.fillRect(158, 74, 46, 32);
      ctx.strokeStyle = '#7a5232';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(208, 66, 13, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    const lines = theme.title.split('\n');
    lines.forEach((line, index) => {
      text(ctx, line, width / 2, 210 + index * 52, {size: 42, weight: 800, font: FONT_SERIF, color: theme.ink, align: 'center'});
    });
    text(ctx, theme.en, width / 2, 322, {size: 18, weight: 700, font: FONT_SANS, color: theme.accent, align: 'center', tracking: 3});
    ctx.strokeStyle = withAlpha(theme.ink, 0.18);
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);
    grain(ctx, width, height, {seed: 12, count: 600, alpha: 0.04, size: 1.2});
  });

/** Rows of little product packages, mapped onto the front of store shelves. */
export const shelfProductsTexture = (variant = 0): ReturnType<typeof canvasTexture> =>
  canvasTexture(`sign/shelfProducts/${variant}`, 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#2a2622';
    ctx.fillRect(0, 0, width, height);
    const palettes = [
      ['#e8d7b8', '#d96b4a', '#e8b04a', '#7fa06a', '#4a7a9a', '#f2f0e6', '#c8d8b0'],
      ['#f2e6c8', '#d8a048', '#8f9e6a', '#c85f4a', '#5f8fa8', '#efe9dc', '#b8c8a0'],
      ['#e8e0c8', '#c8785a', '#9aab7a', '#d8b85a', '#6a8fa0', '#f4f0e4', '#a8b890'],
      ['#f0e8d0', '#b85f4a', '#d8a85a', '#7a9a6a', '#4a6f8a', '#f6f2e6', '#c0d0b0'],
    ] as const;
    const palette = palettes[variant % palettes.length] ?? palettes[0];
    const random = rng(300 + variant * 37);
    const rows = 4;
    const rowHeight = height / rows;
    for (let row = 0; row < rows; row += 1) {
      // Shelf lip.
      ctx.fillStyle = '#4a4038';
      ctx.fillRect(0, row * rowHeight + rowHeight - 8, width, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, row * rowHeight + rowHeight - 8, width, 2);

      let x = 4;
      while (x < width - 8) {
        const packageWidth = 12 + random() * 20;
        const packageHeight = rowHeight * (0.5 + random() * 0.32);
        const color = palette[Math.floor(random() * palette.length)] ?? '#e8d7b8';
        const y = row * rowHeight + rowHeight - 10 - packageHeight;
        ctx.fillStyle = color;
        rr(ctx, x, y, Math.min(packageWidth, width - x - 4), packageHeight, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x + 2, y + packageHeight * 0.18, Math.min(packageWidth, width - x - 4) - 4, packageHeight * 0.18);
        ctx.fillStyle = 'rgba(40,36,32,0.5)';
        ctx.fillRect(x + 3, y + packageHeight * 0.5, Math.max(4, Math.min(packageWidth, width - x - 4) - 8), 2);
        x += Math.min(packageWidth, width - x - 4) + 2 + random() * 2;
      }
    }
    ctx.fillStyle = 'rgba(20,18,16,0.25)';
    ctx.fillRect(0, height - 10, width, 10);
  });

/** Drinks behind the cooler glass. */
export const coolerDrinksTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/cooler', 256, 512, (ctx, width, height) => {
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#eaf6ff'],
      [0.5, '#d8ecf7'],
      [1, '#c8e2f0'],
    ]);
    const random = rng(414);
    const bottles = ['#e8a04a', '#7fb87a', '#4a8fc0', '#e85f6a', '#f2f0e8', '#8a6fc0', '#4ab8a0'];
    for (let row = 0; row < 5; row += 1) {
      const shelfY = 70 + row * 88;
      ctx.fillStyle = 'rgba(120, 150, 168, 0.5)';
      ctx.fillRect(0, shelfY + 56, width, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(0, shelfY + 56, width, 2);
      for (let column = 0; column < 7; column += 1) {
        const color = bottles[Math.floor(random() * bottles.length)] ?? '#e8a04a';
        const x = 12 + column * 34;
        // bottle body
        ctx.fillStyle = color;
        rr(ctx, x, shelfY + 10, 22, 48, 5);
        ctx.fill();
        ctx.fillStyle = withAlpha('#ffffff', 0.35);
        ctx.fillRect(x + 3, shelfY + 14, 5, 38);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        rr(ctx, x + 4, shelfY + 22, 14, 16, 2);
        ctx.fill();
        ctx.fillStyle = '#3a5566';
        ctx.beginPath();
        ctx.arc(x + 11, shelfY + 30, 4, 0, Math.PI * 2);
        ctx.fill();
        // cap
        ctx.fillStyle = '#8fa6b4';
        ctx.fillRect(x + 5, shelfY + 4, 12, 7);
      }
    }
    ctx.fillStyle = 'rgba(30, 50, 64, 0.20)';
    ctx.fillRect(0, 0, width, 20);
    softGlow(ctx, width * 0.5, 40, 160, 'rgba(255,255,255,0.5)');
  });

export const magazineRackTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/magazines', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#3a3630';
    ctx.fillRect(0, 0, width, height);
    const random = rng(717);
    const covers = ['#e8d8b8', '#d96b5a', '#5a8fb0', '#e8c04a', '#7fa87a', '#e8e4dc', '#c06a8a'];
    const cols = 6;
    const rows = 2;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < cols; column += 1) {
        const coverWidth = width / cols - 10;
        const x = column * (width / cols) + 5;
        const y = row * (height / rows) + 8;
        const coverHeight = height / rows - 16;
        ctx.fillStyle = covers[Math.floor(random() * covers.length)] ?? '#e8d8b8';
        ctx.fillRect(x, y, coverWidth, coverHeight);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(x + 4, y + coverHeight * 0.55, coverWidth - 8, coverHeight * 0.16);
        ctx.fillStyle = 'rgba(30,32,36,0.65)';
        for (let line = 0; line < 4; line += 1) {
          ctx.fillRect(x + 5, y + 6 + line * 6, coverWidth - 10 - (line % 2) * 10, 2);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, coverWidth, coverHeight);
      }
    }
  });

export const vendingFrontTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/vending', 256, 512, (ctx, width, height) => {
    ctx.fillStyle = '#f2f0e8';
    ctx.fillRect(0, 0, width, height);
    // Header.
    ctx.fillStyle = '#d8503f';
    ctx.fillRect(0, 0, width, 54);
    text(ctx, 'COLD', 16, 36, {size: 28, weight: 800, font: FONT_SANS, color: '#fff6ea', tracking: 2});
    text(ctx, 'DRINK', 132, 36, {size: 22, weight: 700, font: FONT_SANS, color: '#f7d9c4'});
    softGlow(ctx, 60, 30, 60, 'rgba(255,255,255,0.3)');

    // Product grid.
    const random = rng(919);
    const colors = ['#e8a04a', '#7fb87a', '#4a8fc0', '#e85f6a', '#f2f0e8', '#8a6fc0'];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const x = 12 + column * 60;
        const y = 70 + row * 104;
        ctx.fillStyle = 'rgba(220, 226, 230, 0.65)';
        rr(ctx, x - 2, y - 2, 54, 92, 4);
        ctx.fill();
        const color = colors[Math.floor(random() * colors.length)] ?? '#e8a04a';
        ctx.fillStyle = color;
        rr(ctx, x + 2, y + 6, 46, 62, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(x + 8, y + 22, 34, 22);
        ctx.fillStyle = '#2a3238';
        ctx.fillRect(x + 10, y + 72, 30, 8);
        ctx.fillStyle = '#d8503f';
        ctx.fillRect(x + 12, y + 73, 26, 6);
      }
    }
    // Buttons + coin slot.
    for (let index = 0; index < 8; index += 1) {
      const x = 16 + index * 28;
      ctx.fillStyle = '#3b444a';
      rr(ctx, x, 396, 20, 10, 2);
      ctx.fill();
      ctx.fillStyle = '#9fd8a8';
      ctx.fillRect(x + 4, 398, 12, 3);
    }
    ctx.fillStyle = '#5f6a70';
    ctx.fillRect(16, 420, 56, 10);
    ctx.fillRect(90, 420, 40, 10);
    ctx.fillStyle = '#2a3238';
    rr(ctx, 14, 446, 228, 54, 4);
    ctx.fill();
    ctx.fillStyle = '#171c20';
    ctx.fillRect(24, 456, 208, 34);
    ctx.fillStyle = 'rgba(160, 190, 210, 0.25)';
    ctx.fillRect(28, 460, 200, 6);
    grain(ctx, width, height, {seed: 44, count: 700, alpha: 0.05, size: 1.2});
  });

export const doormatTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/doormat', 256, 128, (ctx, width, height) => {
    ctx.fillStyle = '#4a4c46';
    ctx.fillRect(0, 0, width, height);
    for (let y = 4; y < height; y += 8) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, y, width, 2);
    }
    text(ctx, 'WELCOME', width / 2, height / 2 + 8, {size: 34, weight: 700, font: FONT_SANS, color: '#d8d4c4', align: 'center', tracking: 4});
    ctx.strokeStyle = 'rgba(216,212,196,0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, width - 16, height - 16);
  });

export const neonOpenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/neonOpen', 256, 128, (ctx, width, height) => {
    ctx.fillStyle = '#141a20';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.shadowColor = '#ff8f4a';
    ctx.shadowBlur = 22;
    text(ctx, 'OPEN', width / 2, 62, {size: 58, weight: 800, font: FONT_SANS, color: '#ffd9a8', align: 'center', tracking: 3});
    ctx.shadowBlur = 10;
    text(ctx, '24 HOURS', width / 2, 102, {size: 20, weight: 700, font: FONT_SANS, color: '#ffb46a', align: 'center', tracking: 4});
    ctx.restore();
  });

export const staffOnlyTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/staffOnly', 256, 96, (ctx, width, height) => {
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#5a5a52';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    text(ctx, 'STAFF ONLY', width / 2, 48, {size: 28, weight: 700, font: FONT_SANS, color: '#3a3a34', align: 'center', tracking: 2});
    text(ctx, '関係者以外立入禁止', width / 2, 76, {size: 16, weight: 600, font: FONT_SANS, color: '#6a6a60', align: 'center'});
  });

export const atmSignTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/atm', 128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#2b6f9a';
    ctx.fillRect(0, 0, width, height);
    text(ctx, 'ATM', width / 2, 58, {size: 34, weight: 800, font: FONT_SANS, color: '#f2f8fa', align: 'center', tracking: 2});
    text(ctx, '24H', width / 2, 92, {size: 22, weight: 700, font: FONT_SANS, color: '#a8d8ea', align: 'center'});
  });

export const menuBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/menuBoard', 256, 320, (ctx, width, height) => {
    ctx.fillStyle = '#2f3632';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#c9a878';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    text(ctx, 'TODAY', width / 2, 62, {size: 32, weight: 700, font: FONT_SANS, color: '#f2ead8', align: 'center', tracking: 4});
    text(ctx, '本日のおすすめ', width / 2, 92, {size: 18, weight: 500, font: FONT_SERIF, color: '#c9c0a8', align: 'center'});
    const items = [
      ['おにぎり', '¥120'],
      ['ホットコーヒー', '¥110'],
      ['からあげ', '¥180'],
      ['メロンパン', '¥130'],
    ] as const;
    items.forEach(([name, price], index) => {
      const y = 148 + index * 40;
      text(ctx, name, 34, y, {size: 20, weight: 500, font: FONT_SERIF, color: '#e8dfc8'});
      text(ctx, price, width - 34, y, {size: 20, weight: 700, font: FONT_SANS, color: '#f0b46a', align: 'right'});
      ctx.strokeStyle = 'rgba(201,168,120,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, y + 10);
      ctx.lineTo(width - 34, y + 10);
      ctx.stroke();
    });
  });

export const noticeBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/noticeBoard', 512, 360, (ctx, width, height) => {
    ctx.fillStyle = '#b58b5b';
    ctx.fillRect(0, 0, width, height);
    const random = rng(611);
    for (let index = 0; index < 3000; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(90,62,36,0.25)' : 'rgba(240,214,178,0.25)';
      ctx.fillRect(random() * width, random() * height, 2, 2);
    }
    const papers = [
      [26, 28, 150, 190, '#f2efe4'],
      [196, 46, 128, 150, '#e8e4d2'],
      [344, 30, 132, 172, '#f6f0dc'],
      [40, 236, 180, 96, '#e4ecef'],
      [248, 214, 100, 120, '#f2e0c8'],
      [364, 224, 112, 100, '#eee8d8'],
    ] as const;
    for (const [x, y, w, h, color] of papers) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((random() - 0.5) * 0.06);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(3, 3, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(40,44,48,0.6)';
      for (let line = 0; line < Math.floor(h / 18) - 1; line += 1) {
        ctx.fillRect(10, 14 + line * 16, w - 20 - (line % 3) * 12, 4);
      }
      ctx.fillStyle = '#d8503f';
      ctx.beginPath();
      ctx.arc(w / 2, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });

/* ------------------------------------------------------------------ */
/* Plinth plaque + labels                                              */
/* ------------------------------------------------------------------ */

export const plaqueTexture = (index: string, nameZh: string, nameEn: string, subtitle: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`plaque/${index}/${nameEn}`, 768, 120, (ctx, width, height) => {
    // Brushed brass.
    verticalGradient(ctx, 0, 0, width, height, [
      [0, '#e3cd9a'],
      [0.16, '#c2a76a'],
      [0.5, '#d8bd85'],
      [0.86, '#b0945a'],
      [1, '#8f7440'],
    ]);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255, 250, 232, 0.32)'],
      [0.24, 'rgba(255, 250, 232, 0.04)'],
      [0.76, 'rgba(60, 42, 18, 0.10)'],
      [1, 'rgba(60, 42, 18, 0.22)'],
    ]);
    for (let index = 0; index < 220; index += 1) {
      const random = rng(index * 13 + 5);
      ctx.fillStyle = random() > 0.5 ? 'rgba(255, 246, 218, 0.10)' : 'rgba(90, 66, 28, 0.08)';
      ctx.fillRect(random() * width, random() * height, 12 + random() * 40, 1);
    }
    // Inset border.
    ctx.strokeStyle = 'rgba(74, 52, 20, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10.5, 10.5, width - 21, height - 21);
    ctx.strokeStyle = 'rgba(255, 246, 220, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(13.5, 13.5, width - 27, height - 27);

    // Engraved index.
    text(ctx, index, 34, 74, {size: 52, weight: 700, font: FONT_SERIF, color: 'rgba(58, 40, 14, 0.82)', tracking: 1});
    ctx.fillStyle = 'rgba(74, 52, 20, 0.35)';
    ctx.fillRect(108, 28, 1.5, height - 56);

    text(ctx, nameZh, 132, 60, {size: 42, weight: 700, font: FONT_SERIF, color: 'rgba(48, 33, 10, 0.9)'});
    text(ctx, nameEn, 134, 94, {size: 17, weight: 700, font: FONT_SANS, color: 'rgba(74, 54, 24, 0.82)', tracking: 3});

    text(ctx, subtitle, width - 34, 56, {size: 13, weight: 600, font: FONT_SANS, color: 'rgba(74, 54, 24, 0.72)', align: 'right', tracking: 1});
    text(ctx, 'HAKONIWA / MINIATURE SET', width - 34, 94, {size: 10, weight: 600, font: FONT_SANS, color: 'rgba(74, 54, 24, 0.5)', align: 'right', tracking: 2});
  });

export const labelTagTexture = (label: string, color: string, sub?: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`label/${label}/${color}/${sub ?? ''}`, 256, 96, (ctx, width, height) => {
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 10, height);
    text(ctx, label, 26, sub ? 42 : 52, {size: sub ? 30 : 34, weight: 700, font: FONT_SANS, color: '#2e3438'});
    if (sub) text(ctx, sub, 26, 74, {size: 16, weight: 500, font: FONT_SANS, color: '#6a7076'});
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
  });

/* ------------------------------------------------------------------ */
/* Street furniture signs                                              */
/* ------------------------------------------------------------------ */

export const streetSignTexture = (kind: 'arrow' | 'parking' | 'noEntry' | 'stop'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`sign/street/${kind}`, 256, 128, (ctx, width, height) => {
    if (kind === 'arrow') {
      ctx.fillStyle = '#2f6f9a';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#f2f6f8';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, width - 12, height - 12);
      ctx.fillStyle = '#f2f6f8';
      ctx.beginPath();
      ctx.moveTo(200, 32);
      ctx.lineTo(232, 64);
      ctx.lineTo(200, 96);
      ctx.lineTo(200, 76);
      ctx.lineTo(70, 76);
      ctx.lineTo(70, 52);
      ctx.lineTo(200, 52);
      ctx.closePath();
      ctx.fill();
      text(ctx, '中央区', 64, 118, {size: 16, weight: 600, font: FONT_SANS, color: '#cfe0ea'});
      return;
    }
    if (kind === 'parking') {
      ctx.fillStyle = '#2f6f9a';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f2f6f8';
      text(ctx, 'P', width / 2, 96, {size: 86, weight: 800, font: FONT_SANS, color: '#f2f6f8', align: 'center'});
      return;
    }
    if (kind === 'stop') {
      ctx.fillStyle = '#c8402f';
      ctx.beginPath();
      ctx.moveTo(width / 2, 6);
      ctx.lineTo(width - 8, height - 16);
      ctx.lineTo(8, height - 16);
      ctx.closePath();
      ctx.fill();
      text(ctx, '止まれ', width / 2, height - 34, {size: 40, weight: 800, font: FONT_SANS, color: '#f7ece0', align: 'center'});
      return;
    }
    ctx.fillStyle = '#c8402f';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2efe4';
    ctx.fillRect(60, height / 2 - 10, 136, 20);
  });

export const busStopTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/busStop', 256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#f0ede2';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#3f7a56';
    ctx.fillRect(0, 0, width, 70);
    text(ctx, 'BUS', 24, 48, {size: 34, weight: 800, font: FONT_SANS, color: '#f4f8f0', tracking: 2});
    text(ctx, '停留所', 156, 48, {size: 24, weight: 600, font: FONT_SERIF, color: '#d8e8d0'});
    const stops = ['海甸校区', '白沙门', '钟楼', '骑楼老街'];
    stops.forEach((stop, index) => {
      text(ctx, stop, 26, 116 + index * 34, {size: 18, weight: 500, font: FONT_SANS, color: '#3a4248'});
      text(ctx, `${index + 1}`, width - 30, 116 + index * 34, {size: 16, weight: 700, font: FONT_SANS, color: '#7a848a', align: 'right'});
    });
  });

/* ------------------------------------------------------------------ */
/* Room boards                                                         */
/* ------------------------------------------------------------------ */

export const flowBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/flowBoard', 1024, 384, (ctx, width, height) => {
    ctx.fillStyle = '#1a2229';
    ctx.fillRect(0, 0, width, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(80, 130, 150, 0.18)'],
      [1, 'rgba(20, 28, 34, 0)'],
    ]);
    text(ctx, 'PROCESS MEMORY LIFECYCLE', 42, 58, {size: 30, weight: 700, font: FONT_SANS, color: '#cfe3ea', tracking: 3});
    text(ctx, 'PMU の状態遷移 — 検証と再利用', 44, 92, {size: 18, weight: 500, font: FONT_SERIF, color: '#7f9aa4'});

    const states = [
      {label: 'CANDIDATE', color: '#e0b45a', x: 90},
      {label: 'EXECUTOR', color: '#8fb9c9', x: 290},
      {label: 'JUDGE', color: '#9fc7d8', x: 490},
      {label: 'REPAIR', color: '#d0a070', x: 690},
      {label: 'VERIFIED', color: '#7fbf9a', x: 890},
    ] as const;
    states.forEach((state) => {
      ctx.fillStyle = 'rgba(30, 44, 54, 0.9)';
      rr(ctx, state.x - 76, 158, 152, 74, 10);
      ctx.fill();
      ctx.strokeStyle = withAlpha(state.color, 0.9);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = withAlpha(state.color, 0.16);
      rr(ctx, state.x - 76, 158, 152, 74, 10);
      ctx.fill();
      ctx.fillStyle = state.color;
      ctx.beginPath();
      ctx.arc(state.x - 54, 178, 7, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, state.label, state.x, 208, {size: 20, weight: 700, font: FONT_SANS, color: '#e6f0f2', align: 'center', tracking: 1});
    });
    // Arrows.
    for (let index = 0; index < states.length - 1; index += 1) {
      const from = states[index];
      const to = states[index + 1];
      if (!from || !to) continue;
      ctx.strokeStyle = 'rgba(150, 180, 192, 0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from.x + 78, 195);
      ctx.lineTo(to.x - 80, 195);
      ctx.stroke();
      ctx.fillStyle = 'rgba(150, 180, 192, 0.65)';
      ctx.beginPath();
      ctx.moveTo(to.x - 80, 195);
      ctx.lineTo(to.x - 90, 189);
      ctx.lineTo(to.x - 90, 201);
      ctx.closePath();
      ctx.fill();
    }
    // Return loop.
    ctx.strokeStyle = 'rgba(208, 160, 112, 0.6)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(690, 236);
    ctx.lineTo(690, 296);
    ctx.lineTo(290, 296);
    ctx.lineTo(290, 236);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 're-verify', 470, 322, {size: 16, weight: 600, font: FONT_SANS, color: '#b99a78', align: 'center'});

    // Active state chip.
    ctx.fillStyle = 'rgba(30, 44, 54, 0.9)';
    rr(ctx, 880, 286, 104, 42, 8);
    ctx.fill();
    ctx.fillStyle = '#5fc8b8';
    ctx.beginPath();
    ctx.arc(902, 307, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'ACTIVE', 918, 314, {size: 18, weight: 700, font: FONT_SANS, color: '#b8e8e0'});

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    grain(ctx, width, height, {seed: 71, count: 1500, alpha: 0.04, size: 1.2});
  });

export const commandMapTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/commandMap', 1024, 512, (ctx, width, height) => {
    ctx.fillStyle = '#0e1b24';
    ctx.fillRect(0, 0, width, height);
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(30, 70, 86, 0.55)'],
      [1, 'rgba(10, 18, 24, 0.2)'],
    ]);
    // Grid.
    ctx.strokeStyle = 'rgba(110, 160, 176, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Region shapes.
    const random = rng(808);
    const regions = [
      ['#1f4a56', 120, 90, 260, 180],
      ['#24565f', 420, 60, 200, 150],
      ['#1c3f4c', 640, 130, 240, 170],
      ['#26444e', 260, 300, 300, 150],
      ['#1a3742', 620, 330, 200, 110],
    ] as const;
    for (const [color, x, y, w, h] of regions) {
      ctx.fillStyle = withAlpha(color, 0.85);
      ctx.beginPath();
      const points = 7 + Math.floor(random() * 4);
      for (let index = 0; index < points; index += 1) {
        const angle = (index / points) * Math.PI * 2;
        const radiusX = (w / 2) * (0.72 + random() * 0.42);
        const radiusY = (h / 2) * (0.72 + random() * 0.42);
        const px = x + w / 2 + Math.cos(angle) * radiusX;
        const py = y + h / 2 + Math.sin(angle) * radiusY;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(130, 190, 200, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Roads.
    ctx.strokeStyle = 'rgba(180, 210, 216, 0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-20, 240);
    ctx.bezierCurveTo(240, 210, 420, 320, 700, 250);
    ctx.bezierCurveTo(820, 220, 900, 180, 1040, 200);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(380, -20);
    ctx.bezierCurveTo(400, 120, 340, 320, 420, 540);
    ctx.stroke();

    // Alert markers.
    const markers = [
      [0.28, 0.34, '#e0a04a'],
      [0.52, 0.24, '#d8503f'],
      [0.71, 0.46, '#7fc8b8'],
      [0.44, 0.66, '#e0a04a'],
      [0.78, 0.7, '#7fc8b8'],
    ] as const;
    for (const [mx, my, color] of markers) {
      const x = width * mx;
      const y = height * my;
      softGlow(ctx, x, y, 46, withAlpha(color, 0.7));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Header panel.
    ctx.fillStyle = 'rgba(8, 16, 21, 0.85)';
    ctx.fillRect(0, 0, width, 42);
    text(ctx, 'EMERGENCY KNOWLEDGE MAP / 应急知识图谱', 26, 28, {size: 20, weight: 700, font: FONT_SANS, color: '#a8d4d8', tracking: 2});
    text(ctx, 'SOP-2026 / LIVE', width - 26, 28, {size: 16, weight: 700, font: FONT_MONO, color: '#7fbf9a', align: 'right'});
    grain(ctx, width, height, {seed: 99, count: 1600, alpha: 0.05, size: 1.2});
  });



export const sopPosterTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/sopPoster', 256, 360, (ctx, width, height) => {
    ctx.fillStyle = '#f2efe4';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c8402f';
    ctx.fillRect(0, 0, width, 74);
    text(ctx, '緊急対応', 22, 50, {size: 30, weight: 800, font: FONT_SERIF, color: '#faf4e8'});
    text(ctx, 'SOP', width - 22, 44, {size: 22, weight: 700, font: FONT_SANS, color: '#f7d0c4', align: 'right'});
    const steps = ['1. 状況の確認', '2. 関係機関へ連絡', '3. 初動対応の実施', '4. 記録と報告', '5. 再発防止の検討'];
    steps.forEach((step, index) => {
      text(ctx, step, 24, 124 + index * 42, {size: 17, weight: 500, font: FONT_SANS, color: '#3a4046'});
      ctx.strokeStyle = 'rgba(60,70,76,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 136 + index * 42);
      ctx.lineTo(width - 24, 136 + index * 42);
      ctx.stroke();
    });
    ctx.fillStyle = '#c8402f';
    ctx.fillRect(24, 320, 60, 8);
    ctx.fillStyle = '#5a6268';
    ctx.fillRect(92, 320, 120, 4);
  });

export const warningBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/warningBoard', 512, 256, (ctx, width, height) => {
    ctx.fillStyle = '#241d1c';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e0877a';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    // Warning triangle.
    ctx.fillStyle = '#e0a04a';
    ctx.beginPath();
    ctx.moveTo(64, 190);
    ctx.lineTo(104, 110);
    ctx.lineTo(144, 190);
    ctx.closePath();
    ctx.fill();
    text(ctx, '!', 104, 178, {size: 42, weight: 800, font: FONT_SANS, color: '#241d1c', align: 'center'});
    text(ctx, 'CONTAMINATION', 176, 74, {size: 32, weight: 800, font: FONT_SANS, color: '#f2d8d0', tracking: 2});
    text(ctx, 'DETECTED — CONTAINMENT ACTIVE', 178, 108, {size: 18, weight: 700, font: FONT_SANS, color: '#e0877a', tracking: 2});
    ctx.fillStyle = 'rgba(224, 135, 122, 0.18)';
    ctx.fillRect(176, 128, 300, 82);
    const lines = ['L1 regex  →  blocked', 'L2 vector  →  blocked', 'L3 intent  →  review', 'quorum     →  veto'];
    lines.forEach((line, index) => {
      text(ctx, line, 190, 152 + index * 18, {size: 14, weight: 600, font: FONT_MONO, color: '#e8b8a8'});
    });
    grain(ctx, width, height, {seed: 55, count: 900, alpha: 0.05, size: 1.2});
  });

export const statusBoardTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/statusBoard', 512, 320, (ctx, width, height) => {
    ctx.fillStyle = '#121b22';
    ctx.fillRect(0, 0, width, height);
    text(ctx, 'TASK BOARD', 24, 38, {size: 20, weight: 700, font: FONT_SANS, color: '#8fb9c9', tracking: 3});
    const rows = [
      ['DOC-011', 'PARSE', 'DONE', '#7fbf9a'],
      ['DOC-012', 'EXTRACT', 'DONE', '#7fbf9a'],
      ['SOP-07', 'ALIGN', 'RUN', '#e0b45a'],
      ['SOP-08', 'GRAPH', 'RUN', '#e0b45a'],
      ['QA-021', 'EVIDENCE', 'WAIT', '#8fb9c9'],
      ['QA-022', 'ANSWER', 'WAIT', '#8fb9c9'],
    ] as const;
    rows.forEach(([id, stage, status, color], index) => {
      const y = 70 + index * 38;
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y, width, 34);
      text(ctx, id, 24, y + 22, {size: 15, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
      text(ctx, stage, 140, y + 22, {size: 15, weight: 600, font: FONT_SANS, color: '#c8d8dc', tracking: 1});
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(388, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, status, 404, y + 22, {size: 14, weight: 700, font: FONT_MONO, color});
    });
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let index = 0; index < 50; index += 1) {
      ctx.fillRect(24, 292 + (index % 2) * 10, 300 - index * 4, 2);
    }
  });

export const archiveDrawersTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/archiveDrawers', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#8e9498';
    ctx.fillRect(0, 0, width, height);
    const random = rng(404);
    const cols = 5;
    const rows = 7;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < cols; column += 1) {
        const x = column * cellWidth;
        const y = row * cellHeight;
        const metal = 118 + random() * 24;
        ctx.fillStyle = `rgb(${metal}, ${metal + 4}, ${metal + 6})`;
        ctx.fillRect(x + 3, y + 3, cellWidth - 6, cellHeight - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x + 3, y + 3, cellWidth - 6, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.fillRect(x + 3, y + cellHeight - 6, cellWidth - 6, 3);
        // Label card.
        ctx.fillStyle = '#e8e2d0';
        ctx.fillRect(x + 10, y + cellHeight * 0.26, cellWidth - 20, cellHeight * 0.36);
        ctx.fillStyle = '#3f464a';
        ctx.fillRect(x + 14, y + cellHeight * 0.36, cellWidth - 28, 3);
        ctx.fillRect(x + 14, y + cellHeight * 0.48, cellWidth - 40, 2);
        ctx.fillStyle = '#5a6266';
        ctx.fillRect(x + cellWidth * 0.36, y + cellHeight * 0.7, cellWidth * 0.28, 4);
      }
    }
    grain(ctx, width, height, {seed: 33, count: 1200, alpha: 0.05, size: 1.2});
  });

export const bookshelfTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/bookshelf', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(0, 0, width, height);
    const random = rng(505);
    const colors = ['#8f5f4a', '#3f5f6a', '#6a7a4a', '#7a4a4a', '#4a5a7a', '#a08a5a', '#5a4a3a', '#7f6a8a'];
    const rows = 6;
    for (let row = 0; row < rows; row += 1) {
      const shelfY = row * (height / rows);
      for (let x = 8; x < width - 8; ) {
        const bookWidth = 8 + random() * 18;
        const bookHeight = (height / rows) * (0.6 + random() * 0.3);
        const color = colors[Math.floor(random() * colors.length)] ?? '#8f5f4a';
        ctx.fillStyle = color;
        ctx.fillRect(x, shelfY + (height / rows) - bookHeight - 6, bookWidth, bookHeight);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, shelfY + (height / rows) - bookHeight - 6, 2, bookHeight);
        ctx.fillStyle = 'rgba(240,230,210,0.6)';
        ctx.fillRect(x + bookWidth * 0.2, shelfY + (height / rows) - bookHeight * 0.55, Math.max(2, bookWidth * 0.6), 3);
        x += bookWidth + 2;
      }
    }
  });

export const toolWallTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/toolWall', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#b59a74';
    ctx.fillRect(0, 0, width, height);
    for (let y = 20; y < height; y += 36) {
      for (let x = 20; x < width; x += 36) {
        ctx.fillStyle = 'rgba(60, 44, 26, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tool = (color: string, draw: () => void) => {
      ctx.save();
      ctx.fillStyle = color;
      draw();
      ctx.restore();
    };
    // Wrench.
    tool('#4a4a4a', () => {
      ctx.fillRect(70, 70, 14, 200);
      ctx.beginPath();
      ctx.arc(77, 66, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b59a74';
      ctx.beginPath();
      ctx.arc(77, 66, 13, 0, Math.PI * 2);
      ctx.fill();
    });
    // Screwdriver.
    tool('#a04a3a', () => {
      ctx.fillRect(206, 90, 22, 90);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(214, 180, 6, 100);
      ctx.fillStyle = '#c8b890';
      ctx.fillRect(212, 200, 10, 70);
    });
    // Pliers.
    tool('#3a4a56', () => {
      ctx.save();
      ctx.translate(330, 90);
      ctx.rotate(0.18);
      ctx.fillRect(0, 0, 14, 150);
      ctx.fillRect(30, 0, 14, 150);
      ctx.restore();
      ctx.save();
      ctx.translate(322, 200);
      ctx.rotate(-0.1);
      ctx.fillRect(0, 0, 16, 80);
      ctx.restore();
    });
    // Hammer.
    tool('#6a5a44', () => {
      ctx.fillRect(450, 80, 14, 170);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(420, 66, 74, 34);
    });
    // Tape measure.
    tool('#d8b84a', () => {
      ctx.beginPath();
      ctx.arc(90, 380, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.arc(90, 380, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8b84a';
      ctx.fillRect(130, 372, 120, 14);
    });
    // Caliper.
    tool('#8a8f96', () => {
      ctx.fillRect(270, 340, 200, 12);
      ctx.fillRect(290, 330, 15, 60);
      ctx.fillRect(430, 330, 15, 60);
    });
    // Label tags under each tool.
    const labels = ['SPANNER', 'DRIVER', 'PLIERS', 'HAMMER', 'TAPE', 'CALIPER'] as const;
    labels.forEach((label, index) => {
      ctx.fillStyle = '#f2eee0';
      ctx.fillRect(50 + index * 76, 456, 64, 26);
      text(ctx, label, 82 + index * 76, 474, {size: 10, weight: 700, font: FONT_SANS, color: '#3a3a34', align: 'center'});
    });
    grain(ctx, width, height, {seed: 19, count: 800, alpha: 0.05, size: 1});
  });

export const drawerLabelSheetTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/drawerLabels', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#c8b48e';
    ctx.fillRect(0, 0, width, height);
    const labels = [
      'PYTHON',
      'C++',
      'FASTAPI',
      'PYDANTIC',
      'SQLALCHEMY',
      'SQLITE',
      'WEBSOCKET',
      'NEO4J',
      'GRAPH',
      'RAG',
      'AGENT',
      'MEMORY',
      'DOCKER',
      'GIT',
      'LINUX',
      'CODEX',
    ];
    const cols = 2;
    const rows = 8;
    labels.forEach((label, index) => {
      const x = (index % cols) * (width / cols);
      const y = Math.floor(index / cols) * (height / rows);
      const w = width / cols;
      const h = height / rows;
      ctx.fillStyle = '#efe8d6';
      rr(ctx, x + 8, y + 6, w - 16, h - 12, 6);
      ctx.fill();
      ctx.fillStyle = '#b5955f';
      ctx.fillRect(x + 8, y + 6, 5, h - 12);
      text(ctx, label, x + 24, y + h / 2 + 6, {size: 18, weight: 700, font: FONT_SANS, color: '#33383c', tracking: 1});
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 6, w - 16, h - 12);
    });
  });

export const whiteboardSkinTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('sign/whiteboard', 1024, 512, (ctx, width, height) => {
    ctx.fillStyle = '#f2f4f2';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(40, 50, 58, 0.55)';
    ctx.lineWidth = 2;
    // Architecture sketch.
    const box = (x: number, y: number, w: number, h: number, label: string, tint: string) => {
      ctx.fillStyle = withAlpha(tint, 0.18);
      rr(ctx, x, y, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = tint;
      ctx.lineWidth = 3;
      ctx.stroke();
      text(ctx, label, x + w / 2, y + h / 2 + 7, {size: 20, weight: 700, font: FONT_SANS, color: tint, align: 'center'});
    };
    box(60, 80, 180, 74, 'FastAPI', '#3f7a9a');
    box(60, 200, 180, 74, 'Pydantic', '#3f7a9a');
    box(300, 140, 200, 74, 'Agent Loop', '#6a5a9a');
    box(560, 60, 180, 74, 'Memory', '#7a6a3a');
    box(560, 190, 180, 74, 'Tools', '#7a6a3a');
    box(800, 120, 170, 74, 'WS Trace', '#3f7a5a');
    box(300, 320, 200, 74, 'Neo4j', '#3f7a5a');
    box(560, 320, 180, 74, 'RAG', '#8a4a4a');
    box(800, 320, 170, 74, 'Guard', '#8a4a4a');
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = 'rgba(50, 60, 68, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = 'rgba(50, 60, 68, 0.65)';
      ctx.fill();
    };
    arrow(240, 117, 300, 160);
    arrow(240, 237, 300, 190);
    arrow(500, 165, 560, 110);
    arrow(500, 175, 560, 215);
    arrow(500, 190, 560, 350);
    arrow(740, 100, 800, 145);
    arrow(740, 228, 800, 170);
    arrow(740, 355, 800, 360);
    arrow(400, 214, 400, 320);
    // Notes.
    text(ctx, 'PMU-Graph / architecture', 60, 40, {size: 26, weight: 800, font: FONT_SANS, color: '#2f3a42', tracking: 2});
    text(ctx, 'verify → repair → reuse', 620, 440, {size: 22, weight: 600, font: FONT_SERIF, color: '#8a4a4a'});
    ctx.strokeStyle = 'rgba(138, 74, 74, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(590, 448);
    ctx.lineTo(900, 448);
    ctx.stroke();
    // Small lifecycle scribble.
    const states = ['C', 'E', 'J', 'V', 'A'];
    states.forEach((state, index) => {
      const x = 120 + index * 80;
      ctx.strokeStyle = 'rgba(63, 122, 90, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, 448, 20, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, state, x, 454, {size: 18, weight: 700, font: FONT_SANS, color: '#3f7a5a', align: 'center'});
      if (index < states.length - 1) {
        ctx.strokeStyle = 'rgba(63, 122, 90, 0.55)';
        ctx.beginPath();
        ctx.moveTo(x + 22, 448);
        ctx.lineTo(x + 56, 448);
        ctx.stroke();
      }
    });
    grain(ctx, width, height, {seed: 47, count: 800, alpha: 0.03, size: 1});
  });

export const zoneSignTexture = (title: string, subtitle: string, color: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`sign/zone/${title}`, 256, 128, (ctx, width, height) => {
    ctx.fillStyle = '#20272c';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 12, height);
    text(ctx, title, 30, 54, {size: 30, weight: 800, font: FONT_SANS, color: '#eef2f0', tracking: 2});
    text(ctx, subtitle, 30, 88, {size: 15, weight: 600, font: FONT_SANS, color, tracking: 2});
    ctx.strokeStyle = withAlpha(color, 0.5);
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
  });
