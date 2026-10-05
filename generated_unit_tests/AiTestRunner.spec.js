import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiTestRunner from '../src/usecases/AiTestRunner';
import playwright from 'playwright';

// GroqAdapter mocked internally
vi.mock('../src/infrastructure/GroqAdapter', () => {
  return vi.fn().mockImplementation(() => ({
    generateTestActions: vi.fn().mockResolvedValue([{ action: 'click', selector: '.old-button' }]),
    healSelector: vi.fn().mockResolvedValue('.new-button')
  }));
});
vi.mock('../src/usecases/TestScriptGenerator', () => {
  return vi.fn().mockImplementation(() => ({ generate: vi.fn().mockReturnValue('mocked/path.js') }));
});
vi.mock('../src/usecases/RegressionAnalyzer', () => {
  return vi.fn().mockImplementation(() => ({ saveSnapshotAndCompare: vi.fn().mockReturnValue({ changed: false, missingInputs: [], newInputs: [] }) }));
});
vi.mock('../src/infrastructure/ApplicationLogger', () => {
  return vi.fn().mockImplementation(() => ({ logExecution: vi.fn() }));
});

describe('AiTestRunner Self-Healing', () => {
  let runner;
  let mockSocket;
  let mockPage;
  let mockContext;
  let mockBrowser;

  beforeEach(() => {
    vi.resetAllMocks();
    
    mockSocket = { emit: vi.fn() };
    runner = new AiTestRunner('dummy-api-key', mockSocket);
    
    // Configurar Mocks de Playwright
    mockPage = {
      goto: vi.fn().mockResolvedValue(),
      evaluate: vi.fn().mockResolvedValue({ url: 'http://test.com', inputs: [], buttons: [] }),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('dummy-screenshot')),
      waitForTimeout: vi.fn().mockResolvedValue(), // MOCK THIS CORRECTLY TO AVOID HANG
      waitForFunction: vi.fn().mockResolvedValue(),
      fill: vi.fn(),
      click: vi.fn()
    };
    mockContext = { newPage: vi.fn().mockResolvedValue(mockPage) };
    mockBrowser = { 
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue()
    };
    vi.spyOn(playwright.chromium, 'launch').mockResolvedValue(mockBrowser);

    // Groq Mock by assigning to instance directly (if needed, though constructor mock handles defaults)
    runner.groqAdapter.generateTestActions = vi.fn().mockResolvedValue([
      { action: 'click', selector: '.old-button' }
    ]);
    runner.groqAdapter.healSelector = vi.fn().mockResolvedValue('.new-button');
  });

  it('debe ejecutar acción normalmente si no hay errores', async () => {
    mockPage.click.mockResolvedValue();

    const stats = await runner.runTest('http://test.com', 'dummy-plan');
    
    expect(mockPage.click).toHaveBeenCalledWith('.old-button', { timeout: 5000 });
    expect(runner.groqAdapter.healSelector).not.toHaveBeenCalled();
    expect(stats.detailedActions[0].status).toBe('success');
  });

  it('debe activar Self-Healing si click falla, pedir nuevo selector, y reintentar', async () => {
    mockPage.click
      .mockRejectedValueOnce(new Error('Timeout!'))
      .mockResolvedValueOnce();

    runner.groqAdapter.healSelector.mockResolvedValue('.new-button');

    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.click).toHaveBeenNthCalledWith(1, '.old-button', { timeout: 5000 });
    expect(mockPage.screenshot).toHaveBeenCalled(); 
    expect(runner.groqAdapter.healSelector).toHaveBeenCalledWith('.old-button', 'ZHVtbXktc2NyZWVuc2hvdA=='); 
    expect(mockPage.click).toHaveBeenNthCalledWith(2, '.new-button', { timeout: 5000 });

    expect(stats.detailedActions[0].status).toBe('success (auto-healed)');
    expect(stats.detailedActions[0].selector).toBe('.new-button');
    const recommendations = Array.from(stats.recommendations);
    expect(recommendations.some(r => r.includes('auto-curado'))).toBe(true);
  });

  it('debe pasar al Fallback 1 si Self-Healing devuelve null o falla', async () => {
    mockPage.click
      .mockRejectedValueOnce(new Error('Timeout!')) 
      .mockRejectedValueOnce(new Error('Fallback 1 fail'))
    
    runner.groqAdapter.healSelector.mockResolvedValue(null);

    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.click).toHaveBeenNthCalledWith(1, '.old-button', { timeout: 5000 });
    expect(mockPage.click).toHaveBeenNthCalledWith(2, '.old-button', { force: true, timeout: 5000 });
    expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), '.old-button');
  });

  it('debe activar Self-Healing si fill falla', async () => {
    runner.groqAdapter.generateTestActions.mockResolvedValue([
      { action: 'fill', selector: '.old-input', value: 'hello' }
    ]);

    mockPage.fill
      .mockRejectedValueOnce(new Error('Timeout!')) 
      .mockResolvedValueOnce(); 

    runner.groqAdapter.healSelector.mockResolvedValue('.new-input');

    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.fill).toHaveBeenNthCalledWith(1, '.old-input', 'hello', { timeout: 5000 });
    expect(runner.groqAdapter.healSelector).toHaveBeenCalledWith('.old-input', expect.any(String));
    expect(mockPage.fill).toHaveBeenNthCalledWith(2, '.new-input', 'hello', { timeout: 5000 });

    expect(stats.detailedActions[0].status).toBe('success (auto-healed)');
    expect(stats.detailedActions[0].selector).toBe('.new-input');
  });

  it('debe ejecutar una aserción be.visible correctamente', async () => {
    runner.groqAdapter.generateTestActions.mockResolvedValue([
      { action: 'assert', assertion: 'be.visible', selector: '.toast-success' }
    ]);
    const mockLocator = { waitFor: vi.fn().mockResolvedValue() };
    mockPage.locator = vi.fn().mockReturnValue(mockLocator);

    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.locator).toHaveBeenCalledWith('.toast-success');
    expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 5000 });
    expect(stats.detailedActions[0].status).toBe('success');
  });

  it('debe fallar si una aserción be.disabled falla', async () => {
    runner.groqAdapter.generateTestActions.mockResolvedValue([
      { action: 'assert', assertion: 'be.disabled', selector: '.submit-btn' }
    ]);
    const mockLocator = { isDisabled: vi.fn().mockResolvedValue(false) };
    mockPage.locator = vi.fn().mockReturnValue(mockLocator);

    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.locator).toHaveBeenCalledWith('.submit-btn');
    expect(mockLocator.isDisabled).toHaveBeenCalledWith({ timeout: 5000 });
    expect(stats.detailedActions[0].status).toBe('failed');
    expect(stats.detailedActions[0].error).toContain('Aserción Fallida (be.disabled): El elemento .submit-btn no está deshabilitado como se esperaba.');
  });

  it('debe ejecutar una aserción have.text correctamente', async () => {
    runner.groqAdapter.generateTestActions.mockResolvedValue([
      { action: 'assert', assertion: 'have.text', selector: '.msg', value: 'Éxito' }
    ]);
    mockPage.locator = vi.fn().mockReturnValue({});
    const stats = await runner.runTest('http://test.com', 'dummy-plan');

    expect(mockPage.waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      ['.msg', 'Éxito'],
      { timeout: 5000 }
    );
    expect(stats.detailedActions[0].status).toBe('success');
  });
});
