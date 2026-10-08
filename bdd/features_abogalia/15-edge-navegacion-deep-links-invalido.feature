Feature: Edge Cases - Navegacion Anomala, Deep Links Invalidos y Parametros Corruptos
  Como usuario malicioso o enlace corrupto
  Quiero acceder a identificadores inexistentes, rutas rotas y parametros anómalos
  Para verificar que el sistema maneja excepciones con resiliencia, sin pantallas blancas ni crashes de frontend

  Scenario: Deep link a expediente inexistente con ID numerico desorbitado
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/99999999"
    Then I should see "Expediente"

  Scenario: Deep link a expediente con parametro alfanumerico invalido
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/abc-invalido-xyz"
    Then I should see "Expediente"

  Scenario: Parametro de pestana corrupto o desconocido en cockpit de expediente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=pestana_desconocida_corrupta"
    Then I should see "Expediente"

  Scenario: Navegacion directa a ruta 404 inexistente redirige de forma segura
    Given I am on the page "http://localhost:5174/ruta-inexistente-fantasma-404"
    Then I should see "Directorio"

  Scenario: Navegacion a micrositio de abogado con slug no registrado
    Given I am on the page "http://localhost:5174/e/abogado-fantasma-inexistente-999"
    Then I should see "Abogado"

  Scenario: Acceso a modulo de restablecimiento con token vacio o corrupto
    Given I am on the page "http://localhost:5174/restablecer-password?token="
    Then I should see "Contraseña"

  Scenario: Query parameters con secuencias de escape y caracteres especiales en directorio
    Given I am on the page "http://localhost:5174/?materia=%00%27%22&estado=%3Cscript%3E"
    Then I should see "Directorio"
