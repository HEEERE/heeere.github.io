import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';

mkdirSync('public/images/scenes', {recursive: true});

const sceneIds = ['konbini', 'desk', 'archive', 'command', 'security', 'workshop', 'postbox'];
const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--hide-scrollbars']});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1});
page.on('pageerror', (error) => console.log('[pageerror]', error.message));

for (const id of sceneIds) {
  await page.goto(`http://127.0.0.1:5173/?poster=1#/scene/${id}`, {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(11000);
  const stage = await page.$('.exhibit__stage');
  if (!stage) {
    console.log('no stage for', id);
    continue;
  }
  await stage.screenshot({path: `public/images/scenes/${id}.jpg`, type: 'jpeg', quality: 82});
  console.log('poster', id);
}

await browser.close();
