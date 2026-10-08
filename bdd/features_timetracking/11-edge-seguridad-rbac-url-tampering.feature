Feature: 11 Edge Cases - Seguridad, RBAC y Tampering de URLs
  Como auditor de ciberseguridad y QA destructivo en TimeTracking
  Quiero intentar accesos no autorizados, escalación de privilegios y manipulación directa de URLs
  Para comprobar que los guards de navegación y controles de acceso por rol son impenetrables

  Scenario: Intento de acceso directo no autenticado a ruta protegida de dashboard
    Given I am on the page "http://localhost:3000/dashboard"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de acceso directo no autenticado al panel de super admin
    Given I am on the page "http://localhost:3000/platform"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de acceso directo no autenticado a la vista de proyectos
    Given I am on the page "http://localhost:3000/projects"
    Then I should see "Iniciar Sesión"

  Scenario: Intento de escalacion de privilegios: Empleado navegando a panel de Super Admin
    Given I am logged in as a "employee"
    When I am on the page "http://localhost:3000/platform"
    Then I should see "Dashboard"

  Scenario: Intento de acceso indebido: Empleado navegando a configuracion de facturacion billing
    Given I am logged in as a "employee"
    When I am on the page "http://localhost:3000/billing"
    Then I should see "Dashboard"

  Scenario: Intento de acceso indebido: Tenant Admin navegando a la consola global de superadmin
    Given I am logged in as a "tenant_admin"
    When I am on the page "http://localhost:3000/platform"
    Then I should see "Proyectos"

  Scenario: Super Admin navegando a la consola de administracion global
    Given I am logged in as a "super_admin"
    When I am on the page "http://localhost:3000/platform"
    Then I should see "Usuarios"
