const fs = require('fs');
const path = require('path');
const AuthManager = require('../src/usecases/AuthManager');
const InteractiveTestRunner = require('../src/usecases/InteractiveTestRunner');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const ROLES = [
  { name: 'Abogado Titular', email: 'abogado@mendezgarza.mx', pass: 'Password123!' },
  { name: 'Super Admin', email: 'admin@abogalia.mx', pass: 'Password123!' },
  { name: 'Cliente', email: 'cliente@gmail.com', pass: 'Password123!' }
];

// Requerimientos Extraídos Dinámicamente de markdown
function extractRequirements() {
  const reqPath = process.env.DOCS_PATH || path.join(__dirname, '../../abogalia/docs/QA_master.md');
  const content = fs.readFileSync(reqPath, 'utf8');
  const lines = content.split('\n');
  const requirements = [];
  let currentModule = 'General';

  lines.forEach(line => {
    if (line.startsWith('## ')) {
      currentModule = line.replace('## ', '').trim();
    } else if (line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/)) {
      const match = line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/);
      requirements.push({
        id: match[1],
        module: currentModule,
        title: match[2].trim(),
        description: match[2].trim()
      });
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
    } else if (line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/)) {
       const match = line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/);
       if (match) {
          requirements.push({
             id: match[1],
             module: currentModule,
             title: match[2].trim(),
             description: match[3] ? match[3].trim() : match[2].trim()
          });
       }
    } else if (line.match(/^\| \*\*(RF-[A-Z0-9-]+)\*\* \|/)) {
       const parts = line.split('|').map(p => p.trim());
       if (parts.length >= 4) {
          requirements.push({
             id: parts[1].replace(/\*\*/g, ''),
             module: currentModule,
             title: parts[2],
             description: parts[3]
          });
       }
    }
  });

  let finalReqs = requirements;
  if (process.env.START_FROM_ID) {
    const startIndex = finalReqs.findIndex(r => r.id === process.env.START_FROM_ID);
    if (startIndex !== -1) {
      finalReqs = finalReqs.slice(startIndex);
      console.log(`\n⏭️ Retomando pruebas desde: ${process.env.START_FROM_ID}\n`);
    } else {
      console.warn(`\n⚠️ No se encontró el ID ${process.env.START_FROM_ID}. Iniciando desde el principio.\n`);
    }
  }

  return finalReqs;
}

async function runMasterVerification() {
  console.log('🚀 Iniciando Master Verification Agent (Fase 3: ReAct Step-by-Step)...');
  
  const requirements = extractRequirements();
  console.log(`✅ ${requirements.length} Requerimientos Funcionales parseados desde la documentación.`);
  
  // Limpiar reporte antiguo
  generateHTMLReport([]);
  
  const runner = new InteractiveTestRunner(GROQ_API_KEY);
  const reportData = [];

  let consecutiveFailures = 0;

  for (const role of ROLES) {
    console.log(`\n======================================================`);
    console.log(`👤 Iniciando Pruebas para Rol: ${role.name}`);
    console.log(`======================================================\n`);
    
    const targetUrl = process.env.TARGET_URL || 'http://localhost:3001'; // Force port 3001 to match storage state origin
    const authManager = new AuthManager({
      loginUrl: `${targetUrl}/login`,
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

    // Filtrado Inteligente de Requerimientos por Rol
    const rolePrefix = role.name === 'Super Admin' ? 'RF-ADM' : 
                       (role.name === 'Abogado Titular' || role.name === 'Pasante') ? 'RF-ABO' : 
                       'RF-CLI';
                       
    const filteredReqs = requirements.filter(req => req.id.startsWith(rolePrefix));

    // Iterar sobre cada requerimiento
    for (const req of filteredReqs) {
      console.log(`\n▶️ Testeando: ${req.id} - ${req.title} (Rol: ${role.name})`);
      const objectiveText = `Eres un empleado con rol '${role.name}'. Demuestra o verifica el siguiente requerimiento en el sistema: ${req.id} - ${req.title}. Detalle: ${req.description}`;
      
      try {
        const result = await runner.runRequirement(`${targetUrl}/panel`, objectiveText, statePath);
        
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
        console.log(`   📸 Captura final (Prueba Fehaciente): ${result.screenshot}`);

        if (result.status.toLowerCase() === 'failed' || result.status.toLowerCase() === 'error') {
          consecutiveFailures++;
        } else {
          consecutiveFailures = 0;
        }

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
        consecutiveFailures++;
      }

      if (consecutiveFailures >= 1) {
        console.error(`\n🚨 DETENIENDO PRUEBAS: 1 error detectado. Iniciando fase de reparación manual...`);
        process.exit(1);
      }
    }
  }

  console.log(`\n🎉 Verificación Maestra Finalizada. Reporte guardado en public/abogalia_report.html`);
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
      <td>${d.screenshot ? `<a href="file://${d.screenshot}" target="_blank" style="color:#3b82f6;">Ver Foto</a>` : 'N/A'}</td>
    </tr>
  `).join('');

  const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Master Verification Report - Abogalia</title>
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
  <h1>Reporte Maestro de Verificación Autónoma: Abogalia</h1>
  <p><strong>Última actualización (CST):</strong> ${fecha}</p>
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
        <th>Prueba (Captura)</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>
  `;
  fs.writeFileSync(path.join(__dirname, '../public/abogalia_report.html'), html);
}

runMasterVerification();
