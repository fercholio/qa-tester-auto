# QA Surface Tester: Plataforma Autónoma de Verificación ReAct

El **QA Surface Tester** es una solución de pruebas end-to-end de nueva generación impulsada por IA. A diferencia de las pruebas de QA tradicionales (Cypress, Playwright) que requieren mantenimiento constante de selectores, este tester utiliza Modelos de Lenguaje Grandes (LLMs) mediante el paradigma **ReAct (Reasoning + Acting)**.

El agente es capaz de "ver" el DOM y capturas de pantalla, "razonar" qué acción tomar basado en un requerimiento funcional provisto en formato Markdown, y "actuar" haciendo clics, llenando formularios o navegando por la web, todo de manera autónoma.

## Requisitos Previos

- Node.js (v18 o superior)
- Navegador compatible instalado (Playwright descargará uno en el primer uso)
- Acceso a la API de Groq (para inferencia de modelos LLM)
- La interfaz a probar debe estar corriendo en un puerto local o URL accesible (por defecto `http://localhost:3001`).

## Instalación

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz del proyecto basándote en el formato:
   ```env
   GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
   TARGET_URL=http://localhost:3001
   ```

## Uso Básico

Puedes correr la suite de pruebas completa ejecutando el CLI incorporado. Este procesará el documento maestro de QA (`QA_master.md`) para extraer los requerimientos y lanzar el agente.

```bash
# Ejecutar todas las pruebas (apuntando al documento de QA en tu proyecto principal)
node bin/qa-tester.js run --docs /ruta/absoluta/a/tu/proyecto/docs/QA_master.md
```

## Uso Avanzado: Reanudar Pruebas (Resume)

Dado que las pruebas E2E con IA pueden tardar varios minutos y es común que el sistema se interrumpa o que estés depurando un componente en particular, **no necesitas reiniciar desde el primer requerimiento**.

Puedes utilizar la variable de entorno `START_FROM_ID` y especificar el identificador exacto de la prueba en la que deseas iniciar (o reanudar). El agente omitirá todos los requerimientos anteriores.

```bash
# Ejemplo: Reanudar pruebas y empezar directamente en el requerimiento de facturación (RF-ABO-WEB-05)
START_FROM_ID=RF-ABO-WEB-05 node bin/qa-tester.js run --docs /ruta/absoluta/a/tu/proyecto/docs/QA_master.md
```

## ¿Cómo funciona el Agente Interno?

1. **Autenticación (Bypass):** Se conecta primero a un endpoint de login predefinido para obtener los tokens JWT y los guarda localmente simulando un entorno logueado.
2. **Contextualización (Visión y DOM):** Por cada requerimiento funcional, extrae elementos interactivos visibles (`data-testid`, texto, enlaces) y toma una captura de pantalla que se envía al LLM.
3. **Reasoning + Acting:** El agente de IA decide cuál es el botón o campo óptimo para pulsar o completar.
4. **Validación:** Si el estado del sistema cumple el requerimiento, la prueba se marca como exitosa (`SUCCESS`) y avanza a la siguiente. Si algo falla o no se encuentra el componente adecuado, marca error (`FAILED`).

## Reportes
Los reportes HTML generados y capturas probatorias (pantallazos) al finalizar la prueba se depositan en el directorio `/public`.

## Nuevo Enfoque: Behavior-Driven Development (BDD)

Además de la ejecución a través de documentos markdown interactivos (`QA_master.md`), el QA Surface Tester ahora soporta de forma nativa un motor de Behavior-Driven Development (BDD) que asimila escenarios escritos en Gherkin (archivos `.feature`).

Este enfoque le permite a QA, Desarrolladores y Analistas de Negocio definir el comportamiento esperado del software de manera declarativa. El motor BDD impulsado por IA parsea los archivos `.feature`, extrae las instrucciones y las delega al agente LLM para traducirlas a selectores y acciones de Playwright de forma autónoma.

### Configuración e Integración BDD

1. **Ubicación de archivos:** Escribe tus Requerimientos Funcionales en archivos `.feature` dentro del directorio `bdd/features/` (ej. `rf-1.1.feature`).
2. **Sintaxis Gherkin:** Utiliza la sintaxis estandarizada de Gherkin (`Feature`, `Scenario`, `Given`, `When`, `Then`).
3. **Ejecución Síncrona Completa:**
   Para procesar **todos** los escenarios BDD de todos los roles, extraer capturas de éxito/error por cada paso y generar un reporte `report.xml` compatible con metodologías CI/CD (JUnit), usa el runner oficial:
   
   ```bash
   node run_all_rf.js
   ```

Este comando:
- Iterará de manera síncrona sobre cada archivo en `bdd/features/*.feature`.
- Aislará cada contexto e inyectará los prompts al modelo LLM.
- Producirá la evidencia fotográfica (`success-screenshot-*.png` o `error-screenshot-*.png`).
- Compilará todo en un archivo `report.xml` (JUnit) listando qué RFs pasaron y cuáles fallaron.

Este flujo permite validar exhaustivamente todos los roles (Super Admin, Tenant Admin, Employee) con barreras de aislamiento multi-tenant y controles granulares.

---

## Arquitectura de Cumplimiento UI Semántica para Automatización con IA (AI-Ready Frontend)

### El Paradigma: Cero Selectores Hardcodeados
A diferencia de los frameworks tradicionales (Selenium, Cypress clásico) donde las pruebas dependen de selectores CSS frágiles (`#app > div.main > button:nth-child(2)`) o atributos artificiales (`data-testid`), el **QA Surface Tester** utiliza un motor autónomo ReAct que navega mediante el **Árbol de Accesibilidad (AOM)** y la percepción semántica del DOM.

Para que este modelo opere con 100% de fiabilidad en cualquier entorno (local, Docker, CI/CD o la máquina del Arquitecto de Software), el frontend debe cumplir con los **4 Principios de Semántica UI para Agentes IA**:

#### 1. Elementos Clickeables Semánticos (`clickable-semantics`)
* **Regla:** Todo elemento interactivo debe ser un elemento nativo (`<button>`, `<a>`) o, si se utiliza un contenedor (`<div>`, `<span>`), **debe declarar explícitamente `role="button"` y `tabindex="0"`**.
* **Razón:** El agente de IA filtra el DOM buscando nodos interactivos en el árbol de accesibilidad. Un `<div @click="...">` sin `role="button"` es invisible para el agente, provocando timeouts de 5000ms al no encontrar el target.
* **Ejemplo correcto:**
  ```html
  <!-- Recomendado nativo -->
  <button type="button" @click="handleAction" class="custom-card">...</button>
  
  <!-- Contenedor personalizado con semántica -->
  <div role="button" tabindex="0" @click="handleAction" class="custom-card">...</div>
  ```

#### 2. Nombres Accesibles en Todos los Botones (`empty-button-text`)
* **Regla:** Todo botón (especialmente botones con iconos SVG como editar, eliminar, cerrar o toggles) debe poseer texto visible, un atributo `aria-label` descriptivo o `:title`.
* **Razón:** Los modelos de lenguaje identifican los controles por su nombre accesible. Un `<button class="btn-icon"><svg>...</svg></button>` sin label es un "botón fantasma" que el modelo no puede correlacionar con pasos de prueba como *When I click "Eliminar"*.
* **Ejemplo correcto:**
  ```html
  <button aria-label="Eliminar etiqueta" @click="deleteTag(tag)" class="btn-icon" title="Eliminar">
    <svg ...></svg>
  </button>
  ```

#### 3. Overlays y Modales no Bloqueantes (`z-index-drawers`)
* **Regla:** Los backdrops y modales/drawers deben contar con manejo de cierre al hacer clic (`@click.self="close"`) y un orden de apilamiento `z-index` controlado.
* **Razón:** Elementos overlay transparentes mal cerrados o con `z-index` elevado interceptan eventos de puntero (`pointer-events`), bloqueando los clics del runner de Playwright sobre los botones reales detrás de la cortina.

#### 4. Sin Controles Ocultos Requeridos (`no-hidden-required`)
* **Regla:** Nunca aplicar el atributo HTML `required` a un `<input>` que esté oculto (`display: none` o `v-show="false"`).
* **Razón:** Los navegadores Chromium lanzan el error fatal `"An invalid form control with name='...' is not focusable"`, impidiendo el envío de formularios en pruebas automatizadas y en producción.

---

### Herramientas de Cumplimiento Integradas

El repositorio incluye dos herramientas de análisis y remediación estática ubicadas en la raíz:

#### 1. Escáner de Cumplimiento (`ui_compliance_analyzer.js`)
Analiza todos los componentes `.vue` del frontend (`web/src`) y genera una métrica cuantitativa de "Efectividad AI-Ready":

```bash
node ui_compliance_analyzer.js
```

**Resultado actual en el repositorio:**
```text
===========================================
📊 REPORTE DE EFECTIVIDAD DE UI AUTOMATION
===========================================
Archivos Analizados: 67
Archivos "AI-Ready": 67
Archivos con posibles bloqueos: 0
Total de violaciones de reglas: 0
Porcentaje de Efectividad: 100.00%
===========================================
✅ El código base es altamente compatible con pruebas autónomas.
```

#### 2. Parcheador Automático de Semántica (`fix_ui_semantics.js`)
Herramienta de codemod que examina el árbol de componentes Vue e inyecta automáticamente atributos `role="button"` y `tabindex="0"` en contenedores con eventos `@click`, permitiendo elevar la compatibilidad a 100% de forma instantánea:

```bash
node fix_ui_semantics.js
```

---

### Guía para el Arquitecto de Software: Replicación en Otra Máquina / Sistema

Para que cualquier miembro del equipo o el Arquitecto de Software corra esta suite de pruebas de forma idéntica en su máquina:

1. **Requisitos de Sistema:**
   - Node.js >= 18.x
   - Conexión a Internet (para inferencia de modelos en Groq)
   - El frontend web corriendo (`cd ../timetracking/web && npm run dev` en `http://localhost:3000`)
   - El backend API y base de datos inicializada (`php artisan migrate --seed` / Docker Abogalia)

2. **Instalación y Configuración:**
   ```bash
   git clone https://github.com/fercholio/qa-tester-auto.git
   cd qa-tester-auto
   npm install
   npx playwright install chromium
   ```

3. **Variables de Entorno (`.env`):**
   ```env
   GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
   TARGET_URL=http://localhost:3000
   ```

4. **Ejecutar la Suite Completa:**
   ```bash
   node run_all_rf.js
   ```

5. **Ejecutar un Requerimiento Específico:**
   ```bash
   node bin/qa-tester.js run --feature bdd/features/rf-superadmin.feature
   ```
