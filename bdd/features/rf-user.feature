Feature: Usuario / Empleado
  Como Empleado (Abogado)
  Quiero registrar mi tiempo y ver mis metricas personales
  Para cumplir con mis metas de valor

  Scenario: RF-5.1 Captura manual de Tiempo (Time Tracking)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    Then I should be redirected to the dashboard
    And I click "Entradas"
    When I click "Nueva Entrada"
    And I fill "project_name" with "Defensa Civil"
    And I fill "task_name" with "Revision de Expediente"
    And I fill "duration" with "02:00"
    And I click "Guardar Registro"
    Then the time entry should exist in the table

  Scenario: RF-3.3 Actualizacion de Perfil Restringido
    Given I am logged in as a Super Admin
    When I click the "#nav-profile" link
    And I fill "work_start" with "08:00"
    Then I should see a success notification
    But I should not see options to change my own role
