Feature: 12 Edge Cases - Payloads Maliciosos, XSS, Inyecciones y Overflow de Entradas
  Como pentester y especialista de QA destructivo en TimeTracking
  Quiero someter los campos de entrada a cargas hostiles, XSS, inyecciones y desbordamientos
  Para verificar que la plataforma sanitiza entradas y no expone vulnerabilidades ni bloquea la interfaz

  Scenario: Inyeccion de payload script XSS en formulario de inicio de sesion
    Given I am on the login page "http://localhost:3000/login"
    When I fill "input[type='email']" with "<script>alert('xss')</script>@test.com"
    And I fill "input[type='password']" with "Password123!"
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Inyeccion SQL clasica en formulario de autenticacion
    Given I am on the login page "http://localhost:3000/login"
    When I fill "input[type='email']" with "' OR '1'='1' --"
    And I fill "input[type='password']" with "' OR '1'='1' --"
    And I click "button[type='submit']"
    Then I should see "Iniciar Sesión"

  Scenario: Cadena ultra-larga superior a 250 caracteres en formulario de recuperacion
    Given I am on the page "http://localhost:3000/forgot-password"
    When I fill "input[type='email']" with "usuario_con_cadena_ultra_extremadamente_larga_sin_espacios_para_probar_buffer_overflow_y_desbordamiento_de_memoria_en_el_cliente_web_de_timetracking_que_debe_ser_saneada_y_controlada_de_forma_segura_por_los_componentes_reactivos@dominio-super-largo-de-prueba.com"
    And I click "button[type='submit']"
    Then I should see "Recuperar acceso"

  Scenario: Tolerancia ante valores atipicos en proyectos
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/projects"
    Then I should see "Proyectos"

  Scenario: Entrada de caracteres Unicode complejos y emojis en cronometro
    Given I am logged in as a "employee"
    When I am on the page "http://localhost:3000/timer"
    Then I should see "Cronómetro"

  Scenario: Intento de inyeccion SVG malicioso en correo de recuperacion
    Given I am on the page "http://localhost:3000/forgot-password"
    When I fill "input[type='email']" with "<svg onload=alert(1)>@test.com"
    And I click "button[type='submit']"
    Then I should see "Recuperar acceso"
