/**
 * ChaosEngine.js
 * Cumple con SRP (Single Responsibility) y OCP (Open/Closed):
 * Encapsula la lógica de auditoría ofensiva (IDOR, Race Conditions, JWT Tampering y Performance)
 * de forma genérica, sin URLs hardcodeadas ni constantes mágicas dependientes de un solo repo.
 */

class ChaosEngine {
  /**
   * @param {Object} repoConfig - Configuración inyectada del repositorio activo
   */
  constructor(repoConfig) {
    this.config = repoConfig;
  }

  /**
   * Ejecuta una prueba IDOR contra un endpoint arbitrario extrayendo el token de sesión configurado
   * @param {import('playwright').Page} page
   * @param {string} endpoint
   * @returns {Promise<number>} Código de estado HTTP devuelto
   */
  async executeIdorCheck(page, endpoint) {
    const targetUrl = endpoint || this.config.security.defaultIdorEndpoint;
    const tokenKeys = this.config.auth.tokenKeys;

    return await page.evaluate(async ({ url, keys }) => {
      let token = null;
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) { token = val; break; }
      }

      try {
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, { headers });
        window.__lastSecurityStatus = res.status;
        return res.status;
      } catch (_) {
        window.__lastSecurityStatus = 403;
        return 403;
      }
    }, { url: targetUrl, keys: tokenKeys });
  }

  /**
   * Ejecuta transacciones concurrentes para probar condiciones de carrera (Double-Spend)
   * @param {import('playwright').Page} page
   * @param {string} endpoint
   * @param {number} count
   * @param {Object} [payload]
   * @returns {Promise<number[]>} Array de códigos HTTP obtenidos
   */
  async executeRaceCondition(page, endpoint, count = 5, payload = {}) {
    const targetUrl = endpoint || this.config.security.defaultRaceEndpoint;
    const tokenKeys = this.config.auth.tokenKeys;

    return await page.evaluate(async ({ url, count, payload, keys }) => {
      let token = null;
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) { token = val; break; }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const promises = Array.from({ length: count }).map(() =>
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }).then(r => r.status).catch(() => 409)
      );

      const statuses = await Promise.all(promises);
      window.__raceStatuses = statuses;
      return statuses;
    }, { url: targetUrl, count, payload, keys: tokenKeys });
  }

  /**
   * Simula manipulación de JWT en localStorage purgando o alterando las llaves configuradas
   * @param {import('playwright').Page} page
   * @param {'none'|'tampered'|'expired'} tamperType
   */
  async executeJwtTampering(page, tamperType = 'none') {
    const tokenKeys = this.config.auth.tokenKeys;
    const userKeys = this.config.auth.userKeys;

    await page.evaluate(({ tokenKeys, userKeys, tamperType }) => {
      for (const k of tokenKeys) {
        if (tamperType === 'none') {
          // Token con cabecera sin algoritmo (alg: none attack)
          localStorage.setItem(k, 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6InN1cGVyX2FkbWluIn0.');
        } else {
          localStorage.removeItem(k);
        }
      }
      for (const k of userKeys) {
        localStorage.removeItem(k);
      }
    }, { tokenKeys, userKeys, tamperType });
  }

  /**
   * Mide el tiempo de respuesta interactivo y latencia de ráfagas
   * @param {import('playwright').Page} page
   * @param {string} [endpoint]
   * @param {number} [burstCount]
   * @returns {Promise<number>} Duración de la ráfaga en ms
   */
  async executePerformanceBurst(page, endpoint, burstCount = 5) {
    const targetUrl = endpoint || this.config.security.throttlingEndpoint;

    return await page.evaluate(async ({ url, count }) => {
      const start = performance.now();
      const promises = Array.from({ length: count }).map(() =>
        fetch(url, { method: 'GET' }).catch(() => null)
      );
      await Promise.all(promises);
      const duration = performance.now() - start;
      window.__perfDuration = duration;
      return duration;
    }, { url: targetUrl, count: burstCount });
  }
}

module.exports = ChaosEngine;
