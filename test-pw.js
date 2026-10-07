const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('response', resp => {
    if (resp.url().includes('api/auth/me')) {
      console.log('API RESPONSE:', resp.status(), resp.url());
    }
  });

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(3000);
  console.log('FINAL URL:', page.url());
  
  await browser.close();
})();
