Feature: Aprobacion de Hojas de Tiempo, Inmutabilidad y Reportes
  Como Empleado y Manager
  Quiero someter mis semanas a aprobacion y auditar reportes
  Para garantizar la integridad y cierre contable de las horas

  Scenario: RF-6.1 Envio de Hoja Semanal de Tiempo para Revision
    Given I am logged in as an Employee
    When I click "Hoja Semanal"
    Then I should see the current week timesheet grid
    When I click "Enviar Semana para Aprobación"
    Then the timesheet status should change to "En Revisión"

  Scenario: RF-6.2 Aprobacion de Hoja de Tiempo por el Administrador
    Given I am logged in as a Tenant Admin
    When I click "Aprobaciones"
    Then I should see the pending timesheet for review
    When I click "Aprobar Hoja"
    Then I should see a success notification indicating timesheet was approved
    And the timesheet status should be "Aprobada"

  Scenario: RF-6.3 Inmutabilidad de Entradas Aprobadas (Bloqueo de Edicion - Edge Case)
    Given I am logged in as an Employee
    When I click "Entradas"
    Then approved entries should display a lock icon
    When I try to click "Editar" on an approved entry
    Then the edit action should be disabled or prevented with an alert

  Scenario: RF-6.4 Rechazo de Hoja de Tiempo con Motivo Obligatorio (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Aprobaciones"
    When I click "Rechazar" on a pending timesheet
    And I leave the rejection comment empty
    And I click "Confirmar Rechazo"
    Then I should see a validation error indicating comment is required
    When I fill "rejection_comment" with "Faltan justificar 4 horas del jueves"
    And I click "Confirmar Rechazo"
    Then the timesheet status should be "Rechazada"

  Scenario: RF-10.1 Filtrado de Reportes con Rango Vacio (Empty State Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Reportes"
    And I select date range "2020-01-01" to "2020-01-02"
    And I click "Filtrar"
    Then I should see an empty state illustration saying "No hay datos para este periodo"
    And there should be zero console errors

  Scenario: RF-10.2 Exportacion de Reporte en CSV o Excel
    Given I am logged in as a Tenant Admin
    When I click "Reportes"
    When I click "Exportar CSV"
    Then a file download should trigger with extension ".csv"
