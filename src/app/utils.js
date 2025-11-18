/**
 * Утилиты для работы с геометрией и паттернами
 */

import { SIZES } from './constants.js';

/**
 * Вычисляет границы внутреннего квадрата (область для внутренних паттернов)
 * Внутренний квадрат занимает 2/3 от ширины и высоты Stage, центрирован
 * 
 * @param {Object} stageSize - Размеры Stage {width, height}
 * @returns {Object} Координаты и размеры внутреннего квадрата {x, y, width, height}
 */
export const getInnerRectBounds = (stageSize) => {
  return {
    x: (stageSize.width - stageSize.width / SIZES.INNER_RECT_RATIO) / 2,
    y: (stageSize.height - stageSize.height / SIZES.INNER_RECT_RATIO) / 2,
    width: stageSize.width / SIZES.INNER_RECT_RATIO,
    height: stageSize.height / SIZES.INNER_RECT_RATIO,
  };
};

/**
 * Проверяет, пересекается ли прямоугольник с внутренней областью
 * 
 * @param {Object} box - Прямоугольник для проверки {x, y, width, height}
 * @param {Object} innerRect - Границы внутренней области {x, y, width, height}
 * @returns {boolean} true если пересекается, false если нет
 */
export const intersectsInnerArea = (box, innerRect) => {
  const boxRight = box.x + box.width;
  const boxBottom = box.y + box.height;
  const innerRight = innerRect.x + innerRect.width;
  const innerBottom = innerRect.y + innerRect.height;

  return !(
    boxRight <= innerRect.x ||
    box.x >= innerRight ||
    boxBottom <= innerRect.y ||
    box.y >= innerBottom
  );
};

/**
 * Ограничивает координаты прямоугольника границами Stage
 * Гарантирует, что весь прямоугольник остается внутри Stage
 * 
 * @param {number} x - X координата
 * @param {number} y - Y координата
 * @param {number} width - Ширина прямоугольника
 * @param {number} height - Высота прямоугольника
 * @param {number} stageWidth - Ширина Stage
 * @param {number} stageHeight - Высота Stage
 * @returns {Object} Ограниченные координаты {x, y}
 */
export const constrainToStage = (x, y, width, height, stageWidth, stageHeight) => {
  let newX = Math.max(0, Math.min(x, stageWidth - width));
  let newY = Math.max(0, Math.min(y, stageHeight - height));

  // Дополнительная проверка правой и нижней границ
  if (newX + width > stageWidth) {
    newX = Math.max(0, stageWidth - width);
  }
  if (newY + height > stageHeight) {
    newY = Math.max(0, stageHeight - height);
  }

  return { x: newX, y: newY };
};

/**
 * Преобразует значение в строку для отображения в поле ввода
 * 
 * @param {any} value - Значение для преобразования
 * @returns {string} Строковое представление значения
 */
export const valueToString = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * Преобразует строку обратно в значение с учетом исходного типа
 * 
 * @param {string} str - Строка для преобразования
 * @param {any} originalValue - Исходное значение для определения типа
 * @returns {any} Преобразованное значение
 */
export const stringToValue = (str, originalValue) => {
  if (!str || str.trim() === '') return '';
  // Если исходное значение было массивом, пытаемся разобрать
  if (Array.isArray(originalValue)) {
    return str.split(',').map(s => s.trim()).filter(s => s);
  }
  // Если исходное значение было числом
  if (typeof originalValue === 'number') {
    const num = parseFloat(str);
    return isNaN(num) ? str : num;
  }
  // Если исходное значение было boolean
  if (typeof originalValue === 'boolean') {
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
  }
  return str;
};

/**
 * Получает все свойства паттерна, исключая служебные поля
 * 
 * @param {Object} pattern - Объект паттерна
 * @param {Array<string>} excludeKeys - Ключи для исключения
 * @returns {Array<Array>} Массив пар [ключ, значение]
 */
export const getPatternProperties = (pattern, excludeKeys = ['inner']) => {
  return Object.entries(pattern).filter(([key]) => !excludeKeys.includes(key));
};

/**
 * Парсит значение location (например, "0+", "0..2", "0")
 * Возвращает минимальное и максимальное значение отступа в клетках
 * 
 * @param {string} locationValue - Значение location (например, "0+", "0..2", "0")
 * @returns {Object} {min: number, max: number} - Минимальный и максимальный отступ в клетках
 */
export const parseLocationValue = (locationValue) => {
  if (!locationValue || typeof locationValue !== 'string') {
    return { min: 0, max: 0 };
  }

  const trimmed = locationValue.trim();

  // Обработка "0+" - от 0 до бесконечности
  if (trimmed.endsWith('+')) {
    const num = parseInt(trimmed.slice(0, -1), 10);
    return { min: isNaN(num) ? 0 : num, max: Infinity };
  }

  // Обработка "0..2" - диапазон от 0 до 2
  if (trimmed.includes('..')) {
    const parts = trimmed.split('..');
    const min = parseInt(parts[0], 10);
    const max = parts[1] === '*' ? Infinity : parseInt(parts[1], 10);
    return { 
      min: isNaN(min) ? 0 : min, 
      max: isNaN(max) ? Infinity : max 
    };
  }

  // Обработка простого числа "0"
  const num = parseInt(trimmed, 10);
  return { min: isNaN(num) ? 0 : num, max: isNaN(num) ? 0 : num };
};

/**
 * Вычисляет позицию дочернего паттерна на основе location относительно родительского паттерна
 * 
 * @param {Object} location - Объект location с полями top, right, bottom, left (и их вариантами с margin/padding)
 * @param {Object} parentBounds - Границы родительского паттерна {x, y, width, height}
 * @param {Object} childSize - Размеры дочернего паттерна {width, height}
 * @param {boolean} isInner - true если это внутренний паттерн, false если внешний
 * @returns {Object} Позиция дочернего паттерна {x, y}
 */
export const calculateChildPosition = (location, parentBounds, childSize, isInner = true) => {
  if (!location || typeof location !== 'object') {
    // Если location не задан, размещаем по центру
    return {
      x: parentBounds.x + (parentBounds.width - childSize.width) / 2,
      y: parentBounds.y + (parentBounds.height - childSize.height) / 2,
    };
  }

  const gridSize = SIZES.GRID_SIZE;
  
  // Нормализуем location: обрабатываем margin-top, padding-left и т.д. как обычные top, left
  const normalizedLocation = {};
  ['top', 'right', 'bottom', 'left'].forEach(side => {
    // Проверяем обычные поля
    if (location[side] !== undefined) {
      normalizedLocation[side] = location[side];
    }
    // Проверяем margin-* и padding-* варианты
    if (location[`margin-${side}`] !== undefined) {
      normalizedLocation[side] = location[`margin-${side}`];
    }
    if (location[`padding-${side}`] !== undefined) {
      normalizedLocation[side] = location[`padding-${side}`];
    }
  });

  // Парсим значения location для каждой стороны
  const topOffset = parseLocationValue(normalizedLocation.top);
  const rightOffset = parseLocationValue(normalizedLocation.right);
  const bottomOffset = parseLocationValue(normalizedLocation.bottom);
  const leftOffset = parseLocationValue(normalizedLocation.left);

  if (isInner) {
    // Для внутренних паттернов: отступы от краёв родительского паттерна
    // Используем минимальное значение для позиционирования
    const left = leftOffset.min * gridSize;
    const top = topOffset.min * gridSize;
    const right = rightOffset.min * gridSize;
    const bottom = bottomOffset.min * gridSize;

    // Начальная позиция - левый верхний угол с учётом отступов
    let x = parentBounds.x + left;
    let y = parentBounds.y + top;

    // Если заданы и left, и right, центрируем по горизонтали или прижимаем к нужной стороне
    if (normalizedLocation.left !== undefined && normalizedLocation.right !== undefined) {
      // Если заданы обе стороны, центрируем по горизонтали
      x = parentBounds.x + (parentBounds.width - childSize.width) / 2;
    } else if (normalizedLocation.right !== undefined) {
      // Если задан только right, прижимаем к правому краю
      x = parentBounds.x + parentBounds.width - childSize.width - right;
    }

    // Если заданы и top, и bottom, центрируем по вертикали или прижимаем к нужной стороне
    if (normalizedLocation.top !== undefined && normalizedLocation.bottom !== undefined) {
      // Если заданы обе стороны, центрируем по вертикали
      y = parentBounds.y + (parentBounds.height - childSize.height) / 2;
    } else if (normalizedLocation.bottom !== undefined) {
      // Если задан только bottom, прижимаем к нижнему краю
      y = parentBounds.y + parentBounds.height - childSize.height - bottom;
    }

    return { x, y };
  } else {
    // Для внешних паттернов: отступы от краёв родительского паттерна наружу
    // Используем минимальное значение для позиционирования
    const left = leftOffset.min * gridSize;
    const top = topOffset.min * gridSize;
    const right = rightOffset.min * gridSize;
    const bottom = bottomOffset.min * gridSize;

    let x, y;

    // Определяем горизонтальную позицию
    if (normalizedLocation.left !== undefined) {
      x = parentBounds.x - childSize.width - left;
    } else if (normalizedLocation.right !== undefined) {
      x = parentBounds.x + parentBounds.width + right;
    } else {
      // По умолчанию справа
      x = parentBounds.x + parentBounds.width + right;
    }

    // Определяем вертикальную позицию
    if (normalizedLocation.top !== undefined) {
      y = parentBounds.y - childSize.height - top;
    } else if (normalizedLocation.bottom !== undefined) {
      y = parentBounds.y + parentBounds.height + bottom;
    } else {
      // По умолчанию сверху
      y = parentBounds.y - childSize.height - top;
    }

    return { x, y };
  }
};

