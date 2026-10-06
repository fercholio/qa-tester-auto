const fs = require('fs');

class ConfigLoader {
  static load() {
    let config = {
      roles: [
        { name: 'Abogado Titular', email: 'abogado@mendezgarza.mx', pass: 'Password123!', reqPrefixes: ['RF-ABO'] },
        { name: 'Super Admin', email: 'admin@abogalia.mx', pass: 'Password123!', reqPrefixes: ['RF-ADM'] },
        { name: 'Cliente', email: 'cliente@gmail.com', pass: 'Password123!', reqPrefixes: ['RF-CLI'] }
      ],
      loginUrl: process.env.TARGET_URL ? `${process.env.TARGET_URL}/login` : 'http://localhost:3001/login',
      targetUrl: process.env.TARGET_URL || 'http://localhost:3001',
      startUrl: process.env.TARGET_URL ? `${process.env.TARGET_URL}/panel` : 'http://localhost:3001/panel',
      reportTitle: "Master Verification Report",
      reportPath: "public/report.html",
      docsPath: process.env.DOCS_PATH || '../../abogalia/docs/QA_master.md',
      startFromId: process.env.START_FROM_ID || null
    };

    if (process.env.QA_CONFIG_PATH && fs.existsSync(process.env.QA_CONFIG_PATH)) {
      const loadedConfig = JSON.parse(fs.readFileSync(process.env.QA_CONFIG_PATH, 'utf8'));
      config = { ...config, ...loadedConfig };
    }

    // Allow CLI to override docs path
    if (process.env.DOCS_PATH) {
      config.docsPath = process.env.DOCS_PATH;
    }

    return config;
  }
}

module.exports = ConfigLoader;
