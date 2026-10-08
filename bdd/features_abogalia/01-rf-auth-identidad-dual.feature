Feature: Autenticacion, Recuperacion e Identidad Dual
  Como usuario de Abogalia
  Quiero autenticarme con mi rol correspondiente o recuperar mi acceso
  Para utilizar las herramientas de la plataforma de forma segura

  Scenario: Inicio de sesion exitoso como Abogado Titular
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "abogado@mendezgarza.mx"
    And I fill "input[type='password']" with "Password123!"
    And I click "button[type='submit']"
    Then I should see "Panel"

  Scenario: Inicio de sesion exitoso como Cliente
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "cliente@gmail.com"
    And I fill "input[type='password']" with "Password123!"
    And I click "button[type='submit']"
    Then I should see "Bóveda"

  Scenario: Inicio de sesion exitoso como Super Admin
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "admin@abogalia.mx"
    And I fill "input[type='password']" with "Password123!"
    And I click "button[type='submit']"
    Then I should see "Admin"

  Scenario: Validacion de feedback ante credenciales invalidas
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "invalido@correo.com"
    And I fill "input[type='password']" with "PasswordErronea!"
    And I click "button[type='submit']"
    Then I should see "inválid"

  Scenario: Solicitud de recuperacion de contrasena
    Given I am on the login page "http://localhost:5174/recuperar-password"
    When I fill "input[type='email']" with "abogado@mendezgarza.mx"
    And I click "button[type='submit']"
    Then I should see "enviado"

  Scenario: Validacion de rate limit o control de intentos en recuperacion
    Given I am on the login page "http://localhost:5174/recuperar-password"
    When I fill "input[type='email']" with "cliente@gmail.com"
    And I click "button[type='submit']"
    Then I should see "correo"

  Scenario: Visualizacion de pantalla de registro y creacion de perfil
    Given I am on the page "http://localhost:5174/register"
    Then I should see "Alta Profesional"
