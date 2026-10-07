Feature: Tenant Admin (Administrador Corporativo)
  Como Admin de Corporativo (Dueño de Organización)
  Quiero gestionar mi grupo corporativo, sucursales y proyectos
  Para administrar mi ecosistema de forma autónoma

  Scenario: RF-1.2 Creacion de Empresa Secundaria (Sucursales) desde el Tenant Admin
    Given I am logged in as a Tenant Admin
    When I click "Nueva Empresa"
    And I fill "name" with "ILCO Operaciones"
    And I click "Crear Empresa"
    Then the tenant "ILCO Operaciones" should exist in my organization
    And I should see it in my Workspace Switcher

  Scenario: RF-2.1 y RF-2.2 Creacion y Gestion del Organigrama
    Given I am logged in as a Tenant Admin
    When I select the workspace "ILCO Operaciones"
    And I click "Organigrama"
    When I click "+ Nuevo Puesto"
    And I fill "title" with "Director General"
    And I fill "cost_rate" with "500"
    And I click "Guardar"
    Then the position "Director General" should exist in the tree
    When I click "+ Nuevo Puesto"
    And I fill "title" with "Analista Senior"
    And I select "parent_id" with "Director General"
    And I fill "cost_rate" with "200"
    And I click "Guardar"
    Then the position "Analista Senior" should be nested under "Director General"

  Scenario: RF-2.2 Creacion de Proyectos
    Given I am logged in as a Tenant Admin
    When I click "Proyectos"
    When I click "+ Nuevo Proyecto"
    And I fill "name" with "Defensa Civil"
    And I fill "budget" with "150000"
    And I click "Guardar"
    Then the project "Defensa Civil" should exist in the table

  Scenario: RF-3.1 Configurar Metas de Valor en el Organigrama
    Given I am logged in as a Tenant Admin
    And I click "Organigrama"
    And I click "Editar" on the position "Director General"
    And I fill "valor_percentage" with "80"
    And I fill "admin_percentage" with "20"
    And I click "Guardar Meta"
    Then I should see a success notification

  Scenario: RF-12.1 Generacion de Informe IA de Diagnostico Organizacional
    Given I am logged in as a Tenant Admin
    When I click "Análisis IA"
    And I click "Generar Análisis"
    And I click "Analizar con IA"
    Then I should see the report status as "En Proceso"
