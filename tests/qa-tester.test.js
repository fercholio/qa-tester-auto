const { createCli } = require('../bin/qa-tester');

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

describe('CLI Parser: qa-tester', () => {
  let program;

  beforeEach(() => {
    program = createCli();
    // Evitamos que process.exit y console.log ensucien la salida del test
    program.exitOverride();
    program.configureOutput({
      writeOut: () => {},
      writeErr: () => {},
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  test('debe parsear el argumento --modules correctamente', () => {
    program.parse(['node', 'qa-tester.js', 'run', '--modules', '/dashboard,/users']);
    
    // Al ejecutar parse, las opciones del comando run quedan guardadas en el action handler.
    // Para probar el parseo sin mockear el action, commander nos permite ver las opciones del comando actual:
    const runCommand = program.commands.find(cmd => cmd.name() === 'run');
    const options = runCommand.opts();
    
    expect(options.modules).toBe('/dashboard,/users');
  });

  test('debe parsear el argumento --docs correctamente', () => {
    program.parse(['node', 'qa-tester.js', 'run', '--docs', './custom_docs.md']);
    
    const runCommand = program.commands.find(cmd => cmd.name() === 'run');
    const options = runCommand.opts();
    
    expect(options.docs).toBe('./custom_docs.md');
  });

  test('debe usar el valor por defecto para --docs si no se provee', () => {
    program.parse(['node', 'qa-tester.js', 'run']);
    
    const runCommand = program.commands.find(cmd => cmd.name() === 'run');
    const options = runCommand.opts();
    
    expect(options.docs).toBe('./docs/tempus_v2/func_requirements_v2.md');
  });

  test('debe fallar si se pasa un comando desconocido', () => {
    expect(() => {
      program.parse(['node', 'qa-tester.js', 'unknownCommand']);
    }).toThrow();
  });
});
