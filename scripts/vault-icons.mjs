/**
 * Generate the PWA / home-screen icons for the private vault.
 *
 *   node scripts/vault-icons.mjs
 *
 * Renders a small HTML badge in headless Chrome (the same browser used for the
 * screenshot scripts) and writes the PNGs consumed by manifest.webmanifest.
 */

import {chromium} from 'playwright-core';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || undefined;
const OUT = path.resolve('public/vault/icons');

const badge = (size, maskable) => {
  const pad = maskable ? 0.2 : 0.12;
  const inner = Math.round(size * (1 - pad * 2));
  const glyph = Math.round(size * (maskable ? 0.34 : 0.4));
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0d1310; }
  .icon {
    position: relative;
    width: ${size}px;
    height: ${size}px;
    display: grid;
    place-items: center;
    background:
      radial-gradient(120% 90% at 50% 18%, rgba(74, 104, 74, 0.26), transparent 62%),
      linear-gradient(180deg, #121a14 0%, #0a0e0b 100%);
  }
  .frame {
    position: absolute;
    inset: ${Math.round(size * pad)}px;
    border: 1px solid rgba(201, 167, 106, 0.46);
  }
  .frame::after {
    content: '';
    position: absolute;
    left: 18%;
    right: 18%;
    bottom: -1px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201, 167, 106, 0.85), transparent);
  }
  .glyph {
    position: relative;
    color: #d8b878;
    font-family: 'Songti SC', 'SimSun', 'Noto Serif CJK SC', 'MS Mincho', serif;
    font-size: ${glyph}px;
    line-height: 1;
    text-shadow: 0 0 26px rgba(216, 184, 120, 0.22);
    transform: translateY(-2%);
  }
  .label {
    position: absolute;
    bottom: ${Math.round(size * (pad + 0.075))}px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: ${Math.max(9, Math.round(size * 0.026))}px;
    letter-spacing: 0.34em;
    color: rgba(201, 167, 106, 0.6);
    text-indent: 0.34em;
  }
  .tick {
    position: absolute;
    width: ${Math.round(size * 0.03)}px;
    height: ${Math.round(size * 0.03)}px;
    border-color: rgba(201, 167, 106, 0.5);
    border-style: solid;
  }
  .tick.tl { top: ${Math.round(size * 0.05)}px; left: ${Math.round(size * 0.05)}px; border-width: 1px 0 0 1px; }
  .tick.tr { top: ${Math.round(size * 0.05)}px; right: ${Math.round(size * 0.05)}px; border-width: 1px 1px 0 0; }
  .tick.bl { bottom: ${Math.round(size * 0.05)}px; left: ${Math.round(size * 0.05)}px; border-width: 0 0 1px 1px; }
  .tick.br { bottom: ${Math.round(size * 0.05)}px; right: ${Math.round(size * 0.05)}px; border-width: 0 1px 1px 0; }
</style></head>
<body>
  <div class="icon" id="icon">
    <span class="frame"></span>
    <span class="glyph">箱</span>
    <span class="label">PRIVATE</span>
    <span class="tick tl"></span><span class="tick tr"></span>
    <span class="tick bl"></span><span class="tick br"></span>
  </div>
</body></html>`;
};

const main = async () => {
  await mkdir(OUT, {recursive: true});
  const browser = await chromium.launch({
    channel: CHROME || 'chrome',
    args: ['--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({viewport: {width: 512, height: 512}});
  const jobs = [
    {name: 'icon-192.png', size: 192, maskable: false},
    {name: 'icon-512.png', size: 512, maskable: false},
    {name: 'icon-maskable-512.png', size: 512, maskable: true},
    {name: 'apple-touch-icon.png', size: 180, maskable: false},
  ];
  for (const job of jobs) {
    await page.setViewportSize({width: job.size, height: job.size});
    await page.setContent(badge(job.size, job.maskable), {waitUntil: 'load'});
    await page.evaluate(() => document.fonts.ready);
    const element = await page.$('#icon');
    const buffer = await element.screenshot({type: 'png', omitBackground: false});
    await writeFile(path.join(OUT, job.name), buffer);
    console.log(`wrote public/vault/icons/${job.name} (${job.size}px)`);
  }
  await browser.close();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
