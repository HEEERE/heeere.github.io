import {chromium} from 'playwright-core';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';

const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--hide-scrollbars']});
const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
await page.goto(base, {waitUntil: 'domcontentloaded'});
await page.waitForTimeout(11000);
await page.addStyleTag({
  content: `
    .hero__meta, .hero__scroll, .hero__vertical { display: none !important; }
    .hero__stage-inner { inset: 2% -1% -2% -7% !important; }
    .hero { min-height: 630px !important; padding-top: 96px !important; padding-bottom: 24px !important; }
  `,
});
await page.waitForTimeout(900);
await page.screenshot({path: 'public/images/og-cover.png'});
console.log('og cover written');
await browser.close();
