#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { execSync } = require('child_process');

function createCli() {
  const program = new Command();

  program
    .name('qa-tester')
    .description('CLI Enterprise para QA Surface Tester con IA')
    .version('1.0.0');

  program
    .command('run')
    .description('Ejecuta la suite de pruebas autónoma')
    .option('-m, --modules <modules>', 'Ejecutar pruebas solo en los módulos especificados (separados por coma)')
    .option('--docs <path>', 'Ruta al archivo Markdown de requerimientos', './docs/tempus_v2/func_requirements_v2.md')
    .option('--headless <boolean>', 'Correr el navegador en modo headless', true)
    .action((options) => {
      console.log('🚀 Iniciando QA Surface Tester Enterprise...');
      if (options.modules) {
        console.log(`📌 Filtrando por módulos: ${options.modules}`);
      }
      console.log(`📄 Leyendo requerimientos de: ${options.docs}`);
      
      // Aquí podemos spawnear el script maestro o llamarlo directamente
      try {
        // En una implementación final, importaríamos runMasterVerification y le pasaríamos opciones.
        // Por ahora, simulamos el spawn del agent.
        console.log('Ejecutando master_verification_agent.js...');
        const agentPath = path.join(__dirname, '../scripts/master_verification_agent.js');
        execSync(`node ${agentPath}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Error ejecutando las pruebas:', error.message);
        process.exit(1);
      }
    });

  return program;
}

if (require.main === module) {
  const program = createCli();
  program.parse(process.argv);
}

module.exports = { createCli };
