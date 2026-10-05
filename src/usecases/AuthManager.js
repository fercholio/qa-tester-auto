const { chromium } = require('playwright');
const fs = require('fs');

class AuthManager {
  constructor(authConfig) {
    this.config = authConfig;
    this.stateFilePath = 'auth.json';
  }

  async authenticate() {
    if (!this.config || !this.config.loginUrl || !this.config.user || !this.config.pass) {
      throw new Error('Invalid authentication configuration provided.');
    }

    console.log(`[AuthManager] Logging in as ${this.config.user}...`);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(this.config.loginUrl, { waitUntil: 'networkidle' });

      const userSel = this.config.userSel || 'input[type="email"], input[name*="user"], input[name*="email"]';
      const passSel = this.config.passSel || 'input[type="password"]';
      const submitSel = this.config.submitSel || 'button[type="submit"], form button, .btn-primary';

      await page.fill(userSel, this.config.user);
      await page.fill(passSel, this.config.pass);
      
      // Submit and wait for redirect
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}), // catch timeout if it's an SPA without full reload
        page.click(submitSel)
      ]);

      // Extra wait for SPA routing/token setting
      await page.waitForTimeout(3000); 

      // Save state
      await context.storageState({ path: this.stateFilePath });
      console.log(`[AuthManager] Session saved successfully to ${this.stateFilePath}`);
      
      return this.stateFilePath;
    } catch (error) {
      console.error(`[AuthManager] Error during authentication: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

  hasValidSession() {
    return fs.existsSync(this.stateFilePath);
  }

  clearSession() {
    if (this.hasValidSession()) {
      fs.unlinkSync(this.stateFilePath);
      console.log(`[AuthManager] Session cleared.`);
    }
  }
}

module.exports = AuthManager;
