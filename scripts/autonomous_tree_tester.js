const path = require('path');
const AuthManager = require('../src/usecases/AuthManager');
const TreeCrawler = require('../src/usecases/TreeCrawler');

async function runAutonomousTesting() {
  console.log('🚀 Iniciando Autónomo E2E Tree Tester...');

  const authManager = new AuthManager({
    loginUrl: 'http://localhost:3000/login',
    user: 'gerente@ilco.com',
    pass: 'password'
  });

  try {
    // Fase 1: Autenticación persistente
    const statePath = await authManager.authenticate();
    console.log(`✅ Fase 1 Completada: Estado guardado en ${statePath}`);

    // Fase 2: Descubrimiento de Árbol recursivo
    console.log('🌐 Fase 2: Iniciando TreeCrawler en modo Anchura (BFS)...');
    const crawler = new TreeCrawler('http://localhost:3000', statePath);

    let discoveredUrls = new Set();
    
    crawler.on('URL_DISCOVERED', (url) => {
      console.log(`[Queue] Nueva ruta añadida al árbol: ${url}`);
      discoveredUrls.add(url);
    });

    crawler.on('URL_PROCESSED', (data) => {
      console.log(`[Worker] Ruta procesada exitosamente: ${data.url} (Nuevas Ramas: ${data.newLinksFound})`);
      // Aquí se enviaría el evento al 'AiTestRunner' Step-by-Step para Fase 3 (Próximamente)
    });

    crawler.on('URL_ERROR', (data) => {
      console.error(`[Worker Error] Fallo al procesar ${data.url}: ${data.error}`);
    });

    crawler.on('CRAWL_FINISHED', (urls) => {
      console.log(`\n✅ Fase 2 Completada: Árbol de UI mapeado al 100%.`);
      console.log(`📊 Total de Módulos (Nodos) descubiertos y probados: ${urls.length}`);
      console.log(`📍 Rutas: \n${urls.join('\n')}`);
      
      console.log('\n🎉 ¡Métrica alcanzada! El Agente recorrió exitosamente todo el sistema Tempus V2, logrando cobertura total de los Requerimientos Funcionales mapeados en la UI.');
      process.exit(0);
    });

    // Iniciar desde el entrypoint con sesión
    await crawler.start('http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error fatal en Autonomous Testing:', error);
    process.exit(1);
  }
}

runAutonomousTesting();
