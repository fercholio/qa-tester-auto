const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { runCrawler } = require('./crawler');
const AiTestRunner = require('./src/usecases/AiTestRunner');
const AiPlanGenerator = require('./src/usecases/AiPlanGenerator');
const AiChaosRunner = require('./src/usecases/AiChaosRunner');
const UnitTestGenerator = require('./src/usecases/UnitTestGenerator');
const BddAiRunner = require('./src/usecases/BddAiRunner');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start_crawler', async (config) => {
    socket.emit('log', { type: 'info', message: 'Iniciando Crawler Genérico...' });
    try {
      const surfaceMap = await runCrawler(config, socket);
      socket.emit('log', { type: 'success', message: 'Crawling completado con éxito.' });
      socket.emit('crawler_finished', surfaceMap);
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error en Crawler: ${error.message}` });
      socket.emit('crawler_finished', null);
    }
  });

  socket.on('generate_test_plan', async (data) => {
    socket.emit('log', { type: 'info', message: 'Analizando superficie descubierta...' });
    try {
      const generator = new AiPlanGenerator(data.apiKey);
      const plan = await generator.generateTestPlan(data.surfaceMap);
      socket.emit('log', { type: 'success', message: `¡Plan de pruebas generado con ${plan.length} casos!` });
      socket.emit('test_plan_ready', plan);
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error generando plan: ${error.message}` });
      socket.emit('test_plan_error');
    }
  });

  socket.on('start_ai_test_suite', async (config) => {
    socket.emit('log', { type: 'info', message: `Iniciando Test Suite con ${config.tests.length} casos...` });
    try {
      const runner = new AiTestRunner(config.apiKey, socket);
      
      let totalActions = 0;
      let totalErrors = 0;
      let totalDuration = 0;
      let totalInputs = 0;
      let totalClicks = 0;
      let allRecommendations = new Set();
      let allDetailedActions = [];

      for (let i = 0; i < config.tests.length; i++) {
        const testCase = config.tests[i];
        socket.emit('log', { type: 'warning', message: `--- Ejecutando Caso ${i+1}/${config.tests.length}: ${testCase.title} ---` });
        
        const testPlan = `### ${testCase.title}\n${testCase.stepsMarkdown}`;
        const stats = await runner.runTest(testCase.startUrl, testPlan, config.auth);
        
        if (stats) {
          totalActions += stats.actionsExecuted;
          totalErrors += stats.errorsDetected;
          totalDuration += parseFloat(stats.durationSecs || 0);
          totalInputs += (stats.coverage?.inputs || 0);
          totalClicks += (stats.coverage?.clicks || 0);
          if (stats.recommendations) {
            stats.recommendations.forEach(r => allRecommendations.add(r));
          }
          if (stats.detailedActions) {
            allDetailedActions = allDetailedActions.concat(stats.detailedActions);
          }
        }
      }

      socket.emit('log', { type: 'success', message: '🎉 Suite de pruebas E2E completada.' });
      
      socket.emit('execution_stats', {
        type: 'E2E Testing (Suite)',
        actionsExecuted: totalActions,
        errorsDetected: totalErrors,
        durationSecs: totalDuration.toFixed(1),
        coverage: {
          inputs: totalInputs,
          clicks: totalClicks
        },
        scriptPath: 'Múltiples scripts exportados en /generated_tests/',
        logsPath: 'Trazabilidad step-by-step en /logs/',
        recommendations: Array.from(allRecommendations),
        detailedActions: allDetailedActions
      });
      socket.emit('ai_test_finished');
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error en AI Suite: ${error.message}` });
      socket.emit('ai_test_finished');
    }
  });

  socket.on('start_chaos_test', async (config) => {
    socket.emit('log', { type: 'info', message: 'Iniciando IA Chaos Runner (Monkey Testing)...' });
    try {
      const runner = new AiChaosRunner(config.apiKey, socket);
      await runner.runChaos(config.startUrl, config.auth);
      socket.emit('chaos_test_finished');
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error en Chaos Runner: ${error.message}` });
      socket.emit('chaos_test_finished');
    }
  });

  socket.on('start_unit_test_gen', async (data) => {
    socket.emit('log', { type: 'info', message: `Iniciando Análisis Estático para Unit Test...` });
    try {
      const generator = new UnitTestGenerator(data.apiKey, socket);
      await generator.generateForFile(data.filePath);
      socket.emit('unit_test_finished');
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error en Unit Test Gen: ${error.message}` });
      socket.emit('unit_test_error');
    }
  });

  socket.on('start_bdd_test', async (config) => {
    socket.emit('log', { type: 'info', message: 'Iniciando BDD Spec Runner...' });
    try {
      const runner = new BddAiRunner(config.apiKey, socket);
      const passed = await runner.runScenario(config.featurePath, config.startUrl, config.auth);
      socket.emit('bdd_test_finished', passed);
    } catch (error) {
      socket.emit('log', { type: 'error', message: `Error en BDD Runner: ${error.message}` });
      socket.emit('bdd_test_finished', false);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`QA Surface Tester running at http://localhost:${PORT}`);
});
