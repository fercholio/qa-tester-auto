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

  Scenario: RF-5.2 Validacion de Orden Temporal en Registro Manual (Edge Case)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Entradas"
    When I click "Nueva Entrada"
    And I fill "description" with "Entrada Invalida"
    And I fill "time_start" with "15:00"
    And I fill "time_end" with "14:00"
    And I click "Crear"
    Then I should see an error notification indicating end time must be after start time

  Scenario: RF-5.3 Prevencion de Traslape de Horas (Overlap Edge Case)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Entradas"
    When I click "Nueva Entrada"
    And I fill "description" with "Cita Medica Simultanea"
    And I fill "time_start" with "10:00"
    And I fill "time_end" with "12:00"
    And I click "Crear"
    When I click "Nueva Entrada"
    And I fill "description" with "Juicio Oral Traslapado"
    And I fill "time_start" with "11:00"
    And I fill "time_end" with "13:00"
    And I click "Crear"
    Then I should see an overlap warning or error indicating overlapping time entries

  Scenario: RF-3.4 Incoherencia de Horas en Jornada Laboral (Edge Case)
    Given I am logged in as a Super Admin
    When I click the "#nav-profile" link
    And I fill "work_start" with "20:00"
    And I fill "work_end" with "08:00"
    Then I should see a warning notification or validation alert for overnight schedule

  Scenario: RF-3.5 Sanitizacion de Nombre de Perfil contra XSS (Edge Case)
    Given I am logged in as a Super Admin
    When I click the "#nav-profile" link
    And I fill "name" with "<script>alert('xss')</script> Super Admin"
    And I click "Guardar Perfil"
    Then I should not see any raw script execution or unescaped HTML tags
