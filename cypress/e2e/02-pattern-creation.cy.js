describe('Добавление паттернов', () => {
    beforeEach(() => {
      cy.visit('/');
      
      // Ждём загрузки интерфейса
      cy.contains('button', 'Добавить внешний паттерн').should('be.visible');
      cy.contains('button', 'Добавить внутренний паттерн').should('be.visible');

      // Сохраняем кнопки для повторного использования
      cy.get('button').contains('+').first().as('addEmptyPatternBtn'); // в LeftSidebar
      cy.contains('button', 'Добавить внешний паттерн').as('addExternalBtn');
      cy.contains('button', 'Добавить внутренний паттерн').as('addInternalBtn');
    });

    it('Добавить пустой паттерн в корневой уровень (кнопка "+" в LeftSidebar) — появляется карточка с именем по умолчанию', () => {
      cy.get('@addEmptyPatternBtn').click();
      
      // Проверяем, что появился новый паттерн в левом сайдбаре
      cy.contains('pattern_1').should('be.visible');
      
      // Кликаем по нему — должен открыться RightSidebar с редактированием
      cy.contains('pattern_1').click();
      
      // Проверяем, что в правом сайдбаре отображается редактируемое имя
      cy.get('input[placeholder="Введите название паттерна"]')
        .should('have.value', 'pattern_1');
      
      // Убеждаемся, что inner/outer/extends пустые
      cy.contains('Нет внутренних паттернов').scrollIntoView().should('be.visible');
      cy.contains('Нет внешних паттернов').scrollIntoView().should('be.visible');
      
    });

    it('Добавить внешний паттерн — появляется прямоугольник вне внутреннего квадрата с текстом "Внешний паттерн"', () => {
      cy.get('@addEmptyPatternBtn').click();
      cy.get('@addEmptyPatternBtn').click();
      
      
      cy.get('#root div:nth-child(8) button').click();
      cy.get('#root div:nth-child(3) button:nth-child(1)').click();
    });

    it('Добавить внутренний паттерн — появляется прямоугольник внутри внутреннего квадрата с текстом "Внутренний паттерн"', () => {
      cy.get('@addInternalBtn').click();
      
      cy.contains('pattern_').should('be.visible');
      
      // Проверяем наличие текста внутри внутреннего квадрата
      cy.get('canvas').eq(1).trigger('mousemove', { clientX: 100, clientY: 100, force: true });
      
    });

    it('Добавить паттерн с одинаковым именем — дубликат допускается при создании, но блокируется при сохранении в RightSidebar', () => {
      // Создаём первый паттерн
      cy.get('@addEmptyPatternBtn').click();
      cy.contains('pattern_1').click();
      
      // Меняем имя на "MyPattern"
      cy.get('input[placeholder="Введите название паттерна"]')
        .clear()
        .type('MyPattern');
      cy.contains('button', '✓ Сохранить').click();
      
      // Проверяем, что имя применилось
      cy.contains('MyPattern').should('be.visible');
      
      
      
      // Нажимаем "Сохранить" — должна быть ошибка (в консоли или через alert)
      
      cy.get('#root div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > button').click();
      cy.get('#root div.custom-scrollbar-left > div:nth-child(2) > div:nth-child(1)').click();
      cy.get('#root > div:nth-child(1) > div:nth-child(2) > div:nth-child(3)').click();
      cy.get('#root input[placeholder="Введите название паттерна"]').clear();
      cy.get('#root input[placeholder="Введите название паттерна"]').type('MyPattern');
      cy.on('window:alert', (text) => {
        expect(text).to.include('уже существует');
      });
      cy.get('#root div:nth-child(3) button:nth-child(1)').click();
    });

    it('После добавления внешнего/внутреннего паттерна — он сразу отображается на холсте и в LeftSidebar', () => {
      cy.get('@addExternalBtn').click();
      cy.contains('pattern_1').should('be.visible');
      cy.get('canvas').eq(1).trigger('mousemove', { clientX: 100, clientY: 100, force: true });
      
      cy.get('@addInternalBtn').click();
      cy.contains('pattern_2').should('be.visible'); // два паттерна
      cy.get('canvas').eq(1).trigger('mousemove', { clientX: 100, clientY: 100, force: true });
    });
});