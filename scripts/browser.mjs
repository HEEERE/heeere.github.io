import {chromium} from 'playwright-core';

// Local runs reuse Chrome; CI installs the Chromium matching playwright-core.
export const launchBrowser = () => chromium.launch({
  ...(process.env.CI ? {} : {channel: 'chrome'}),
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
