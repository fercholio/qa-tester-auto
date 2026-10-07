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
    And I fill "description" with "Revision de Expediente"
    And I click "Crear"
    Then I should see the time entry "Revision de Expediente"

  Scenario: RF-3.3 Actualizacion de Perfil Restringido
    Given I am logged in as a Super Admin
    When I click the "#nav-profile" link
    And I fill "work_start" with "08:00"
    Then I should see a success notification
    But I should not see options to change my own role
