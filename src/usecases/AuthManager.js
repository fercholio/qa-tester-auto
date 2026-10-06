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

    try {
      // 1. Make direct API call via Node fetch (bypassing browser/CORS/Vue issues)
      const apiUrl = 'http://127.0.0.1:8001/api/v1/auth/login';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: this.config.user, password: this.config.pass })
      });

      if (!response.ok) {
        throw new Error(`API Auth failed with status ${response.status}`);
      }

      const parsed = await response.json();
      if (!parsed.data || !parsed.data.token) {
        throw new Error('API Auth failed: No token returned');
      }

      // 2. Build Playwright storage state manually
      const storageState = {
        cookies: [],
        origins: [
          {
            origin: "http://localhost:3001",
            localStorage: [
              { name: "abogalia_token", value: parsed.data.token },
              { name: "abogalia_user", value: JSON.stringify(parsed.data.user) },
              { name: "abogalia_session_v", value: "2" }
            ]
          }
        ]
      };

      fs.writeFileSync(this.stateFilePath, JSON.stringify(storageState, null, 2));
      console.log(`[AuthManager] Session saved successfully to ${this.stateFilePath}`);
      
      return this.stateFilePath;
    } catch (error) {
      console.error(`[AuthManager] Error during authentication: ${error.message}`);
      throw error;
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
