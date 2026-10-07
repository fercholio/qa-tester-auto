Feature: Tenant Admin (Administrador Corporativo)
  Como Admin de Corporativo (Dueño de Organización)
  Quiero gestionar mi grupo corporativo, sucursales y proyectos
  Para administrar mi ecosistema de forma autónoma

  Scenario: RF-1.2 Creacion de Empresa Secundaria (Sucursales) desde el Tenant Admin
    Given I am logged in as a Tenant Admin
    When I click "Nueva Empresa"
    And I fill "name" with "ILCO Operaciones"
    And I click "Siguiente"
    And I fill "contact_email" with "operaciones@ilco.com"
    And I click "Siguiente"
    And I click "Siguiente"
    And I click "Confirmar y Crear"
    Then the tenant "ILCO Operaciones" should exist in my organization
    And I should see it in my Workspace Switcher

  Scenario: RF-2.1 y RF-2.2 Creacion y Gestion del Organigrama
    Given I am logged in as a Tenant Admin
    When I select the workspace "ILCO Operaciones"
    And I click "Organigrama"
    When I click "+ Nuevo Puesto Raíz"
    And I fill "title" with "Director General"
    And I fill "cost_rate" with "500"
    And I click "Crear Puesto"
    Then the position "Director General" should exist in the tree
    When I click "+"
    And I fill "title" with "Analista Senior"
    And I fill "cost_rate" with "200"
    And I click "Crear Puesto"
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
    And I click "✎" on the position "Director General"
    And I fill "valor_percentage" with "80"
    And I fill "admin_percentage" with "20"
    And I click "Guardar Cambios"
    Then I should see a success notification

  Scenario: RF-12.1 Generacion de Informe IA de Diagnostico Organizacional
    Given I am logged in as a Tenant Admin
    When I click "Análisis IA"
    And I click "Generar Análisis"
    And I click "Analizar con IA"
    Then I should see the report status as "processing"

  Scenario: RF-2.3 Prevencion de Referencias Ciclicas en el Organigrama (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Organigrama"
    And I click "Editar" on the position "Director General"
    And I select parent position "Analista Senior"
    And I click "Guardar Cambios"
    Then I should see a validation error preventing cyclic hierarchy loop

  Scenario: RF-2.4 Proteccion al Eliminar Puesto con Usuarios Asignados (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Organigrama"
    And I click "Eliminar" on the position "Director General"
    Then I should see a modal warning that position has assigned active users and cannot be deleted

  Scenario: RF-3.2 Validacion de Suma de Metas que Excedan 100% (Edge Case)
    Given I am logged in as a Tenant Admin
    When I click "Organigrama"
    And I click "✎" on the position "Director General"
    And I fill "valor_percentage" with "70"
    And I fill "admin_percentage" with "50"
    And I click "Guardar Cambios"
    Then I should see a validation error indicating sum of percentages cannot exceed 100

  Scenario: RF-9.1 Creacion y Asignacion de Etiquetas Facturables (Tags)
    Given I am logged in as a Tenant Admin
    When I click "Etiquetas"
    When I click "+ Nueva Etiqueta"
    And I fill "tag_name" with "Facturable Extraordinario"
    And I select "billable" as "true"
    And I click "Guardar"
    Then the tag "Facturable Extraordinario" should exist in the tags table
