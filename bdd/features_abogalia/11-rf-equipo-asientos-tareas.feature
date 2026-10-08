Feature: Gestion de Equipo, Asientos Corporativos y Tareas
  Como administrador del despacho
  Quiero invitar colaboradores, asignar tareas y controlar permisos granulares
  Para mantener una operacion coordinada y segura dentro de la firma

  Scenario: Visualizacion del panel de equipo y gobernanza de asientos corporativos
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    Then I should see "Equipo"

  Scenario: Apertura de modal de invitacion a un nuevo colaborador
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    Then I should see "Asientos"

  Scenario: Acceso a pantalla de aceptacion de invitacion mediante token
    Given I am on the page "http://localhost:5174/invitacion/token-prueba-123"
    Then I should see "Invitación"

  Scenario: Navegacion a la Matriz de Permisos por Rol del despacho
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    And I click "button:has-text('Permisos'), button:has-text('Roles'), a[href*='permisos']"
    Then I should see "Permisos"

  Scenario: Navegacion a la pestana de Tareas entre colaboradores
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    And I click "button:has-text('Tareas'), a[href*='tareas'], text=Tareas"
    Then I should see "Tareas"

  Scenario: Creacion de una nueva tarea interna vinculada a un caso
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    And I click "button:has-text('Tareas'), a[href*='tareas'], text=Tareas"
    Then I should see "Nueva Tarea"

  Scenario: Consulta y asignacion de clientes en el modulo de equipo
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/equipo"
    Then I should see "Clientes"
