/**
 * Константы приложения
 * Централизованное хранение всех константных значений
 */

// Цвета
export const COLORS = {
  PRIMARY: '#D72B00',        // Основной красный цвет
  BORDER: '#949494',          // Серый цвет для границ
  GRID: '#e8e8e8',            // Цвет сетки
  PATTERN_FILL: '#D9D9D9',    // Цвет заливки паттернов
  INNER_BORDER: '#000000',    // Черная граница внутренней области
  BACKGROUND: '#ffffff',      // Белый фон
  SIDEBAR_BG: '#E3E3E3',      // Светло-серый фон sidebar
  SELECTED: '#D72B00',        // Цвет выделения
  TEXT: '#333333',            // Основной цвет текста
  TEXT_SECONDARY: '#666666',  // Вторичный цвет текста
  TEXT_LIGHT: '#999999',      // Светлый цвет текста
};

// Размеры и отступы
export const SIZES = {
  SIDEBAR_LEFT_WIDTH: 275,
  SIDEBAR_RIGHT_WIDTH: 325,
  SIDEBAR_MARGIN: 3,
  SIDEBAR_GAP: 20,
  CENTRAL_PADDING: 40,
  HEADER_HEIGHT: 80,
  VERTICAL_PADDING: 80,
  GRID_SIZE: 50,              // Размер ячейки сетки
  MIN_STAGE_WIDTH: 400,
  MIN_STAGE_HEIGHT: 400,
  INNER_RECT_RATIO: 1.5,      // Соотношение для внутреннего квадрата (width/1.5)
  BORDER_RADIUS: 8,
  BORDER_RADIUS_LARGE: 16,
};

// Значения по умолчанию для паттернов
export const DEFAULT_PATTERN = {
  EXTERNAL: {
    width: 100,
    height: 70,
    xOffset: -100,             // Смещение при создании внешнего паттерна
    yOffset: 40,
  },
  INTERNAL: {
    width: 100,
    height: 70,
    xOffset: 20,              // Смещение внутри внутренней области
    yOffset: 20,
  },
};

// Размеры шрифтов
export const FONT_SIZES = {
  PATTERN_NAME: 22,           // Название паттерна в левом sidebar
  BUTTON_SMALL: 16,
  BUTTON_MEDIUM: 18,
  BUTTON_LARGE: 22,
  HEADER_BUTTON: 22,
  PROPERTY_LABEL: 14,
  PROPERTY_VALUE: 13,
};

// Шрифты
export const FONTS = {
  PRIMARY: 'Inter, sans-serif',
  DEFAULT: 'inherit',
};

