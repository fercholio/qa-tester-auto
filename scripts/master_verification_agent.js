const fs = require('fs');
const path = require('path');
const AuthManager = require('../src/usecases/AuthManager');
const InteractiveTestRunner = require('../src/usecases/InteractiveTestRunner');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Definición de Roles a probar
const ROLES = [
  { name: 'Super Admin', email: 'reinhard.stark@example.com', pass: 'password' },
  { name: 'Gerente / Dueño Empresa', email: 'gerente@ilco.com', pass: 'password' },
  { name: 'Empleado (Solo Lectura)', email: 'coordinador1@ilco.com', pass: 'password' }
];

// Requerimientos Extraídos Dinámicamente de func_requirements_v2.md
function extractRequirements() {
  const reqPath = path.join(__dirname, '../../timetracking/docs/tempus_v2/func_requirements_v2.md');
  const content = fs.readFileSync(reqPath, 'utf8');
  const lines = content.split('\n');
  const requirements = [];
  let currentModule = 'General';

  lines.forEach(line => {
    if (line.startsWith('## ')) {
      currentModule = line.replace('## ', '').trim();
    } else if (line.match(/^\*\*RF-\d+\.\d+:/)) {
      const match = line.match(/^\*\*(RF-\d+\.\d+):\s*(.*?)\.\*\*(.*)/);
      if (match) {
        requirements.push({
          id: match[1],
          module: currentModule,
          title: match[2].trim(),
          description: match[3].trim()
        });
      } else {
         // Fallback regex
         const simpleMatch = line.match(/^\*\*(RF-\d+\.\d+.*?\*\*.*)/);
         if (simpleMatch) {
            requirements.push({
               id: line.split(':')[0].replace('**', ''),
               module: currentModule,
               title: line,
               description: line
            });
         }
      }
    }
  });
  return requirements;
}

async function runMasterVerification() {
  console.log('🚀 Iniciando Master Verification Agent (Fase 3: ReAct Step-by-Step)...');
  
  const requirements = extractRequirements();
  console.log(`✅ ${requirements.length} Requerimientos Funcionales parseados desde la documentación.`);
  
  const runner = new InteractiveTestRunner(GROQ_API_KEY);
  const reportData = [];

  for (const role of ROLES) {
    console.log(`\n======================================================`);
    console.log(`👤 Iniciando Pruebas para Rol: ${role.name}`);
    console.log(`======================================================\n`);
    
    const authManager = new AuthManager({
      loginUrl: 'http://localhost:3000/login',
      user: role.email,
      pass: role.pass
    });

    let statePath = null;
    try {
      statePath = await authManager.authenticate();
      console.log(`✅ Login Exitoso para ${role.name}`);
    } catch(e) {
      console.error(`❌ Error de Login para ${role.name}. Saltando rol...`);
      continue;
    }

    // Iterar sobre cada requerimiento (o una muestra si se interrumpe)
    for (const req of requirements) {
      console.log(`\n▶️ Testeando: ${req.id} - ${req.title} (Rol: ${role.name})`);
      const objectiveText = `Eres un empleado con rol '${role.name}'. Demuestra o verifica el siguiente requerimiento en el sistema: ${req.id} - ${req.title}. Detalle: ${req.description}`;
      
      try {
        const result = await runner.runRequirement('http://localhost:3000/dashboard', objectiveText, statePath);
        
        reportData.push({
          role: role.name,
          module: req.module,
          reqId: req.id,
          title: req.title,
          status: result.status,
          reason: result.reason,
          steps: result.stepsTaken,
          screenshot: result.screenshot
        });

        generateHTMLReport(reportData); // Update report in real-time
        console.log(`   └─ Resultado: ${result.status.toUpperCase()} (${result.stepsTaken} pasos)`);
      } catch(err) {
         console.error(`   └─ Error Fatal: ${err.message}`);
         reportData.push({
          role: role.name,
          module: req.module,
          reqId: req.id,
          title: req.title,
          status: 'error',
          reason: err.message,
          steps: 0,
          screenshot: null
        });
      }
    }
  }

  console.log(`\n🎉 Verificación Maestra Finalizada. Reporte guardado en public/master_verification_report.html`);
}

function generateHTMLReport(data) {
  let tableRows = data.map(d => `
    <tr>
      <td>${d.role}</td>
      <td>${d.module}</td>
      <td><strong>${d.reqId}</strong></td>
      <td>${d.title}</td>
      <td class="status-${d.status}">${d.status.toUpperCase()}</td>
      <td>${d.steps}</td>
      <td>${d.reason || 'OK'}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Master Verification Report (Tempus V2)</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { color: #3b82f6; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; background: rgba(0,0,0,0.2); }
    th, td { border: 1px solid rgba(255,255,255,0.1); padding: 12px; text-align: left; }
    th { background: rgba(255,255,255,0.05); color: #cbd5e1; }
    .status-success { color: #2ecc71; font-weight: bold; }
    .status-failed { color: #e74c3c; font-weight: bold; }
    .status-error { color: #e67e22; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Tempus V2: Reporte Maestro de Verificación Autónoma</h1>
  <p>Este reporte es generado dinámicamente iterando sobre la Fase 3 (Agente ReAct). Cruza todos los RFs de la documentación oficial contra los múltiples Roles del sistema.</p>
  <table>
    <thead>
      <tr>
        <th>Rol</th>
        <th>Módulo</th>
        <th>ID</th>
        <th>Requerimiento</th>
        <th>Estado</th>
        <th>Pasos IA</th>
        <th>Razón / Observación</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>
  `;
  fs.writeFileSync(path.join(__dirname, '../public/master_verification_report.html'), html);
}

runMasterVerification();
