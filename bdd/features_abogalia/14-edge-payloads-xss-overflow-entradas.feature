Feature: Edge Cases - Payloads Maliciosos, XSS, Inyecciones y Overflow de Entradas
  Como pentester y especialista de QA destructivo
  Quiero someter los campos de entrada a cargas hostiles, XSS, inyecciones y desbordamientos
  Para verificar que la plataforma sanitiza entradas y no expone vulnerabilidades ni bloquea la interfaz

  Scenario: Inyeccion de payload script XSS en campo de busqueda del directorio publico
    Given I am on the page "http://localhost:5174/"
    When I fill "input[type='text']:not([readonly])" with "<script>alert('xss')</script>"
    Then I should see "Directorio"

  Scenario: Inyeccion de caracteres especiales regex y comodines en buscador
    Given I am on the page "http://localhost:5174/"
    When I fill "input[type='text']:not([readonly])" with "[.*+?^${}()|[]{}]\\"
    Then I should see "Directorio"

  Scenario: Inyeccion SQL clasica en formulario de autenticacion
    Given I am on the login page "http://localhost:5174/login"
    When I fill "input[type='email']" with "' OR '1'='1' --"
    And I fill "input[type='password']" with "' OR '1'='1' --"
    And I click "button[type='submit']"
    Then I should see "inválid"

  Scenario: Cadena ultra-larga superior a 250 caracteres en formulario de recuperacion
    Given I am on the page "http://localhost:5174/recuperar-password"
    When I fill "input[type='email']" with "usuario_con_cadena_ultra_extremadamente_larga_sin_espacios_para_probar_buffer_overflow_y_desbordamiento_de_memoria_en_el_cliente_web_de_abogalia_que_debe_ser_saneada_y_controlada_de_forma_segura_por_los_componentes_reactivos@dominio-super-largo-de-prueba.com"
    And I click "button[type='submit']"
    Then I should see "correo"

  Scenario: Valores numericos negativos en calculadora notarial
    Given I am on the page "http://localhost:5174/calculadoras"
    When I fill "input[type='number']" with "-500000"
    Then I should see "Calculadoras"

  Scenario: Valores astronomicos y desbordamiento numerico en calculadora notarial
    Given I am on the page "http://localhost:5174/calculadoras"
    When I fill "input[type='number']" with "99999999999999"
    Then I should see "Calculadoras"

  Scenario: Entrada de caracteres Unicode complejos y emojis en busqueda
    Given I am on the page "http://localhost:5174/"
    When I fill "input[type='text']:not([readonly])" with "⚖️💼👨‍⚖️🛡️ Abogado Penalista México"
    Then I should see "Directorio"

  Scenario: Intento de inyeccion SVG malicioso en correo de recuperacion
    Given I am on the page "http://localhost:5174/recuperar-password"
    When I fill "input[type='email']" with "<svg onload=alert(1)>@test.com"
    And I click "button[type='submit']"
    Then I should see "correo"
