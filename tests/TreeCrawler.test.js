import { describe, it, expect, vi, beforeEach } from 'vitest';
import TreeCrawler from '../../src/usecases/TreeCrawler';
import fs from 'fs';
import { chromium } from 'playwright';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn()
  }
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn()
  }
}));

describe('TreeCrawler', () => {
  let crawler;
  let mockPage;
  let mockContext;
  let mockBrowser;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPage = {
      goto: vi.fn().mockResolvedValue(true),
      waitForTimeout: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue([
        'http://test.com/about',
        'http://test.com/contact'
      ])
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage)
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn()
    };

    chromium.launch.mockResolvedValue(mockBrowser);

    crawler = new TreeCrawler('http://test.com');
  });

  it('should initialize correctly', () => {
    expect(crawler.baseUrl).toBe('http://test.com');
    expect(crawler.visited.size).toBe(0);
    expect(crawler.queue.length).toBe(0);
  });

  it('should normalize URLs correctly', () => {
    expect(crawler.normalizeUrl('http://test.com/dashboard/')).toBe('http://test.com/dashboard');
    expect(crawler.normalizeUrl('http://test.com/settings#tab1')).toBe('http://test.com/settings');
    expect(crawler.normalizeUrl('http://test.com/reports?id=1')).toBe('http://test.com/reports?id=1');
  });

  it('should crawl URLs recursively and emit events', async () => {
    fs.existsSync.mockReturnValue(true); // Mock auth.json exists
    
    const discoveredUrls = [];
    crawler.on('URL_DISCOVERED', (url) => discoveredUrls.push(url));
    
    const processedUrls = [];
    crawler.on('URL_PROCESSED', (data) => processedUrls.push(data.url));

    // Force the evaluate to return empty on the second level to stop recursion
    mockPage.evaluate
      .mockResolvedValueOnce(['http://test.com/page1', 'http://test.com/page2'])
      .mockResolvedValue([]);

    await crawler.start('http://test.com');

    expect(chromium.launch).toHaveBeenCalled();
    expect(mockContext.newPage).toHaveBeenCalled();
    
    // It should have visited the start URL and the two discovered ones
    expect(mockPage.goto).toHaveBeenCalledWith('http://test.com', expect.any(Object));
    expect(mockPage.goto).toHaveBeenCalledWith('http://test.com/page1', expect.any(Object));
    expect(mockPage.goto).toHaveBeenCalledWith('http://test.com/page2', expect.any(Object));

    expect(discoveredUrls).toContain('http://test.com/page1');
    expect(discoveredUrls).toContain('http://test.com/page2');

    expect(processedUrls).toContain('http://test.com');
    expect(processedUrls).toContain('http://test.com/page1');
    expect(processedUrls).toContain('http://test.com/page2');

    expect(crawler.visited.size).toBe(3);
  });
});
