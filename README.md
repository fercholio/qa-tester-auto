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
