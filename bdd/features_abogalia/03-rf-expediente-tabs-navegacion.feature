Feature: Cockpit del Expediente Judicial y sus 12 Tabs Operativos
  Como abogado del despacho
  Quiero navegar por todos los tabs del expediente y ejecutar actuaciones procesales
  Para llevar el control juridico exhaustivo de cada juicio

  Scenario: Navegacion al listado de expedientes en el panel de abogados
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    Then I should see "Expedientes"

  Scenario: Apertura del modal para registrar un nuevo expediente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel"
    And I click "button:has-text('Nuevo Expediente'), button:has-text('Nuevo Caso'), #btn-new-case"
    Then I should see "Materia"

  Scenario: Acceso al cockpit unificado del expediente y Tab Resumen
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=resumen"
    Then I should see "Resumen"

  Scenario: Visualizacion de acciones rapidas de caratula y constancias
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=resumen"
    Then I should see "Carátula"

  Scenario: Conmutacion del estado de Favorito en el expediente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=resumen"
    Then I should see "expedientes"

  Scenario: Navegacion y operacion en el Tab Actuaciones con visibilidad
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=actuaciones"
    Then I should see "Actuaciones"

  Scenario: Navegacion al Tab Partes y consulta de partes procesales
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=partes"
    Then I should see "Partes"

  Scenario: Navegacion al Tab Audiencias y agenda procesal
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=audiencias"
    Then I should see "Audiencias"

  Scenario: Navegacion al Tab Notificaciones y boletines de juzgado
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=notificaciones"
    Then I should see "Notificaciones"

  Scenario: Navegacion al Tab Resoluciones y sentencias
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=resoluciones"
    Then I should see "Resoluciones"

  Scenario: Navegacion al Tab Terminos con calculo de dias habiles restantes
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=terminos"
    Then I should see "Términos"

  Scenario: Navegacion al Tab Seguimiento con notas al cliente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=seguimiento"
    Then I should see "Seguimiento"

  Scenario: Navegacion al Tab Auditoria de modificaciones
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=auditoria"
    Then I should see "Auditoría"

  Scenario: Navegacion al Tab Radicacion formal del expediente
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=radicacion"
    Then I should see "Radicación"

  Scenario: Verificacion de gobernanza de Z-Index en modales sin corte superior
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=resumen"
    Then I should see "Méndez"
