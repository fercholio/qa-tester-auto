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

  Scenario: RF-R1.3 Reset de Contraseña con Token Invalido o Expirado (Edge Case)
    Given I am an unauthenticated user
    When I navigate directly to "/reset-password?token=token_falso_expirado&email=demo@demo.com"
    And I fill "password" with "nuevaPassword123"
    And I fill "password_confirmation" with "nuevaPassword123"
    And I click "Restablecer contraseña"
    Then I should see an error notification indicating invalid or expired token

  Scenario: RF-R1.4 Cooldown Temporal entre Solicitudes de Recuperacion (Edge Case)
    Given I am an unauthenticated user
    When I navigate to "/forgot-password"
    And I fill "email" with "cooldown_test@demo.com"
    And I click "Enviar enlace seguro"
    Then I should see the success message "recibirás un mensaje en breve"
    When I immediately click "Enviar enlace seguro" again
    Then I should see a warning notification requesting to wait before requesting another email
