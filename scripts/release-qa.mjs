import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4173/');
const out = 'tmp/release-qa';
await mkdir(out, {recursive: true});
const browser = await launchBrowser();
const checks = [];
const errors = [];
const badResponses = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log(`PASS ${name}`); };
const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
context.on('page', page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base.origin) && response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const url = path => new URL(path, base).href;
const shot = name => page.screenshot({path: `${out}/${name}.png`});
try {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(url('#/simple'));
  await page.locator('.hero__name').waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.view === 'static');
  check('static reading works without downloading the 3D engine', !requests.some(path => /SceneRenderer-|three-vendor-/.test(path)));
  check('static mode does not allocate WebGL canvases', await page.locator('canvas').count() === 0);
  await page.locator('.hero__directory button').first().click();
  await page.locator('.exhibit.is-open').waitFor();
  check('modal background is inert', await page.locator('main').evaluate(node => Boolean(node.closest('[inert]'))));
  await page.locator('.exhibit__close').focus();
  await page.keyboard.press('Tab');
  check('Tab cycles within the modal', await page.evaluate(() => Boolean(document.activeElement.closest('.exhibit'))));
  await page.keyboard.press('Shift+Tab');
  check('reverse Tab cycles within the modal', await page.evaluate(() => Boolean(document.activeElement.closest('.exhibit'))));
  await page.keyboard.press('Escape');
  await page.locator('.exhibit').waitFor({state: 'detached'});
  check('close returns to the original static URL', new URL(page.url()).hash === '#/simple');
  check('focus returns to the scene opener', await page.locator('.hero__directory button').first().evaluate(node => node === document.activeElement));
  await page.goForward();
  await page.locator('.exhibit').waitFor();
  check('browser Forward restores the scene', new URL(page.url()).hash === '#/scene/archive');
  await page.goBack();
  await page.locator('.exhibit').waitFor({state: 'detached'});
  check('browser Back restores the page', await page.locator('main').evaluate(node => !node.closest('[inert]')));
  await page.getByRole('button', {name: '进入 3D 版本'}).click();
  await page.waitForFunction(() => document.documentElement.dataset.view === 'rich');
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await page.locator('.hero .scene-canvas.is-ready').waitFor();
  check('3D mode can be restored from a direct static entry', await page.locator('.hero canvas').count() === 1);
  await page.goto(base.href);
  await page.locator('.hero .scene-canvas.is-ready').waitFor();
  check('offscreen cards allocate no canvases on initial load', await page.locator('canvas').count() === 1);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.locator('.hero [data-motion="full"]').waitFor();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('.hero [data-motion="reduced"]').waitFor();
  check('motion preference changes apply without a reload', true);
  await shot('desktop-home');

  await page.goto(url('#/scene/archive'));
  await page.locator('.story-marker').first().waitFor();
  await page.locator('.project-report').scrollIntoViewIfNeeded();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('#exhibit-title')?.textContent === '应急指挥室');
  check('next scene starts at the top of its content', await page.locator('.exhibit__body').evaluate(node => node.scrollTop === 0));
  await page.keyboard.press('Escape');
  await page.locator('.exhibit').waitFor({state: 'detached'});
  check('closing a shared deep link stays on the website', page.url() === base.href);

  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({width, height: 844});
    await page.goto(url('#/simple'));
    await page.locator('.hero__name').waitFor();
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    check(`${width}px home has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await shot(`home-${width}`);
    await page.locator('.hero__directory button').nth(2).click();
    await page.locator('.exhibit.is-open').waitFor();
    await page.locator('.project-demo').waitFor();
    await page.locator('.project-demo__variants button').nth(1).click();
    await page.locator('.project-demo__steps button').nth(2).click();
    check(`${width}px static project controls work`, (await page.locator('.scene-story-caption p').innerText()).includes('ALLOW'));
    const layout = await page.locator('.exhibit').evaluate(node => ({
      width: innerWidth,
      scrollWidth: node.scrollWidth,
      overflow: [...node.querySelectorAll('*')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => ({
        class: element.className, right: element.getBoundingClientRect().right, transform: getComputedStyle(element).transform,
      })),
    }));
    if (layout.scrollWidth > layout.width) console.error('Dialog overflow:', JSON.stringify(layout));
    check(`${width}px dialog fits the viewport`, layout.scrollWidth <= layout.width);
    await shot(`project-${width}`);
    await page.keyboard.press('Escape');
    await page.locator('.exhibit').waitFor({state: 'detached'});
  }
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(url('#/simple'));
  await page.getByRole('button', {name: '打开菜单'}).click();
  await page.keyboard.press('Escape');
  check('mobile Escape closes menu and restores focus', await page.locator('.nav__menu').evaluate(node => node.getAttribute('aria-expanded') === 'false' && node === document.activeElement));
  await page.getByRole('button', {name: '打开菜单'}).click();
  await page.locator('#nav-drawer a[href="#contact"]').click();
  check('mobile navigation closes after selecting a section', await page.locator('.nav__menu').getAttribute('aria-expanded') === 'false');
  check('mobile contact navigation reaches its target', await page.locator('#contact').evaluate(node => Math.abs(node.getBoundingClientRect().top) < 150));
  await page.getByRole('button', {name: '打开菜单'}).click();
  await page.setViewportSize({width: 1200, height: 900});
  await page.waitForFunction(() => document.querySelector('.nav__menu').getAttribute('aria-expanded') === 'false');
  await page.setViewportSize({width: 390, height: 844});
  check('desktop resize does not leave a stale mobile menu', !(await page.locator('#nav-drawer').isVisible()));

  for (const id of ['pmu', 'ekg', 'security']) {
    const response = await page.request.get(url(`reports/${id}.md`));
    check(`${id} production report is available`, response.ok() && (await response.text()).includes('## 验证方法'));
  }
  for (const path of ['favicon.svg', 'robots.txt', 'sitemap.xml', 'images/og-cover.png', 'vault/manifest.webmanifest']) {
    const response = await page.request.get(url(path));
    check(`${path} is included in the release`, response.ok());
  }
  await page.goto(url('404.html'));
  check('404 offers working homepage and project links', await page.locator('a[href="/"]').count() === 1 && await page.locator('a[href="/#works"]').count() === 1);
  await shot('not-found');

  // Validate the actual Service Worker redirect using a temporary browser profile.
  await page.goto(url('vault/'));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const share = await page.evaluate(async () => {
    const data = new FormData();
    data.set('title', 'Release check');
    data.set('text', 'Temporary QA content');
    const response = await fetch('/vault/__share', {method: 'POST', body: data});
    const cache = await caches.open('hakoniwa-vault-share');
    const saved = await cache.match('/vault/__share');
    const payload = saved ? await saved.json() : null;
    await cache.delete('/vault/__share');
    return {ok: response.ok, url: response.url, payload};
  });
  check('PWA share POST redirects to the vault', share.ok && share.url.endsWith('/vault/?shared=1'));
  check('PWA share payload survives the redirect', share.payload?.title === 'Release check');
  check('private vault is excluded from indexing', await page.locator('meta[name="robots"]').getAttribute('content').then(value => value.includes('noindex')));

  const noGl = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  await noGl.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  const fallback = await noGl.newPage();
  await fallback.goto(base.href);
  await fallback.locator('.webgl-note').waitFor();
  await fallback.locator('.hero__directory button').first().click();
  await fallback.locator('.project-demo__steps button').nth(2).click();
  check('no-WebGL devices retain project interactions', (await fallback.locator('.scene-story-caption p').innerText()).includes('Active'));
  check('no-WebGL fallback has no live canvas', await fallback.locator('canvas').count() === 0);
  await fallback.screenshot({path: `${out}/no-webgl.png`});
  await noGl.close();

  const interrupted = await browser.newContext({reducedMotion: 'reduce'});
  await interrupted.route('**/assets/SceneRenderer-*.js', route => route.abort('failed'));
  const degraded = await interrupted.newPage();
  await degraded.goto(base.href);
  await degraded.locator('.hero .scene-art').waitFor();
  await degraded.locator('.hero__directory button').nth(2).click();
  await degraded.locator('.project-demo__steps button').nth(2).click();
  check('failed 3D downloads preserve the project content and controls', (await degraded.locator('.scene-story-caption p').innerText()).includes('BLOCK'));
  await interrupted.close();

  const noJs = await browser.newContext({javaScriptEnabled: false});
  const plain = await noJs.newPage();
  await plain.goto(base.href);
  check('JavaScript-disabled visitors can read project reports and contact details', await plain.locator('.noscript-fallback a').count() === 5);
  await noJs.close();
  check('release paths have no failed HTTP responses', badResponses.length === 0);
  check('release paths have no uncaught browser errors', errors.length === 0);
} catch (error) {
  await page.screenshot({path: `${out}/failure.png`}).catch(() => {});
  throw error;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify({checks, errors, badResponses}, null, 2));
  await browser.close();
}
console.log(`${checks.length} release checks passed`);
