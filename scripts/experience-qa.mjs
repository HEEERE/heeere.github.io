import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const out = 'tmp/experience-qa';
await mkdir(out, {recursive: true});
const browser = await launchBrowser();
const checks = [];
const errors = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log(`PASS ${name}`); };
const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
await context.addInitScript(() => {
  window.__soundQA = {contexts: [], meters: [], capture: null, chunks: [], visibility: null};
  const Native = window.AudioContext;
  window.AudioContext = class extends Native {
    constructor(...args) { super(...args); window.__soundQA.contexts.push(this); }
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function(destination, ...args) {
    if (destination instanceof AudioDestinationNode) {
      const meter = this.context.createAnalyser(); meter.fftSize = 2048;
      connect.call(this, meter); window.__soundQA.meters.push(meter);
      const stream = this.context.createMediaStreamDestination(); connect.call(this, stream);
      window.__soundQA.capture = new MediaRecorder(stream.stream);
      window.__soundQA.capture.ondataavailable = event => window.__soundQA.chunks.push(event.data);
    }
    return connect.call(this, destination, ...args);
  };
  Object.defineProperty(document, 'hidden', {configurable: true, get: () => window.__soundQA.visibility ?? document.visibilityState === 'hidden'});
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(30000);
const shot = name => page.screenshot({path: `${out}/${name}.png`});
const energy = () => page.evaluate(() => {
  const meter = window.__soundQA.meters[0]; if (!meter) return 0;
  const samples = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(samples);
  return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
});
try {
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.locator('.opening--full').waitFor();
  check('first arrival uses the full window opening', await page.locator('.opening').evaluate(node => getComputedStyle(node).animationDuration === '1.8s' && getComputedStyle(node).pointerEvents === 'none'));
  await shot('opening');
  await page.locator('.opening').waitFor({state: 'detached'});
  await page.locator('.hero .scene-viewport[data-load="ready"]').waitFor();
  check('sound is opt-in and allocates no audio context before a gesture', await page.evaluate(() => window.__soundQA.contexts.length === 0));
  await page.reload({waitUntil: 'domcontentloaded'});
  check('returning visitors get a brief fade', await page.evaluate(() => localStorage.getItem('hakoniwa.arrived') === '1' && !document.querySelector('.opening--full')));
  await page.locator('.nav .sound__trigger').click();
  await page.getByRole('button', {name: '开启声音', exact: true}).click();
  await page.locator('.nav [data-audio-status="playing"]').waitFor();
  await page.waitForTimeout(1000);
  check('enabled ambience produces a real audio signal', await energy() > .00001);
  check('music starts disabled independently of ambience', !(await page.getByRole('checkbox', {name: '背景音乐', exact: false}).isChecked()));
  await page.getByRole('checkbox', {name: '环境音', exact: false}).uncheck();
  await page.waitForTimeout(2200);
  check('both layers disabled are silent', await energy() < .00001);
  await page.getByRole('checkbox', {name: '背景音乐', exact: false}).check();
  await page.waitForTimeout(4700);
  check('music can play without ambience', await energy() > .00001);
  await page.getByRole('checkbox', {name: '环境音', exact: false}).check();
  await page.evaluate(() => window.__soundQA.capture.start());
  await page.waitForTimeout(8500);
  const recording = await page.evaluate(async () => {
    const recorder = window.__soundQA.capture;
    await new Promise(resolve => {recorder.onstop = resolve; recorder.stop();});
    const blob = new Blob(window.__soundQA.chunks, {type: recorder.mimeType});
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  await writeFile(`${out}/sound-preview.webm`, Buffer.from(recording));
  await page.evaluate(() => { window.__soundQA.visibility = true; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1300);
  check('background page fades to silence', await energy() < .00001 && await page.locator('.nav .sound').getAttribute('data-audio-status') === 'paused');
  await page.evaluate(() => { window.__soundQA.visibility = false; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1100);
  check('returning page restores the chosen sound', await energy() > .00001);
  await shot('sound-panel');
  await page.getByRole('slider', {name: '音量'}).fill('0');
  await page.waitForTimeout(1600);
  check('zero volume is silent', await energy() < .00001);
  await page.getByRole('slider', {name: '音量'}).fill('30');
  await page.getByRole('button', {name: '关闭声音', exact: true}).click();
  await page.keyboard.press('Escape');
  await page.reload();
  check('sound choices persist without autoplay', await page.evaluate(() => JSON.parse(localStorage.getItem('hakoniwa.sound.v1')).music && !JSON.parse(localStorage.getItem('hakoniwa.sound.v1')).enabled && window.__soundQA.contexts.length === 0));
  await page.locator('.scene-card[data-scene="archive"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#exhibit-title').waitFor();
  await page.locator('.exhibit .scene-viewport[data-load="ready"]').waitFor();
  await page.locator('.project-demo__steps button').nth(2).click();
  await page.waitForTimeout(1500);
  await shot('archive-active');
  await page.locator('.exhibit .sound__trigger').click();
  await page.locator('.exhibit .sound__panel input[type="range"]').focus();
  await page.keyboard.press('ArrowRight');
  check('sound slider arrows do not navigate away from the scene', await page.locator('#exhibit-title').innerText() === '记忆档案室');
  await page.keyboard.press('Escape');
  check('Escape closes sound settings before closing the scene', await page.locator('.exhibit').count() === 1 && await page.locator('.exhibit .sound__panel').count() === 0);
  await page.keyboard.press('Escape');
  await page.locator('.exhibit').waitFor({state: 'detached'});
  check('closing returns focus and records a visit', await page.locator('.scene-card[data-scene="archive"]').evaluate(node => node === document.activeElement && Boolean(node.querySelector('.scene-visited'))));
  await page.reload();
  check('visited scenes survive reload within the session', await page.locator('.scene-card[data-scene="archive"] .scene-visited').count() === 1);
  await page.locator('#works').evaluate(node => node.scrollIntoView({behavior: 'instant'}));
  await page.waitForTimeout(300);
  check('navigation marks the current section', await page.locator('.nav__links a[href="#works"]').getAttribute('aria-current') === 'location');
  await page.locator('.work__implementation summary').first().click();
  check('implementation details remain native and expandable', await page.locator('.work__implementation').first().getAttribute('open') !== null);
  const reportLink = page.locator('.work .report-download[href="/reports/pmu.md"]');
  // Observe the transient text before clicking. Software-rendered CI can return
  // the download event after the acknowledgement has already reset.
  await reportLink.evaluate(node => {
    const original = node.textContent;
    window.__reportFeedback = {started: false, reset: false};
    const observer = new MutationObserver(() => {
      if (node.textContent.includes('已开始下载')) window.__reportFeedback.started = true;
      if (window.__reportFeedback.started && node.textContent === original) {
        window.__reportFeedback.reset = true;
        observer.disconnect();
      }
    });
    observer.observe(node, {subtree: true, childList: true, characterData: true});
  });
  const [download] = await Promise.all([page.waitForEvent('download'), reportLink.click()]);
  await page.waitForFunction(() => window.__reportFeedback.started && window.__reportFeedback.reset);
  check('report download has an honest inline acknowledgement', download.suggestedFilename() === 'pmu.md' && await page.evaluate(() => window.__reportFeedback.started && window.__reportFeedback.reset));
  for (const id of ['command', 'security', 'workshop', 'postbox', 'desk']) {
    await page.goto(`${base}#/scene/${id}`);
    await page.locator('.exhibit .scene-viewport[data-load="ready"]').waitFor();
    if (id === 'command' || id === 'security') {
      await page.locator('.project-demo__steps button').nth(2).click();
      await page.waitForTimeout(1300); await shot(`${id}-final`);
      await page.locator('.project-demo__variants button').nth(1).click();
      await page.waitForTimeout(1300); await shot(`${id}-alternative`);
    } else if (id === 'workshop') {
      await page.locator('.workshop-group__select').nth(2).focus();
      await page.locator('.exhibit .workshop-label').waitFor();
      check('keyboard skill selection highlights its physical tools', (await page.locator('.exhibit .workshop-label').innerText()).includes('Graph / Infra'));
      await shot('workshop-tools');
    } else if (id === 'postbox') {
      await page.locator('.scene-mail').focus();
      check('mailbox opens an email action without claiming submission', (await page.locator('.scene-mail').getAttribute('href')).startsWith('mailto:') && !(await page.locator('.exhibit').innerText()).includes('信已投递'));
      check('mailbox contact link remains above the canvas', await page.locator('.scene-mail').evaluate(node => {const r = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));}));
      await page.waitForTimeout(700); await shot('mailbox');
    } else { await page.waitForTimeout(1100); await shot('desk'); }
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(base);
  check('reduced motion omits the opening', await page.locator('.opening').count() === 0);
  await page.locator('#contact').evaluate(node => node.scrollIntoView({behavior: 'instant'}));
  await page.locator('.contact__miniature .scene-viewport[data-load="ready"]').waitFor();
  await shot('contact');
  await page.getByRole('button', {name: '回到顶部 ↑'}).click();
  check('return to top does not replay the opening or discard sound settings', await page.locator('.opening').count() === 0 && await page.evaluate(() => window.scrollY < 5 && JSON.parse(localStorage.getItem('hakoniwa.sound.v1')).music));
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({width, height: 844});
    await page.goto(`${base}#/simple`);
    await page.locator('.nav .sound__trigger').click();
    check(`${width}px sound panel stays on screen`, await page.locator('.sound__panel').evaluate(node => {const r = node.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth;}));
    check(`${width}px page has no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await shot(`mobile-sound-${width}`);
    await page.keyboard.press('Escape');
  }
  const mobile = await browser.newContext({viewport: {width: 390, height: 844}});
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(base, {waitUntil: 'domcontentloaded'});
  check('first mobile visit uses the simplified entrance', await mobilePage.locator('.opening--full').count() === 0);
  await mobile.close();
  const skip = await browser.newContext({viewport: {width: 1440, height: 1000}});
  const skipPage = await skip.newPage();
  await skipPage.goto(base, {waitUntil: 'domcontentloaded'});
  await skipPage.locator('.opening--full').waitFor();
  await skipPage.mouse.wheel(0, 80);
  await skipPage.locator('.opening').waitFor({state: 'detached', timeout: 1000});
  check('scroll immediately dismisses the opening', true);
  await skip.close();
  check('experience has no uncaught runtime errors', errors.length === 0);
} catch (error) {
  await shot('failure').catch(() => {}); throw error;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify({checks, errors}, null, 2));
  await browser.close();
}
console.log(`${checks.length} experience checks passed`);
