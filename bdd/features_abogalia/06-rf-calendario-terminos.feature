Feature: Calendario Judicial, Terminos Fatales y Dias Habiles
  Como abogado del despacho
  Quiero consultar audiencias, terminos fatales y dias habiles procesales
  Para prevenir preclusiones y gestionar eficazmente los plazos procesales

  Scenario: Navegacion a la vista general del Calendario Judicial
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Calendario"

  Scenario: Filtrado por categoria de eventos en el calendario
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Audiencias"

  Scenario: Visualizacion de Terminos Fatales en la agenda judicial
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Términos"

  Scenario: Soporte del filtro universal de materias procesales
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Materia"

  Scenario: Calculo y visualizacion de dias habiles restantes en los terminos
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "días"

  Scenario: Navegacion entre meses en la vista mensual del calendario
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "2026"

  Scenario: Agendamiento de un nuevo evento o recordatorio en el calendario
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Agendar"
