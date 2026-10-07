Feature: RF-1.4 Logical Isolation
  As a Super Admin
  I want to verify that tenant data is isolated
  So that users from one tenant cannot access data from another tenant

  Scenario: Create a user in one tenant and verify it does not exist in another
    Given I am logged in as a Super Admin
    When I click the "#btn-workspace-platform" button
    And I click the "#nav-tenants" link
    And I click the first "Gestionar" button
    And I click "Usuarios"
    And I click "+ Nuevo Usuario"
    And I fill "user-name-input" with "Test Isolation"
    And I fill "user-email-input" with "test-iso@empresa.com"
    And I fill "user-password-input" with "password123"
    And I click "submit-user"
    Then the user "test-iso@empresa.com" should exist in the table
    When I click the "#btn-return-platform" button
    And I click the "#nav-tenants" link
    And I click the second "Gestionar" button
    And I click "Usuarios"
    Then the user "test-iso@empresa.com" should NOT exist in the table
