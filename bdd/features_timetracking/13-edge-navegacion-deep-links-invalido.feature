Feature: 13 Edge Cases - Navegacion Anomala, Deep Links Invalidos y Parametros Corruptos
  Como usuario malicioso o enlace corrupto en TimeTracking
  Quiero acceder a identificadores inexistentes, rutas rotas y parámetros anómalos
  Para verificar que el sistema maneja excepciones con resiliencia, sin pantallas blancas ni crashes de frontend

  Scenario: Deep link a proyecto inexistente con ID numerico desorbitado
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/projects/99999999/users"
    Then I should see "Proyectos"

  Scenario: Deep link a proyecto con parametro alfanumerico invalido
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/projects/abc-invalido-xyz/entries"
    Then I should see "Proyectos"

  Scenario: Navegacion directa a ruta 404 inexistente redirige de forma segura
    Given I am on the page "http://localhost:3000/ruta-inexistente-fantasma-404"
    Then I should see "TEMPUS"

  Scenario: Acceso a modulo de restablecimiento con token vacio o corrupto
    Given I am on the page "http://localhost:3000/reset-password?token="
    Then I should see "TEMPUS"

  Scenario: Query parameters con secuencias de escape y caracteres especiales en reportes
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/reports?start=%00%27%22&end=%3Cscript%3E"
    Then I should see "Reportes"
