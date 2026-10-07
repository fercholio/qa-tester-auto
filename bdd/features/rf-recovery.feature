Feature: Recovery y Seguridad
  Como Usuario Publico o Empleado
  Quiero solicitar la recuperacion de mi contraseña
  Para recuperar el acceso si la olvido

  Scenario: RF-R1.1 y RF-R1.2 Solicitar Recuperacion de Contraseña (Ofuscado)
    Given I am an unauthenticated user
    When I navigate to the login page "/login"
    And I click "¿Olvidaste tu contraseña?"
    And I fill "email" with "usuario_perdido@example.com"
    And I click "Enviar enlace seguro"
    Then I should see the success message "recibirás un mensaje en breve"

  Scenario: RF-R2.1 Rate Limiting (Proteccion contra Fuerza Bruta)
    Given I am an unauthenticated user
    When I submit the recovery form rapidly 6 times with "ataque@example.com"
    Then the 6th attempt should return a rate limit error or "Too Many Requests"

  Scenario: RF-R3.1 Recuperacion Detonada por Administrador
    Given I am logged in as a Tenant Admin
    When I click "Gestionar Usuarios"
    And I click "Enviar Recuperacion" on the first user
    Then I should see a success notification indicating the email was sent
