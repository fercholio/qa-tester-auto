const fs = require('fs');
const path = require('path');

class HtmlReportGenerator {
  static generate(data, config) {
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
  <title>${config.reportTitle}</title>
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
  <h1>${config.reportTitle}</h1>
  <p><strong>Última actualización (CST):</strong> ${fecha}</p>
  <p>Este reporte es generado dinámicamente iterando sobre la Fase 3 (Agente ReAct).</p>
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
    const fullPath = path.isAbsolute(config.reportPath) 
      ? config.reportPath 
      : path.join(process.cwd(), config.reportPath);
      
    // ensure dir exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, html);
  }
}

module.exports = HtmlReportGenerator;
