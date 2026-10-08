Feature: Monitoreo Judicial Automatizado y Web Scrapers
  Como abogado suscrito a la plataforma
  Quiero automatizar la vigilancia de acuerdos y boletines judiciales
  Para enterarme de inmediato de cualquier publicacion procesal relevante

  Scenario: Navegacion al modulo de Monitoreo Judicial
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "Monitoreo"

  Scenario: Visualizacion del catalogo de portales judiciales soportados
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "Federal"

  Scenario: Apertura del modal de configuracion de monitor PJF SISE
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "SISE"

  Scenario: Apertura del modal de configuracion de monitor estatal Campeche SIGELEX
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "Campeche"

  Scenario: Apertura del modal de acuerdos para Quintana Roo Estrados
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "Quintana Roo"

  Scenario: Ejecucion de accion Forzar nueva busqueda en acuerdos judiciales
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "a[href*='monitoreo'], button:has-text('Monitoreo'), text=Monitoreo"
    Then I should see "Búsqueda"
