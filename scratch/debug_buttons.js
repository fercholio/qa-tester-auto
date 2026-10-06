const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'abogado@demo.com');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/panel');
  await page.waitForFunction(() => !document.querySelector('.animate-pulse'), { timeout: 10000 }).catch(() => {});
  
  // Extract buttons
  const buttons = await page.evaluate(() => {
    const getSelector = (el) => {
      if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
      if (el.id) return `#${el.id}`;
      if (el.className && typeof el.className === 'string' && el.className.trim()) return `.${el.className.trim().split(' ')[0]}`;
      return el.tagName.toLowerCase();
    };
    return Array.from(document.querySelectorAll('button, .btn, a'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0;
      })
      .map(el => {
        const text = el.innerText?.trim() || el.title || el.getAttribute('aria-label') || '';
        return { cssSelector: getSelector(el), text };
      });
  });
  
  console.log("Extracted buttons:", JSON.stringify(buttons, null, 2));
  
  await browser.close();
})();
