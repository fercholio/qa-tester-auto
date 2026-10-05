import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AiCodeHealer from '../src/usecases/AiCodeHealer';
import fs from 'fs';
import crypto from 'crypto';

vi.spyOn(crypto, 'randomBytes').mockReturnValue({ toString: () => 'mockedhash' });

describe('AiCodeHealer', () => {
  let healer;
  let mockLogger;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLogger = { log: vi.fn(), info: vi.fn() };
    healer = new AiCodeHealer(mockLogger);
    vi.spyOn(crypto, 'randomBytes').mockReturnValue({ toString: () => 'mockedhash' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe extraer correctamente el selector de una sugerencia', () => {
    const suggestion = "El selector '.hamburger' es genérico. Agrega un atributo 'id', 'name' o 'data-testid' para tests más estables.";
    const selector = healer.extractSelector(suggestion);
    expect(selector).toBe('.hamburger');
  });

  it('debe devolver null si no hay un selector en el formato esperado', () => {
    const suggestion = "No hay selectores aquí";
    const selector = healer.extractSelector(suggestion);
    expect(selector).toBeNull();
  });

  it('debe inyectar data-testid en un archivo Vue cuando encuentra la clase coincidente', async () => {
    const suggestions = ["El selector '.hamburger' es genérico."];
    const fakeHtml = `<template>\n  <div>\n    <button class="menu hamburger active">Menú</button>\n  </div>\n</template>`;
    
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['TestComponent.vue']);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false });
    vi.spyOn(fs, 'readFileSync').mockReturnValue(fakeHtml);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const result = await healer.heal(suggestions, '/fake/dir');
    
    expect(result.healedCount).toBe(1);
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const writtenContent = writeSpy.mock.calls[0][1];
    expect(writtenContent).toContain('<button class="menu hamburger active" data-testid="auto-qa-mockedhash">Menú</button>');
  });

  it('no debe inyectar data-testid si el elemento ya tiene uno', async () => {
    const suggestions = ["El selector '.hamburger' es genérico."];
    const fakeHtml = `<button class="hamburger" data-testid="auto-qa-old">Menú</button>`;
    
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['TestComponent.vue']);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false });
    vi.spyOn(fs, 'readFileSync').mockReturnValue(fakeHtml);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const result = await healer.heal(suggestions, '/fake/dir');
    
    expect(result.healedCount).toBe(0);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('debe inyectar data-testid buscando por tag (ej: button)', async () => {
    const suggestions = ["El selector 'button' es genérico."];
    const fakeHtml = `<button type="submit">Enviar</button>`;
    
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['TestComponent.vue']);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => false });
    vi.spyOn(fs, 'readFileSync').mockReturnValue(fakeHtml);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const result = await healer.heal(suggestions, '/fake/dir');
    
    expect(result.healedCount).toBe(1);
    const writtenContent = writeSpy.mock.calls[0][1];
    expect(writtenContent).toContain('<button type="submit" data-testid="auto-qa-mockedhash">Enviar</button>');
  });

  it('debe procesar subdirectorios correctamente', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    
    // Configuración robusta para recursión
    vi.spyOn(fs, 'readdirSync').mockImplementation((dir) => {
      if (dir === '/fake') return ['subdir', 'file1.vue'];
      if (dir.includes('subdir')) return ['file2.vue'];
      return [];
    });
    
    vi.spyOn(fs, 'statSync').mockImplementation((p) => {
      const isSubdir = p.toString().includes('subdir') && !p.toString().endsWith('.vue');
      return { isDirectory: () => isSubdir };
    });
    
    const files = healer.getAllFiles('/fake', ['.vue']);
    expect(files.length).toBe(2);
    expect(files.some(f => f.includes('file2.vue'))).toBe(true);
    expect(files.some(f => f.includes('file1.vue'))).toBe(true);
  });
});
