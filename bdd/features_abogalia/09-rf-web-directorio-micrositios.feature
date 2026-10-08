Feature: Directorio Juridico, Micrositios y Sitio Web Publico
  Como visitante o cliente potencial
  Quiero buscar abogados calificados, explorar micrositios y realizar consultas legales
  Para encontrar representacion juridica confiable y adecuada

  Scenario: Navegacion y busqueda en el Directorio Juridico publico
    Given I am on the page "http://localhost:5174/"
    Then I should see "Directorio"

  Scenario: Filtrado de abogados por materia legal en el directorio
    Given I am on the page "http://localhost:5174/"
    Then I should see "Materia"

  Scenario: Identificacion visible del titular y propietario de cuenta en la ficha
    Given I am on the page "http://localhost:5174/"
    Then I should see "Titular"

  Scenario: Visualizacion del micrositio institucional publico del abogado
    Given I am on the page "http://localhost:5174/e/lic-roberto-mendez-garza"
    Then I should see "Méndez"

  Scenario: Acceso al editor en vivo del micrositio del despacho
    Given I am logged in as a "lawyer"
    When I am on the page "http://localhost:5174/panel/mi-sitio"
    Then I should see "Micrositio"

  Scenario: Consulta del muro publico de Preguntas al Abogado
    Given I am on the page "http://localhost:5174/preguntas"
    Then I should see "Preguntas"

  Scenario: Carga de pagina de aterrizaje SEO especializada
    Given I am on the page "http://localhost:5174/calculadora-pension-alimenticia"
    Then I should see "Pensión"
