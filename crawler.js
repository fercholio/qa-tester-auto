const { chromium } = require('playwright');

async function runCrawler(config, socket) {
  const { startUrl, maxPages = 10 } = config;
  const visited = new Set();
  const queue = [startUrl];
  const results = {
    pages: 0,
    buttons: 0,
    inputs: 0,
    forms: 0
  };

  socket.emit('status_update', results);
  
  const browser = await chromium.launch({ headless: false }); // show login
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Handle Authentication if provided
  if (config.auth && config.auth.user && config.auth.pass) {
    socket.emit('log', { type: 'warning', message: `Autenticando como ${config.auth.user}...` });
    try {
      await page.goto(config.auth.loginUrl, { waitUntil: 'domcontentloaded' });
      
      // Auto-detect selectors or use provided
      const userSel = config.auth.userSel || 'input[type="email"], input[name*="user"], input[name*="email"]';
      const passSel = config.auth.passSel || 'input[type="password"]';
      const submitSel = config.auth.submitSel || 'button[type="submit"], form button, .btn-primary';

      const userExists = await page.locator(userSel).count() > 0;
      if (!userExists) throw new Error("No se pudo detectar el campo de usuario. Intenta proveer el selector manualmente.");

      await page.fill(userSel, config.auth.user);
      await page.fill(passSel, config.auth.pass);
      await page.click(submitSel);
      
      const currentUrlAfterLogin = page.url();
      if (currentUrlAfterLogin === config.auth.loginUrl) {
         // Wait a bit more just in case
         await page.waitForTimeout(2000);
      }
      
      const postLoginUrl = page.url();
      socket.emit('log', { type: 'success', message: `¡Autenticación completada! Redirigido a: ${postLoginUrl}` });
      
      // Clear the initial queue and start fresh from the post-login URL
      queue.length = 0; 
      queue.push(postLoginUrl);

    } catch (e) {
      socket.emit('log', { type: 'error', message: `Fallo el login: ${e.message.split('\\n')[0]}` });
    }
  }

  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    socket.emit('log', { type: 'info', message: `Crawling: ${currentUrl}` });
    const pageData = { url: currentUrl, buttons: [], inputs: [], forms: 0, a11y: [] };

    try {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      results.pages++;

      await page.waitForTimeout(2000);

      const extracted = await page.evaluate(() => {
        const getSelector = (el) => el.id ? `#${el.id}` : (el.name ? `${el.tagName.toLowerCase()}[name="${el.name}"]` : (el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()));
        const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"]')).map(el => ({ id: el.id, text: el.innerText, cssSelector: getSelector(el) }));
        const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({ id: el.id, name: el.name, type: el.type, cssSelector: getSelector(el) }));
        const forms = document.querySelectorAll('form').length;
        const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(href => href.startsWith(window.location.origin));
        
        // A11y & SEO Auditing
        const a11yWarnings = [];
        if (!document.title) a11yWarnings.push("Falta etiqueta <title>");
        
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 0) a11yWarnings.push("Falta encabezado <h1>");
        if (h1s.length > 1) a11yWarnings.push(`Múltiples <h1> encontrados (${h1s.length})`);
        
        const imgNoAlt = document.querySelectorAll('img:not([alt])').length;
        if (imgNoAlt > 0) a11yWarnings.push(`${imgNoAlt} imágenes sin atributo 'alt'`);
        
        const btnNoLabel = Array.from(document.querySelectorAll('button')).filter(b => !b.innerText.trim() && !b.getAttribute('aria-label')).length;
        if (btnNoLabel > 0) a11yWarnings.push(`${btnNoLabel} botones sin texto ni 'aria-label'`);

        // Performance Metrics (Basic)
        const timing = window.performance.timing;
        const loadTimeMs = timing.loadEventEnd - timing.navigationStart;
        const isSlow = loadTimeMs > 3000;

        return { buttons, inputs, forms, links: [...new Set(links)], a11yWarnings, loadTimeMs, isSlow };
      });

      pageData.buttons = extracted.buttons;
      pageData.inputs = extracted.inputs;
      pageData.forms = extracted.forms;
      pageData.a11y = extracted.a11yWarnings;

      if (extracted.a11yWarnings.length > 0) {
        socket.emit('log', { type: 'warning', message: `⚠️ SEO/A11y (${currentUrl}): ${extracted.a11yWarnings.join(', ')}` });
      }
      if (extracted.isSlow && extracted.loadTimeMs > 0) {
        socket.emit('log', { type: 'error', message: `🐌 Rendimiento Pobre (${currentUrl}): El tiempo de carga fue de ${extracted.loadTimeMs}ms.` });
      }

      results.buttons += extracted.buttons.length;
      results.inputs += extracted.inputs.length;
      results.forms += extracted.forms;

      socket.emit('status_update', results);
      socket.emit('page_analyzed', {
        url: currentUrl,
        buttons: extracted.buttons.length,
        inputs: extracted.inputs.length,
        forms: extracted.forms
      });

      // Add new links to queue
      for (const link of extracted.links) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }

    } catch (e) {
      socket.emit('log', { type: 'warning', message: `Fallo al cargar ${currentUrl}: ${e.message.split('\\n')[0]}` });
    }
    
    results.surfaceMap = results.surfaceMap || [];
    results.surfaceMap.push(pageData);
  }

  await context.storageState({ path: 'auth.json' });
  await browser.close();
  return results.surfaceMap;
}

module.exports = { runCrawler };
