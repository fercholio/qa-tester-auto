Feature: Super Administrador (Global)
  Como Super Admin
  Quiero gestionar todos los corporativos, inquilinos y planes
  Para asegurar el control global del sistema, facturacion y limites

  Scenario: RF-1.8 Creacion y Gestion de Planes SaaS
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click "Planes"
    When I click "+ Nuevo Plan"
    And I fill "name" with "Plan Enterprise"
    And I fill "price" with "299"
    And I fill "max_users" with "100"
    And I click "Guardar Plan"
    Then the plan "Plan Enterprise" should exist in the table

  Scenario: RF-1.1 y RF-1.3 Creacion de Tenant con Limites y Plan
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click the "#nav-tenants" link
    When I click "+ Nuevo Cliente"
    And I fill "name" with "Tech Corp V2"
    And I click "Siguiente"
    And I fill "contact_email" with "admin@techcorp.com"
    And I click "Siguiente"
    And I click "Crear Empresa"
    Then the tenant "Tech Corp V2" should exist in the table

  Scenario: RF-11.1 Visualizacion de Dashboard Global
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click "Dashboard"
    Then I should see "Tenants activos"
    And I should see "Rentabilidad"

  Scenario: RF-1.5 Suspension y Reactivacion en Vivo de Tenant (Edge Case)
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click the "#nav-tenants" link
    When I click "Suspender" on tenant "Tech Corp V2"
    Then the tenant status badge should change to "Inactivo"
    When I click "Reactivar" on tenant "Tech Corp V2"
    Then the tenant status badge should return to "Activo"

  Scenario: RF-8.1 Gestion de Facturacion y Cambio de Plan SaaS (Billing Upgrade)
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click the "#nav-tenants" link
    And I click the first "Gestionar" button
    And I click "Suscripción"
    Then I should see the current plan details
    When I click "Cambiar Plan"
    And I select plan "Plan Enterprise"
    And I click "Confirmar Cambio"
    Then I should see a success notification indicating plan updated

  Scenario: RF-1.6 Cambio Dinamico de Espacios de Trabajo (Workspace Switcher)
    Given I am logged in as a Super Admin
    When I click the workspace selector in topbar
    And I select workspace "Zeta Labs"
    Then the active workspace header should display "Zeta Labs"
    And data in views should reflect only "Zeta Labs"
