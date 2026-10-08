/**
 * RepoConfigLoader.js
 * Cumple con SRP (Single Responsibility) y DIP (Dependency Inversion)
 * Carga la configuración declarativa específica de cada repositorio desde su directorio bdd/features_<repo>/repo.config.json
 */

const fs = require('fs');
const path = require('path');

class RepoConfigLoader {
  /**
   * Carga la configuración del repositorio activo.
   * @param {string} repoName - Nombre del repositorio (ej. 'abogalia', 'timetracking')
   * @param {string} [featuresDir] - Ruta opcional al directorio de features del repositorio
   * @returns {Object} Configuración normalizada del repositorio
   */
  static load(repoName = 'abogalia', featuresDir = null) {
    const rootDir = path.resolve(__dirname, '../../../');
    const targetDir = featuresDir || path.join(rootDir, 'bdd', `features_${repoName}`);
    const configFile = path.join(targetDir, 'repo.config.json');

    let loaded = {};
    if (fs.existsSync(configFile)) {
      try {
        loaded = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      } catch (e) {
        console.warn(`[RepoConfigLoader] Error parsing ${configFile}: ${e.message}`);
      }
    }

    // Esquema canónico con valores por defecto desacoplados
    return {
      name: loaded.name || repoName,
      displayName: loaded.displayName || repoName.toUpperCase(),
      targetUrl: process.env.TARGET_URL || loaded.targetUrl || 'http://localhost:5174',
      loginUrl: process.env.LOGIN_URL || loaded.loginUrl || `${process.env.TARGET_URL || 'http://localhost:5174'}/login`,
      auth: {
        tokenKeys: loaded.auth?.tokenKeys || ['token', 'auth_token', 'access_token'],
        userKeys: loaded.auth?.userKeys || ['user', 'auth_user', 'current_user'],
        credentials: loaded.auth?.credentials || {
          default: { email: 'user@example.com', password: 'Password123!' }
        }
      },
      security: {
        defaultIdorEndpoint: loaded.security?.defaultIdorEndpoint || '/api/resource/1',
        defaultRaceEndpoint: loaded.security?.defaultRaceEndpoint || '/api/action',
        throttlingEndpoint: loaded.security?.throttlingEndpoint || '/api/search'
      },
      performance: {
        maxInteractiveLatencyMs: loaded.performance?.maxInteractiveLatencyMs || 500,
        maxApiLatencyMs: loaded.performance?.maxApiLatencyMs || 800
      }
    };
  }
}

module.exports = RepoConfigLoader;
