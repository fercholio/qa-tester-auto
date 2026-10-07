const ConfigLoader = require('../infrastructure/config/ConfigLoader');
const MarkdownRequirementsParser = require('../infrastructure/parser/MarkdownRequirementsParser');
const HtmlReportGenerator = require('../infrastructure/report/HtmlReportGenerator');
const AuthManager = require('./AuthManager');
const InteractiveTestRunner = require('./InteractiveTestRunner');

class MasterVerificationUseCase {
  constructor(groqApiKey) {
    this.groqApiKey = groqApiKey;
  }

  async execute() {
    console.log('🚀 Iniciando Master Verification Agent (Fase 3: ReAct Step-by-Step)...');
    
    const config = ConfigLoader.load();
    let requirements = MarkdownRequirementsParser.parse(config.docsPath);
    
    if (config.startFromId) {
      const startIndex = requirements.findIndex(r => r.id === config.startFromId);
      if (startIndex !== -1) {
        requirements = requirements.slice(startIndex);
        console.log(`\n⏭️ Retomando pruebas desde: ${config.startFromId}\n`);
      } else {
        console.warn(`\n⚠️ No se encontró el ID ${config.startFromId}. Iniciando desde el principio.\n`);
      }
    }

    console.log(`✅ ${requirements.length} Requerimientos Funcionales parseados desde la documentación.`);
    
    // Limpiar reporte antiguo
    HtmlReportGenerator.generate([], config);
    
    const runner = new InteractiveTestRunner(this.groqApiKey);
    const reportData = [];
  
    let consecutiveFailures = 0;
  
    for (const role of config.roles) {
      console.log(`\n======================================================`);
      console.log(`👤 Iniciando Pruebas para Rol: ${role.name}`);
      console.log(`======================================================\n`);
      
      const authManager = new AuthManager({
        loginUrl: config.loginUrl,
        targetUrl: config.targetUrl,
        localStorageKeys: config.localStorageKeys,
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
      const filteredReqs = requirements.filter(req => {
        if (!role.reqPrefixes || role.reqPrefixes.length === 0) return true;
        return role.reqPrefixes.some(prefix => req.id.startsWith(prefix));
      });
  
      for (const req of filteredReqs) {
        console.log(`\n▶️ Testeando: ${req.id} - ${req.title} (Rol: ${role.name})`);
        const objectiveText = `Eres un empleado con rol '${role.name}'. Demuestra o verifica el siguiente requerimiento en el sistema: ${req.id} - ${req.title}. Detalle: ${req.description}`;
        
        try {
          const result = await runner.runRequirement(config.startUrl, objectiveText, statePath);
          
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
  
          HtmlReportGenerator.generate(reportData, config);
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
  
    console.log(`\n🎉 Verificación Maestra Finalizada. Reporte guardado en ${config.reportPath}`);
  }
}

module.exports = MasterVerificationUseCase;
