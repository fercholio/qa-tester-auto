Feature: Landing Page
  Como Usuario Publico
  Quiero visualizar la landing page de Tempus
  Para entender el producto e iniciar sesion

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
