Feature: Gestion de Proyectos, Asignacion de Miembros y Tarifas
  Como Manager o Administrador
  Quiero estructurar proyectos, asignar colaboradores y definir tarifas
  Para controlar presupuestos y costos en tiempo real

  Scenario: RF-7.1 Asignacion de Miembros a Proyecto con Tarifa Personalizada
    Given I am logged in as a Tenant Admin
    When I click "Proyectos"
    And I click "Gestionar Miembros" on "Defensa Civil"
    When I click "+ Asignar Colaborador"
    And I select user "Test User"
    And I fill "hourly_rate" with "350"
    And I click "Guardar Asignacion"
    Then the user "Test User" should exist in the project members list with rate "350"

  Scenario: RF-7.2 Ocultamiento de Proyecto Archivado en Cronometro y Entradas (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Proyectos"
    And I click "Archivar" on the project "Defensa Civil"
    Then the project status should be "Archivado"
    When I click "Entradas"
    And I click "Nueva Entrada"
    Then the project "Defensa Civil" should not exist in the active projects select list

  Scenario: RF-7.3 Alerta de Exceso de Presupuesto en Proyecto (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Proyectos"
    And I click "Detalles" on "Defensa Civil"
    Then I should see the budget health card
    And I should see the consumed vs remaining budget breakdown

  Scenario: RF-7.4 Visualizacion de Entradas Filtradas por Proyecto
    Given I am logged in as a Tenant Admin
    When I click "Proyectos"
    And I click "Ver Entradas" on "Defensa Civil"
    Then I should see the project time entries view
    And all entries in the table should belong to "Defensa Civil"
