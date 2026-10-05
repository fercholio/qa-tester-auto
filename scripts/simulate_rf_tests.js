const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const socket = io('http://localhost:4000');

const authConfig = {
  loginUrl: 'http://localhost:3000/',
  user: 'admin@ilco.com',
  pass: 'password'
};

const groqApiKey = process.env.GROQ_API_KEY;

// Requerimientos Funcionales extraídos y convertidos a Test Plan
const testCases = [
  {
    title: 'RF-5.1 y RF-5.2 - Captura de Tiempo (Manual e Inferencia IA)',
    startUrl: 'http://localhost:3000/tracker',
    stepsMarkdown: `
1. Navegar a la pantalla del Tracker de tiempo (/tracker).
2. Llenar el input de descripción con la tarea "Desarrollo de nueva interfaz y refactorización".
3. Hacer clic en el botón de guardar o capturar tiempo.
4. (Assert) Validar que aparezca un elemento o texto confirmando que el registro se ha guardado exitosamente o que la lista de tiempo se haya actualizado.`
  },
  {
    title: 'RF-10.2 - Configuraciones por Inquilino (Tenant Settings - Acceso)',
    startUrl: 'http://localhost:3000/settings',
    stepsMarkdown: `
1. Navegar a la pantalla de Configuraciones (/settings).
2. Intentar buscar o modificar un campo de configuración de la empresa (ej. zona horaria o días laborables).
3. Hacer clic en el botón de guardar configuraciones.
4. (Assert) Validar que se muestre un mensaje de éxito al actualizar la configuración.`
  }
];

let aggregatedStats = [];

socket.on('connect', () => {
  console.log('✅ Cliente conectado al backend. Iniciando suite de pruebas basadas en RF...');
  
  socket.emit('start_ai_test_suite', {
    tests: testCases,
    apiKey: groqApiKey,
    auth: authConfig
  });
});

socket.on('execution_stats', (stats) => {
  aggregatedStats.push(stats);
});

socket.on('ai_test_finished', () => {
  console.log('✅ AI Test Suite finalizada.');
  generateFinalHTMLReport();
  process.exit(0);
});

socket.on('log', (data) => {
  const color = data.type === 'error' ? '\x1b[31m' : (data.type === 'warning' ? '\x1b[33m' : (data.type === 'success' ? '\x1b[32m' : '\x1b[37m'));
  console.log(`${color}[${data.type.toUpperCase()}] ${data.message}\x1b[0m`);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error de conexión Socket.io:', err.message);
  process.exit(1);
});

function generateFinalHTMLReport() {
  let totalActions = 0;
  let htmlModules = '';

  aggregatedStats.forEach((stats, idx) => {
    totalActions += stats.actionsExecuted;
    htmlModules += `
    <div class="card" style="margin-bottom: 2rem;">
      <h2>Resultado: ${stats.type || 'Ejecución de Suite'}</h2>
      <div class="metric">Acciones Ejecutadas: <span>${stats.actionsExecuted}</span></div>
      <div class="metric">Errores Detectados: <span style="color: ${stats.errorsDetected > 0 ? '#e74c3c' : '#2ecc71'}">${stats.errorsDetected}</span></div>
      
      ${stats.recommendations && stats.recommendations.length > 0 ? `
      <div style="margin-top: 1rem; background: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; padding: 1rem; border-radius: 4px;">
        <h3 style="color: #e74c3c; margin-top: 0;">💡 Sugerencias Proactivas (Auto-Healer)</h3>
        <ul style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 0;">
          ${stats.recommendations.map(r => `<li style="margin-bottom: 0.5rem;">${r}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${stats.detailedActions && stats.detailedActions.length > 0 ? `
      <h3 style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">Trazabilidad Paso a Paso</h3>
      ${stats.detailedActions.map((action, index) => `
        <div class="step">
          <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">
            <strong>Paso ${index + 1}:</strong> <span style="text-transform: uppercase;">${action.action}</span> 
            <code style="color: #60a5fa; background: rgba(0,0,0,0.5); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem;">${action.selector || ''}</code>
          </div>
          ${action.value ? `<div style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.5rem;">Valor Inyectado: ${action.value}</div>` : ''}
          <div style="margin-bottom: 0.5rem;">
            Estado: <span class="${action.status && action.status.includes('success') ? 'status-success' : 'status-failed'}">${action.status === 'success' ? 'Éxito' : (action.status && action.status.includes('auto-healed') ? 'Éxito (Auto-Healed)' : 'Fallido')}</span>
            ${action.error ? `<br><span style="color: #e74c3c; font-size: 0.85rem;">Error: ${action.error}</span>` : ''}
          </div>
          ${action.vrt ? `
          <div style="margin-top: 0.5rem; font-size: 0.85rem; padding: 0.5rem; background: ${action.vrt.match || action.vrt.isNewBaseline ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; border-left: 3px solid ${action.vrt.match || action.vrt.isNewBaseline ? '#2ecc71' : '#e74c3c'};">
            <strong>VRT (Visual Regression):</strong> 
            ${action.vrt.isNewBaseline ? 'Nuevos baselines creados.' : (action.vrt.match ? 'Sin diferencias visuales detectadas.' : `<span style="color: #e74c3c">Falló (${action.vrt.percentage.toFixed(2)}% de diferencia detectada).</span>`)}
            ${action.vrt.diffPath ? `<br><img src="file://${action.vrt.diffPath}" class="step-img" style="border-color: #e74c3c;" alt="VRT Diff" />` : ''}
          </div>
          ` : ''}
          ${action.screenshot ? `<img src="file://${action.screenshot}" class="step-img" alt="Paso ${index + 1}" />` : ''}
        </div>
      `).join('')}
      ` : ''}
    </div>
    `;
  });

  const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Funcional de Pruebas (E2E)</title>
  <style>
    body { background: #0f172a; color: #e2e8f0; font-family: sans-serif; padding: 2rem; }
    .card { background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; max-width: 900px; margin: 0 auto; border-left: 4px solid #3b82f6; }
    h1 { text-align: center; color: #fff; margin-bottom: 2rem; }
    h2 { color: #3b82f6; margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
    .metric { margin: 10px 0; font-size: 1.1rem; }
    .metric span { font-weight: bold; color: #fff; }
    .step { background: rgba(255,255,255,0.05); padding: 1rem; margin-top: 1rem; border-radius: 6px; }
    .step-img { max-width: 100%; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; }
    .status-success { color: #2ecc71; font-weight: bold; }
    .status-failed { color: #e74c3c; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Reporte de Pruebas Funcionales: Módulo de Captura y Configuraciones</h1>
  <p style="text-align: center; max-width: 800px; margin: 0 auto 2rem auto; color: #94a3b8;">
    Este reporte fue generado de manera autónoma. La IA tomó los requerimientos funcionales, ingresó a la aplicación, navegó y aplicó las pruebas con Aserciones VRT y Self-Healing en tiempo real.
  </p>
  <div style="text-align: center; margin-bottom: 2rem;">Total de acciones ejecutadas en UI: <strong>${totalActions}</strong></div>
  ${htmlModules}
</body>
</html>`;
  
  const reportPath = path.join(__dirname, '../public/rf_e2e_report.html');
  fs.writeFileSync(reportPath, htmlReport);
  console.log(`\\n✅ Reporte Funcional HTML de ejecución de pruebas generado en: ${reportPath}`);
}
