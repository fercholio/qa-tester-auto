Feature: Boveda Documental, Previsualizacion Mammoth y Eliminacion de Fojas
  Como abogado del despacho
  Quiero cargar, previsualizar y auditar constancias digitales sin conceptos obsoletos
  Para contar con un archivo digital moderno, rapido y seguro

  Scenario: Navegacion al Tab Documentos de la Boveda Digital
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    Then I should see "Documentos"

  Scenario: Verificacion de eliminacion total del concepto Fojas en la tabla
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    Then I should not see "Fojas"

  Scenario: Apertura del modal de subida de constancia digital
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    And I click "button:has-text('Subir'), button:has-text('Adjuntar'), button:has-text('Agregar Documento')"
    Then I should not see "Número de Fojas"

  Scenario: Filtrado y busqueda de constancias digitales en la boveda
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    And I fill "input[placeholder*='Buscar documento']" with "Auto"
    Then I should see "Auto"

  Scenario: Visualizacion de constancias con sello de hash criptografico SHA-256
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    Then I should see "SHA-256"

  Scenario: Previsualizacion de documento en visor digital integrado
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/expediente/1?tab=documentos"
    And I click "tr:has-text('Auto'), tr:has-text('PDF'), button:has-text('Ver')"
    Then I should see "Visor"
