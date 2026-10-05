const { chromium } = require('playwright');
const EventEmitter = require('events');
const fs = require('fs');

class TreeCrawler extends EventEmitter {
  constructor(baseUrl, authStatePath = 'auth.json') {
    super();
    this.baseUrl = baseUrl;
    this.authStatePath = authStatePath;
    this.visited = new Set();
    this.queue = [];
    this.isCrawling = false;
  }

  async start(startUrl) {
    if (this.isCrawling) return;
    this.isCrawling = true;
    
    this.queue.push(startUrl);
    
    const browser = await chromium.launch({ headless: true });
    const contextOptions = {};
    if (fs.existsSync(this.authStatePath)) {
      contextOptions.storageState = this.authStatePath;
    }
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    console.log(`[TreeCrawler] Starting crawl at ${startUrl}`);

    try {
      while (this.queue.length > 0) {
        const currentUrl = this.queue.shift();
        
        // Normalize URL to avoid duplicates (remove trailing slash, hash, etc.)
        const normalizedUrl = this.normalizeUrl(currentUrl);

        if (this.visited.has(normalizedUrl)) {
          continue;
        }

        this.visited.add(normalizedUrl);
        
        console.log(`[TreeCrawler] Visiting: ${normalizedUrl}`);
        this.emit('URL_VISITING', normalizedUrl);

        try {
          await page.goto(normalizedUrl, { waitUntil: 'networkidle', timeout: 10000 });
          
          // Allow some time for JS to render dynamically
          await page.waitForTimeout(1000);

          // Extract all internal links
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
              .map(a => a.href)
              .filter(href => href && href.startsWith(window.location.origin));
          });

          const uniqueLinks = [...new Set(links)];
          
          let newLinksCount = 0;
          for (const link of uniqueLinks) {
            const normLink = this.normalizeUrl(link);
            if (!this.visited.has(normLink) && !this.queue.includes(normLink)) {
              this.queue.push(normLink);
              this.emit('URL_DISCOVERED', normLink);
              newLinksCount++;
            }
          }

          this.emit('URL_PROCESSED', {
            url: normalizedUrl,
            newLinksFound: newLinksCount
          });

        } catch (e) {
          console.error(`[TreeCrawler] Error visiting ${normalizedUrl}: ${e.message}`);
          this.emit('URL_ERROR', { url: normalizedUrl, error: e.message });
        }
      }
      console.log(`[TreeCrawler] Crawl finished. Visited ${this.visited.size} URLs.`);
      this.emit('CRAWL_FINISHED', Array.from(this.visited));
    } finally {
      await browser.close();
      this.isCrawling = false;
    }
  }

  normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Remove hash to treat #tab1 and #tab2 as the same page (or keep it if your app routes with hashes)
      // Since many modern apps use history API, we remove hash.
      parsed.hash = ''; 
      let cleanUrl = parsed.toString();
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      return cleanUrl;
    } catch (e) {
      return url;
    }
  }
}

module.exports = TreeCrawler;
