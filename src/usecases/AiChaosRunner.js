const { chromium } = require('playwright');
const GroqAdapter = require('../infrastructure/GroqAdapter');
const TestScriptGenerator = require('./TestScriptGenerator');
const ApplicationLogger = require('../infrastructure/ApplicationLogger');

class AiChaosRunner {
  constructor(apiKey, socket) {
    this.groqAdapter = new GroqAdapter(apiKey);
    this.scriptGenerator = new TestScriptGenerator();
    this.logger = new ApplicationLogger();
    this.socket = socket;
  }

  async runChaos(startUrl, auth = null) {
    this.socket.emit('log', { type: 'warning', message: 'Iniciando Monkey Tester / Chaos Engineering...' });
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    let foundErrors = false;

    // Listen for network errors (Integration Testing at runtime)
    page.on('response', response => {
      if (response.status() >= 500) {
        foundErrors = true;
        this.socket.emit('log', { type: 'error', message: `❌ INTEGRATION FAIL: La API devolvió ${response.status()} en ${response.url()}` });
      }
    });

    try {
      // Handle Pre-flight Authentication
      if (auth && auth.user && auth.pass && auth.loginUrl) {
        this.socket.emit('log', { type: 'warning', message: `Pre-flight: Autenticando como ${auth.user}...` });
        await page.goto(auth.loginUrl, { waitUntil: 'domcontentloaded' });
        
        const userSel = auth.userSel || 'input[type="email"], input[name*="user"], input[name*="email"]';
        const passSel = auth.passSel || 'input[type="password"]';
        const submitSel = auth.submitSel || 'button[type="submit"], form button, .btn-primary';

        if (await page.locator(userSel).count() > 0) {
          await page.fill(userSel, auth.user);
          await page.fill(passSel, auth.pass);
          await page.click(submitSel);
          await page.waitForTimeout(2000); // Wait for redirect
        }
      }

      this.socket.emit('log', { type: 'info', message: `Navegando a ruta objetivo: ${startUrl}` });
      await page.goto(startUrl, { waitUntil: 'networkidle' });

      const pageContext = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({ tag: el.tagName, name: el.name, id: el.id, type: el.type }));
        const buttons = Array.from(document.querySelectorAll('button, .btn, a')).map(el => ({ tag: el.tagName, text: el.innerText?.trim(), id: el.id }));
        return { url: window.location.href, inputs, buttons };
      });
      if (auth) pageContext.auth = auth;

      this.socket.emit('log', { type: 'info', message: 'Tomando captura visual para el Chaos Tester...' });
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
      const screenshotBase64 = screenshot.toString('base64');

      this.socket.emit('log', { type: 'info', message: 'Groq está diseñando vectores de ataque (Fuzzing)...' });
      const actions = await this.groqAdapter.generateChaosActions(pageContext, screenshotBase64);
      this.socket.emit('log', { type: 'warning', message: `Groq lanzará ${actions.length} acciones maliciosas.` });

      for (const action of actions) {
        this.socket.emit('log', { type: 'info', message: `Chaos: ${action.action} en ${action.selector || ''} con payload: ${action.value || 'N/A'}` });
        if (action.action === 'fill') {
          await page.fill(action.selector, action.value).catch(e => {});
        } else if (action.action === 'click') {
          await page.click(action.selector).catch(e => {});
        } else if (action.action === 'wait') {
          await page.waitForTimeout(parseInt(action.value) || 1000);
        }
        await page.waitForTimeout(200); // Click real fast like a monkey
      }

      this.logger.logExecution({ testType: 'Chaos', startUrl }, actions);

      // Check for console errors or broken DOM
      const domErrors = await page.evaluate(() => document.body.innerHTML.includes('Exception') || document.body.innerHTML.includes('Error 500'));
      if (domErrors) {
        foundErrors = true;
        this.socket.emit('log', { type: 'error', message: '❌ FATAL UX: La interfaz mostró un stacktrace o error crudo al usuario.' });
      }

      if (foundErrors) {
        this.socket.emit('log', { type: 'error', message: '⚠️ Chaos Test Finalizado: Se encontraron vulnerabilidades o crashes.' });
      } else {
        this.socket.emit('log', { type: 'success', message: '✅ Chaos Test Finalizado: La aplicación resistió el ataque (Graceful Degradation).' });
      }

      const scriptPath = this.scriptGenerator.generate(actions, 'chaos_test_execution');
      this.socket.emit('log', { type: 'success', message: `Script de Chaos guardado en: ${scriptPath}` });

      this.socket.emit('execution_stats', {
        type: 'Monkey / Chaos Testing',
        actionsExecuted: actions.length,
        errorsDetected: foundErrors ? 1 : 0,
        scriptPath
      });
    } catch (e) {
      this.socket.emit('log', { type: 'error', message: `Fallo Crítico en Chaos Runner: ${e.message}` });
    } finally {
      await page.waitForTimeout(3000);
      await browser.close();
    }
  }
}

module.exports = AiChaosRunner;
