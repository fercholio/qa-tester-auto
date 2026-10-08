---
description: "Regla obligatoria de estructura y nomenclatura para suites de pruebas BDD: bdd/features_<repositoryname>"
---

# Regla de Nomenclatura para Suites BDD por Repositorio

Todos los agentes de IA, desarrolladores y herramientas de automatización de QA que operen en este repositorio deben cumplir estrictamente la siguiente convención de estructura y directorios:

## 1. Convención de Directorio Obligatoria
* Las especificaciones BDD (`.feature`) **NUNCA** deben guardarse en un directorio genérico como `bdd/features/`.
* Todo archivo o conjunto de features debe residir obligatoriamente en un subdirectorio nombrado con el prefijo `features_` seguido del nombre del repositorio destino en minúsculas y sin caracteres especiales:
  
  **Formato:**
  ```text
  /bdd/features_<repositoryname>/
  ```

### Ejemplos vigentes:
* Repositorio **timetracking**: `bdd/features_timetracking/`
* Repositorio **abogalia**: `bdd/features_abogalia/`

## 2. Comportamiento Requerido para Agentes y Runners
1. **Creación de Escenarios:** Al generar nuevos escenarios o funcionalidades de prueba BDD para un sistema bajo prueba, el agente debe identificar el nombre del repositorio destino y crear sus archivos `.feature` exclusivamente dentro de `bdd/features_<repositoryname>/`.
2. **Ejecución y Lectura:** Los ejecutores (runners como `run_all_rf.js`, `run_bdd_test.js`) deben leer la suite desde la carpeta correspondiente al repositorio activo (`bdd/features_${process.env.APP_NAME || 'abogalia'}`) o permitir su especificación vía variable de entorno `FEATURES_DIR`.
3. **Mantenimiento y Migración:** Si existen features en un directorio sin el nombre del repositorio, el agente debe moverlos inmediatamente a `bdd/features_<repositoryname>/` para garantizar aislamiento multi-proyecto y trazabilidad.
