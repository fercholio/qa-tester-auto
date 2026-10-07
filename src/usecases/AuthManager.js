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
      const apiUrl = this.config.loginUrl || 'http://127.0.0.1:8001/api/v1/auth/login';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: this.config.user, password: this.config.pass, device_name: "cli" })
      });

      if (!response.ok) {
        throw new Error(`API Auth failed with status ${response.status}`);
      }

      const parsed = await response.json();
      if (!parsed.data || !parsed.data.token) {
        throw new Error('API Auth failed: No token returned');
      }

      // 2. Build Playwright storage state manually
      const targetUrl = this.config.targetUrl || "http://localhost:3001";
      const localStorageData = (this.config.localStorageKeys || [
        { name: "abogalia_token", valuePath: "token" },
        { name: "abogalia_user", valuePath: "user" },
        { name: "abogalia_session_v", value: "2" }
      ]).map(keyDef => {
        let val = keyDef.value;
        if (keyDef.valuePath === 'token') val = parsed.data.token;
        else if (keyDef.valuePath === 'user') val = JSON.stringify(parsed.data.user);
        else if (keyDef.valuePath === 'tenant_id') val = parsed.data.user.tenant_id?.toString() || '1';
        return { name: keyDef.name, value: val };
      });

      const storageState = {
        cookies: [],
        origins: [
          {
            origin: targetUrl,
            localStorage: localStorageData
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
