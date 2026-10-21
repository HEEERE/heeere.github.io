import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const mode = process.argv[3] ?? 'hero';
mkdirSync('tmp/shots', {recursive: true});

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1});

const logs = [];
page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`));
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}\n${error.stack ?? ''}`));

const waitReady = async (count = 1, timeout = 45000) => {
  try {
    await page.waitForFunction(
      (expected) =>
        document.querySelectorAll('.scene-canvas canvas').length > 0 &&
        document.querySelectorAll('.scene-canvas.is-ready').length >= expected,
      count,
      {timeout},
    );
  } catch {
    console.log('warning: scenes not ready in time');
  }
  await page.waitForTimeout(1200);
};

await page.goto(url, {waitUntil: 'domcontentloaded'});
await waitReady(1);

const shots = [];
const shoot = async (name) => {
  const path = `tmp/shots/${name}.png`;
  await page.screenshot({path});
  shots.push(path);
  console.log('shot', path);
};

if (mode === 'hero') {
  await shoot('hero');
  await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await waitReady(3);
  await page.evaluate(() => window.scrollBy(0, 500));
  await waitReady(3);
  await shoot('scenes-grid');
  await page.evaluate(() => document.getElementById('works')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await page.waitForTimeout(900);
  await shoot('works');
  await page.evaluate(() => document.getElementById('about')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await page.waitForTimeout(900);
  await shoot('about');
  await page.evaluate(() => document.getElementById('stack')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await page.waitForTimeout(900);
  await shoot('stack');
  await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await page.waitForTimeout(900);
  await shoot('contact');
} else if (mode === 'exhibit') {
  const scene = process.argv[4] ?? 'archive';
  await page.goto(`${url}#/scene/${scene}`, {waitUntil: 'domcontentloaded'});
  await waitReady(1);
  await shoot(`exhibit-${scene}`);
} else if (mode === 'mobile') {
  await page.setViewportSize({width: 390, height: 844});
  await page.waitForTimeout(2000);
  await shoot('mobile-hero');
  await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await waitReady(2);
  await shoot('mobile-scenes');
} else if (mode === 'simple') {
  await page.goto('http://127.0.0.1:5173/#/simple', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(3000);
  await shoot('simple-hero');
  await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
  await page.waitForTimeout(1200);
  await shoot('simple-scenes');
}

const errors = logs.filter((line) => line.startsWith('[pageerror]') || line.startsWith('[error]'));
if (errors.length) {
  console.log('--- PAGE ERRORS ---');
  for (const line of errors.slice(0, 12)) console.log(line);
}
const warnings = logs.filter((line) => line.startsWith('[warning]') && !line.includes('React DevTools'));
if (warnings.length) {
  console.log('--- WARNINGS (first 8) ---');
  for (const line of warnings.slice(0, 8)) console.log(line);
}

await browser.close();
console.log('done', shots.length, 'shots');
