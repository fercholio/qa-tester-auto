const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', exception => {
    errors.push(`[Uncaught Exception] ${exception.message}`);
  });

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'super@demo.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Platform
  await page.goto('http://localhost:3000/platform');
  await page.waitForTimeout(1000);

  // Tenants
  await page.goto('http://localhost:3000/tenants');
  await page.waitForTimeout(1000);

  // Plan
  await page.goto('http://localhost:3000/platform/plans');
  await page.waitForTimeout(1000);

  // Impersonate
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(1000);

  fs.writeFileSync('console_errors.json', JSON.stringify(errors, null, 2));
  console.log(`Captured ${errors.length} errors.`);
  await browser.close();
})();
