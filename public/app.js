const socket = io();

const form = document.getElementById('crawler-form');
const startBtn = document.getElementById('startBtn');
const btnText = startBtn.querySelector('.btn-text');
const btnLoader = document.getElementById('btnLoader');
const terminal = document.getElementById('terminal');
const mapList = document.getElementById('map-list');

const statPages = document.getElementById('stat-pages');
const statForms = document.getElementById('stat-forms');
const statInputs = document.getElementById('stat-inputs');
const statButtons = document.getElementById('stat-buttons');

function addLog(type, message) {
  const el = document.createElement('div');
  el.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  el.innerText = `[${time}] ${message}`;
  terminal.appendChild(el);
  terminal.scrollTop = terminal.scrollHeight;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const startUrl = document.getElementById('startUrl').value;
  const maxPages = parseInt(document.getElementById('maxPages').value, 10);
  
  const authConfig = {
    loginUrl: document.getElementById('authLoginUrl').value,
    user: document.getElementById('authUser').value,
    pass: document.getElementById('authPass').value,
    userSel: document.getElementById('authUserSel').value,
    passSel: document.getElementById('authPassSel').value,
    submitSel: document.getElementById('authSubmitSel').value,
  };

  terminal.innerHTML = '';
  mapList.innerHTML = '';
  const seoContainer = document.getElementById('seoAuditContainer');
  if (seoContainer) seoContainer.innerHTML = ''; // Limpiar resultados SEO previos

  startBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'block';

  socket.emit('start_crawler', { startUrl, maxPages, auth: authConfig });
});

socket.on('log', (data) => {
  addLog(data.type, data.message);
});

socket.on('status_update', (data) => {
  statPages.innerText = data.pages;
  statForms.innerText = data.forms;
  statInputs.innerText = data.inputs;
  statButtons.innerText = data.buttons;
});

socket.on('page_analyzed', (data) => {
  const emptyText = mapList.querySelector('.empty-text');
  if (emptyText) emptyText.remove();

  const item = document.createElement('div');
  item.className = 'map-item';
  item.innerHTML = `
    <div class="map-item-url">${data.url}</div>
    <div class="map-item-stats">
      <span class="map-badge">${data.forms} Forms</span>
      <span class="map-badge">${data.inputs} Inputs</span>
      <span class="map-badge">${data.buttons} Buttons</span>
    </div>
  `;
  mapList.appendChild(item);
  mapList.scrollTop = mapList.scrollHeight;

  // Actualización en tiempo real del SEO Audit Tab
  const seoContainer = document.getElementById('seoAuditContainer');
  const seoEmpty = seoContainer.querySelector('p');
  if (seoEmpty) seoEmpty.remove();

  if (data.a11y && data.a11y.length > 0) {
    const seoItem = document.createElement('div');
    seoItem.style.cssText = "background: rgba(255,0,0,0.1); padding: 1rem; margin-bottom:1rem; border-left: 4px solid #e74c3c;";
    seoItem.innerHTML = `
      <h4 style="margin-bottom: 0.5rem; color: #e74c3c;">📍 ${data.url}</h4>
      <ul style="padding-left: 1.5rem; color: var(--text-light);">
        ${data.a11y.map(a => `<li>⚠️ ${a}</li>`).join('')}
      </ul>
    `;
    seoContainer.appendChild(seoItem);
  }
});

let currentSurfaceMap = null;
let currentProposedPlan = null;

const generatePlanBtn = document.getElementById('generatePlanBtn');
const generateLoader = document.getElementById('generateLoader');
const generateBtnText = generatePlanBtn.querySelector('.btn-text');
const testPlanContainer = document.getElementById('testPlanContainer');
const testCasesList = document.getElementById('testCasesList');
const executeSelectedBtn = document.getElementById('executeSelectedBtn');
const executeLoader = document.getElementById('executeLoader');
const executeBtnText = executeSelectedBtn.querySelector('.btn-text');

socket.on('crawler_finished', (surfaceMap) => {
  startBtn.disabled = false;
  btnText.style.display = 'block';
  btnLoader.style.display = 'none';
  
  if (surfaceMap && surfaceMap.length > 0) {
    currentSurfaceMap = surfaceMap;
    localStorage.setItem('lastSurfaceMap', JSON.stringify(surfaceMap));
    generatePlanBtn.disabled = false;
  }
});

generatePlanBtn.addEventListener('click', () => {
  const apiKey = document.getElementById('groqKeyStep2').value;
  if (!apiKey) return alert("API Key requerida");
  
  generatePlanBtn.disabled = true;
  generateBtnText.style.display = 'none';
  generateLoader.style.display = 'block';
  
  socket.emit('generate_test_plan', { apiKey, surfaceMap: currentSurfaceMap });
});

socket.on('test_plan_ready', (plan) => {
  generatePlanBtn.disabled = false;
  generateBtnText.style.display = 'block';
  generateLoader.style.display = 'none';
  
  currentProposedPlan = plan;
  testPlanContainer.style.display = 'block';
  testCasesList.innerHTML = '';
  
  plan.forEach((testCase, index) => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.gap = '0.5rem';
    label.style.alignItems = 'start';
    label.style.cursor = 'pointer';
    
    label.innerHTML = `
      <input type="checkbox" class="test-checkbox" data-index="${index}" checked>
      <div>
        <strong style="display: block; color: var(--text-light);">${testCase.title}</strong>
        <span style="font-size: 0.8rem; color: var(--text-main);">${testCase.description}</span>
      </div>
    `;
    testCasesList.appendChild(label);
  });
});

socket.on('test_plan_error', () => {
  generatePlanBtn.disabled = false;
  generateBtnText.style.display = 'block';
  generateLoader.style.display = 'none';
});

const chaosBtn = document.getElementById('chaosBtn');
const chaosLoader = document.getElementById('chaosLoader');
const chaosBtnText = chaosBtn.querySelector('.btn-text');

const unitTestBtn = document.getElementById('unitTestBtn');
const unitLoader = document.getElementById('unitLoader');
const unitBtnText = unitTestBtn.querySelector('.btn-text');

executeSelectedBtn.addEventListener('click', () => {
  const apiKey = document.getElementById('groqKeyStep2').value;
  const checkboxes = document.querySelectorAll('.test-checkbox:checked');
  const selectedTests = Array.from(checkboxes).map(cb => currentProposedPlan[cb.dataset.index]);
  
  if (selectedTests.length === 0) return alert("Selecciona al menos una prueba");
  
  executeSelectedBtn.disabled = true;
  executeBtnText.style.display = 'none';
  executeLoader.style.display = 'block';
  
  const authConfig = {
    loginUrl: document.getElementById('authLoginUrl').value,
    user: document.getElementById('authUser').value,
    pass: document.getElementById('authPass').value,
    userSel: document.getElementById('authUserSel').value,
    passSel: document.getElementById('authPassSel').value,
    submitSel: document.getElementById('authSubmitSel').value,
  };

  socket.emit('start_ai_test_suite', { 
    tests: selectedTests,
    apiKey, 
    auth: authConfig
  });
});

chaosBtn.addEventListener('click', () => {
  const apiKey = document.getElementById('groqKeyStep2').value;
  if (!apiKey) return alert("API Key requerida");
  
  const startUrl = currentSurfaceMap && currentSurfaceMap.length > 0 ? currentSurfaceMap[0].url : document.getElementById('startUrl').value;
  
  chaosBtn.disabled = true;
  chaosBtnText.style.display = 'none';
  chaosLoader.style.display = 'block';
  
  const authConfig = {
    loginUrl: document.getElementById('authLoginUrl').value,
    user: document.getElementById('authUser').value,
    pass: document.getElementById('authPass').value,
    userSel: document.getElementById('authUserSel').value,
    passSel: document.getElementById('authPassSel').value,
    submitSel: document.getElementById('authSubmitSel').value,
  };

  socket.emit('start_chaos_test', { startUrl, apiKey, auth: authConfig });
});

unitTestBtn.addEventListener('click', () => {
  const apiKey = document.getElementById('groqKeyStep2').value;
  const filePath = document.getElementById('unitFilePath').value;
  if (!apiKey) return alert("API Key requerida");
  if (!filePath) return alert("Ruta del archivo requerida");
  
  unitTestBtn.disabled = true;
  unitBtnText.style.display = 'none';
  unitLoader.style.display = 'block';
  
  socket.emit('start_unit_test_gen', { filePath, apiKey });
});

socket.on('ai_test_finished', () => {
  executeSelectedBtn.disabled = false;
  executeBtnText.style.display = 'block';
  executeLoader.style.display = 'none';
});

socket.on('chaos_test_finished', () => {
  chaosBtn.disabled = false;
  chaosBtnText.style.display = 'block';
  chaosLoader.style.display = 'none';
});

socket.on('unit_test_finished', () => {
  unitTestBtn.disabled = false;
  unitBtnText.style.display = 'block';
  unitLoader.style.display = 'none';
});

socket.on('unit_test_error', () => {
  unitTestBtn.disabled = false;
  unitBtnText.style.display = 'block';
  unitLoader.style.display = 'none';
});

socket.on('unit_test_result', (result) => {
  const container = document.getElementById('testResultsContainer');
  container.style.display = 'block';

  const metricsContainer = document.getElementById('testMetrics');
  metricsContainer.innerHTML = `
    <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #9b59b6;">
      <h3 style="color: #9b59b6; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">Reporte: Prueba Unitaria (Static Analysis)</h3>
      <p style="color: #2ecc71; margin-bottom: 0.5rem;"><strong>✓ Archivo guardado en:</strong><br><span style="color: var(--text-main); font-family: monospace;">${result.path}</span></p>
      
      <div style="margin-top: 1rem; background: #1e1e1e; padding: 1rem; border-radius: 6px; overflow-x: auto; max-height: 400px; overflow-y: auto;">
        <pre><code style="color: #d4d4d4; font-family: monospace; font-size: 0.9rem;">${result.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
    </div>
  `;
  
  // Clean up chart if any
  const ctx = document.getElementById('resultsChart').getContext('2d');
  ctx.clearRect(0, 0, 400, 400);
  if (resultsChartInstance) {
    resultsChartInstance.destroy();
    resultsChartInstance = null;
  }
  
  container.scrollIntoView({ behavior: 'smooth' });
});

let resultsChartInstance = null;

socket.on('execution_stats', (stats) => {
  const container = document.getElementById('testResultsContainer');
  container.style.display = 'block';

  const metricsContainer = document.getElementById('testMetrics');
  metricsContainer.innerHTML = `
    <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--primary);">
      <h3 style="color: var(--primary); margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">Reporte de Inteligencia QA: ${stats.type}</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <p style="color: var(--text-light); font-size: 0.9rem;">Total Pasos Inyectados:</p>
          <p style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">${stats.actionsExecuted}</p>
        </div>
        <div>
          <p style="color: var(--text-light); font-size: 0.9rem;">Crashes / Regresiones:</p>
          <p style="font-size: 1.5rem; font-weight: bold; color: ${stats.errorsDetected > 0 ? '#e74c3c' : '#2ecc71'};">${stats.errorsDetected}</p>
        </div>
        <div>
          <p style="color: var(--text-light); font-size: 0.9rem;">Tiempo de Ejecución:</p>
          <p style="font-size: 1.2rem; color: #f1c40f;">${stats.durationSecs || 0}s</p>
        </div>
        <div>
          <p style="color: var(--text-light); font-size: 0.9rem;">Cobertura Lograda:</p>
          <p style="font-size: 1.2rem; color: #3498db;">${stats.coverage?.inputs || 0} Inputs / ${stats.coverage?.clicks || 0} Clicks</p>
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 6px; font-size: 0.85rem; line-height: 1.4;">
        <p style="color: #2ecc71; margin-bottom: 0.5rem;"><strong>✓ Scripts E2E Generados (Devs):</strong><br><span style="color: var(--text-main); font-family: monospace;">${stats.scriptPath}</span></p>
        <p style="color: #f39c12;"><strong>✓ Trazabilidad JSON (QA Manager):</strong><br><span style="color: var(--text-main); font-family: monospace;">${stats.logsPath || 'Trazabilidad step-by-step en /logs/'}</span></p>
      </div>
    </div>
  `;

  const ctx = document.getElementById('resultsChart').getContext('2d');
  
  if (resultsChartInstance) {
    resultsChartInstance.destroy();
  }

  resultsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pasos Exitosos', 'Fallas/Crashes'],
      datasets: [{
        data: [stats.actionsExecuted, stats.errorsDetected],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderColor: ['#27ae60', '#c0392b'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ffffff' } },
        title: { display: true, text: 'Métricas de Ejecución', color: '#ffffff' }
      }
    }
  });
  
  // Auto-scroll to results
  container.scrollIntoView({ behavior: 'smooth' });
});
