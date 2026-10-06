const Groq = require('groq-sdk');
require('dotenv').config();

class GroqAdapter {
  constructor(apiKey) {
    this.groq = new Groq({ apiKey });
  }

  async _callWithRetry(params, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.groq.chat.completions.create(params);
      } catch (error) {
        attempt++;
        if (error.status === 429 && attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s...
          console.warn(`[GroqAdapter] 429 Rate limit hit. Retrying in ${waitMs}ms (Attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        } else {
          throw error;
        }
      }
    }
  }

  async generateTestActions(pageContext, testPlan, screenshotBase64 = null) {
    const prompt = `
Eres un ingeniero de QA Senior automatizador (Zero Mock).
Tu objetivo es leer el mapa de la interfaz actual (inputs, botones), ver la captura de pantalla de la página y un plan de pruebas (Markdown).
Debes deducir qué acciones tomar en Playwright para completar el test descrito en el plan.

--- PLAN DE PRUEBAS ---
${testPlan}

--- CONTEXTO DE LA PÁGINA ACTUAL ---
URL: ${pageContext.url}
Inputs disponibles (Selectores CSS): ${JSON.stringify(pageContext.inputs)}
Botones disponibles (Selectores CSS): ${JSON.stringify(pageContext.buttons)}
${pageContext.auth ? `\n--- CREDENCIALES DE PRUEBA (NO INVENTES DATOS) ---\nUsuario: ${pageContext.auth.user}\nContraseña: ${pageContext.auth.pass}` : ''}

--- REGLAS CRÍTICAS DE SELECTORES ---
1. Para cada acción, DEBES usar EXACTAMENTE la propiedad 'cssSelector' proporcionada en las listas de Inputs y Botones de arriba.
2. NUNCA inventes selectores CSS (como button:has-text('...')). Si en la lista aparece "cssSelector": "#theme-toggle", usa exactamente "#theme-toggle".
3. Si no encuentras un botón o input en las listas de arriba que se adapte al plan, ignora ese paso. NUNCA inventes un selector.

--- TAREA ---
Devuelve UNICAMENTE un objeto JSON con la llave "actions" que contenga el arreglo de acciones.
Tipos de acción soportados: "fill", "click", "wait", "assert".
Formato de aserciones: { "action": "assert", "selector": "css_selector", "assertion": "be.visible" | "have.text" | "be.disabled", "value": "texto opcional" }
Formato general: { "actions": [ { "action": "fill", "selector": "css_selector", "value": "text_to_fill" } ] }
NO DEVUELVAS NADA MÁS QUE EL JSON.`;

    const messages = [
      {
        role: "user",
        content: screenshotBase64 
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` } }
            ]
          : prompt
      }
    ];

    try {
      const completion = await this._callWithRetry({
        messages: messages,
        model: process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview',
        response_format: { type: 'json_object' }
      });

      let responseText = completion.choices[0]?.message?.content;
      // Extract JSON if it returned markdown block
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed) ? parsed : (parsed.actions || []);
    } catch (error) {
      console.warn("Groq Adapter Error, switching to deterministic fallback:", error.message);
      return this.generateFallbackActions(pageContext, testPlan);
    }
  }

  async healSelector(oldSelector, screenshotBase64) {
    const prompt = `
Eres un ingeniero de QA experto en auto-healing de pruebas (Self-Healing).
Nuestra prueba automatizada falló intentando interactuar con el selector CSS: '${oldSelector}'.
Al parecer, el desarrollador cambió el código, las clases CSS, o la estructura del DOM, por lo que este elemento ya no se encuentra.

Aquí tienes una captura de pantalla del estado ACTUAL de la aplicación.
Tu tarea es analizar visualmente la interfaz y deducir cuál podría ser el NUEVO selector CSS correcto para interactuar con ese mismo elemento.

Devuelve ÚNICAMENTE un objeto JSON con la llave "newSelector" que contenga el nuevo selector CSS.
Si es absolutamente imposible encontrar el elemento en la pantalla (ej. fue eliminado), devuelve null.
Formato: { "newSelector": ".nueva-clase" } o { "newSelector": null }
NO DEVUELVAS NADA MÁS QUE EL JSON.`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` } }
        ]
      }
    ];

    try {
      const completion = await this._callWithRetry({
        messages: messages,
        model: process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview',
        response_format: { type: 'json_object' }
      });
      let responseText = completion.choices[0]?.message?.content || '{}';
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }
      return JSON.parse(responseText).newSelector || null;
    } catch (e) {
      console.warn("[GroqAdapter] Fallo al intentar auto-heal del selector:", e.message);
      return null;
    }
  }

  generateFallbackActions(pageContext, testPlan) {
    const actions = [];
    
    // Fill all inputs deterministically
    if (pageContext.inputs && pageContext.inputs.length > 0) {
      pageContext.inputs.forEach(input => {
        let val = 'Test Value';
        if (input.type === 'email') val = 'test@example.com';
        if (input.type === 'number') val = '42';

        // Check if test plan or context hints at auth
        if (pageContext.auth && pageContext.auth.user && (input.type === 'email' || input.name === 'email' || input.id === 'email')) {
            val = pageContext.auth.user;
        }
        if (pageContext.auth && pageContext.auth.pass && (input.type === 'password' || input.name === 'password' || input.id === 'password')) {
            val = pageContext.auth.pass;
        }
        
        let selector = '';
        if (input.id) selector = `#${input.id}`;
        else if (input.name) selector = `input[name="${input.name}"]`;
        else if (input.type) selector = `input[type="${input.type}"]`;
        else selector = 'input';
        
        actions.push({ action: "fill", selector, value: val });
      });
    }

    // Click the primary/first button deterministically
    if (pageContext.buttons && pageContext.buttons.length > 0) {
      const btn = pageContext.buttons[0];
      let selector = btn.id ? `#${btn.id}` : (btn.class ? `.${btn.class.split(' ')[0]}` : 'button');
      actions.push({ action: "click", selector });
    }

    return actions;
  }

  async generateChaosActions(pageContext, screenshotBase64 = null) {
    const prompt = `
Eres un ingeniero de Chaos Testing / Monkey Tester.
Tu objetivo es intentar ROMPER la interfaz y descubrir vulnerabilidades (Fuzzing) usando datos inválidos o maliciosos (XSS, SQL Injection, números negativos extremos, strings kilométricos, Emojis).

--- CONTEXTO DE LA PÁGINA ACTUAL ---
URL: ${pageContext.url}
Inputs disponibles: ${JSON.stringify(pageContext.inputs)}
Botones disponibles: ${JSON.stringify(pageContext.buttons)}
${pageContext.auth ? `\n--- CREDENCIALES VÁLIDAS ---\nIMPORTANTE: Para los campos de Email y Password, usa SIEMPRE estos datos para pasar el login y atacar rutas internas: \nUsuario: ${pageContext.auth.user}\nContraseña: ${pageContext.auth.pass}` : ''}

--- TAREA ---
Devuelve UNICAMENTE un objeto JSON con la llave "actions" que contenga el arreglo de acciones destructivas.
Formato: { "actions": [ { "action": "fill" | "click" | "wait", "selector": "css", "value": "payload" } ] }
NO DEVUELVAS NADA MÁS QUE EL JSON.`;

    const messages = [{ role: "user", content: prompt }];

    try {
      const completion = await this._callWithRetry({
        messages: messages,
        model: process.env.GROQ_VERSATILE_MODEL || 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      let responseText = completion.choices[0]?.message?.content;
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed) ? parsed : (parsed.actions || []);
    } catch (error) {
      console.warn("Groq Chaos Error, switching to deterministic fallback:", error.message);
      return this.generateFallbackChaosActions(pageContext);
    }
  }

  generateFallbackChaosActions(pageContext) {
    const actions = [];
    const payloads = [
      "<script>alert(1)</script>",
      "' OR 1=1 --",
      "-999999999",
      "😀😂😎🔥".repeat(100),
      "A".repeat(10000)
    ];

    if (pageContext.inputs && pageContext.inputs.length > 0) {
      pageContext.inputs.forEach(input => {
        let selector = input.id ? `#${input.id}` : `input[name="${input.name}"]`;
        let randomPayload = payloads[Math.floor(Math.random() * payloads.length)];

        // Check if test plan or context hints at auth
        if (pageContext.auth && pageContext.auth.user && (input.type === 'email' || input.name === 'email' || input.id === 'email')) {
            randomPayload = pageContext.auth.user;
        }
        if (pageContext.auth && pageContext.auth.pass && (input.type === 'password' || input.name === 'password' || input.id === 'password')) {
            randomPayload = pageContext.auth.pass;
        }

        actions.push({ action: "fill", selector, value: randomPayload });
      });
    }

    if (pageContext.buttons && pageContext.buttons.length > 0) {
      pageContext.buttons.forEach(btn => {
        let selector = btn.id ? `#${btn.id}` : (btn.class ? `.${btn.class.split(' ')[0]}` : 'button');
        actions.push({ action: "click", selector });
      });
    }

    return actions;
  }

  async determineNextAction(pageContext, requirementText, screenshotBase64, history) {
    console.log("[DEBUG] pageContext.url:", pageContext.url);
    console.log("[DEBUG] pageContext.buttons for requirement:", requirementText.substring(0, 50));
    console.log(JSON.stringify(pageContext.buttons, null, 2));
    
    const historyText = history.map(h => `Paso ${h.step}: ${h.action.action} -> ${h.action.selector || ''}`).join('\n');
    const prompt = `
Eres un Agente de QA E2E (Interactive ReAct Agent). Tu objetivo es validar el siguiente requerimiento funcional interactuando con la interfaz:
"${requirementText}"

Historial de acciones ya realizadas:
${historyText || 'Ninguna'}

Contexto DOM actual:
URL: ${pageContext.url}
Inputs: ${JSON.stringify(pageContext.inputs)}
Buttons/Links: ${JSON.stringify(pageContext.buttons)}

Observa la captura de pantalla adjunta. Determina CUÁL DEBE SER EL SIGUIENTE PASO ÚNICO para cumplir el objetivo.
Si el requerimiento ya se cumplió o es verificable en pantalla, responde con una acción 'success'.
Si no hay forma de avanzar (ej. falta un botón indispensable), responde 'fail'.

Debes devolver EXCLUSIVAMENTE un JSON con el siguiente formato, sin texto adicional:
{
  "action": "click|fill|wait|success|fail",
  "selector": "selector CSS si aplica",
  "value": "valor a escribir o tiempo de espera si aplica",
  "reason": "breve justificación de tu decisión"
}

IMPORTANTE: DEBES priorizar fuertemente utilizar el 'cssSelector' que contiene '[data-testid="..."]' o '#id' en lugar de los selectores que usan 'text="..."'. Los selectores con 'text=' son inestables. SI Y SOLO SI el único selector disponible para un elemento es 'text="..."', entonces puedes usarlo. Nunca inventes selectores, usa los que se te proveen.
Si el requerimiento te pide adjuntar o subir un archivo, DEBES utilizar la acción 'fill' en el selector del 'input' tipo 'file', pasando como 'value' el nombre de un archivo (ej: 'test.pdf').`;

    try {
      const messages = [
        {
          role: "user",
          content: prompt
        }
      ];

      const completion = await this._callWithRetry({
        messages: messages,
        model: process.env.GROQ_VERSATILE_MODEL || 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' }
      });
      const responseText = completion.choices[0].message.content.trim();
      return JSON.parse(responseText);
    } catch (error) {
      console.warn(`[GroqAdapter] Error in determineNextAction: ${error.message}`);
      return { action: 'wait', value: 2000, reason: 'Fallback by error: ' + error.message };
    }
  }
}
module.exports = GroqAdapter;
