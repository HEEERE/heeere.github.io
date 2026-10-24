import {launchBrowser} from './browser.mjs';

const baseUrl = process.argv[2] ?? 'http://localhost:4173';
const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
await page.waitForTimeout(9000);

const results = [];
const check = (label, value) => {
  results.push([label, value]);
  console.log(`${value ? 'PASS' : 'FAIL'}  ${label}`);
};

// Hero canvas mounted
check('hero canvas mounted', (await page.locator('.hero .scene-canvas canvas').count()) === 1);

// Scene cards present
await page.evaluate(() => document.getElementById('scenes')?.scrollIntoView({behavior: 'instant', block: 'start'}));
await page.waitForTimeout(5000);
const cardCount = await page.locator('.scene-card').count();
check('six scene cards', cardCount === 6);

// Click the desk card (scene 02)
await page.getByRole('button', {name: '进入场景 02：学习工作台（ABOUT / PROFILE）', exact: true}).click();
await page.waitForTimeout(2500);
check('overlay opens', await page.locator('.exhibit[role="dialog"]').isVisible());
check('overlay title is 学习工作台', (await page.locator('#exhibit-title').innerText()) === '学习工作台');
check('hash is scene route', (await page.evaluate(() => window.location.hash)).startsWith('#/scene/desk'));
check('exhibit canvas mounted', (await page.locator('.exhibit .scene-canvas canvas').count()) === 1);

// Navigate next scene with keyboard
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1500);
check('arrow key changes scene', (await page.locator('#exhibit-title').innerText()) === '记忆档案室');

// Close with escape
await page.keyboard.press('Escape');
await page.locator('.exhibit').waitFor({state: 'detached'});
check('escape closes overlay', (await page.locator('.exhibit').count()) === 0);
check('hash cleared', (await page.evaluate(() => window.location.hash)) === '');

// Static mode toggle in footer
await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({behavior: 'instant', block: 'start'}));
await page.waitForTimeout(800);
await page.getByRole('button', {name: '静态版'}).click();
await page.waitForTimeout(800);
check('static mode hides live canvases', (await page.locator('.scene-canvas canvas').count()) === 0);
check('static mode shows posters', (await page.locator('.scene-art__image').count()) > 0);
await page.getByRole('button', {name: '进入 3D 版本'}).click();
await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
await page.locator('.hero .scene-canvas.is-ready').waitFor();
await page.waitForTimeout(800);
check('3D mode restores canvases', (await page.locator('.hero .scene-canvas canvas').count()) === 1);

const fatal = errors.filter((message) => !/ResizeObserver/.test(message));
check('no page errors', fatal.length === 0);
if (fatal.length) console.log(fatal.slice(0, 8));

await browser.close();
const failed = results.filter(([, value]) => !value);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
