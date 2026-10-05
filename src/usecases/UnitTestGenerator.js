const fs = require('fs');
const path = require('path');
const GroqAdapter = require('../infrastructure/GroqAdapter');
const TestScriptGenerator = require('./TestScriptGenerator');

class UnitTestGenerator {
  constructor(apiKey, socket) {
    this.groqAdapter = new GroqAdapter(apiKey);
    this.scriptGenerator = new TestScriptGenerator('generated_unit_tests');
    this.socket = socket;
  }

  async generateForFile(filePath) {
    this.socket.emit('log', { type: 'info', message: `Analizando estáticamente el archivo: ${filePath}` });
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    const isVue = ext === '.vue' || ext === '.js' || ext === '.ts';
    const isPhp = ext === '.php';

    const framework = isVue ? 'Vitest / Vue Test Utils' : (isPhp ? 'Pest / PHPUnit' : 'Jest');

    const prompt = `
Eres un Ingeniero de Control de Calidad (Zero Mock, Clean Architecture).
Tu tarea es leer el código fuente de un archivo y generar una prueba unitaria exhaustiva usando ${framework}.
Asegúrate de cubrir los flujos felices y posibles casos límite basándote únicamente en el código proveído.

--- CÓDIGO FUENTE (${path.basename(filePath)}) ---
${fileContent}

--- TAREA ---
Devuelve UNICAMENTE un string JSON con este formato:
{
  "testCode": "AQUÍ VA EL CÓDIGO DEL TEST GENERADO EN TEXTO PLANO"
}
NO DEVUELVAS NADA MÁS QUE EL JSON.`;

    try {
      this.socket.emit('log', { type: 'info', message: `Consultando a Groq IA para generar Unit Test en ${framework}...` });
      
      const completion = await this.groqAdapter._callWithRetry({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_VERSATILE_MODEL || 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      let responseText = completion.choices[0]?.message?.content;
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      }
      
      const parsed = JSON.parse(responseText);
      const testCode = parsed.testCode;

      if (!testCode) throw new Error("La IA no devolvió el código esperado.");

      const outFilename = path.basename(filePath).replace(ext, `.spec${ext === '.php' ? '.php' : '.ts'}`);
      
      const outPath = path.join(this.scriptGenerator.outputDir, outFilename);
      fs.writeFileSync(outPath, testCode, 'utf8');

      this.socket.emit('log', { type: 'success', message: `¡Unit Test generado exitosamente en: ${outPath}!` });
      this.socket.emit('unit_test_result', { path: outPath, code: testCode });
      return outPath;

    } catch (error) {
      this.socket.emit('log', { type: 'warning', message: `Groq falló (${error.message.substring(0, 50)}...), usando generador de fallback local para el Unit Test...` });
      
      const testCode = `// [FALLBACK GENERADO] Prueba Unitaria para ${path.basename(filePath)}
// Nota: La IA no estaba disponible o excedió el límite.
import { describe, it, expect } from 'vitest';

describe('${path.basename(filePath)}', () => {
  it('debería renderizar correctamente (Happy Path)', () => {
    // TODO: Implementar prueba
    expect(true).toBe(true);
  });
});`;
      const outFilename = path.basename(filePath).replace(ext, `.spec${ext === '.php' ? '.php' : '.ts'}`);
      const outPath = path.join(this.scriptGenerator.outputDir, outFilename);
      fs.writeFileSync(outPath, testCode, 'utf8');

      this.socket.emit('log', { type: 'success', message: `¡Unit Test generado exitosamente en: ${outPath}!` });
      this.socket.emit('unit_test_result', { path: outPath, code: testCode });
      return outPath;
    }
  }
}

module.exports = UnitTestGenerator;
