// cypress/support/commands.js
Cypress.Commands.add('addPattern', (type, name = null) => {
    cy.contains('button', '+').click();
    cy.contains(type).click();
    if (name) {
        cy.get('input[type=text]').clear().type(name);
    }
    cy.contains('button', 'Сохранить').click();
});