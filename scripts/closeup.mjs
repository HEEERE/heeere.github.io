import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const target = process.argv[3] ?? '.hero__stage';
const name = process.argv[4] ?? 'closeup';
mkdirSync('tmp/shots', {recursive: true});

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 2});
const logs = [];
page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`));
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`));

await page.goto(url, {waitUntil: 'domcontentloaded'});
await page.waitForTimeout(10000);

const element = await page.$(target);
if (!element) {
  console.log('element not found:', target);
} else {
  await element.screenshot({path: `tmp/shots/${name}.png`});
  console.log('shot', `tmp/shots/${name}.png`);
}

for (const line of logs.filter((item) => item.startsWith('[pageerror]'))) console.log(line);
await browser.close();
