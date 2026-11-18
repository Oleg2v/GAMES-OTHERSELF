import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'browser*.spec.js', timeout: 90000,
  expect: { timeout: 15000 }, workers: 1, fullyParallel: false,
  reporter: [['list']], outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173', viewport: {width:1440,height:900},
    headless: true, launchOptions: { executablePath:'/usr/bin/chromium', args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'] },
    screenshot:'only-on-failure', trace:{mode:'retain-on-failure',screenshots:false,snapshots:true,sources:true},
  },
});
