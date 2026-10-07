const { chromium } = require('playwright');
const Groq = require('groq-sdk');
const fs = require('fs');

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
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Scenario:')) {
        if (currentScenario) scenarios.push(currentScenario);
        currentScenario = { title: trimmed.replace('Scenario:', '').trim(), steps: [] };
      } else if (currentScenario && (trimmed.startsWith('Given ') || trimmed.startsWith('When ') || trimmed.startsWith('And ') || trimmed.startsWith('Then ') || trimmed.startsWith('But '))) {
        currentScenario.steps.push(trimmed);
      }
    }
    if (currentScenario) scenarios.push(currentScenario);
    return scenarios;
  }

  async runFeature(featurePath, startUrl, authConfig) {
    this.socket.emit('log', { type: 'info', message: `🔍 Cargando Feature Spec: ${featurePath}` });
    const scenarios = await this.parseFeature(featurePath);
    let allPassed = true;

    for (const scenario of scenarios) {
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
          this.socket.emit('log', { type: 'warning', message: `Ejecutando paso: ${step}` });
          
          let stepCompleted = false;
          let attempts = 0;
          let actionHistory = [];

          while (!stepCompleted && attempts < 10) {
            attempts++;
            const domState = await this.extractDom(page);
            const result = await this.executeStepWithAI(step, domState, page.url(), contextDocs, actionHistory);
            console.log('🤖 AI Decision:', result);
            actionHistory.push(result);
            
            if (result.action === 'done') {
              stepCompleted = true;
              break;
            }

            try {
              if (result.action === 'goto') {
                await page.goto(result.value);
                await page.waitForLoadState('networkidle');
              } else if (result.action === 'click') {
                await page.click(result.selector, { timeout: 5000 });
                await page.waitForTimeout(1000);
              } else if (result.action === 'fill') {
                await page.fill(result.selector, result.value, { timeout: 5000 });
              } else if (result.action === 'verify') {
                const verifyValue = result.value || result.selector.replace('text=', '').replace(/['"]/g, '');
                let html = await page.content();
                let verifyAttempts = 0;
                while (verifyAttempts < 10) {
                  if (result.expected === 'exists' && html.includes(verifyValue)) break;
                  if (result.expected === 'not_exists' && !html.includes(verifyValue)) break;
                  await page.waitForTimeout(500);
                  html = await page.content();
                  verifyAttempts++;
                }
                
                if (!html.includes(verifyValue) && result.expected === 'exists') {
                  throw new Error(`Verificación fallida: No se encontró "${verifyValue}"`);
                }
                if (html.includes(verifyValue) && result.expected === 'not_exists') {
                  throw new Error(`Verificación fallida: Se encontró "${verifyValue}" pero no debía existir`);
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
              actionHistory.push({ failed_action: result, error: error.message, hint: "Intenta un selector diferente, busca por placeholder, id, o un texto alternativo visible." });
            }
          }

          if (!stepCompleted) throw new Error("Excedido límite de reintentos en paso.");
          this.socket.emit('log', { type: 'success', message: `✅ Paso completado: ${step}` });
        }

        await page.screenshot({ path: `success-screenshot-${Date.now()}.png` });
      } catch (e) {
        this.socket.emit('log', { type: 'error', message: `❌ Fallo en el escenario: ${e.message}` });
        allPassed = false;
        await page.screenshot({ path: `error-screenshot-${Date.now()}.png` }).catch(() => {});
      } finally {
        if (pageErrors.length > 0) {
          this.socket.emit('log', { type: 'error', message: `⚠️ Se capturaron ${pageErrors.length} errores de consola/página en este escenario.` });
          scenario.pageErrors = pageErrors;
        }
        await browser.close();
      }
    }
    
    return { passed: allPassed, scenarios };
  }

  async extractDom(page) {
    return await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, select'));
      return elements.map(el => ({
        tag: el.tagName,
        text: el.innerText || el.placeholder || el.value || '',
        id: el.id,
        cssClass: el.className
      })).filter(el => el.text || el.id);
    });
  }

  async executeStepWithAI(stepDescription, domState, currentUrl, contextDocs = '', actionHistory = []) {
    const prompt = `
Eres un agente de Playwright BDD (Spec-Driven Testing). 
Tu objetivo es traducir un paso BDD en una acción de Playwright, basándote ÚNICAMENTE en los elementos de la interfaz actuales.
${contextDocs}

Paso BDD a ejecutar: "${stepDescription}"
URL actual: ${currentUrl}

Historial de acciones YA EJECUTADAS para este paso (No las repitas):
${JSON.stringify(actionHistory, null, 2)}

Elementos interactivos en pantalla:
${JSON.stringify(domState, null, 2)}

Devuelve SOLO un JSON con este formato (nada de texto adicional):
{
  "action": "click" | "fill" | "verify" | "goto" | "done",
  "selector": "selector valido de Playwright. Si hay múltiples botones con el mismo texto, usa el motor de texto con pseudo-clase estricta, ej: text=Gestionar >> nth=0",
  "value": "valor a escribir, URL para goto, o verificar",
  "expected": "exists" | "not_exists" (solo si action es verify)
}
IMPORTANTE: Si consideras que el paso ya fue completado con las acciones previas o ya estás en el estado correcto, devuelve "action": "done".
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
