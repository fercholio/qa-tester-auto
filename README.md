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
