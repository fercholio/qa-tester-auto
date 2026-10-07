---
description: "Hints and best practices for scraping, UI testing, and interacting with new repositories or DOM elements."
---

# Scraper & UI Testing Hints

Cuando interactúes con un nuevo repositorio que requiera pruebas E2E, UI Scraping o QA automatizado (por ejemplo con Playwright o Puppeteer), ten siempre en cuenta los siguientes lineamientos proactivos para evitar fallos de lectura del DOM y "flaky tests":

## 1. Identificadores Explícitos (IDs y data-testid)
La mayoría de los fallos de selectores en herramientas de IA (como ReAct Agents) o scrapers tradicionales ocurren por depender de selectores de texto frágiles (`text="Siguiente"`) que fallan si el texto incluye saltos de línea, íconos o cambia por traducciones.
* **Hint Proactivo:** Antes de iniciar pruebas o extracción, inyecta siempre atributos únicos como `id="btn-confirm"` o `data-testid="modal-submit"` en botones críticos, elementos de navegación, modales y formularios. No asumas que el scraper logrará hacer clic por texto libre de errores.

## 2. Bloqueo de Animaciones (CSS)
Las animaciones de interfaz (como modales `slide-in`, popovers o `fade`) provocan que los elementos tengan `opacity: 0` o no sean clickeables durante varios milisegundos. Si el scraper evalúa la página demasiado rápido, no detectará los elementos.
* **Hint Proactivo:** Inyecta globalmente una regla CSS que desactive todas las transiciones y animaciones inmediatamente después de cargar la página para que el DOM se vuelva instantáneo y determinista:
  \`\`\`css
  *, *::before, *::after {
      transition: none !important;
      animation: none !important;
  }
  \`\`\`

## 3. Manejo de Formularios y Modales (Steppers)
En componentes tipo "Stepper" o multi-paso, asegúrate de que todos los inputs necesarios del paso actual sean visibles en el DOM y tengan identificadores. Si un requerimiento exige la asignación de un dato (e.g. "Seleccionar Plan"), verifica explícitamente si el campo de selección existe en el formulario antes de delegarlo a la automatización.

### Hints para Verificación de Requerimientos Complejos
- **Aislamiento Lógico (RF-1.4)**: Para verificarlo debes:
  1. Ir a la vista global de Tenants en Plataforma y entrar a un Tenant usando el botón `Gestionar`.
  2. Navegar a una sección del Tenant (ej. `Usuarios` o `Proyectos`) y crear un registro de prueba.
  3. Hacer clic en `Volver a Plataforma (Cambiar Tenant)` para regresar a la vista global.
  4. Entrar a un **Tenant diferente** haciendo clic en su botón `Gestionar`.
  5. Navegar a la misma sección del segundo Tenant y verificar visualmente que el registro creado en el paso 2 NO se muestra. Una vez verificado, puedes dar el test por exitoso.
