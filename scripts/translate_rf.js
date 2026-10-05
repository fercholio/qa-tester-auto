const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateRFStandard() {
  console.log('📖 Leyendo func_requirements_v2.md...');
  const rfPath = '/Users/fercho/dev/timetracking/docs/tempus_v2/func_requirements_v2.md';
  const rfContent = fs.readFileSync(rfPath, 'utf8');

  console.log('🤖 Leyendo el estándar ai_test_requirements_standard.md...');
  const standardPath = '/Users/fercho/.gemini/antigravity-ide/brain/75025ca7-d0f6-48a8-ab23-49ab90d21be9/ai_test_requirements_standard.md';
  const standardContent = fs.readFileSync(standardPath, 'utf8');

  console.log('🧠 Enviando a GroqVision/LLM para estructurar los requerimientos (Módulo Multi-Tenant)...');
  const prompt = `
    Eres un QA Automation Architect. 
    Tu objetivo es leer los siguientes Requerimientos Funcionales de Tempus V2:
    
    ${rfContent}

    Y traducirlos ESTRICTAMENTE al siguiente formato/plantilla para que puedan ser consumidos por un sistema E2E (Playwright).
    Formato requerido:
    ${standardContent}

    Por favor, genera la traducción SOLO para la sección "10. Módulo de Configuraciones por Inquilino (Tenant Settings)".
    Formatea la salida en Markdown válido.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-20b',
    temperature: 0.2,
    max_tokens: 4000
  });

  const markdownResult = response.choices[0].message.content;

  console.log('✅ Traducción completada. Generando reporte HTML...');

  const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Requerimientos Funcionales E2E (Standard Format)</title>
  <style>
    body { background: #0f172a; color: #e2e8f0; font-family: 'Inter', sans-serif; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; background: rgba(0,0,0,0.3); padding: 2rem; border-radius: 8px; border-left: 4px solid #3b82f6; }
    h1, h2, h3 { color: #60a5fa; }
    pre { background: #1e293b; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #a78bfa; }
    ul { margin-bottom: 1rem; }
    li { margin-bottom: 0.5rem; }
    .btn { display: inline-block; padding: 0.5rem 1rem; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 1rem; font-weight: bold; }
    .btn:hover { background: #2563eb; }
  </style>
  <!-- Marked JS para renderizar Markdown a HTML -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="container">
    <h1>📋 Especificación de Pruebas AI-QA (Módulo Configuración Empresa/Inquilino)</h1>
    <p>Este HTML contiene la traducción de los requerimientos funcionales originales al estándar AI-QA, generada por el script.</p>
    <div id="content" style="margin-top: 2rem; border-top: 1px solid #334155; padding-top: 1rem;"></div>
  </div>

  <script>
    const markdownText = \`${markdownResult.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    document.getElementById('content').innerHTML = marked.parse(markdownText);
  </script>
</body>
</html>
  `;

  const outputPath = path.join(__dirname, '../public/rf_standard_report_tenant_settings.html');
  fs.writeFileSync(outputPath, htmlReport);
  console.log('✅ HTML guardado en:', outputPath);
}

generateRFStandard().catch(console.error);
