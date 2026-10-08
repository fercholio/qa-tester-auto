Feature: 14 Edge Cases - Formularios Limite, Campos Vacios y Tolerancia a Fallos
  Como usuario atípico o automatizado en TimeTracking
  Quiero enviar formularios incompletos, espacios en blanco y valores fuera de rango
  Para certificar que el sistema valida adecuadamente y mantiene una experiencia robusta y tolerante a fallos

  Scenario: Envio de formulario de login con campos vacios
    Given I am on the login page "http://localhost:3000/login"
    When I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Envio de correo electronico con formato invalido sin arroba ni dominio
    Given I am on the login page "http://localhost:3000/login"
    When I fill "input[type='email']" with "correo_invalido_sin_arroba"
    And I fill "input[type='password']" with "password"
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Envio de credenciales compuestas exclusivamente de espacios en blanco
    Given I am on the login page "http://localhost:3000/login"
    When I fill "input[type='email']" with "   "
    And I fill "input[type='password']" with "   "
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Consulta de proyectos y tolerancia a filtros vacios
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/projects"
    Then I should see "Proyectos"

  Scenario: Consulta interactiva en organigrama con multiples puestos
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/organigram"
    Then I should see "Organigrama"

  Scenario: Visualizacion y tolerancia en modulo de aprobaciones timesheet
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/approvals"
    Then I should see "Aprobaciones"
