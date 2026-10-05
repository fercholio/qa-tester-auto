const io = require('socket.io-client');
const fs = require('fs');
require('dotenv').config();

const socket = io('http://localhost:4000');

const authConfig = {
  loginUrl: 'http://localhost:3000/login',
  user: 'gerente@ilco.com',
  pass: 'password',
  userSel: 'input[type="email"], input[name*="user"], input[name*="email"]',
  passSel: 'input[type="password"]',
  submitSel: 'button[type="submit"], form button, .btn-primary'
};

const groqApiKey = process.env.GROQ_API_KEY;

const modulesToTest = [
  'http://localhost:3000/dashboard',
  'http://localhost:3000/home'
];
let currentModuleIndex = 0;
let aggregatedStats = [];

function startNextModule() {
  if (currentModuleIndex >= modulesToTest.length) {
    console.log('✅ Todos los módulos han sido probados.');
    generateFinalHTMLReport();
    process.exit(0);
    return;
  }
  
  const targetUrl = modulesToTest[currentModuleIndex];
  console.log(`\n🚀 [MÓDULO ${currentModuleIndex + 1}/${modulesToTest.length}] Solicitando crawling para: ${targetUrl}`);
  
  socket.emit('start_crawler', {
    url: targetUrl,
    maxPages: 1, // Modular: solo escaneamos esta ruta (depth 0/1)
    auth: authConfig
  });
}

socket.on('connect', () => {
  console.log('✅ Cliente conectado al backend.');
  startNextModule();
});

let currentSurfaceMap = [];

socket.on('status_update', (stats) => {
  console.log('📊 Estado de rastreo:', stats);
});

socket.on('crawler_finished', (results) => {
  if (!results || results.length === 0) {
    console.error('❌ Módulo vacío o fallido, saltando...');
    currentModuleIndex++;
    return startNextModule();
  }
  
  console.log(`✅ Crawling finalizado para módulo. Rutas: ${results.length}`);
  currentSurfaceMap = results;
  
  console.log('🤖 Solicitando generación de Test Plan a Groq...');
  socket.emit('generate_test_plan', {
    surfaceMap: currentSurfaceMap,
    apiKey: groqApiKey
  });
});

socket.on('test_plan_ready', (plan) => {
  console.log(`✅ Test Plan generado con ${plan.length} casos. (Primero: ${plan[0]?.title})`);
  
  console.log('▶️ Ejecutando AI Test Suite para este módulo...');
  socket.emit('start_ai_test_suite', {
    tests: plan.slice(0, 1), // Ejecutamos 1 caso por módulo para ahorrar tokens
    apiKey: groqApiKey,
    auth: authConfig
  });
});

socket.on('test_plan_error', () => {
  console.error('❌ Error generando Test Plan. Saltando al siguiente módulo...');
  currentModuleIndex++;
  startNextModule();
});

socket.on('execution_stats', (stats) => {
  stats.moduleUrl = modulesToTest[currentModuleIndex];
  aggregatedStats.push(stats);
});

socket.on('ai_test_finished', () => {
  console.log('✅ Módulo finalizado.');
  currentModuleIndex++;
  startNextModule();
});

socket.on('log', (data) => {
  const color = data.type === 'error' ? '\\x1b[31m' : (data.type === 'warning' ? '\\x1b[33m' : (data.type === 'success' ? '\\x1b[32m' : '\\x1b[37m'));
  console.log(`${color}[${data.type.toUpperCase()}] ${data.message}\\x1b[0m`);
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
      <h2>Módulo: ${stats.moduleUrl}</h2>
      <div class="metric">Acciones Ejecutadas: <span>${stats.actionsExecuted}</span></div>
      <div class="metric">Errores Detectados: <span style="color: ${stats.errorsDetected > 0 ? '#e74c3c' : '#2ecc71'}">${stats.errorsDetected}</span></div>
      
      ${stats.recommendations && stats.recommendations.length > 0 ? `
      <div style="margin-top: 1rem; background: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; padding: 1rem; border-radius: 4px;">
        <h3 style="color: #e74c3c; margin-top: 0;">💡 Sugerencias Proactivas</h3>
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
            <code style="color: #60a5fa; background: rgba(0,0,0,0.5); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem;">${action.selector}</code>
          </div>
          ${action.value ? `<div style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.5rem;">Valor: ${action.value}</div>` : ''}
          <div style="margin-bottom: 0.5rem;">
            Estado: <span class="${action.status.includes('success') ? 'status-success' : 'status-failed'}">${action.status === 'success' ? 'Éxito' : (action.status.includes('auto-healed') ? 'Éxito (Auto-Healed)' : 'Fallido')}</span>
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
  <title>Modular E2E Report</title>
  <style>
    body { background: #0f172a; color: #e2e8f0; font-family: sans-serif; padding: 2rem; }
    .card { background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; max-width: 800px; margin: 0 auto; border-left: 4px solid #3498db; }
    h1 { text-align: center; color: #fff; margin-bottom: 2rem; }
    h2 { color: #3498db; margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
    .metric { margin: 10px 0; font-size: 1.1rem; }
    .metric span { font-weight: bold; color: #fff; }
    .step { background: rgba(255,255,255,0.05); padding: 1rem; margin-top: 1rem; border-radius: 6px; }
    .step-img { max-width: 100%; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; }
    .status-success { color: #2ecc71; font-weight: bold; }
    .status-failed { color: #e74c3c; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Reporte de Pruebas Modular (SOLID Architecture)</h1>
  <div style="text-align: center; margin-bottom: 2rem;">Total de acciones probadas exitosamente: <strong>${totalActions}</strong></div>
  ${htmlModules}
</body>
</html>`;
  
  const reportPath = require('path').join(__dirname, 'e2e_report.html');
  fs.writeFileSync(reportPath, htmlReport);
  console.log(`\n✅ Reporte Modular HTML generado en: ${reportPath}`);
}
