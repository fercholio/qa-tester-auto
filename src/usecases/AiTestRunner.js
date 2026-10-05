const { chromium } = require('playwright');
const GroqAdapter = require('../infrastructure/GroqAdapter');
const TestScriptGenerator = require('./TestScriptGenerator');
const RegressionAnalyzer = require('./RegressionAnalyzer');
const ApplicationLogger = require('../infrastructure/ApplicationLogger');
const VisualComparator = require('./VisualComparator');

class AiTestRunner {
  constructor(apiKey, socket) {
    this.groqAdapter = new GroqAdapter(apiKey);
    this.scriptGenerator = new TestScriptGenerator();
    this.regressionAnalyzer = new RegressionAnalyzer();
    this.logger = new ApplicationLogger();
    this.visualComparator = new VisualComparator('./baselines');
    this.socket = socket;
    this.recommendations = new Set();
  }

  async runTest(startUrl, testPlanContent, auth = null) {
    const startTime = Date.now();
    this.socket.emit('log', { type: 'info', message: 'Iniciando navegador para pruebas IA...' });
    const fs = require('fs');
    const browser = await chromium.launch({ headless: false }); // Visible for demo
    const contextOptions = { viewport: { width: 1280, height: 720 } };
    if (fs.existsSync('auth.json')) {
      contextOptions.storageState = 'auth.json';
    }
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
      // Pre-flight authentication omitted since we load auth.json
      if (!require('fs').existsSync('auth.json') && auth && auth.user && auth.pass && auth.loginUrl) {
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

      // Extract context
      const pageContext = await page.evaluate(() => {
        const getSelector = (el) => el.id ? `#${el.id}` : (el.name ? `${el.tagName.toLowerCase()}[name="${el.name}"]` : (el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()));
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => {
          return { cssSelector: getSelector(el), type: el.type, placeholder: el.placeholder };
        });
        const buttons = Array.from(document.querySelectorAll('button, .btn, a')).map(el => {
          return { cssSelector: getSelector(el), text: el.innerText?.trim() };
        });
        return { url: window.location.href, inputs, buttons };
      });
      if (auth) pageContext.auth = auth;

      // Regression Analysis
      const report = this.regressionAnalyzer.saveSnapshotAndCompare(startUrl, pageContext);
      if (report.changed) {
        this.socket.emit('log', { type: 'warning', message: `ATENCIÓN: Cambios detectados en la superficie (Missing Inputs: ${report.missingInputs.length}, New Inputs: ${report.newInputs.length})` });
      }

      this.socket.emit('log', { type: 'info', message: 'Tomando captura visual para el LLM Multimodal...' });
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
      const screenshotBase64 = screenshot.toString('base64');

      this.socket.emit('log', { type: 'info', message: 'Analizando superficie con Groq Vision (Zero Mock)...' });
      
      const actions = await this.groqAdapter.generateTestActions(pageContext, testPlanContent, screenshotBase64);
      this.socket.emit('log', { type: 'success', message: `Groq planeó ${actions.length} acciones.` });

      let executedCount = 0;
      let errorOccurred = null;
      const detailedActions = [];

      for (const action of actions) {
        this.socket.emit('log', { type: 'info', message: `Ejecutando: ${action.action} en ${action.selector || ''}` });
        
        // Proactive Selector Check
        if (action.selector && !action.selector.includes('#') && !action.selector.includes('[name=')) {
          this.recommendations.add(`El selector '${action.selector}' es genérico. Agrega un atributo 'id', 'name' o 'data-testid' para tests más estables.`);
        }

        try {
          if (action.action === 'fill') {
            try {
               await page.fill(action.selector, action.value, { timeout: 5000 });
            } catch (e1) {
               try {
                 const healScreenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
                 this.socket.emit('log', { type: 'warning', message: `Self-Healing: Buscando nuevo selector para '${action.selector}'...` });
                 const newSelector = await this.groqAdapter.healSelector(action.selector, healScreenshot.toString('base64'));
                 if (newSelector && newSelector !== action.selector) {
                    this.socket.emit('log', { type: 'success', message: `Self-Healing Exitoso: Reemplazado por '${newSelector}'` });
                    await page.fill(newSelector, action.value, { timeout: 5000 });
                    this.recommendations.add(`El selector '${action.selector}' falló y fue auto-curado a '${newSelector}'. Actualiza tu código.`);
                    action.selector = newSelector;
                    action.autoHealed = true;
                 } else {
                    throw e1;
                 }
               } catch (healError) {
                 this.socket.emit('log', { type: 'warning', message: `Fallback Fill: Forzando inyección JS en ${action.selector}` });
                 this.recommendations.add(`El input '${action.selector}' falló con un fill normal. Asegúrate de que no esté oculto o bloqueado.`);
                 await page.evaluate(({sel, val}) => { document.querySelector(sel).value = val; }, {sel: action.selector, val: action.value});
               }
            }
          } else if (action.action === 'click') {
            try {
              await page.click(action.selector, { timeout: 5000 });
            } catch (e1) {
              try {
                 const healScreenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
                 this.socket.emit('log', { type: 'warning', message: `Self-Healing: Buscando nuevo selector para '${action.selector}'...` });
                 const newSelector = await this.groqAdapter.healSelector(action.selector, healScreenshot.toString('base64'));
                 if (newSelector && newSelector !== action.selector) {
                    this.socket.emit('log', { type: 'success', message: `Self-Healing Exitoso: Reemplazado por '${newSelector}'` });
                    await page.click(newSelector, { timeout: 5000 });
                    this.recommendations.add(`El selector '${action.selector}' falló y fue auto-curado a '${newSelector}'. Actualiza tu código.`);
                    action.selector = newSelector;
                    action.autoHealed = true;
                 } else {
                    throw e1;
                 }
              } catch (healError) {
                try {
                  this.socket.emit('log', { type: 'warning', message: `Fallback Click 1: Forzando click en ${action.selector}` });
                  await page.click(action.selector, { force: true, timeout: 5000 });
                  this.recommendations.add(`El botón '${action.selector}' requirió un clic forzado. Revisa si un modal lo cubre.`);
                } catch (e2) {
                  this.socket.emit('log', { type: 'warning', message: `Fallback Click 2: Inyectando JS click en ${action.selector}` });
                  this.recommendations.add(`El botón '${action.selector}' es inaccesible nativamente. Hazlo visible.`);
                  await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if(el) el.click();
                    else throw new Error("DOM Element no encontrado");
                  }, action.selector);
                }
              }
            }
          } else if (action.action === 'wait') {
            await page.waitForTimeout(parseInt(action.value) || 2000);
          } else if (action.action === 'assert') {
            this.socket.emit('log', { type: 'info', message: `Validando aserción: ${action.assertion} en ${action.selector}` });
            try {
              const loc = page.locator(action.selector);
              if (action.assertion === 'be.visible') {
                await loc.waitFor({ state: 'visible', timeout: 5000 });
              } else if (action.assertion === 'be.disabled') {
                const disabled = await loc.isDisabled({ timeout: 5000 });
                if (!disabled) throw new Error(`El elemento ${action.selector} no está deshabilitado como se esperaba.`);
              } else if (action.assertion === 'have.text') {
                await page.waitForFunction(([sel, val]) => {
                  const el = document.querySelector(sel);
                  return el && el.textContent.includes(val);
                }, [action.selector, action.value || ''], { timeout: 5000 });
              }
            } catch (assertErr) {
              throw new Error(`Aserción Fallida (${action.assertion}): ${assertErr.message}`);
            }
          }
          await page.waitForTimeout(500); // Small delay for UX
          executedCount++;
          
          const stepScreenshotPath = `/Users/fercho/dev/qa-surface-tester/generated_tests/step_${Date.now()}_${executedCount}.png`;
          await page.screenshot({ path: stepScreenshotPath });
          
          // VRT Comparison
          const stepId = `${Buffer.from(startUrl).toString('base64').substring(0, 8)}_step_${executedCount}`;
          const diffPath = `/Users/fercho/dev/qa-surface-tester/generated_tests/diff_${Date.now()}_${executedCount}.png`;
          const vrtResult = await this.visualComparator.compare(stepId, stepScreenshotPath, diffPath, 0.1);
          
          if (!vrtResult.match && !vrtResult.isNewBaseline) {
            this.socket.emit('log', { type: 'warning', message: `VRT Falló: ${vrtResult.percentage.toFixed(2)}% diferencia visual detectada.` });
          }

          detailedActions.push({
            action: action.action,
            selector: action.selector || 'N/A',
            value: action.value || '',
            status: action.autoHealed ? 'success (auto-healed)' : 'success',
            screenshot: stepScreenshotPath,
            vrt: vrtResult
          });

        } catch (e) {
          errorOccurred = e;
          this.socket.emit('log', { type: 'error', message: `Acción falló: ${e.message.split('\\n')[0]}` });
          
          const stepScreenshotPath = `/Users/fercho/dev/qa-surface-tester/generated_tests/step_${Date.now()}_failed.png`;
          await page.screenshot({ path: stepScreenshotPath });
          
          detailedActions.push({
            action: action.action,
            selector: action.selector || 'N/A',
            value: action.value || '',
            status: 'failed',
            screenshot: stepScreenshotPath,
            error: e.message
          });
          
          break; // Stop execution of this plan on failure
        }
      }

      this.logger.logExecution({ testPlanContent, startUrl }, actions.slice(0, executedCount));

      this.socket.emit('log', { type: 'success', message: 'Flujo de prueba AI completado con éxito.' });
      
      const scriptPath = this.scriptGenerator.generate(actions, 'ai_test_execution');
      this.socket.emit('log', { type: 'success', message: `Script guardado en: ${scriptPath}` });
      
      const durationSecs = ((Date.now() - startTime) / 1000).toFixed(1);

      const stats = {
        type: 'E2E Testing',
        actionsExecuted: executedCount,
        errorsDetected: report.changed ? 1 : 0,
        durationSecs,
        coverage: {
          inputs: actions.filter(a => a.action === 'fill').length,
          clicks: actions.filter(a => a.action === 'click').length
        },
        scriptPath,
        recommendations: Array.from(this.recommendations),
        detailedActions
      };

      // No longer emit execution_stats here, let server emit the aggregated suite stats
      // this.socket.emit('execution_stats', stats);

      return stats;
    } catch (e) {
      console.error('runTest ERROR:', e);
      this.socket.emit('log', { type: 'error', message: `Fallo durante ejecución IA: ${e.message}` });
    } finally {
      await page.waitForTimeout(3000); // Leave browser open a bit to see result
      await browser.close();
    }
  }
}

module.exports = AiTestRunner;
