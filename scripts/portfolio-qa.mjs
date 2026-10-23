import {launchBrowser} from './browser.mjs';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
mkdirSync('tmp/portfolio-qa', {recursive: true});
const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
let passed = 0;
const check = (name, value) => {assert.ok(value, name); passed++; console.log(`PASS ${name}`);};
const shot = (name) => page.screenshot({path: `tmp/portfolio-qa/${name}.png`});
try {
  await page.goto(base);
  await page.locator('.hero .scene-canvas.is-ready').waitFor();
  await page.waitForTimeout(1800);
  const text = await page.locator('body').innerText();
  check('location and professional positioning', text.includes('天津') && text.includes('AI Agent 系统开发'));
  check('no internship or old location copy', !/实习|海口|HAIKOU|INTERNSHIP/i.test(text));
  check('hero contact link', await page.locator('.hero a[href="#contact"]').count() === 1);
  await shot('desktop-hero');
  await page.locator('.hero__directory button').first().click();
  await page.locator('.story-marker').first().waitFor();
  check('hero directory opens archive', await page.locator('#exhibit-title').innerText() === '记忆档案室');
  await page.keyboard.press('Escape');
  await page.locator('.exhibit').waitFor({state: 'detached'});
  for (const [id, reportId, expected, alternate] of [
    ['archive', 'pmu', 'Active', '不允许复用'],
    ['command', 'ekg', '演示文档 §2', '证据不足'],
    ['security', 'security', 'BLOCK', 'ALLOW'],
  ]) {
    await page.goto(`${base}#/scene/${id}`);
    await page.locator('.story-marker').first().waitFor();
    await page.waitForTimeout(600);
    check(`${id}: three physical object controls`, await page.locator('.story-marker').count() === 3);
    await page.locator('.story-marker').nth(1).click();
    check(`${id}: object selects demo step`, await page.locator('.project-demo__steps button').nth(1).getAttribute('aria-pressed') === 'true');
    await page.locator('.scene-story-caption button').click();
    check(`${id}: scene caption advances physical marker`, await page.locator('.story-marker').nth(2).getAttribute('aria-pressed') === 'true');
    check(`${id}: normal output in scene`, (await page.locator('.scene-story-caption p').innerText()).includes(expected));
    await page.locator('.project-demo__variants button').nth(1).click();
    check(`${id}: alternative branch in scene`, (await page.locator('.scene-story-caption p').innerText()).includes(alternate));
    check(`${id}: panel and scene agree`, await page.locator('.project-demo__output').innerText() === await page.locator('.scene-story-caption p').innerText());
    await page.locator('.project-demo').scrollIntoViewIfNeeded();
    await shot(`desktop-${id}`);
    await page.locator('.project-report summary').first().click();
    check(`${id}: report expands`, await page.locator('.project-report details').first().getAttribute('open') !== null);
    const response = await page.request.get(`${base}reports/${reportId}.md`);
    check(`${id}: downloadable report content`, response.ok() && (await response.text()).includes('## 验证方法'));
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.project-report a[download]').click()]);
    check(`${id}: report download`, download.suggestedFilename() === `${reportId}.md`);
    check(`${id}: project contact entry`, (await page.locator('.project-dossier > a').getAttribute('href')).startsWith('mailto:2401266324@qq.com?subject='));
    await page.locator('.exhibit__close').focus();
    await page.keyboard.press('Tab');
    check(`${id}: focus remains in dialog`, await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))));
    await page.keyboard.press('Escape');
    await page.locator('.exhibit').waitFor({state: 'detached'});
  }
  await page.goto(`${base}#/simple`);
  check('static mode has no live canvas', await page.locator('canvas').count() === 0);
  await page.locator('.hero__directory button').nth(2).click();
  await page.locator('.scene-story-caption').waitFor();
  await page.locator('.scene-story-caption button').click();
  check('static mode retains interactive explanations', (await page.locator('.scene-story-caption b').innerText()) === '双图复核');
  await shot('static-defense');
  await page.keyboard.press('Escape');
  await page.locator('.exhibit').waitFor({state: 'detached'});
  await page.getByRole('button', {name: '进入 3D 版本'}).click();
  await page.waitForFunction(() => document.documentElement.dataset.view === 'rich');
  check('static entry can return to 3D', await page.locator('.scene-viewport').count() > 0);
  await page.setViewportSize({width: 390, height: 844});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(base);
  await page.waitForTimeout(1800);
  check('mobile no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot('mobile-hero');
  await page.goto(`${base}#/scene/security`);
  await page.locator('.story-marker').first().waitFor();
  await page.locator('.story-marker').nth(2).click();
  check('mobile scene controls select final step', await page.locator('.project-demo__steps button').nth(2).getAttribute('aria-pressed') === 'true');
  await page.locator('.project-demo__variants button').nth(1).click();
  check('mobile branch selection', (await page.locator('.scene-story-caption p').innerText()).includes('ALLOW'));
  check('mobile dialog no horizontal overflow', await page.evaluate(() => document.querySelector('.exhibit').scrollWidth <= innerWidth));
  await shot('mobile-defense');
  check('no runtime exceptions', errors.length === 0);
  console.log(`${passed} acceptance checks passed`);
} catch (error) {
  await page.screenshot({path: 'tmp/portfolio-qa/failure.png'}).catch(() => {});
  console.error('Browser errors:', errors);
  console.error('Marker hit targets:', await page.locator('.story-marker').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return {text: node.textContent, zIndex: node.parentElement?.parentElement?.style.zIndex, hit: hit?.outerHTML.slice(0, 200)};
  })).catch(() => []));
  throw error;
} finally {
  await browser.close();
}
