const GroqAdapter = require('../infrastructure/GroqAdapter');

class AiPlanGenerator {
  constructor(apiKey) {
    this.groqAdapter = new GroqAdapter(apiKey);
  }

  async generateTestPlan(surfaceMap) {
    const plans = [];
    
    // Chunk surfaceMap into batches of 3 to avoid LLM token limits and ensure depth
    const chunkSize = 3;
    const chunks = [];
    for (let i = 0; i < surfaceMap.length; i += chunkSize) {
      chunks.push(surfaceMap.slice(i, i + chunkSize));
    }

    // Process chunks sequentially to not hammer the API too hard (or Promise.all for speed)
    for (const chunk of chunks) {
      const prompt = `
Eres un ingeniero de QA Senior automatizador (Zero Mock).
Tu objetivo es leer un mapa JSON de la superficie interactiva de una aplicación y proponer un plan de pruebas end-to-end.

--- SUPERFICIE DESCUBIERTA (Lote actual: ${chunk.length} rutas) ---
${JSON.stringify(chunk, null, 2)}

--- TAREA ---
Identifica los flujos de prueba complejos basados en los inputs y botones encontrados.
IMPORTANTE: Como Senior QA, no te limites a casos "Happy Path" básicos de llenar formularios. 
Diseña casos DEEP y AVANZADOS (Edge Cases, Validation Testing, Inyección de datos anómalos, Flujos de Negocio Complejos, etc).
INCLUYE ASERCIONES EXPLÍCITAS en tus pasos de prueba (ej. "Validar que el texto X exista", "Validar que el botón se deshabilite", "Validar que aparezca un toast de éxito").
Debes generar AL MENOS 1 caso de prueba por CADA RUTA / URL que veas en el arreglo.
Devuelve UNICAMENTE un objeto JSON con la propiedad "plans" que contenga el arreglo de propuestas.
Formato:
{
  "plans": [
    {
      "id": "identificador_unico",
      "title": "Título de la prueba",
      "description": "Descripción corta",
      "startUrl": "URL donde inicia",
      "stepsMarkdown": "Instrucciones paso a paso en texto que luego leerá otra IA"
    }
  ]
}
NO DEVUELVAS NADA MÁS QUE EL OBJETO JSON.`;

      try {
        const completion = await this.groqAdapter._callWithRetry({
          messages: [{ role: 'user', content: prompt }],
          model: process.env.GROQ_VERSATILE_MODEL || 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' }
        });

        let responseText = completion.choices[0]?.message?.content;
        if (responseText.includes('```json')) {
          responseText = responseText.split('```json')[1].split('```')[0];
        }
        
        const parsed = JSON.parse(responseText);
        const chunkPlans = Array.isArray(parsed) ? parsed : (parsed.plans || parsed.tests || []);
        plans.push(...chunkPlans);
      } catch (error) {
        console.warn("Groq Plan Error for chunk, switching to fallback for this chunk:", error.message);
        plans.push(...this.generateFallbackPlan(chunk));
      }
    }
    
    return plans;
  }

  generateFallbackPlan(surfaceMap) {
    const plans = [];
    let idCounter = 1;

    for (const page of surfaceMap) {
      if ((page.inputs && page.inputs.length > 0) || (page.buttons && page.buttons.length > 0)) {
        plans.push({
          id: `fallback_test_${idCounter++}`,
          title: `[Local Fallback] Interacción básica en ${new URL(page.url).pathname || '/'}`,
          description: `Generado algorítmicamente. Detectados ${page.inputs.length} inputs y ${page.buttons.length} botones.`,
          startUrl: page.url,
          stepsMarkdown: `1. Navegar a ${page.url}\n2. Llenar inputs disponibles con datos de prueba genéricos.\n3. Presionar el primer botón principal.\n4. Validar que la interfaz cambie de estado o muestre un mensaje.`
        });
      }
    }
    
    // Add a global monkey test plan
    plans.push({
      id: `fallback_monkey`,
      title: `[Local Fallback] Fuzzing / Monkey Test Global`,
      description: `Ejecuta ataques aleatorios y rápidos en todas las rutas para detectar errores 500.`,
      startUrl: surfaceMap[0]?.url || 'http://localhost:3000',
      stepsMarkdown: `1. Iniciar en la ruta principal.\n2. Inyectar payloads maliciosos y strings excesivos en todos los inputs.\n3. Monitorear degradación y excepciones crudas.`
    });

    return plans;
  }
}

module.exports = AiPlanGenerator;
