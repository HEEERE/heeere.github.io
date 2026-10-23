import {launchBrowser} from './browser.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';

const browser = await launchBrowser();
const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
try {
await page.goto(base, {waitUntil: 'domcontentloaded'});
await page.locator('.hero .scene-canvas.is-ready').waitFor();
await page.addStyleTag({
  content: `
    .hero__meta, .hero__scroll, .hero__vertical, .hero__directory, .hero__actions, .hero__drag-hint { display: none !important; }
    .hero__stage-inner { inset: -2% -7% -3% -6% !important; }
    .hero { width: 1080px !important; height: 630px !important; min-height: 630px !important; padding: 110px 0 40px !important; grid-template-columns: 42fr 58fr !important; gap: 24px !important; }
    .hero__stage { min-height: 0 !important; }
    .hero__name { font-size: 100px !important; margin-top: 18px !important; }
    .hero__positioning { font-size: 18px !important; }
    .hero__roles { font-size: 8px !important; letter-spacing: .09em !important; }
    .hero__intro { font-size: 14px !important; margin-top: 18px !important; }
  `,
});
await page.waitForTimeout(900);
await page.screenshot({path: 'public/images/og-cover.png'});
console.log('og cover written');
} finally {
  await browser.close();
}
