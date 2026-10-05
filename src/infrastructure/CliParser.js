const { Command } = require('commander');

class CliParser {
  constructor() {
    this.program = new Command();
    
    this.program
      .name('qa-tester')
      .description('QA Surface Tester - Enterprise AI E2E Testing')
      .version('1.0.0');

    this.program.command('run')
      .description('Ejecuta la suite de pruebas automatizada')
      .requiredOption('-m, --modules <urls>', 'URLs base a probar, separadas por coma')
      .option('-t, --threshold <number>', 'Umbral para Visual Regression Testing', parseFloat, 0.1)
      .option('--headless', 'Correr Playwright en modo headless', false)
      .action((options) => {
        this.runOptions = options;
      });
  }

  parse(argv) {
    this.program.parse(argv);
    return this.runOptions;
  }
}

module.exports = CliParser;
