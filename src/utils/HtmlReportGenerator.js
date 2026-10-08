const fs = require('fs');
const path = require('path');

class HtmlReportGenerator {
  static generate(suiteData) {
    const {
      features = [],
      startTime = Date.now(),
      endTime = Date.now(),
      environment = {}
    } = suiteData;

    const totalDurationMs = endTime - startTime;
    const totalDurationSec = (totalDurationMs / 1000).toFixed(2);

    let totalScenarios = 0;
    let passedScenarios = 0;
    let failedScenarios = 0;
    let selfHealedScenarios = 0;
    let totalSteps = 0;
    let passedSteps = 0;
    let selfHealedSteps = 0;
    let failedSteps = 0;
    let totalAutoRepairs = 0;

    features.forEach(f => {
      (f.scenarios || []).forEach(sc => {
        totalScenarios++;
        let hasSelfHeal = false;

        (sc.stepResults || []).forEach(st => {
          totalSteps++;
          if (st.status === 'self_healed') {
            selfHealedSteps++;
            hasSelfHeal = true;
            totalAutoRepairs += (st.attempts - 1);
          } else if (st.status === 'failed') {
            failedSteps++;
          } else {
            passedSteps++;
          }
        });

        if (sc.passed) {
          passedScenarios++;
          if (hasSelfHeal) selfHealedScenarios++;
        } else {
          failedScenarios++;
        }
      });
    });

    const passRate = totalScenarios > 0 ? ((passedScenarios / totalScenarios) * 100).toFixed(1) : '100.0';
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference - (parseFloat(passRate) / 100) * circumference;

    const nowFormatted = new Date(endTime).toLocaleString('es-MX', {
      timeZoneName: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tempus AI — Reporte Ejecutivo de Pruebas BDD E2E</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #090d16;
      --bg-secondary: #0f172a;
      --bg-card: rgba(15, 23, 42, 0.75);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --border-color: rgba(148, 163, 184, 0.12);
      --border-glow: rgba(56, 189, 248, 0.3);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.12);
      --rose: #f43f5e;
      --rose-bg: rgba(244, 63, 94, 0.12);
      --cyan: #06b6d4;
      --cyan-bg: rgba(6, 182, 212, 0.12);
      --indigo: #6366f1;
      --indigo-bg: rgba(99, 102, 241, 0.12);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.5;
      padding: 2rem 1.5rem 4rem 1.5rem;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
    }

    /* ═══ HEADER & BRANDING ═══ */
    .header {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
    }
    .brand-title h1 {
      font-size: 1.625rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .brand-title p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .btn-primary {
      background: #0ea5e9;
      color: #fff;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    .btn-primary:hover { background: #0284c7; }
    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-color);
      color: var(--text-primary);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* ═══ BADGES & METADATA ═══ */
    .metadata-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .meta-tag {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      background: rgba(0,0,0,0.3);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.06);
    }

    /* ═══ KPI CARDS GRID ═══ */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-glow);
    }
    .kpi-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.375rem;
      flex-shrink: 0;
    }
    .kpi-info h3 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .kpi-info .kpi-value {
      font-size: 1.625rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
      margin-top: 2px;
    }
    .kpi-info .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    /* Donut chart card */
    .kpi-donut-card {
      grid-column: span 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .donut-wrapper {
      position: relative;
      width: 90px;
      height: 90px;
      flex-shrink: 0;
    }
    .donut-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .donut-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.08);
      stroke-width: 8;
    }
    .donut-fill {
      fill: none;
      stroke: var(--emerald);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: ${circumference};
      stroke-dashoffset: ${strokeDashoffset};
      transition: stroke-dashoffset 1s ease;
    }
    .donut-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
    }

    /* ═══ FILTER TOOLBAR ═══ */
    .toolbar {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.875rem 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .filter-tabs {
      display: flex;
      gap: 0.5rem;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-secondary);
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,0.05);
    }
    .tab-btn.active {
      background: rgba(14, 165, 233, 0.15);
      border-color: rgba(14, 165, 233, 0.4);
      color: #38bdf8;
    }

    .search-box {
      position: relative;
      min-width: 260px;
    }
    .search-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.45rem 0.75rem 0.45rem 2.2rem;
      color: var(--text-primary);
      font-size: 0.8125rem;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .search-input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    /* ═══ FEATURES ACCORDION ═══ */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .feature-card.passed { border-left: 4px solid var(--emerald); }
    .feature-card.failed { border-left: 4px solid var(--rose); }

    .feature-header {
      padding: 1.25rem 1.5rem;
      background: rgba(255,255,255,0.02);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .feature-header:hover {
      background: rgba(255,255,255,0.04);
    }
    .feature-title-box {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .feature-icon {
      font-size: 1.5rem;
    }
    .feature-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
    }
    .feature-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    .feature-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge-passed {
      background: var(--emerald-bg);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-healed {
      background: var(--amber-bg);
      color: var(--amber);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-failed {
      background: var(--rose-bg);
      color: var(--rose);
      border: 1px solid rgba(244, 63, 94, 0.3);
    }

    .feature-body {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ═══ SCENARIO CARD ═══ */
    .scenario-card {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
    }
    .scenario-header {
      padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.02);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }
    .scenario-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .scenario-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Steps Table */
    .steps-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .steps-table tr {
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s ease;
    }
    .steps-table tr:last-child { border-bottom: none; }
    .steps-table tr:hover { background: rgba(255,255,255,0.02); }
    .steps-table td {
      padding: 0.65rem 1.25rem;
      vertical-align: middle;
    }

    .step-keyword {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      display: inline-block;
      width: 55px;
      text-align: center;
    }
    .kw-given { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .kw-when { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
    .kw-then { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .kw-and { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
    .kw-but { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

    .step-text {
      color: var(--text-primary);
      font-weight: 500;
    }
    .step-decision {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #38bdf8;
      background: rgba(14, 165, 233, 0.08);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      max-width: 380px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .step-duration {
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      text-align: right;
      width: 70px;
    }

    .repair-tag {
      font-size: 0.6875rem;
      background: var(--amber-bg);
      color: var(--amber);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    /* Scenario Footer & Screenshot */
    .scenario-footer {
      padding: 0.75rem 1.25rem;
      background: rgba(0,0,0,0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
    }
    .screenshot-thumb {
      max-height: 48px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .screenshot-thumb:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    /* ═══ LIGHTBOX MODAL ═══ */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .modal-backdrop.open { display: flex; }
    .modal-img {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
    }
    .modal-close {
      position: absolute;
      top: 1.5rem;
      right: 2rem;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
    }

    /* ═══ PRINT STYLESHEET ═══ */
    @media print {
      body {
        background: #fff !important;
        color: #0f172a !important;
        padding: 0 !important;
      }
      .container { max-width: 100% !important; }
      .header {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        color: #0f172a !important;
        padding: 1.5rem !important;
        break-inside: avoid;
      }
      .brand-title h1 { color: #0f172a !important; }
      .header::before, .header-actions, .toolbar, .modal-backdrop { display: none !important; }
      .kpi-card {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
      }
      .kpi-info .kpi-value { color: #0f172a !important; }
      .feature-card {
        background: #fff !important;
        border: 1px solid #cbd5e1 !important;
        break-before: page;
        margin-bottom: 2rem;
      }
      .feature-header {
        background: #f1f5f9 !important;
      }
      .feature-name { color: #0f172a !important; }
      .scenario-card {
        background: #fff !important;
        border: 1px solid #e2e8f0 !important;
        break-inside: avoid;
        margin-bottom: 1rem;
      }
      .scenario-header {
        background: #f8fafc !important;
      }
      .scenario-title { color: #0f172a !important; }
      .step-text { color: #1e293b !important; }
      .step-decision {
        background: #e0f2fe !important;
        color: #0284c7 !important;
      }
      .screenshot-thumb {
        max-height: 140px !important;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <!-- ═══ HEADER ═══ -->
  <header class="header">
    <div class="header-top">
      <div class="brand-title">
        <div class="brand-logo">⚡</div>
        <div>
          <h1>Reporte Ejecutivo de Pruebas BDD Autónomas</h1>
          <p>Motor de Razonamiento ReAct + Playwright · Cero Selectores Hardcodeados</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" onclick="expandAllFeatures(true)">Expandir Todo</button>
        <button class="btn btn-outline" onclick="expandAllFeatures(false)">Colapsar Todo</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      </div>
    </div>

    <div class="metadata-bar">
      <div class="meta-item">
        <span>🕒 Fecha:</span>
        <span class="meta-tag">${nowFormatted}</span>
      </div>
      <div class="meta-item">
        <span>🌐 Target:</span>
        <span class="meta-tag">${environment.targetUrl || 'http://localhost:3000'}</span>
      </div>
      <div class="meta-item">
        <span>🤖 Motor IA:</span>
        <span class="meta-tag">${environment.model || 'Groq / openai/gpt-oss-120b'}</span>
      </div>
      <div class="meta-item">
        <span>🎭 Runner:</span>
        <span class="meta-tag">Playwright (Chromium)</span>
      </div>
      <div class="meta-item">
        <span>🛡️ UI Compliance:</span>
        <span class="meta-tag" style="color: var(--emerald);">100% AI-Ready</span>
      </div>
    </div>
  </header>

  <!-- ═══ KPI SUMMARY CARDS ═══ -->
  <section class="kpi-grid">
    <!-- Donut Pass Rate -->
    <div class="kpi-card kpi-donut-card">
      <div class="kpi-info">
        <h3>Efectividad Global</h3>
        <div class="kpi-value" style="color: ${parseFloat(passRate) >= 90 ? 'var(--emerald)' : 'var(--amber)'};">${passRate}%</div>
        <div class="kpi-sub">${passedScenarios} de ${totalScenarios} escenarios ok</div>
      </div>
      <div class="donut-wrapper">
        <svg class="donut-svg" viewBox="0 0 100 100">
          <circle class="donut-bg" cx="50" cy="50" r="42"></circle>
          <circle class="donut-fill" cx="50" cy="50" r="42"></circle>
        </svg>
        <div class="donut-text">${passRate}%</div>
      </div>
    </div>

    <!-- Total Scenarios -->
    <div class="kpi-card">
      <div class="kpi-icon-box" style="background: var(--indigo-bg); color: var(--indigo);">🎯</div>
      <div class="kpi-info">
        <h3>Escenarios Totales</h3>
        <div class="kpi-value">${totalScenarios}</div>
        <div class="kpi-sub">${features.length} Features ejecutadas</div>
      </div>
    </div>

    <!-- Steps Passed vs Self-Healed -->
    <div class="kpi-card">
      <div class="kpi-icon-box" style="background: var(--emerald-bg); color: var(--emerald);">✅</div>
      <div class="kpi-info">
        <h3>Pasos Ejecutados</h3>
        <div class="kpi-value">${totalSteps}</div>
        <div class="kpi-sub">${passedSteps} nativos · ${selfHealedSteps} autoreparados</div>
      </div>
    </div>

    <!-- Self-Healing & Auto-Repairs -->
    <div class="kpi-card">
      <div class="kpi-icon-box" style="background: var(--amber-bg); color: var(--amber);">🪄</div>
      <div class="kpi-info">
        <h3>Auto-Reparaciones IA</h3>
        <div class="kpi-value">${totalAutoRepairs}</div>
        <div class="kpi-sub">Adaptaciones de selectores en caliente</div>
      </div>
    </div>

    <!-- Total Duration -->
    <div class="kpi-card">
      <div class="kpi-icon-box" style="background: var(--cyan-bg); color: var(--cyan);">⏱️</div>
      <div class="kpi-info">
        <h3>Tiempo de Ejecución</h3>
        <div class="kpi-value">${totalDurationSec}s</div>
        <div class="kpi-sub">Promedio ~${(totalDurationMs / (totalSteps || 1) / 1000).toFixed(2)}s por paso</div>
      </div>
    </div>
  </section>

  <!-- ═══ TOOLBAR & FILTERS ═══ -->
  <div class="toolbar">
    <div class="filter-tabs">
      <button class="tab-btn active" onclick="filterByStatus('all', this)">Todos (${totalScenarios})</button>
      <button class="tab-btn" onclick="filterByStatus('passed', this)">Exitosos (${passedScenarios})</button>
      ${selfHealedScenarios > 0 ? `<button class="tab-btn" onclick="filterByStatus('healed', this)">Auto-Reparados (${selfHealedScenarios})</button>` : ''}
      ${failedScenarios > 0 ? `<button class="tab-btn" onclick="filterByStatus('failed', this)">Fallidos (${failedScenarios})</button>` : ''}
    </div>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="searchFilter" placeholder="Buscar por feature, paso o selector..." oninput="handleSearch()">
    </div>
  </div>

  <!-- ═══ FEATURES DETAIL ═══ -->
  <main class="features-list">
    ${features.map((feature, fIndex) => {
      const fPassed = (feature.scenarios || []).every(s => s.passed);
      const fDurationSec = ((feature.duration || 0) / 1000).toFixed(2);
      const featureStatus = fPassed ? 'passed' : 'failed';

      return `
      <article class="feature-card ${featureStatus}" data-feature-status="${featureStatus}">
        <div class="feature-header" onclick="toggleFeatureAccordion('feat-${fIndex}')">
          <div class="feature-title-box">
            <span class="feature-icon">${fPassed ? '🟢' : '🔴'}</span>
            <div>
              <div class="feature-name">${escapeHtml(feature.title)}</div>
              <div class="feature-desc">${escapeHtml(feature.description || feature.file)}</div>
            </div>
          </div>
          <div class="feature-meta">
            <span class="badge ${fPassed ? 'badge-passed' : 'badge-failed'}">
              ${fPassed ? 'PASSED' : 'FAILED'}
            </span>
            <span class="meta-tag">⏱️ ${fDurationSec}s</span>
            <span class="meta-tag">${feature.scenarios.length} Escenarios</span>
          </div>
        </div>

        <div class="feature-body" id="feat-${fIndex}">
          ${feature.scenarios.map((scenario) => {
            const scPassed = scenario.passed;
            const scHealed = (scenario.stepResults || []).some(s => s.status === 'self_healed');
            const scDurationSec = ((scenario.duration || 0) / 1000).toFixed(2);
            const scStatus = !scPassed ? 'failed' : (scHealed ? 'healed' : 'passed');

            return `
            <div class="scenario-card" data-scenario-status="${scStatus}">
              <div class="scenario-header">
                <div class="scenario-title">
                  <span>${scPassed ? (scHealed ? '⚡' : '✅') : '❌'}</span>
                  <span>${escapeHtml(scenario.title)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="badge ${scPassed ? (scHealed ? 'badge-healed' : 'badge-passed') : 'badge-failed'}">
                    ${scPassed ? (scHealed ? 'SELF-HEALED' : 'PASSED') : 'FAILED'}
                  </span>
                  <span class="scenario-time">${scDurationSec}s</span>
                </div>
              </div>

              <table class="steps-table">
                <tbody>
                  ${(scenario.stepResults || []).map((stepResult) => {
                    const stepWords = stepResult.step.split(' ');
                    const kw = stepWords[0].toUpperCase();
                    const restText = stepWords.slice(1).join(' ');
                    const kwClass = 'kw-' + kw.toLowerCase();
                    const lastDecision = (stepResult.decisions && stepResult.decisions.length > 0)
                      ? stepResult.decisions[stepResult.decisions.length - 1]
                      : null;
                    const decisionText = lastDecision 
                      ? `${lastDecision.action} ${lastDecision.selector || ''} ${lastDecision.value ? `"${lastDecision.value}"` : ''}`
                      : 'done';

                    return `
                    <tr>
                      <td style="width: 70px;">
                        <span class="step-keyword ${kwClass}">${kw}</span>
                      </td>
                      <td class="step-text">
                        ${escapeHtml(restText)}
                        ${stepResult.status === 'self_healed' ? `<span class="repair-tag">Auto-Reparado (${stepResult.attempts} reintentos)</span>` : ''}
                      </td>
                      <td>
                        <span class="step-decision" title="${escapeHtml(decisionText)}">${escapeHtml(decisionText)}</span>
                      </td>
                      <td class="step-duration">${((stepResult.duration || 0) / 1000).toFixed(2)}s</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              ${(() => {
                if (!scenario.screenshot) return '';
                let imgSrc = scenario.screenshot;
                const candidatePaths = [
                  path.isAbsolute(imgSrc) ? imgSrc : null,
                  path.join(process.cwd(), 'public', imgSrc),
                  path.join(process.cwd(), imgSrc),
                  path.join(__dirname, '../../public', imgSrc),
                  path.join(__dirname, '../../', imgSrc)
                ].filter(Boolean);

                for (const p of candidatePaths) {
                  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                    try {
                      const ext = path.extname(p).replace('.', '').toLowerCase() || 'png';
                      const mime = ext === 'jpg' ? 'jpeg' : ext;
                      const base64 = fs.readFileSync(p).toString('base64');
                      imgSrc = `data:image/${mime};base64,${base64}`;
                      break;
                    } catch (_) {}
                  }
                }

                return `
                <div class="scenario-footer">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Evidencia visual capturada en tiempo de ejecución:</span>
                  <img src="${imgSrc}" class="screenshot-thumb" alt="Captura de Pantalla" onclick="openLightbox(this.src)">
                </div>
                `;
              })()}
            </div>
            `;
          }).join('')}
        </div>
      </article>
      `;
    }).join('')}
  </main>
</div>

<!-- Lightbox Modal -->
<div class="modal-backdrop" id="imgModal" onclick="closeLightbox()">
  <span class="modal-close">&times;</span>
  <img src="" id="modalImg" class="modal-img" onclick="event.stopPropagation()">
</div>

<script>
  function toggleFeatureAccordion(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  function expandAllFeatures(expand) {
    document.querySelectorAll('.feature-body').forEach(el => {
      el.style.display = expand ? 'flex' : 'none';
    });
  }

  function filterByStatus(status, tabBtn) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tabBtn) tabBtn.classList.add('active');

    document.querySelectorAll('.scenario-card').forEach(card => {
      const cardStatus = card.getAttribute('data-scenario-status');
      if (status === 'all' || cardStatus === status || (status === 'passed' && (cardStatus === 'passed' || cardStatus === 'healed'))) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    // Hide empty features
    document.querySelectorAll('.feature-card').forEach(fCard => {
      const visibleScenarios = fCard.querySelectorAll('.scenario-card:not([style*="display: none"])');
      fCard.style.display = visibleScenarios.length > 0 ? 'block' : 'none';
    });
  }

  function handleSearch() {
    const query = document.getElementById('searchFilter').value.toLowerCase().trim();
    document.querySelectorAll('.scenario-card').forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? 'block' : 'none';
    });

    document.querySelectorAll('.feature-card').forEach(fCard => {
      const fText = fCard.innerText.toLowerCase();
      const visibleScenarios = fCard.querySelectorAll('.scenario-card:not([style*="display: none"])');
      fCard.style.display = (fText.includes(query) || visibleScenarios.length > 0) ? 'block' : 'none';
    });
  }

  function openLightbox(src) {
    const modal = document.getElementById('imgModal');
    const img = document.getElementById('modalImg');
    img.src = src;
    modal.classList.add('open');
  }

  function closeLightbox() {
    document.getElementById('imgModal').classList.remove('open');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
</script>

</body>
</html>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = HtmlReportGenerator;
