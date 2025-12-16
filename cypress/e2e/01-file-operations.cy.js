describe('Открытие файла', () => {
    beforeEach(() => {
        cy.visit('/');
        // Ждём полной загрузки UI
        cy.contains('button', 'Открыть').should('be.visible');
        cy.contains('button', 'Сохранить как').should('be.visible');
        cy.contains('button', 'Открыть').as('openBtn');
        cy.get('button').contains('+').as('addPatternBtn');
    });

    it('Пустой проект, нажатие "+" — открывается форма создания паттерна', () => {
        // Нажимаем на кнопку "+"
        cy.get('@addPatternBtn').click();

        // Проверяем, что появилась форма для создания нового паттерна
        cy.contains('pattern_1').should('be.visible');

        // Дополнительно: убеждаемся, что модалка или сайдбар действительно открыты
        cy.contains('pattern_1').click()
        cy.contains('Название паттерна').should('be.visible');
    });

    it('Пустой проект, нажатие на кнопку открыть - ожидается виджет для выбора файла.', () => {
        // Нажимаем на кнопку "Открыть"
        cy.get('@openBtn').click();
        // Проверяем, что появился виджет для выбора файла
        cy.get('[data-cy="file-input"]').should('be.visible');
    });

    it('Открытие корректного YAML из fixtures — паттерны появляются', () => {
        cy.contains('button', 'Открыть').click();
        
        cy.get('[data-cy="file-input"]')
        .selectFile('cypress/fixtures/valid-grammar.yaml', { force: true });
        
        cy.contains('teacher').scrollIntoView().should('be.visible');
        cy.contains('room').scrollIntoView().should('be.visible');
        cy.contains('lesson').scrollIntoView().should('be.visible');
    });
    
    it('Открытие некорректного файла - появляется alert', () => {
        // Перехватываем alert
    cy.on('window:alert', (text) => {
        expect(text).to.include('Не удалось открыть файл');
    });

    // Кликаем на кнопку "Открыть"
    cy.contains('button', 'Открыть').click();

    // Выбираем некорректный файл из fixtures
    cy.get('[data-cy="file-input"]')
        .selectFile('cypress/fixtures/invalid-grammar.yaml', { force: true });
    });
});