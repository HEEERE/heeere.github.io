import {launchBrowser} from './browser.mjs';
import {mkdirSync} from 'node:fs';

mkdirSync('public/images/scenes', {recursive: true});

const sceneIds = ['konbini', 'desk', 'archive', 'command', 'security', 'workshop', 'postbox'];
const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
for (const id of sceneIds) {
  await page.goto(`${base}?poster=1#/scene/${id}`, {waitUntil: 'domcontentloaded'});
  await page.locator('.exhibit .scene-canvas.is-ready').waitFor();
  await page.waitForTimeout(1500);
  if (errors.length) throw new Error(errors.join('\n'));
  const stage = page.locator('.exhibit__stage');
  await stage.screenshot({path: `public/images/scenes/${id}.jpg`, type: 'jpeg', quality: 82});
  console.log('poster', id);
}

} finally {
  await browser.close();
}
