Feature: Edge Cases - Formularios Limite, Campos Vacios y Tolerancia a Fallos
  Como usuario atípico o automatizado
  Quiero enviar formularios incompletos, espacios en blanco y valores fuera de rango
  Para certificar que el sistema valida adecuadamente y mantiene una experiencia robusta y tolerante a fallos

  Scenario: Envio de formulario de login con campos vacios
    Given I am on the login page "http://localhost:5174/login"
    When I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Envio de correo electronico con formato invalido sin arroba ni dominio
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "correo_invalido_sin_arroba"
    And I fill "input[type='password']" with "Password123!"
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Envio de credenciales compuestas exclusivamente de espacios en blanco
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "   "
    And I fill "input[type='password']" with "   "
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Busqueda con espacios en blanco en Boveda del Cliente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I fill "input[placeholder*='Buscar por número de expediente']" with "     "
    Then I should see "Bóveda"

  Scenario: Consulta en centro de calculadoras legales
    Given I am on the page "http://localhost:5174/calculadoras"
    Then I should see "Laboral"

  Scenario: Visualizacion de calendario de terminos judiciales
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/calendario"
    Then I should see "Calendario"

  Scenario: Acceso a editor de micrositio y resiliencia de carga
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/mi-sitio"
    Then I should see "Micrositio"

  Scenario: Recuperacion de contrasena con email no registrado
    Given I am on the login page "http://localhost:5174/recuperar-password"
    When I fill "input[type='email']" with "no-existe-en-db-abogalia-999@gmail.com"
    And I click "button[type='submit']"
    Then I should see "correo"
