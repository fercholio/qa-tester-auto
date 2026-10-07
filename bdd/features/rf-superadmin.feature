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
    When I click "+ Nuevo"
    And I fill "name" with "Tech Corp V2"
    And I fill "code" with "TECHV2"
    And I select "plan_id" with "Plan Enterprise"
    And I click "Guardar Corporativo"
    Then the tenant "Tech Corp V2" should exist in the table

  Scenario: RF-11.1 Visualizacion de Dashboard Global
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click "Dashboard"
    Then I should see "Total Corporativos"
    And I should see "Ingresos Totales"
