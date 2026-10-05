import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthManager from '../../src/usecases/AuthManager';
import fs from 'fs';
import { chromium } from 'playwright';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn()
  }
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    unlinkSync: vi.fn()
  }
}));

describe('AuthManager', () => {
  let authManager;
  let mockPage;
  let mockContext;
  let mockBrowser;

  const authConfig = {
    loginUrl: 'http://test.com/login',
    user: 'test@user.com',
    pass: 'password'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPage = {
      goto: vi.fn(),
      fill: vi.fn(),
      click: vi.fn(),
      waitForNavigation: vi.fn().mockResolvedValue(true),
      waitForTimeout: vi.fn()
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      storageState: vi.fn()
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn()
    };

    chromium.launch.mockResolvedValue(mockBrowser);

    authManager = new AuthManager(authConfig);
  });

  it('should throw an error if configuration is invalid', async () => {
    const invalidManager = new AuthManager({});
    await expect(invalidManager.authenticate()).rejects.toThrow('Invalid authentication configuration provided.');
  });

  it('should authenticate and save storage state', async () => {
    await authManager.authenticate();

    expect(chromium.launch).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('http://test.com/login', { waitUntil: 'networkidle' });
    expect(mockPage.fill).toHaveBeenCalledWith('input[type="email"], input[name*="user"], input[name*="email"]', 'test@user.com');
    expect(mockPage.fill).toHaveBeenCalledWith('input[type="password"]', 'password');
    expect(mockPage.click).toHaveBeenCalled();
    expect(mockContext.storageState).toHaveBeenCalledWith({ path: 'auth.json' });
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('should check if valid session exists', () => {
    fs.existsSync.mockReturnValue(true);
    expect(authManager.hasValidSession()).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith('auth.json');
  });

  it('should clear session if it exists', () => {
    fs.existsSync.mockReturnValue(true);
    authManager.clearSession();
    expect(fs.unlinkSync).toHaveBeenCalledWith('auth.json');
  });
});
