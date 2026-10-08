Feature: Modulo Mis Formatos y Ensamblador de Escritos
  Como abogado del despacho
  Quiero gestionar plantillas y redactar escritos con variables automatizadas
  Para estandarizar la produccion documental y ahorrar tiempo procesal

  Scenario: Navegacion al modulo de Mis Formatos y Plantillas
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='plantillas'], button:has-text('Formatos'), text=Formatos"
    Then I should see "Formatos"

  Scenario: Visualizacion del catalogo de formatos procesales precargados
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='plantillas'], button:has-text('Formatos'), text=Formatos"
    Then I should see "Plantilla"

  Scenario: Creacion de una nueva plantilla institucional con variables dinamicas
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='plantillas'], button:has-text('Formatos'), text=Formatos"
    Then I should see "Nuevo formato"

  Scenario: Ensamblado de escrito vinculando variables procesales del expediente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='plantillas'], button:has-text('Formatos'), text=Formatos"
    Then I should see "Formatos"

  Scenario: Descarga de machote en formato editable Word o PDF
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='plantillas'], button:has-text('Formatos'), text=Formatos"
    Then I should see "Formatos"
