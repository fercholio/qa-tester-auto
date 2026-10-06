#!/usr/env/node

const { Command } = require('commander');
const path = require('path');
const MasterVerificationUseCase = require('../src/usecases/MasterVerificationUseCase');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
    .option('--docs <path>', 'Ruta al archivo Markdown de requerimientos')
    .option('--headless <boolean>', 'Correr el navegador en modo headless', true)
    .action(async (options) => {
      console.log('🚀 Iniciando QA Surface Tester Enterprise...');
      
      if (options.docs) {
        process.env.DOCS_PATH = path.resolve(process.cwd(), options.docs);
        console.log(`📄 Leyendo requerimientos de: ${process.env.DOCS_PATH}`);
      }
      
      try {
        const usecase = new MasterVerificationUseCase(process.env.GROQ_API_KEY);
        await usecase.execute();
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
