import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
mkdirSync('docs/screenshots', {recursive: true});

const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--hide-scrollbars']});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1});
page.on('pageerror', (error) => console.log('[pageerror]', error.message));

const waitScenes = async (count = 1) => {
  try {
    await page.waitForFunction(
      (expected) => document.querySelectorAll('.scene-canvas.is-ready').length >= expected,
      count,
      {timeout: 45000},
    );
  } catch {
    console.log('scenes not ready');
  }
  await page.waitForTimeout(1200);
};

const jpeg = (path) => page.screenshot({path, type: 'jpeg', quality: 84});

await page.goto(base, {waitUntil: 'domcontentloaded'});
await waitScenes(1);
await jpeg('docs/screenshots/01-hero.jpg');
console.log('hero');

await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
await waitScenes(3);
await page.evaluate(() => window.scrollBy(0, 420));
await page.waitForTimeout(2500);
await jpeg('docs/screenshots/02-scenes.jpg');
console.log('scenes');

for (const [id, path] of [
  ['security', 'docs/screenshots/03-exhibit-security.jpg'],
  ['workshop', 'docs/screenshots/04-exhibit-workshop.jpg'],
]) {
  await page.goto(`${base}#/scene/${id}`, {waitUntil: 'domcontentloaded'});
  await waitScenes(1);
  await jpeg(path);
  console.log('exhibit', id);
}

await page.setViewportSize({width: 390, height: 844});
await page.goto(base, {waitUntil: 'domcontentloaded'});
await page.waitForTimeout(6000);
await jpeg('docs/screenshots/05-mobile.jpg');
console.log('mobile');

await page.setViewportSize({width: 1600, height: 1000});
await page.goto(`${base}#/simple`, {waitUntil: 'domcontentloaded'});
await page.waitForTimeout(3000);
await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
await page.waitForTimeout(2000);
await jpeg('docs/screenshots/06-static-mode.jpg');
console.log('static');

await browser.close();
