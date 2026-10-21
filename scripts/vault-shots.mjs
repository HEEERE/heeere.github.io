/**
 * Visual + smoke QA for the private garden.
 *
 *   node scripts/vault-shots.mjs [baseUrl]
 *
 * Uses a throwaway passphrase and a throwaway vault. Screenshots land in
 * tmp/shots/ (ignored by git); nothing here is ever committed as content.
 */

import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = path.resolve('tmp/shots');
const PASSPHRASE = 'hakoniwa-garden-2026';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const step = (name) => console.log(`[vault-qa] ${name}`);

const fillVault = async (page) => {
  const entries = [
    {
      kind: 'note',
      title: '下一步要验证的三件事',
      body: '1. PMU 的 Candidate → Verified 转换在长任务上是否稳定\n2. 三路检索的融合权重\n3. Docker 隔离下的冷启动时间\n\n先把 benchmark 脚本写出来。',
      tags: 'agent, todo',
    },
    {
      kind: 'idea',
      title: '把场景当成目录',
      body: '如果每个项目都有一个可以旋转的房间，那么导航就不需要 sidebar。\n\n访客先看见光，再看见内容。',
      tags: 'design, portfolio',
    },
    {
      kind: 'prompt',
      title: '给 Agent 的审查提示词',
      body: '你是一个谨慎的过程记忆审阅者。\n\n只根据给定轨迹判断：\n- 是否复用了不可靠的旧记忆\n- 工具调用是否越权\n- 结论是否可追溯\n\n不确定时输出 `reject`，并给出原因。',
      tags: 'prompt, security',
    },
    {
      kind: 'clip',
      title: '参考：雨夜便利店的光',
      body: '冷色的街道，暖色的窗。收藏这一帧。',
      url: 'https://example.com/rainy-konbini',
      tags: 'visual, reference',
    },
    {
      kind: 'workflow',
      title: '每周整理一次记忆',
      body: '- 周一：收集\n- 周三：合并重复项\n- 周五：删除验证不通过的记忆\n- 周日：导出一次加密备份',
      tags: 'workflow',
    },
  ];

  const kindLabel = {note: '便签', idea: '灵感', prompt: 'Prompt', clip: '摘录', workflow: '工作流'};

  for (const item of entries) {
    await page.locator('.vault-sidebar__new').click();
    await page.waitForSelector('.vault-composer');
    await page.locator('.vault-kindbtn', {hasText: kindLabel[item.kind]}).first().click();
    await page.locator('.vault-composer__title').fill(item.title);
    if (item.url) await page.locator('.vault-composer__url').fill(item.url);
    const tagsInput = page.locator('.vault-composer__tags input');
    await tagsInput.fill(item.tags);
    await tagsInput.press('Enter');
    await page.locator('.vault-editor').fill(item.body);
    await page.getByRole('button', {name: '保存', exact: true}).click();
    await page.waitForSelector('.vault-composer', {state: 'detached'});
    await sleep(120);
  }
};

const main = async () => {
  await mkdir(OUT, {recursive: true});
  step(`launch chrome (${BASE})`);
  const browser = await chromium.launch({channel: 'chrome', args: ['--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  step('hidden entry from public site');
  await page.goto(`${BASE}/`, {waitUntil: 'domcontentloaded'});
  await page.waitForSelector('body');
  await page.keyboard.type('garden', {delay: 90});
  await page.waitForURL(/\/vault\//, {timeout: 15000});

  step('open lock screen');
  await page.waitForSelector('.vault-lock');
  const pwa = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    const sw = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/vault/') : null;
    return {manifest: link?.getAttribute('href') ?? null, swScope: sw?.scope ?? null};
  });
  step(`pwa ${JSON.stringify(pwa)}`);
  await page.screenshot({path: path.join(OUT, 'vault-lock-create.png')});

  step('create vault');
  await page.locator('.vault-lock__form input[type=password]').first().fill(PASSPHRASE);
  await page.locator('.vault-lock__form input[type=password]').nth(1).fill(PASSPHRASE);
  await page.locator('.vault-check input').check();
  await page.getByRole('button', {name: '创建庭院'}).click();
  await page.waitForSelector('.vault-shell', {timeout: 20000});
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(OUT, 'vault-empty.png')});

  step('seed entries');
  await fillVault(page);
  await page.waitForTimeout(300);
  await page.screenshot({path: path.join(OUT, 'vault-list.png')});

  step('detail + composer');
  await page.locator('.vault-card__hit').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(OUT, 'vault-detail.png')});

  await page.getByRole('button', {name: '编辑'}).first().click();
  await page.waitForSelector('.vault-composer');
  await page.waitForTimeout(200);
  await page.screenshot({path: path.join(OUT, 'vault-composer.png')});
  await page.getByRole('button', {name: '取消'}).click();

  step('settings');
  await page.getByRole('button', {name: '设置与同步'}).click();
  await page.waitForSelector('.vault-settings');
  await page.waitForTimeout(300);
  await page.screenshot({path: path.join(OUT, 'vault-settings.png')});
  await page.locator('.vault-settings__scroll').evaluate((element) => {
    element.scrollTop = element.scrollHeight * 0.34;
  });
  await page.waitForTimeout(250);
  await page.screenshot({path: path.join(OUT, 'vault-settings-sync.png')});
  await page.getByRole('button', {name: '返回庭院'}).click();

  step('mobile');
  const mobile = await context.newPage();
  mobile.setDefaultTimeout(15000);
  await mobile.setViewportSize({width: 390, height: 844});
  await mobile.goto(`${BASE}/vault/`, {waitUntil: 'domcontentloaded'});
  await mobile.waitForSelector('.vault-lock');
  await mobile.waitForTimeout(250);
  await mobile.screenshot({path: path.join(OUT, 'vault-mobile-lock.png')});
  await mobile.locator('.vault-lock__form input[type=password]').first().fill(PASSPHRASE);
  await mobile.getByRole('button', {name: '解锁'}).click();
  await mobile.waitForSelector('.vault-shell', {timeout: 20000});
  await mobile.waitForTimeout(400);
  await mobile.screenshot({path: path.join(OUT, 'vault-mobile-list.png')});
  await mobile.locator('.vault-card__hit').first().click();
  await mobile.waitForTimeout(400);
  await mobile.screenshot({path: path.join(OUT, 'vault-mobile-detail.png')});
  await mobile.close();

  step('wrong password');
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForSelector('.vault-lock');
  await page.locator('.vault-lock__form input[type=password]').first().fill('wrong-passphrase-000');
  await page.getByRole('button', {name: '解锁'}).click();
  await page.waitForSelector('.vault-lock__error', {timeout: 20000});
  const wrongError = await page.locator('.vault-lock__error').innerText();
  await page.locator('.vault-lock__form input[type=password]').first().fill(PASSPHRASE);
  await page.getByRole('button', {name: '解锁'}).click();
  await page.waitForSelector('.vault-shell', {timeout: 20000});
  const cards = await page.locator('.vault-card').count();

  console.log(JSON.stringify({wrongError, cards, errors}, null, 2));
  await context.close().catch(() => undefined);
  await browser.close().catch(() => undefined);
  step('done');
  process.exit(0);
};

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
