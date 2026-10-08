Feature: Edge Cases - Seguridad, RBAC y Tampering de URLs
  Como auditor de ciberseguridad y QA destructivo
  Quiero intentar accesos no autorizados, escalación de privilegios y manipulación directa de URLs
  Para comprobar que los guards de navegación y controles de acceso por rol son impenetrables

  Scenario: Intento de acceso directo no autenticado a ruta protegida de panel
    Given I am on the page "http://localhost:5174/panel"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de acceso directo no autenticado al panel de super admin
    Given I am on the page "http://localhost:5174/admin"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de acceso directo no autenticado al cockpit de un expediente
    Given I am on the page "http://localhost:5174/expediente/1"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de escalacion de privilegios: Cliente navegando a panel de administracion
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/admin"
    Then I should see "Portal del Cliente"

  Scenario: Intento de acceso indebido: Cliente navegando a panel de despacho de abogados
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/panel"
    Then I should see "Portal del Cliente"

  Scenario: Intento de acceso indebido: Abogado navegando al panel de Super Admin
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/admin"
    Then I should see "Expedientes"

  Scenario: Super Admin confinado exclusivamente a la consola de administracion
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:5174/panel"
    Then I should see "Admin"
