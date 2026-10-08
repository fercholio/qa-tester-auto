Feature: Herramientas LegalTech, Calculadoras y Boveda Escrow
  Como usuario o abogado de Abogalia
  Quiero utilizar calculadoras juridicas, auditar contratos con IA y consultar fondos escrow
  Para agilizar la toma de decisiones legales y garantizar pagos seguros

  Scenario: Acceso al centro de calculadoras legales
    Given I am on the page "http://localhost:5174/calculadoras"
    Then I should see "Calculadoras"

  Scenario: Calculo de liquidacion e indemnizacion en calculadora laboral
    Given I am on the page "http://localhost:5174/calculadoras"
    Then I should see "Laboral"

  Scenario: Calculo de impuestos y derechos en calculadora notarial
    Given I am on the page "http://localhost:5174/calculadora-notarial"
    Then I should see "Notarial"

  Scenario: Acceso al modulo de analisis de contratos con IA
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/analisis-contratos"
    Then I should see "Contrato"

  Scenario: Consulta de fondos y estados de pago en la Boveda Escrow
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/escrow"
    Then I should see "Escrow"

  Scenario: Consulta de la matriz de planes y suscripciones
    Given I am on the page "http://localhost:5174/planes"
    Then I should see "Planes"
