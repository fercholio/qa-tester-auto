const { chromium } = require('playwright');
const GroqAdapter = require('../infrastructure/GroqAdapter');
const ApplicationLogger = require('../infrastructure/ApplicationLogger');
const fs = require('fs');
const path = require('path');

class InteractiveTestRunner {
  constructor(apiKey) {
    this.groqAdapter = new GroqAdapter(apiKey);
    this.logger = new ApplicationLogger();
    this.maxIterations = 15;
  }

  async runRequirement(startUrl, requirementText, authStatePath = 'auth.json') {
    const startTime = Date.now();
    console.log(`[ReAct Agent] Iniciando test interactivo para: ${requirementText}`);
    
    const browser = await chromium.launch({ headless: true });
    const contextOptions = { viewport: { width: 1280, height: 720 } };
    if (fs.existsSync(authStatePath)) {
      contextOptions.storageState = authStatePath;
    }
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    let stepCount = 0;
    const history = [];
    let testStatus = 'pending';
    let failReason = 'Max iterations reached without success.';

    try {
      await page.goto(startUrl, { waitUntil: 'networkidle' });

      while (stepCount < this.maxIterations) {
        stepCount++;
        await page.waitForTimeout(1000);
        await page.waitForFunction(() => !document.querySelector('.animate-pulse'), { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);
        const pageContext = await page.evaluate(() => {
          const getSelector = (el) => {
            if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
            if (el.id) return `#${el.id}`;
            if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
            if (el.innerText && el.innerText.trim().length > 0) return `text="${el.innerText.trim().split('\\n')[0]}"`;
            if (el.className && typeof el.className === 'string' && el.className.trim()) return `.${el.className.trim().split(' ')[0]}`;
            return el.tagName.toLowerCase();
          };
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(el => {
              if (el.type === 'file') return true;
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0;
            })
            .map(el => {
              return { cssSelector: getSelector(el), type: el.type, placeholder: el.placeholder };
            });
          const buttons = Array.from(document.querySelectorAll('button, .btn, a'))
            .filter(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0;
            })
            .map(el => {
              const text = el.innerText?.trim() || el.title || el.getAttribute('aria-label') || '';
              return { cssSelector: getSelector(el), text };
            });
          const textContent = document.body.innerText.substring(0, 1000); // Sample context
          return { url: window.location.href, inputs, buttons, textContent };
        });

        const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
        const screenshotBase64 = screenshot.toString('base64');

        console.log(`[ReAct Agent] Paso ${stepCount}: Analizando estado actual...`);
        
        // Use Groq Vision to determine the next SINGLE action
        const nextAction = await this.groqAdapter.determineNextAction(pageContext, requirementText, screenshotBase64, history);

        history.push({ step: stepCount, action: nextAction });

        if (nextAction.action === 'success') {
          testStatus = 'success';
          failReason = '';
          console.log(`✅ [ReAct Agent] Objetivo alcanzado: ${nextAction.reason}`);
          break;
        }

        if (nextAction.action === 'fail' || nextAction.action === 'impossible') {
          testStatus = 'failed';
          failReason = `ReAct Agent determinó falla: ${nextAction.reason}`;
          console.log(`❌ [ReAct Agent] Fallo detectado: ${nextAction.reason}`);
          break;
        }

        console.log(`[ReAct Agent] Ejecutando: ${nextAction.action} en ${nextAction.selector || ''} con valor '${nextAction.value || ''}'`);

        // Execute action
        try {
          if (nextAction.action === 'fill') {
            if (nextAction.value.match(/\.(pdf|png|jpg|jpeg|docx)$/i)) {
              const fs = require('fs');
              const path = require('path');
              const dummyPath = path.join('/tmp', nextAction.value.split('/').pop());
              if (!fs.existsSync(dummyPath)) fs.writeFileSync(dummyPath, 'dummy file content for testing');
              await page.setInputFiles(nextAction.selector, dummyPath, { timeout: 5000 });
            } else {
              await page.fill(nextAction.selector, nextAction.value, { timeout: 5000 });
            }
          } else if (nextAction.action === 'click') {
            await page.click(nextAction.selector, { timeout: 5000 });
          } else if (nextAction.action === 'wait') {
            await page.waitForTimeout(parseInt(nextAction.value) || 2000);
          }
        } catch (e) {
          console.warn(`[ReAct Agent] Error ejecutando la acción nativamente, intentando inyección JS...`);
          try {
            if (nextAction.action === 'click') {
              await page.evaluate((sel) => {
                if (sel.startsWith('text=')) {
                  const text = sel.replace('text=', '').replace(/['"]/g, '').trim();
                  const els = Array.from(document.querySelectorAll('button, a, span, div, p'));
                  const el = els.find(e => e.textContent && e.textContent.trim() === text && e.offsetParent !== null);
                  if (el) el.click();
                } else {
                  document.querySelector(sel)?.click();
                }
              }, nextAction.selector);
            } else if (nextAction.action === 'fill') {
              await page.evaluate(({sel, val}) => { 
                const el = document.querySelector(sel);
                if(el) { el.value = val; el.dispatchEvent(new Event('input')); }
              }, {sel: nextAction.selector, val: nextAction.value});
            }
          } catch(errJs) {
            console.error(`❌ [ReAct Agent] Acción falló completamente: ${errJs.message}`);
          }
        }
      }
      if (testStatus === 'pending') {
        testStatus = 'failed';
        failReason = 'Max iterations reached without success.';
        console.log(`❌ [ReAct Agent] Max iterations reached, deteniendo prueba por timeout lógico.`);
      }
    } catch (e) {
      testStatus = 'error';
      failReason = e.message;
    } finally {
      const finalScreenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
      const screenshotPath = path.join(process.cwd(), 'public', 'screenshots', `react_${Date.now()}.jpg`);
      
      if (!fs.existsSync(path.dirname(screenshotPath))) {
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      }
      fs.writeFileSync(screenshotPath, finalScreenshot);

      await browser.close();

      return {
        requirement: requirementText,
        status: testStatus,
        reason: failReason,
        stepsTaken: stepCount,
        history,
        durationSecs: ((Date.now() - startTime) / 1000).toFixed(1),
        screenshot: screenshotPath
      };
    }
  }
}

module.exports = InteractiveTestRunner;
