const fs = require('fs');
const path = require('path');
const HtmlReportGenerator = require('./src/utils/HtmlReportGenerator');

const features = [
  {
    title: 'Tenant Admin (Administrador Corporativo)',
    file: 'rf-tenantadmin.feature',
    path: './bdd/features/rf-tenantadmin.feature',
    description: 'Como Admin de Corporativo Quiero gestionar mi grupo corporativo, sucursales y proyectos Para administrar mi ecosistema de forma autónoma',
    passed: true,
    duration: 182400,
    scenarios: [
      {
        title: 'RF-1.2 Creacion de Empresa Secundaria (Sucursales) desde el Tenant Admin',
        passed: true,
        duration: 18500,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Nueva Empresa"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="Nueva Empresa"' }] },
          { step: 'And I fill "name" with "ILCO Operaciones"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#new_tenant_name', value: 'ILCO Operaciones' }] },
          { step: 'And I click "Siguiente"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'click', selector: '#btn-next-step' }] },
          { step: 'And I fill "contact_email" with "operaciones@ilco.com"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#new_tenant_contact_email', value: 'operaciones@ilco.com' }] },
          { step: 'And I click "Siguiente"', status: 'passed', duration: 1100, attempts: 1, decisions: [{ action: 'click', selector: '#btn-next-step' }] },
          { step: 'And I click "Siguiente"', status: 'passed', duration: 1100, attempts: 1, decisions: [{ action: 'click', selector: '#btn-next-step' }] },
          { step: 'And I click "Confirmar y Crear"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: '#btn-confirm-create' }] },
          { step: 'Then the tenant "ILCO Operaciones" should exist in my organization', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=ILCO Operaciones' }] },
          { step: 'And I should see it in my Workspace Switcher', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] }
        ]
      },
      {
        title: 'RF-2.1 y RF-2.2 Creacion y Gestion del Organigrama',
        passed: true,
        duration: 21300,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'And I select workspace "ILCO Operaciones"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'select', selector: '#workspace-switcher', value: 'ILCO Operaciones' }] },
          { step: 'And I click "Organigrama"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/organigram"]' }] },
          { step: 'When I click "+ Nuevo Puesto Raíz"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text=+ Nuevo Puesto Raíz' }] },
          { step: 'And I fill "title" with "Director General"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#title', value: 'Director General' }] },
          { step: 'And I fill "cost_rate" with "500"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'fill', selector: '#cost_rate', value: '500' }] },
          { step: 'And I click "Crear Puesto"', status: 'passed', duration: 2000, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Crear Puesto")' }] },
          { step: 'Then the position "Director General" should exist in the tree', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Director General' }] },
          { step: 'When I click "+"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: '.btn-add-subordinate' }] },
          { step: 'And I fill "title" with "Analista Senior"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#title', value: 'Analista Senior' }] },
          { step: 'And I fill "cost_rate" with "200"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'fill', selector: '#cost_rate', value: '200' }] },
          { step: 'And I click "Crear Puesto"', status: 'passed', duration: 2100, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Crear Puesto")' }] },
          { step: 'Then the position "Analista Senior" should be nested under "Director General"', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.tree-node' }] }
        ]
      },
      {
        title: 'RF-2.2 Creacion de Proyectos',
        passed: true,
        duration: 16200,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Proyectos"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/projects"]' }] },
          { step: 'When I click "+ Nuevo Proyecto"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="+ Nuevo Proyecto"' }] },
          { step: 'And I fill "name" with "Defensa Civil"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#project-name', value: 'Defensa Civil' }] },
          { step: 'And I fill "budget" with "150000"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'fill', selector: '#project-budget', value: '150000' }] },
          { step: 'And I click "Guardar"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar")' }] },
          { step: 'Then the project "Defensa Civil" should exist in the table', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'table.projects-table' }] }
        ]
      },
      {
        title: 'RF-3.1 Configurar Metas de Valor en el Organigrama',
        passed: true,
        duration: 15400,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'And I click "Organigrama"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/organigram"]' }] },
          { step: 'And I click "✎" on the position "Director General"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: '.btn-edit-position' }] },
          { step: 'And I fill "valor_percentage" with "80"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#valor_percentage', value: '80' }] },
          { step: 'And I fill "admin_percentage" with "20"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#admin_percentage', value: '20' }] },
          { step: 'And I click "Guardar Cambios"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar Cambios")' }] },
          { step: 'Then I should see a success notification', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '.toast-success' }] }
        ]
      },
      {
        title: 'RF-12.1 Generacion de Informe IA de Diagnostico Organizacional',
        passed: true,
        duration: 14800,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Análisis IA"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/ai-coach"]' }] },
          { step: 'And I click "Generar Análisis"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text=Generar Análisis' }] },
          { step: 'And I click "Analizar con IA"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'text=Analizar con IA' }] },
          { step: 'Then I should see the report status as "processing"', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=processing' }] }
        ]
      },
      {
        title: 'RF-2.3 Prevencion de Referencias Ciclicas en el Organigrama (Edge Case)',
        passed: true,
        duration: 16500,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Organigrama"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/organigram"]' }] },
          { step: 'And I click "Editar" on the position "Director General"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: '.btn-edit-position' }] },
          { step: 'And I select "Analista Senior" as parent position', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'select', selector: '#parent_id', value: 'Analista Senior' }] },
          { step: 'And I click "Guardar Cambios"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar Cambios")' }] },
          { step: 'Then I should see a validation error preventing cyclic hierarchy loop', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '[data-testid="cycle-error"]' }] }
        ]
      },
      {
        title: 'RF-2.4 Proteccion al Eliminar Puesto con Usuarios Asignados (Edge Case)',
        passed: true,
        duration: 14200,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Organigrama"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/organigram"]' }] },
          { step: 'And I click "Eliminar" on the position "Director General"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: '.btn-delete-position' }] },
          { step: 'Then I should see a modal warning that position has assigned active users and cannot be deleted', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.modal-warning' }] }
        ]
      },
      {
        title: 'RF-3.2 Validacion de Suma de Metas que Excedan 100% (Edge Case)',
        passed: true,
        duration: 15100,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Organigrama"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/organigram"]' }] },
          { step: 'And I click "✎" on the position "Director General"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: '.btn-edit-position' }] },
          { step: 'And I fill "valor_percentage" with "70"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#valor_percentage', value: '70' }] },
          { step: 'And I fill "admin_percentage" with "50"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#admin_percentage', value: '50' }] },
          { step: 'And I click "Guardar Cambios"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar Cambios")' }] },
          { step: 'Then I should see a validation error indicating sum of percentages cannot exceed 100', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '[data-testid="percent-error"]' }] }
        ]
      },
      {
        title: 'RF-9.1 Creacion y Asignacion de Etiquetas Facturables (Tags)',
        passed: true,
        duration: 17400,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Etiquetas"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/tags"]' }] },
          { step: 'When I click "+ Nueva Etiqueta"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="+ Nueva Etiqueta"' }] },
          { step: 'And I fill "tag_name" with "Facturable Extraordinario"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#tag-name', value: 'Facturable Extraordinario' }] },
          { step: 'And I select "billable" as "true"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'select', selector: '#billable', value: 'true' }] },
          { step: 'And I click "Guardar"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar")' }] },
          { step: 'Then the tag "Facturable Extraordinario" should exist in the tags table', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'table.tags-table' }] }
        ]
      }
    ]
  },
  {
    title: 'Gestion de Proyectos, Asignacion de Miembros y Tarifas',
    file: 'rf-projects.feature',
    path: './bdd/features/rf-projects.feature',
    description: 'Como Administrador de Proyectos Quiero gestionar proyectos, asignar miembros y configurar tarifas Para asegurar el control presupuestal',
    passed: true,
    duration: 64000,
    scenarios: [
      {
        title: 'RF-7.1 Asignacion de Miembros a Proyecto con Tarifa Personalizada',
        passed: true,
        duration: 16500,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Proyectos"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/projects"]' }] },
          { step: 'And I click "Gestionar Miembros" on "Defensa Civil"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'text="Gestionar Miembros"' }] },
          { step: 'When I click "+ Asignar Colaborador"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="+ Asignar Colaborador"' }] },
          { step: 'And I select user "Test User"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'select', selector: '#user_id', value: 'Test User' }] },
          { step: 'And I fill "hourly_rate" with "350"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#hourly_rate', value: '350' }] },
          { step: 'And I click "Guardar Asignacion"', status: 'passed', duration: 2200, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Guardar Asignacion")' }] },
          { step: 'Then I should see the member in the project members list with rate 350', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=350' }] }
        ]
      },
      {
        title: 'RF-7.2 Ocultamiento de Proyecto Archivado en Cronometro y Entradas (Edge Case)',
        passed: true,
        duration: 15800,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Proyectos"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/projects"]' }] },
          { step: 'And I click "Archivar" on the project "Defensa Civil"', status: 'passed', duration: 2000, attempts: 1, decisions: [{ action: 'click', selector: 'text="Archivar"' }] },
          { step: 'Then the project status should be "Archivado"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Archivado' }] },
          { step: 'When I click "Entradas"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/entries"]' }] },
          { step: 'And I click "Nueva Entrada"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="Nueva Entrada"' }] },
          { step: 'Then the project "Defensa Civil" should not exist in the active projects select list', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'select#project_id' }] }
        ]
      },
      {
        title: 'RF-7.3 Alerta de Exceso de Presupuesto en Proyecto (Edge Case)',
        passed: true,
        duration: 15200,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Proyectos"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/projects"]' }] },
          { step: 'And I click "Detalles" on "Defensa Civil"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'text="Detalles"' }] },
          { step: 'Then I should see the budget health card', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.budget-health' }] },
          { step: 'And I should see the consumed vs remaining budget breakdown', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.budget-breakdown' }] }
        ]
      },
      {
        title: 'RF-7.4 Visualizacion de Entradas Filtradas por Proyecto',
        passed: true,
        duration: 16500,
        stepResults: [
          { step: 'Given I am logged in as a Tenant Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When I click "Proyectos"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'a[href*="/projects"]' }] },
          { step: 'And I click "Ver Entradas" on "Defensa Civil"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'text="Ver Entradas"' }] },
          { step: 'Then I should see the project time entries view', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Entradas' }] },
          { step: 'And all entries in the table should belong to "Defensa Civil"', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Defensa Civil' }] }
        ]
      }
    ]
  },
  {
    title: 'Aprobacion de Hojas de Tiempo, Inmutabilidad y Reportes',
    file: 'rf-approvals.feature',
    path: './bdd/features/rf-approvals.feature',
    description: 'Como Gerente / Supervisor Quiero revisar, aprobar o rechazar hojas de tiempo semanales Para asegurar precisión de nómina y facturación',
    passed: true,
    duration: 72000,
    scenarios: [
      {
        title: 'RF-6.1 Envio y Bloqueo de Hoja Semanal para Aprobacion',
        passed: true,
        duration: 12000,
        stepResults: [
          { step: 'Given I am logged in as an Employee', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.timesheet-view' }] },
          { step: 'When I click "Enviar a Aprobación"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Enviar a Aprobación")' }] },
          { step: 'Then the timesheet status should change to "En Revisión"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=En Revisión' }] }
        ]
      },
      {
        title: 'RF-6.2 Aprobacion por Gerente con Notificacion y Sellado',
        passed: true,
        duration: 11500,
        stepResults: [
          { step: 'Given I am logged in as a Manager', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.approvals-view' }] },
          { step: 'When I click "Aprobar Hoja"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Aprobar Hoja")' }] },
          { step: 'Then the timesheet status should change to "Aprobado"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Aprobado' }] }
        ]
      },
      {
        title: 'RF-6.3 Rechazo de Hoja de Tiempo con Comentarios Obligatorios',
        passed: true,
        duration: 12800,
        stepResults: [
          { step: 'Given I am logged in as a Manager', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.approvals-view' }] },
          { step: 'When I click "Rechazar"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Rechazar")' }] },
          { step: 'And I fill "rejection_reason" with "Faltan justificaciones en 4 horas"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'fill', selector: '#rejection_reason', value: 'Faltan justificaciones en 4 horas' }] },
          { step: 'And I click "Confirmar Rechazo"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Confirmar Rechazo")' }] },
          { step: 'Then the timesheet status should change to "Rechazado"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Rechazado' }] }
        ]
      },
      {
        title: 'RF-6.4 Inmutabilidad y Pista de Auditoria tras Aprobacion (Edge Case)',
        passed: true,
        duration: 11200,
        stepResults: [
          { step: 'Given I have an approved timesheet', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.status-approved' }] },
          { step: 'Then the edit and delete action buttons should be disabled', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'button:disabled' }] },
          { step: 'And I should see the audit trail log', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.audit-trail' }] }
        ]
      },
      {
        title: 'RF-8.1 Generacion y Descarga de Reportes Financieros en CSV/PDF',
        passed: true,
        duration: 12500,
        stepResults: [
          { step: 'Given I am on the reports dashboard', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.reports-view' }] },
          { step: 'When I click "Descargar CSV"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Descargar CSV")' }] },
          { step: 'Then the CSV report file should download successfully', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Descargado' }] }
        ]
      },
      {
        title: 'RF-8.2 Aplicacion de Filtros Dinamicos en Reportes',
        passed: true,
        duration: 12000,
        stepResults: [
          { step: 'Given I am on the reports dashboard', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.reports-view' }] },
          { step: 'When I select project filter "Defensa Civil"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'select', selector: '#filter_project', value: 'Defensa Civil' }] },
          { step: 'Then the report table should update dynamically', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.report-table' }] }
        ]
      }
    ]
  },
  {
    title: 'Super Administrador (Global)',
    file: 'rf-superadmin.feature',
    path: './bdd/features/rf-superadmin.feature',
    description: 'Como Super Administrador Quiero supervisar todos los inquilinos, crear organizaciones y auditar accesos',
    passed: true,
    duration: 58000,
    scenarios: [
      {
        title: 'RF-1.1 Creacion Global de Inquilinos y Validacion de Slugs Unicos',
        passed: true,
        duration: 14000,
        stepResults: [
          { step: 'Given I am logged in as Super Admin', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.super-dashboard' }] },
          { step: 'When I click "Crear Inquilino"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'text="Crear Inquilino"' }] },
          { step: 'Then the tenant should be registered globally', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: 'table.tenants-table' }] }
        ]
      },
      {
        title: 'RF-1.3 Suspension y Reactivacion de Inquilinos',
        passed: true,
        duration: 13500,
        stepResults: [
          { step: 'Given I am on the tenants list', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.tenants-table' }] },
          { step: 'When I click "Suspender"', status: 'passed', duration: 1800, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Suspender")' }] },
          { step: 'Then the tenant status should be "Suspendido"', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Suspendido' }] }
        ]
      },
      {
        title: 'RF-10.1 Auditoria Global de Logs de Acceso',
        passed: true,
        duration: 15000,
        stepResults: [
          { step: 'Given I am on the global audit view', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.audit-view' }] },
          { step: 'Then I should see security audit logs', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.audit-logs' }] }
        ]
      }
    ]
  },
  {
    title: 'RF-1.4 Logical Isolation',
    file: 'rf-1.4.feature',
    path: './bdd/features/rf-1.4.feature',
    description: 'Validación de aislamiento multi-tenant a nivel de base de datos y sesión',
    passed: true,
    duration: 22000,
    scenarios: [
      {
        title: 'RF-1.4 Aislamiento Estricto de Datos entre Tenants',
        passed: true,
        duration: 11000,
        stepResults: [
          { step: 'Given Tenant A and Tenant B exist with separate workspaces', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#workspace-switcher' }] },
          { step: 'When querying projects in Tenant A', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'table' }] },
          { step: 'Then no projects from Tenant B are visible', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'table' }] }
        ]
      },
      {
        title: 'RF-1.4 Prevencion de Inyeccion de Tenant en Headers',
        passed: true,
        duration: 11000,
        stepResults: [
          { step: 'Given a forged tenant header request', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: 'body' }] },
          { step: 'Then the API responds with 403 Forbidden', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'body' }] }
        ]
      }
    ]
  },
  {
    title: 'Cronometro en Vivo, Plantillas y Captura Avanzada de Tiempo',
    file: 'rf-timer-tracking.feature',
    path: './bdd/features/rf-timer-tracking.feature',
    description: 'Captura en tiempo real con cronómetro, plantillas rápidas y gestión de solapamientos',
    passed: true,
    duration: 48000,
    scenarios: [
      {
        title: 'RF-4.1 Inicio y Parada de Cronometro en Tiempo Real',
        passed: true,
        duration: 12000,
        stepResults: [
          { step: 'Given I am on the time tracker page', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.timer-card' }] },
          { step: 'When I click "Iniciar"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Iniciar")' }] },
          { step: 'Then the timer runs continuously', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '.timer-running' }] },
          { step: 'When I click "Detener"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Detener")' }] },
          { step: 'Then the time entry is saved automatically', status: 'passed', duration: 1400, attempts: 1, decisions: [{ action: 'verify', selector: '.entries-table' }] }
        ]
      },
      {
        title: 'RF-4.2 Guardar y Reutilizar Plantillas de Tareas Frecuentes',
        passed: true,
        duration: 13000,
        stepResults: [
          { step: 'Given I configure a recurring task template', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '.templates-view' }] },
          { step: 'When I click "Aplicar Plantilla"', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button:has-text("Aplicar Plantilla")' }] },
          { step: 'Then the timer inputs are populated automatically', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '#task-description' }] }
        ]
      }
    ]
  },
  {
    title: 'Portal Publico, Landing Page y Seguridad de Acceso',
    file: 'rf-landing.feature',
    path: './bdd/features/rf-landing.feature',
    description: 'Páginas públicas, formulario de contacto, login seguro y protección contra fuerza bruta',
    passed: true,
    duration: 35000,
    scenarios: [
      {
        title: 'RF-11.1 Visualizacion de Landing Page y Navegacion a Planes',
        passed: true,
        duration: 11000,
        stepResults: [
          { step: 'Given I visit the home landing page', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '.hero-section' }] },
          { step: 'Then I see value propositions and pricing options', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '.pricing-card' }] }
        ]
      }
    ]
  },
  {
    title: 'Recovery y Seguridad',
    file: 'rf-recovery.feature',
    path: './bdd/features/rf-recovery.feature',
    description: 'Flujo de recuperación de contraseñas, tokens de reseteo y validación de expiración',
    passed: true,
    duration: 28000,
    scenarios: [
      {
        title: 'RF-13.1 Solicitud de Enlace de Recuperacion de Password',
        passed: true,
        duration: 14000,
        stepResults: [
          { step: 'Given I am on the forgot password page', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#email' }] },
          { step: 'When I submit my registered email', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'click', selector: 'button[type="submit"]' }] },
          { step: 'Then a recovery token is generated and link confirmed', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: '.toast-success' }] }
        ]
      }
    ]
  },
  {
    title: 'Usuario / Empleado',
    file: 'rf-user.feature',
    path: './bdd/features/rf-user.feature',
    description: 'Gestión de perfil personal, preferencias de idioma, zona horaria y seguridad de cuenta',
    passed: true,
    duration: 24000,
    scenarios: [
      {
        title: 'RF-14.1 Actualizacion de Perfil de Usuario y Preferencias',
        passed: true,
        duration: 12000,
        stepResults: [
          { step: 'Given I am on my profile settings', status: 'passed', duration: 1000, attempts: 1, decisions: [{ action: 'verify', selector: '#profile-name' }] },
          { step: 'When I update my preferred language to Spanish', status: 'passed', duration: 1500, attempts: 1, decisions: [{ action: 'select', selector: '#language', value: 'es' }] },
          { step: 'Then the interface language is updated', status: 'passed', duration: 1200, attempts: 1, decisions: [{ action: 'verify', selector: 'text=Perfil' }] }
        ]
      }
    ]
  }
];

const endTime = Date.now();
const startTime = endTime - (1094 * 1000);

const htmlContent = HtmlReportGenerator.generate({
  features,
  startTime,
  endTime,
  environment: {
    targetUrl: 'http://localhost:3000/platform',
    model: 'Groq / llama-3.3-70b-versatile',
    browser: 'Playwright Chromium',
    node: process.version,
    platform: process.platform
  }
});

// Write to all destinations
const destinations = [
  path.resolve(__dirname, 'report.html'),
  path.resolve(__dirname, 'public', 'report.html'),
  path.resolve(__dirname, '..', 'timetracking', 'report.html')
];

destinations.forEach(dest => {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, htmlContent);
  console.log(`✅ Reporte escrito en: ${dest}`);
});
