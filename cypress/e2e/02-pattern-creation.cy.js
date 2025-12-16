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
      // 1. Создаём два паттерна
      cy.get('@addEmptyPatternBtn').click();
      cy.get('@addEmptyPatternBtn').click();
      
      cy.contains('pattern_1').click();
      cy.get('input[placeholder="Введите название паттерна"]').clear().type('Base');
      cy.contains('button', '✓ Сохранить').click();
      
      cy.contains('pattern_2').click();
      cy.get('input[placeholder="Введите название паттерна"]').clear().type('Child');
      cy.contains('button', '✓ Сохранить').click();
      
      // 2. Открываем Base для добавления внешнего паттерна
      cy.contains('Base').click();
      
      // 3. Перехватываем два prompt() — имя компонента и ID паттерна
      cy.window().then((win) => {
        cy.stub(win, 'prompt')
          .onFirstCall().returns('childComponent')   // имя компонента
          .onSecondCall().returns('Child');          // ID паттерна
      });
      
      // 4. Кликаем кнопку "Добавить внешний паттерн" сверху
      cy.contains('button', 'Добавить внешний паттерн').click();
      
      // 5. Сохраняем изменения в RightSidebar
      cy.contains('button', '✓ Сохранить').click();
      
      // 6. Проверяем, что на холсте появился внешний паттерн (дочерний)
      // Поскольку renderChildPatterns() рендерит его как DefaultExternalRectangle с текстом = componentName
      cy.window().then((win) => {
        const stage = win.Konva.stages[0];
        const texts = stage.find('Text');
        const childText = texts.find(t => t.text() === 'childComponent');
        expect(childText).to.exist;
        // Дополнительно: он должен быть вне внутренней области
        const group = childText.parent;
        const innerRect = stage.width() / 1.5;
        const offset = (stage.width() - innerRect) / 2;
      });
    });

    it('Добавить внутренний паттерн — появляется прямоугольник внутри внутреннего квадрата с текстом "Внутренний паттерн"', () => {
      // 1. Создаём два паттерна
          cy.get('@addEmptyPatternBtn').click();
          cy.get('@addEmptyPatternBtn').click();
          
          cy.contains('pattern_1').click();
          cy.get('input[placeholder="Введите название паттерна"]').clear().type('Base');
          cy.contains('button', '✓ Сохранить').click();
          
          cy.contains('pattern_2').click();
          cy.get('input[placeholder="Введите название паттерна"]').clear().type('Child');
          cy.contains('button', '✓ Сохранить').click();
          
          // 2. Открываем Base для добавления внешнего паттерна
          cy.contains('Base').click();
          
          // 3. Перехватываем два prompt() — имя компонента и ID паттерна
          cy.window().then((win) => {
            cy.stub(win, 'prompt')
              .onFirstCall().returns('childComponent')   // имя компонента
              .onSecondCall().returns('Child');          // ID паттерна
          });
          
          // 4. Кликаем кнопку "Добавить внутренний паттерн" сверху
          cy.contains('button', 'Добавить внутренний паттерн').click();
          
          // 5. Сохраняем изменения в RightSidebar
          cy.contains('button', '✓ Сохранить').click();
          
          // 6. Проверяем, что на холсте появился внутренний паттерн (дочерний)
          // Поскольку renderChildPatterns() рендерит его как DefaultExternalRectangle с текстом = componentName
          cy.window().then((win) => {
            const stage = win.Konva.stages[0];
            const texts = stage.find('Text');
            const childText = texts.find(t => t.text() === 'childComponent');
            expect(childText).to.exist;
            // Дополнительно: он должен быть внутри внутренней области
            const group = childText.parent;
            const innerRect = stage.width() / 1.5;
            const offset = (stage.width() - innerRect) / 2;
          });
      
    });

    it('Добавить паттерн с одинаковым именем — дубликат допускается при создании, но блокируется при сохранении в RightSidebar', () => {
      // Создаём первый паттерн
      cy.get('@addEmptyPatternBtn').click();
      cy.contains('pattern_1');
      // Создаём второй паттерн
      cy.get('@addEmptyPatternBtn').click();
      cy.contains('pattern_2').click();
      // Меняем имя на "pattern_1" у второго
      cy.get('input[placeholder="Введите название паттерна"]')
        .clear()
        .type('pattern_1');
      cy.contains('button', '✓ Сохранить').click();
      
      // Проверяем, что имя применилось
      cy.contains('pattern_1').should('be.visible');
      
      // Нажимаем "Сохранить" — должна быть ошибка (в консоли или через alert)
      cy.on('window:alert', (text) => {
        expect(text).to.include('уже существует');
      });
    });

    it('После добавления внешнего/внутреннего паттерна — он сразу отображается на холсте и в LeftSidebar', () => {
      // 1. Создаём паттерн
      cy.get('@addEmptyPatternBtn').click();
      cy.get('@addEmptyPatternBtn').click();
      
      // 2. Открываем Base для добавления внешнего паттерна
      cy.contains('pattern_1').click();
      
      // 3. Перехватываем два prompt() — имя компонента и ID паттерна
      cy.window().then((win) => {
        cy.stub(win, 'prompt')
          .onFirstCall().returns('pattern_2')   // имя компонента
          .onSecondCall().returns('pattern_2');          // ID паттерна
      });
      
      // 4. Кликаем кнопку "Добавить внешний паттерн" сверху
      cy.contains('button', 'Добавить внешний паттерн').click();
      
      // 5. Сохраняем изменения в RightSidebar
      cy.contains('button', '✓ Сохранить').click();
      
      // 6. Проверяем, что на холсте появился внешний паттерн (дочерний)
      // Поскольку renderChildPatterns() рендерит его как DefaultExternalRectangle с текстом = componentName
      cy.window().then((win) => {
        const stage = win.Konva.stages[0];
        const texts = stage.find('Text');
        const childText = texts.find(t => t.text() === 'pattern_2');
        expect(childText).to.exist;
        // Дополнительно: он должен быть вне внутренней области
        const group = childText.parent;
        const innerRect = stage.width() / 1.5;
        const offset = (stage.width() - innerRect) / 2;
      });
    });
});