const { chromium } = require('playwright');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

class BddAiRunner {
  constructor(apiKey, socket) {
    this.groq = new Groq({ apiKey });
    this.socket = socket;
  }

  async parseFeature(featurePath) {
    const content = fs.readFileSync(featurePath, 'utf8');
    const lines = content.split('\n');
    const scenarios = [];
    let currentScenario = null;
    let featureTitle = path.basename(featurePath, '.feature');
    let featureDescription = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('Feature:')) {
        featureTitle = trimmed.replace('Feature:', '').trim();
      } else if (trimmed.startsWith('Scenario:')) {
        if (currentScenario) scenarios.push(currentScenario);
        currentScenario = { title: trimmed.replace('Scenario:', '').trim(), steps: [] };
      } else if (currentScenario && (trimmed.startsWith('Given ') || trimmed.startsWith('When ') || trimmed.startsWith('And ') || trimmed.startsWith('Then ') || trimmed.startsWith('But '))) {
        currentScenario.steps.push(trimmed);
      } else if (!currentScenario) {
        featureDescription += (featureDescription ? ' ' : '') + trimmed;
      }
    }
    if (currentScenario) scenarios.push(currentScenario);
    return { title: featureTitle, description: featureDescription, scenarios };
  }

  async runFeature(featurePath, startUrl, authConfig) {
    this.socket.emit('log', { type: 'info', message: `🔍 Cargando Feature Spec: ${featurePath}` });
    const { title: featureTitle, description: featureDescription, scenarios } = await this.parseFeature(featurePath);
    let allPassed = true;
    const featureStartTime = Date.now();

    for (const scenario of scenarios) {
      scenario.startTime = Date.now();
      scenario.stepResults = [];
      scenario.passed = true;
      this.socket.emit('log', { type: 'info', message: `▶️ Ejecutando Escenario: ${scenario.title}` });

      let storageStatePath = undefined;
      const loginStep = scenario.steps.find(s => s.toLowerCase().includes('logged in as a'));
      if (loginStep) {
        const roleStr = loginStep.split(' as a ')[1]?.trim().replace(/\s+/g, '_') || 'default';
        const potentialPath = `auth_${roleStr}.json`;
        if (fs.existsSync(potentialPath)) {
          storageStatePath = potentialPath;
          this.socket.emit('log', { type: 'info', message: `♻️ Reutilizando sesión previa para: ${roleStr}` });
        }
      }

      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext(storageStatePath ? { storageState: storageStatePath } : undefined);
      const page = await context.newPage();
      
      const pageErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageErrors.push(`Console Error: ${msg.text()}`);
        }
      });
      page.on('pageerror', exception => {
        pageErrors.push(`Uncaught Exception: ${exception.message}`);
      });

      try {
        this.socket.emit('log', { type: 'info', message: `Navegando a ${startUrl}` });
        await page.goto(startUrl);

        const contextDocs = authConfig ? `\nCredenciales disponibles: Email: ${authConfig.email}, Password: ${authConfig.password}. Usa estas credenciales si necesitas hacer login.` : '';

        for (let i = 0; i < scenario.steps.length; i++) {
          const step = scenario.steps[i];
          const stepStart = Date.now();
          const stepDecisions = [];
          const stepErrors = [];
          this.socket.emit('log', { type: 'warning', message: `Ejecutando paso: ${step}` });
          
          let stepCompleted = false;
          let attempts = 0;
          let actionHistory = [];

          while (!stepCompleted && attempts < 10) {
            attempts++;
            const domState = await this.extractDom(page);
            const result = await this.executeStepWithAI(step, domState, page.url(), contextDocs, actionHistory);
            console.log('🤖 AI Decision:', result);
            stepDecisions.push({ ...result });
            actionHistory.push(result);
            
            if (result.action === 'done') {
              stepCompleted = true;
              break;
            }

            try {
              if (result.action === 'goto') {
                let targetUrl = result.value || (result.selector && (result.selector.startsWith('http') || result.selector.startsWith('/')) ? result.selector : null);
                if (targetUrl) {
                  if (targetUrl.startsWith('/')) {
                    targetUrl = `http://localhost:3000${targetUrl}`;
                  }
                  await page.goto(targetUrl);
                  await page.waitForLoadState('networkidle');
                }
              } else if (result.action === 'click') {
                await page.click(result.selector, { timeout: 5000 });
                await page.waitForTimeout(600);
                await page.waitForLoadState('domcontentloaded').catch(() => {});
              } else if (result.action === 'fill') {
                await page.fill(result.selector, result.value, { timeout: 5000 });
              } else if (result.action === 'select') {
                await page.selectOption(result.selector, { label: result.value }).catch(async () => {
                  await page.selectOption(result.selector, result.value);
                });
                await page.waitForTimeout(500);
              } else if (result.action === 'verify') {
                let isMatch = false;
                let verifyAttempts = 0;
                while (verifyAttempts < 10) {
                  const html = await page.content();
                  
                  // Check selector via Playwright locator first
                  if (result.selector) {
                    try {
                      let sel = result.selector.trim();
                      let count = 0;
                      if (sel.startsWith('role=')) {
                        const roleName = sel.replace('role=', '').trim();
                        count = await page.getByRole(roleName).count();
                      } else {
                        if (sel.startsWith('css=')) sel = sel.replace('css=', '').trim();
                        count = await page.locator(sel).count();
                      }
                      if (result.expected === 'exists' && count > 0) { isMatch = true; break; }
                      if (result.expected === 'not_exists' && count === 0) { isMatch = true; break; }
                    } catch (_) {}
                  }

                  // Check cleaned text from value or selector against HTML (case-insensitive)
                  const rawVal = result.value || result.selector || '';
                  const cleanText = rawVal.replace(/^text=/, '').replace(/^["']|["']$/g, '').trim();
                  
                  if (cleanText) {
                    const hasCleanText = html.toLowerCase().includes(cleanText.toLowerCase());
                    if (result.expected === 'exists' && hasCleanText) { isMatch = true; break; }
                    if (result.expected === 'not_exists' && !hasCleanText) { isMatch = true; break; }
                  }
                  
                  await page.waitForTimeout(500);
                  verifyAttempts++;
                }
                
                if (!isMatch) {
                  throw new Error(`Verificación fallida: No se cumplió "${result.selector || result.value}"`);
                }
                stepCompleted = true;
                break;
              }
              await page.waitForTimeout(500);

              if (step.toLowerCase().includes('logged in')) {
                 const roleStr = step.split(' as a ')[1]?.trim().replace(/\s+/g, '_') || 'default';
                 await context.storageState({ path: `auth_${roleStr}.json` });
              }
            } catch (error) {
              console.log(`[AI Auto-Repair] Error ejecutando acción: ${error.message}`);
              stepErrors.push(error.message);
              actionHistory.push({ failed_action: result, error: error.message, hint: "Intenta un selector diferente, busca por placeholder, id, o un texto alternativo visible." });
            }
          }

          const stepDuration = Date.now() - stepStart;
          const stepStatus = stepCompleted ? (attempts > 1 ? 'self_healed' : 'passed') : 'failed';
          
          scenario.stepResults.push({
            step,
            status: stepStatus,
            attempts,
            duration: stepDuration,
            decisions: stepDecisions,
            errors: stepErrors
          });

          if (!stepCompleted) throw new Error("Excedido límite de reintentos en paso.");
          this.socket.emit('log', { type: 'success', message: `✅ Paso completado: ${step}` });
        }

        const screenshotName = `screenshot-${Date.now()}.png`;
        const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, screenshotName);
        await page.screenshot({ path: screenshotPath });
        scenario.screenshot = `screenshots/${screenshotName}`;
        scenario.duration = Date.now() - scenario.startTime;
        scenario.passed = true;
      } catch (e) {
        this.socket.emit('log', { type: 'error', message: `❌ Fallo en el escenario: ${e.message}` });
        allPassed = false;
        scenario.passed = false;
        scenario.error = e.message;
        scenario.duration = Date.now() - scenario.startTime;
        const errScreenshotName = `error-${Date.now()}.png`;
        const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, errScreenshotName);
        await page.screenshot({ path: screenshotPath }).catch(() => {});
        scenario.screenshot = `screenshots/${errScreenshotName}`;
      } finally {
        if (pageErrors.length > 0) {
          this.socket.emit('log', { type: 'error', message: `⚠️ Se capturaron ${pageErrors.length} errores de consola/página en este escenario.` });
          scenario.pageErrors = pageErrors;
        }
        await browser.close();
      }
    }
    
    return {
      title: featureTitle,
      description: featureDescription,
      path: featurePath,
      file: path.basename(featurePath),
      passed: allPassed,
      duration: Date.now() - featureStartTime,
      scenarios
    };
  }

  async extractDom(page) {
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]'));
      return elements.map(el => {
        const text = (el.innerText || el.placeholder || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
        return {
          tag: el.tagName.toLowerCase(),
          text: text ? text.substring(0, 80) : undefined,
          id: el.id || undefined,
          name: el.getAttribute('name') || undefined,
          placeholder: el.getAttribute('placeholder') || undefined,
          type: el.getAttribute('type') || undefined,
          href: el.getAttribute('href') || undefined
        };
      }).filter(el => el.text || el.id || el.name || el.placeholder || el.href);
    });
  }

  async executeStepWithAI(stepDescription, domState, currentUrl, contextDocs = '', actionHistory = []) {
    const prompt = `
Eres un agente autónomo de Playwright BDD (Spec-Driven Testing). 
Tu objetivo es traducir un paso BDD en una acción de Playwright, basándote en los elementos interactivos actuales.
${contextDocs}

Paso BDD a ejecutar: "${stepDescription}"
URL actual: ${currentUrl}

Reglas estrictas de decisión:
1. Si el paso dice "click", "hacer clic", o "clic en", la acción DEBE ser "click". Elige el selector más directo (id ej: "#btn-new-entry", text ej: "text=Crear", o selector CSS).
2. Si el paso dice "fill", "escribir", o "ingresar", la acción DEBE ser "fill". Busca el input por id (ej: "#entry-description"), name, placeholder o label asociado.
3. Si el paso dice "select", "seleccionar", la acción DEBE ser "select".
4. Si el paso dice "verify", "should see", "should exist", "debería ver", "debería existir", la acción DEBE ser "verify" con expected: "exists".
5. Si el paso dice "should not see", "should not exist", "no debería ver", la acción DEBE ser "verify" con expected: "not_exists".
6. Si la acción ya se ejecutó con éxito o el objetivo del paso ya está cumplido, devuelve "action": "done".
7. NUNCA respondas "action": "verify" si el paso BDD explícitamente pide hacer "click" o "fill".

Historial de acciones YA EJECUTADAS para este paso (NO las repitas si fallaron):
${JSON.stringify(actionHistory, null, 2)}

Elementos interactivos en pantalla:
${JSON.stringify(domState, null, 2)}

Devuelve SOLO un JSON con este formato exacto:
{
  "action": "click" | "fill" | "select" | "verify" | "goto" | "done",
  "selector": "selector valido de Playwright (ej: #id, text=Nombre, input[name='x'])",
  "value": "valor a escribir, opción a seleccionar, o texto/selector a verificar",
  "expected": "exists" | "not_exists" (solo si action es verify)
}
`;

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b", // Fast model for deterministic steps
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0].message.content;
    return JSON.parse(responseContent);
  }
}

module.exports = BddAiRunner;
