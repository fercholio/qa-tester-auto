Feature: Cronometro en Vivo, Plantillas y Captura Avanzada de Tiempo
  Como Colaborador (Abogado o Analista)
  Quiero cronometrar mis actividades en tiempo real y usar plantillas
  Para contabilizar con precision mis horas operativas y facturables

  Scenario: RF-4.1 Iniciar y Detener Cronometro en Vivo con Asignacion de Proyecto
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Cronómetro"
    When I fill "timer_description" with "Audiencia Preliminar"
    And I click "Iniciar"
    Then the timer should be running
    When I wait 3 seconds
    And I click "Detener"
    Then I should see the time entry "Audiencia Preliminar" in the recent entries list

  Scenario: RF-4.2 Persistencia del Cronometro tras Recarga de Pagina (Edge Case)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Cronómetro"
    When I fill "timer_description" with "Investigacion Juridica Persistente"
    And I click "Iniciar"
    Then the timer should be running
    When I reload the page
    Then the timer should still be running with "Investigacion Juridica Persistente"
    When I click "Detener"
    Then the timer should be stopped

  Scenario: RF-4.3 Cambio de Proyecto en Caliente durante Cronometro Activo
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Cronómetro"
    When I fill "timer_description" with "Redaccion de Contrato"
    And I click "Iniciar"
    When I select the project "Defensa Civil"
    And I click "Detener"
    Then the saved entry should be associated with "Defensa Civil"

  Scenario: RF-4.4 Entrada de Tiempo con Duracion Cero o Minima (Edge Case)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Entradas"
    When I click "Nueva Entrada"
    And I fill "description" with "Entrada Instantanea Invalida"
    And I fill "time_start" with "10:00"
    And I fill "time_end" with "10:00"
    And I click "Crear"
    Then I should see a validation error indicating duration must be greater than zero

  Scenario: RF-4.5 Registro de Horas en Fecha Futura no Permitida (Edge Case)
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Entradas"
    When I click "Nueva Entrada"
    And I fill "description" with "Trabajo del Futuro"
    And I fill "entry_date" with "2099-12-31"
    And I click "Crear"
    Then I should see an error notification indicating future entries are not allowed

  Scenario: RF-5.4 Aplicacion de Plantilla Recurrente de Tiempo
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Plantillas"
    When I click "Nueva Plantilla"
    And I fill "name" with "Reunion Semanal de Estatus"
    And I fill "default_duration" with "01:00"
    And I click "Guardar Plantilla"
    Then the template "Reunion Semanal de Estatus" should exist in the templates list
    When I click "Usar Plantilla" on "Reunion Semanal de Estatus"
    Then a new time entry prefilled with "Reunion Semanal de Estatus" should be created

  Scenario: RF-5.5 Captura Asistida por IA en Lenguaje Natural
    Given I am logged in as a Super Admin
    When I click "Tenants"
    And I click the first "Gestionar" button
    And I click "Inicio"
    When I fill "conversational_prompt" with "Dedique 2 horas a revisar expedientes con el cliente"
    And I click "Enviar"
    Then I should see the parsed entry draft with duration "2" hours
