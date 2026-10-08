Feature: Panel de Administracion Master y God Mode
  Como Super Administrador de Abogalia
  Quiero acceder al panel de control global, monitorear la telemetria y gobernar la infraestructura
  Para asegurar la estabilidad, seguridad y continuidad de la plataforma

  Scenario: Acceso exclusivo al panel de control general de administracion
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    Then I should see "Administración"

  Scenario: Visualizacion del catalogo global de usuarios y despachos
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    Then I should see "Usuarios"

  Scenario: Gestion del catalogo dinamico de Materias Legales
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    And I click "button:has-text('Materias'), a[href*='materias'], text=Materias"
    Then I should see "Materias"

  Scenario: Consulta de la Matriz Global de Roles y Permisos del sistema
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    And I click "button:has-text('Permisos'), button:has-text('Roles'), a[href*='roles']"
    Then I should see "Roles"

  Scenario: Monitoreo de telemetria operativa y logs de auditoria inmutables
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    And I click "button:has-text('Auditoría'), a[href*='auditoria'], text=Auditoría"
    Then I should see "Auditoría"

  Scenario: Verificacion de interruptores de emergencia Kill-Switches
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/admin"
    And I click "button:has-text('Auditoría'), a[href*='auditoria'], text=Auditoría"
    Then I should see "Scraper"
