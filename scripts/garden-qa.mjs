import {chromium} from 'playwright-core';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const base = 'https://appassets.androidplatform.net';
const pass = 'Garden-QA-2026-Only';
await mkdir('tmp/garden-qa', {recursive: true});
const browser = await chromium.launch({channel: 'chrome'});
const context = await browser.newContext({viewport:{width:393,height:852}, deviceScaleFactor:2});
const serveBundle = async (ctx) => ctx.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== base) return route.abort();
  const file = path.join('android/build/assets/www', url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname);
  try {
    const contentType = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    await route.fulfill({body:await readFile(file),contentType,headers:{'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self' blob: https://api.github.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"}});
  } catch { await route.fulfill({status:404,body:''}); }
});
await serveBundle(context);
// Exercise exactly the same JS entry points called by the native Activity.
await context.addInitScript(() => {
  window.testShares = [];
  window.testExports = [];
  window.GardenNative = {
    takeShare: () => window.testShares.shift() || '',
    saveFile: (name,mime,data) => window.testExports.push({name,mime,data}),
    minimize: () => { window.testMinimized = true; },
    copyText: text => { window.testClipboard = text; },
  };
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors=[];
page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
page.on('dialog', dialog => dialog.accept());
try {
  await page.goto(`${base}/vault/`);
  await page.getByPlaceholder('至少 8 个字符').fill(pass);
  await page.getByPlaceholder('确认密码').fill(pass);
  await page.locator('.vault-check input').check();
  await page.getByRole('button',{name:'创建庭院',exact:true}).click();
  await page.locator('.garden-home').waitFor();
  assert.equal(await page.locator('.garden-templates button').count(),4);
  await page.screenshot({path:'tmp/garden-qa/home.png'});
  console.log('PASS create vault / mobile research dashboard');
  await page.getByRole('button',{name:/读一篇论文/}).click();
  await page.locator('.vault-composer__title').fill('Agent 记忆研究');
  assert.match(await page.locator('.vault-editor').inputValue(),/实验与证据/);
  await page.locator('.vault-editor').fill('## 研究问题\n如何验证长期记忆？\n\n## 证据\n需要对照实验。');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'添加附件',exact:true}).click();
  await (await chooser).setFiles({name:'experiment.txt',mimeType:'text/plain',buffer:Buffer.from('garden attachment verification')});
  await page.locator('.vault-attach__name').waitFor();
  await page.getByRole('button',{name:'保存',exact:true}).click();
  await page.locator('.vault-composer').waitFor({state:'detached'});
  await page.getByRole('button',{name:'复制正文',exact:true}).click();
  assert.match(await page.evaluate(() => window.testClipboard), /如何验证长期记忆/);
  await page.getByRole('link',{name:'下载',exact:true}).click();
  await page.waitForFunction(() => window.testExports.length === 1);
  assert.equal(Buffer.from(await page.evaluate(() => window.testExports[0].data),'base64').toString(),'garden attachment verification');
  await page.evaluate(() => { window.testExports = []; });
  console.log('PASS attachment encryption / export / native clipboard bridge');
  await page.evaluate(() => window.dispatchEvent(new Event('garden-back')));
  await page.getByRole('button',{name:/做今日复盘/}).click();
  await page.locator('.vault-editor').fill('今天完成了记忆研究的实验设计。');
  await page.getByRole('button',{name:'保存',exact:true}).click();
  await page.locator('.vault-composer').waitFor({state:'detached'});
  await page.evaluate(() => window.dispatchEvent(new Event('garden-back')));
  await page.locator('.vault-toast').first().waitFor({state:'detached'});
  await page.screenshot({path:'tmp/garden-qa/home-with-notes.png'});
  console.log('PASS paper / daily review save');
  await page.evaluate(() => window.dispatchEvent(new Event('garden-lock')));
  await page.locator('.vault-lock').waitFor();
  await page.getByPlaceholder('输入密码').fill('wrong-password-000');
  await page.getByRole('button',{name:'解锁',exact:true}).click();
  await page.locator('.vault-lock__error').waitFor();
  await page.getByPlaceholder('输入密码').fill(pass);
  await page.getByRole('button',{name:'解锁',exact:true}).click();
  await page.locator('.garden-home').waitFor();
  await page.getByPlaceholder('搜索标题、正文、标签…').fill('Agent');
  await page.getByText('Agent 记忆研究', {exact:true}).first().waitFor();
  assert.match(await page.locator('.vault-list').innerText(), /Agent 记忆研究/);
  console.log('PASS background lock / incorrect password / unlock / search');
  await page.evaluate(() => {
    window.testShares.push(JSON.stringify({title:'分享的论文',text:'参考 https://example.org/paper 研究材料'}));
    window.dispatchEvent(new Event('garden-share'));
  });
  await page.locator('.vault-composer').waitFor();
  assert.equal(await page.locator('.vault-composer__url').inputValue(),'https://example.org/paper');
  await page.getByRole('button',{name:'保存',exact:true}).click();
  await page.locator('.vault-composer').waitFor({state:'detached'});
  await page.locator('.vault-mobilebar').getByRole('button',{name:'设置',exact:true}).click();
  await page.getByRole('button',{name:'导出加密备份',exact:true}).click();
  await page.waitForFunction(() => window.testExports.length === 1);
  const backup = await page.evaluate(() => window.testExports[0]);
  const backupText = Buffer.from(backup.data,'base64').toString('utf8');
  assert.ok(!backupText.includes('Agent 记忆研究'));
  const parsed = JSON.parse(backupText);
  assert.equal(parsed.entries.length,3);
  assert.equal(parsed.files.length,1);
  await writeFile('tmp/garden-qa/backup.json',backupText);
  console.log('PASS native share draft / encrypted backup bridge');
  await page.reload();
  await page.getByPlaceholder('输入密码').fill(pass);
  await page.getByRole('button',{name:'解锁',exact:true}).click();
  await page.locator('.garden-home').waitFor();
  assert.equal(await page.locator('.garden-stats strong').first().innerText(),'3');
  // Fresh device restoration through the actual file input.
  const fresh = await browser.newContext({viewport:{width:393,height:852}});
  await serveBundle(fresh);
  const restore = await fresh.newPage();
  restore.on('dialog', dialog => dialog.accept());
  await restore.goto(`${base}/vault/`);
  await restore.getByPlaceholder('至少 8 个字符').fill(pass);
  await restore.getByPlaceholder('确认密码').fill(pass);
  await restore.locator('.vault-check input').check();
  await restore.getByRole('button',{name:'创建庭院',exact:true}).click();
  await restore.locator('.garden-home').waitFor();
  await restore.locator('.vault-mobilebar').getByRole('button',{name:'设置',exact:true}).click();
  await restore.locator('input[type=file]').setInputFiles(path.resolve('tmp/garden-qa/backup.json'));
  await restore.getByPlaceholder('备份密码').fill(pass);
  await restore.getByRole('button',{name:'导入',exact:true}).click();
  await restore.getByText('备份已导入', {exact:true}).waitFor();
  await restore.locator('.vault-settings__head').getByRole('button').click();
  assert.equal(await restore.locator('.garden-stats strong').first().innerText(),'3');
  console.log('PASS persistence after reload / backup restore on a fresh device');
  await fresh.close();
  assert.deepEqual(errors,[]);
  console.log('PASS no JavaScript errors');
  await writeFile('tmp/garden-qa/result.json',JSON.stringify({passed:true,errors,records:parsed.entries.length},null,2));
} catch (error) {
  console.error((await page.locator('body').innerText()).slice(-2000));
  await page.screenshot({path:'tmp/garden-qa/failure.png'});
  throw error;
} finally { await browser.close(); }
