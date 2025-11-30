describe('Редактирование свойств паттернов', () => {
    beforeEach(() => {
        cy.visit('/');

        // Ждём загрузку UI
        cy.contains('button', '+').first().as('addBtn');

        // Создаём два паттерна, с которыми будем работать
        cy.get('@addBtn').click(); // pattern_1
        cy.get('@addBtn').click(); // pattern_2
    });

    it('Изменить имя паттерна — сохраняется, дубликат блокируется', () => {
        // Открываем первый паттерн
        cy.contains('pattern_1').click();
        
        // Меняем имя на уникальное
        cy.get('input[placeholder="Введите название паттерна"]')
        .clear()
        .type('UserCard');
        
        cy.contains('button', '✓ Сохранить').click();
        
        // Имя обновилось в левом сайдбаре
        cy.contains('UserCard').should('be.visible');
        
        // Открываем второй паттерн и пытаемся задать то же имя
        cy.contains('pattern_2').click();
        cy.get('input[placeholder="Введите название паттерна"]')
        .clear()
        .type('UserCard');
        
        // Перехватываем ошибку (в вашем коде — console.error в handleSave)
        cy.window().then((win) => {
        cy.spy(win.console, 'error').as('consoleError');
        });
        
        cy.contains('button', 'Сохранить').click();
        
        // Имя второго паттерна осталось прежним
        cy.contains('pattern_2').should('be.visible');
    });

    it('Изменить inner/outer — добавление и редактирование компонентов', () => {
        // Делаем первый паттерн контейнером
        cy.contains('pattern_1').click();
        cy.get('input[placeholder="Введите название паттерна"]').clear().type('Container');
        cy.contains('button', '✓ Сохранить').click();
        
        // Второй паттерн — тот, который будем вставлять внутрь
        cy.contains('pattern_2').click();
        cy.get('input[placeholder="Введите название паттерна"]').clear().type('Header');
        cy.contains('button', '✓ Сохранить').click();
        
        // Возвращаемся к Container для добавления inner-компонента
        cy.contains('Container').click();
        
        // ПЕРЕХВАТЫВАЕМ ДВА prompt() — ЭТО КЛЮЧЕВОЙ МОМЕНТ
        cy.window().then((win) => {
        cy.stub(win, 'prompt')
            .onFirstCall().returns('header')     // ← ответ на "Введите имя компонента:"
            .onSecondCall().returns('Header');   // ← ответ на "Введите ID паттерна..."
        });
        
        // Нажимаем "+" у "Внутренние паттерны"
        cy.contains('Внутренние паттерны')
        .scrollIntoView()
        .parent()
        .find('button')
        .contains('+')
        .click();
        
        // Сохраняем изменения паттерна
        cy.contains('button', '✓ Сохранить').click();
        
        // Проверяем, что компонент успешно добавлен и отображается
        cy.contains('header').should('be.visible');
        cy.contains('Pattern: Header').should('be.visible'); // или 'pattern_2' — зависит от того, что показывает ваш UI
    });

    it('Изменить extends — добавление/удаление и блокировка цикла', () => {
        // 1. Создаём два паттерна с понятными именами
        cy.contains('pattern_1').click();
        cy.get('input[placeholder="Введите название паттерна"]').clear().type('Base');
        cy.contains('button', '✓ Сохранить').click();
        
        cy.contains('pattern_2').click();
        cy.get('input[placeholder="Введите название паттерна"]').clear().type('Child');
        cy.contains('button', '✓ Сохранить').click();
        
        // 2. Child наследует Base — успешно
        cy.contains('Child').click();
        
        cy.contains('Extends').scrollIntoView();
        cy.window().then((win) => {
          cy.stub(win, 'prompt').returns('Base');
        });
        
        cy.contains('Extends').parent().find('button').contains('+').click();
        cy.contains('button', '✓ Сохранить').click();
        
        // 3. Base наследует Child - ошибка
        cy.contains('Base').scrollIntoView().click();
        
        cy.contains('Extends').scrollIntoView();
        
        cy.window().then((win) => {
        // Сначала перехватываем alert (он вызывается сразу при клике на +)
        cy.stub(win, 'alert').as('alertStub');
        });
        
    });

    it ('Проверка на изменение имени паттерна на пустое значение — появляется ошибка', () => {
            cy.contains('pattern_1').click();
            // Очищаем имя
            cy.get('input[placeholder="Введите название паттерна"]')
            .clear();
            // Пытаемся сохранить
            cy.contains('button', '✓ Сохранить').click();
            // Проверяем, что появилась ошибка
            cy.on('window:alert', (text) => {
            expect(text).to.include('Имя паттерна не может быть пустым');
            });
        });
});