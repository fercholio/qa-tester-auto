import { describe, it, expect, beforeEach } from 'vitest';
import CliParser from '../src/infrastructure/CliParser';

describe('CliParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CliParser();
  });

  it('debe parsear las urls de modulos', () => {
    const args = ['node', 'qa-tester.js', 'run', '--modules', 'http://localhost:3000/dashboard,http://localhost:3000/home'];
    const options = parser.parse(args);
    expect(options.modules).toBe('http://localhost:3000/dashboard,http://localhost:3000/home');
  });

  it('debe parsear el threshold con valor por defecto', () => {
    const args = ['node', 'qa-tester.js', 'run', '--modules', 'test'];
    const options = parser.parse(args);
    expect(options.threshold).toBe(0.1);
  });

  it('debe parsear el threshold con valor personalizado', () => {
    const args = ['node', 'qa-tester.js', 'run', '--modules', 'test', '--threshold', '0.5'];
    const options = parser.parse(args);
    expect(options.threshold).toBe(0.5);
  });

  it('debe parsear la bandera headless', () => {
    const args = ['node', 'qa-tester.js', 'run', '--modules', 'test', '--headless'];
    const options = parser.parse(args);
    expect(options.headless).toBe(true);
  });
});
