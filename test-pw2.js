const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/tenants');
  await page.waitForTimeout(3000);
  
  // Click + Nuevo Cliente
  await page.click('text="+ Nuevo Cliente"');
  await page.waitForTimeout(1000);
  
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0;
      })
      .map(el => el.id || el.name);
  });
  
  console.log('INPUTS VISIBLE:', inputs);
  
  await browser.close();
})();
