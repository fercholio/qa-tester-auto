Feature: Portal del Cliente y Boveda de Documentos
  Como cliente de un despacho en Abogalia
  Quiero consultar mis expedientes, descargar constancias autorizadas y ver seguimientos
  Para estar informado del avance procesal con total transparencia y seguridad

  Scenario: Aislamiento multi-tenant al acceder al portal del cliente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    Then I should see "Portal del Cliente"

  Scenario: Busqueda y filtrado de expedientes en el portal del cliente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I fill "input[placeholder*='Buscar']" with "AMP-2026-001"
    Then I should see "AMP-2026-001"

  Scenario: Visualizacion del Ultimo Acuerdo Traducido en el detalle del juicio
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Última Actualizacion"

  Scenario: Visualizacion de documentos autorizados en la Boveda del Cliente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Documentos Disponibles"

  Scenario: Accion de descarga directa de documento de boveda
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Descargar"

  Scenario: Apertura del modal de creacion de formato para el cliente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    And I click "text=Crear Formato"
    Then I should see "Formato"

  Scenario: Consulta de la linea de seguimiento unidireccional del abogado
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Despacho Legal"

  Scenario: Comprobacion de que las actuaciones confidenciales no son visibles
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=LAB-2026-992"
    Then I should not see "Contestación de Demanda"

  Scenario: Identificacion visible del despacho y abogado responsable
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Méndez"

  Scenario: Acceso al Reporte PDF imprimible del expediente
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    And I click "text=AMP-2026-001"
    Then I should see "Reporte PDF"

  Scenario: Verificacion de ausencia de chat y restriccion de privilegios de edicion
    Given I am logged in as a "client"
    When I am on the page "http://localhost:5174/boveda-cliente"
    Then I should not see "Eliminar Expediente"
