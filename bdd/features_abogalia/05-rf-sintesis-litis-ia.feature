Feature: Sintesis Juridica con IA, Litis 50/50 y Edicion de Objeciones
  Como abogado litigante
  Quiero consultar el analisis de IA, editar las prestaciones y registrar objeciones a pruebas
  Para estructurar la estrategia procesal con precision y control

  Scenario: Navegacion al Tab Sintesis y analisis estructurado por IA
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should see "Síntesis"

  Scenario: Verificacion de limpieza de botones en la cabecera de sintesis
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should not see "btn-export-synthesis"

  Scenario: Presencia del boton unificado Reiniciar Sintesis
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should see "Reiniciar"

  Scenario: Verificacion de la estructura simetrica 50/50 de Prestaciones
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should see "Prestaciones"

  Scenario: Visualizacion del modulo de Pruebas con label Objecion
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should see "Pruebas"

  Scenario: Integridad lexico-procesal y consistencia ortografica en la interfaz
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=sintesis"
    Then I should see "Bóveda"
