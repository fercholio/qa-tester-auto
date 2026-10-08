Feature: 15 Performance, Estrés y Concurrencia Masiva en TimeTracking
  Como arquitecto de rendimiento y tester de estrés en TimeTracking
  Quiero someter la aplicación a cargas sostenidas, ráfagas DoS y concurrencia masiva
  Para certificar que los tiempos de respuesta interactiva, el motor de throttling y la consistencia transaccional se mantienen óptimos

  Scenario: Carga concurrente de peticiones simultaneas en API de reportes
    Given I am logged in as a "tenant_admin"
    When I trigger 30 simultaneous release requests to "/api/reports"
    Then the directory response time must remain resilient under load
    And I should see "Reportes"

  Scenario: Renderizado y latencia interactiva en cronometro en vivo bajo estres
    Given I am logged in as a "employee"
    And I am on the page "http://localhost:3000/timer"
    When I trigger continuous parameter updates in labor calculator
    Then the interactive rendering latency must stay under 400ms
    And I should see "Cronómetro"

  Scenario: Rafaga de consultas masivas en directorio de proyectos
    Given I am logged in as a "tenant_admin"
    When I simulate 30 concurrent user search queries in directory
    Then the directory response time must remain resilient under load
    And I should see "Proyectos"

  Scenario: Rafaga masiva de intentos de autenticacion para verificacion de proteccion DoS y Throttling
    Given I am on the page "http://localhost:3000/"
    When I send a burst rate of 25 rapid search requests within 2 seconds
    Then the rate limiting throttling protection must activate
    And I should see "TEMPUS"

  Scenario: Verificacion de consistencia en hoja de tiempos bajo navegacion rapida
    Given I am logged in as a "employee"
    When I am on the page "http://localhost:3000/timesheet"
    Then I should see "Dashboard"
