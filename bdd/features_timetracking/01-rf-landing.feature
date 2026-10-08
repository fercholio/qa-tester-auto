Feature: Portal Publico, Landing Page y Seguridad de Acceso
  Como Usuario Publico o Empleado
  Quiero acceder al portal publico e iniciar sesion de forma segura
  Para operar en la plataforma con las restricciones de mi rol

  Scenario: RF-L1.1 Navegacion a la Landing Page y Call to Action
    Given I am an unauthenticated user
    When I navigate to the landing page "/"
    Then I should see the main heading "Tempus"
    And I should see the "Iniciar Sesión" button
    When I click the "Iniciar Sesión" button
    Then I should be redirected to the login page

  Scenario: RF-L3.1 Verificacion de Meta Etiquetas SEO
    Given I am an unauthenticated user
    When I navigate to the landing page "/"
    Then the page title should contain "Tempus"
    And the meta description should exist

  Scenario: RF-L1.2 Intento de Login con Credenciales Invalidas (Edge Case)
    Given I am an unauthenticated user
    When I navigate to the login page "/login"
    And I fill "email" with "usuario_inexistente@demo.com"
    And I fill "password" with "password_invalida_123"
    And I click "Iniciar sesión"
    Then I should see an error notification
    But I should not be redirected to the dashboard

  Scenario: RF-L1.3 Bloqueo de Cuenta con Tenant Inactivo (Edge Case)
    Given I am an unauthenticated user
    When I navigate to the login page "/login"
    And I fill "email" with "inactivo@empresa.com"
    And I fill "password" with "password123"
    And I click "Iniciar sesión"
    Then I should see an error notification indicating tenant suspension or inactive account

  Scenario: RF-L1.4 Proteccion de Rutas RBAC contra Acceso Directo (Edge Case)
    Given I am logged in as an Employee
    When I navigate directly to "/platform"
    Then I should be redirected to "/home" or "/dashboard"
    And I should not see the platform superadmin metrics
