# QA Surface Tester - Reglas de Operación para Agentes

Este archivo define las directrices y estándares que todos los agentes de IA deben seguir al operar en esta plataforma de testing autónomo.

## Estructura de Suites BDD por Repositorio

Es mandatorio mantener aislado el conjunto de especificaciones BDD según el repositorio o sistema que se esté testeando:

* **Formato de Directorio:**
  `/bdd/features_<repositoryname>/`
* **Ejemplos:**
  - `bdd/features_timetracking/` (Pruebas del sistema TimeTracking)
  - `bdd/features_abogalia/` (Pruebas de la plataforma Abogalia)

### Directrices para Agentes:
1. **Nunca** depositar archivos `.feature` en `bdd/features/` genérico.
2. Cada vez que se generen o modifiquen features para un proyecto, colocarlos dentro de `bdd/features_<repositoryname>/`.
3. Los scripts ejecutores deben referenciar `bdd/features_<repositoryname>/` de acuerdo al proyecto activo (`APP_NAME`).
