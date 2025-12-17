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
 * Проверяет, пересекаются ли два прямоугольника
 * 
 * @param {Object} rect1 - Первый прямоугольник {x, y, width, height}
 * @param {Object} rect2 - Второй прямоугольник {x, y, width, height}
 * @returns {boolean} true если пересекаются
 */
export const checkCollision = (rect1, rect2) => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect1.x >= rect2.x + rect2.width ||
    rect1.y + rect1.height <= rect2.y ||
    rect1.y >= rect2.y + rect2.height
  );
};

/**
 * Определяет, какие стороны паттерна зафиксированы (притянуты с location = 0)
 * 
 * @param {Object} location - Объект location
 * @returns {Object} {left, right, top, bottom} - true если сторона зафиксирована
 */
export const getFixedSides = (location) => {
  if (!location || typeof location !== 'object') {
    return { left: false, right: false, top: false, bottom: false };
  }

  const normalizedLocation = {};
  ['top', 'right', 'bottom', 'left'].forEach(side => {
    if (location[side] !== undefined) {
      normalizedLocation[side] = location[side];
    }
    if (location[`margin-${side}`] !== undefined) {
      normalizedLocation[side] = location[`margin-${side}`];
    }
    if (location[`padding-${side}`] !== undefined) {
      normalizedLocation[side] = location[`padding-${side}`];
    }
  });

  const result = { left: false, right: false, top: false, bottom: false };
  
  ['top', 'right', 'bottom', 'left'].forEach(side => {
    if (normalizedLocation[side] !== undefined) {
      const offset = parseLocationValue(normalizedLocation[side]);
      if (offset.min === 0) {
        result[side] = true;
      }
    }
  });

  return result;
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
 * Находит максимальные значения location среди всех паттернов для масштабирования
 * Адаптирует размер клетки под конкретный выбранный паттерн
 * 
 * @param {Object} patterns - Объект с паттернами
 * @param {string} patternId - ID текущего паттерна
 * @returns {Object} {maxTop, maxRight, maxBottom, maxLeft} - Максимальные значения в клетках
 */
export const findMaxLocationValues = (patterns, patternId) => {
  const pattern = patterns[patternId];
  if (!pattern) return { maxTop: 5, maxRight: 5, maxBottom: 5, maxLeft: 5 };

  let maxTop = 0;
  let maxRight = 0;
  let maxBottom = 0;
  let maxLeft = 0;

  // Функция для обработки location компонента
  const processLocation = (loc) => {
    if (!loc) return;
    
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      const value = loc[side] || loc[`margin-${side}`] || loc[`padding-${side}`];
      if (value) {
        const parsed = parseLocationValue(value);
        // Для диапазонов берем максимальное значение
        // Для "0+" берем min + 10 как разумный максимум
        const maxVal = parsed.max === Infinity ? parsed.min + 10 : parsed.max;
        
        if (side === 'top') maxTop = Math.max(maxTop, maxVal);
        if (side === 'right') maxRight = Math.max(maxRight, maxVal);
        if (side === 'bottom') maxBottom = Math.max(maxBottom, maxVal);
        if (side === 'left') maxLeft = Math.max(maxLeft, maxVal);
      }
    });
  };

  // Проверяем внутренние паттерны
  if (pattern.inner && typeof pattern.inner === 'object') {
    Object.values(pattern.inner).forEach(component => {
      processLocation(component.location);
    });
  }

  // Проверяем внешние паттерны
  if (pattern.outer && typeof pattern.outer === 'object') {
    Object.values(pattern.outer).forEach(component => {
      processLocation(component.location);
    });
  }

  // Если нет значений, используем минимальные значения по умолчанию
  return { 
    maxTop: Math.max(maxTop, 1), 
    maxRight: Math.max(maxRight, 1), 
    maxBottom: Math.max(maxBottom, 1), 
    maxLeft: Math.max(maxLeft, 1) 
  };
};

/**
 * Вычисляет масштабированный размер клетки на основе максимальных значений location
 * Адаптирует размер клетки так, чтобы все паттерны поместились во внутреннее поле
 * 
 * @param {Object} parentBounds - Границы родительского контейнера
 * @param {Object} maxValues - Максимальные значения location
 * @returns {Object} {gridSizeX, gridSizeY} - Размеры клетки по X и Y
 */
export const calculateScaledGridSize = (parentBounds, maxValues) => {
  const { maxTop, maxRight, maxBottom, maxLeft } = maxValues;
  
  // Учитываем размер паттерна (примерно 100px) при расчете
  const patternSize = 100;
  
  // Доступное пространство для размещения (за вычетом размера паттерна)
  const availableWidth = parentBounds.width - patternSize;
  const availableHeight = parentBounds.height - patternSize;
  
  // Максимальное количество клеток по каждой оси
  // Берем максимум из противоположных сторон, так как паттерн может быть
  // либо слева (left), либо справа (right), но не одновременно на обеих сторонах
  const maxHorizontalCells = Math.max(maxLeft, maxRight, 1);
  const maxVerticalCells = Math.max(maxTop, maxBottom, 1);
  
  // Вычисляем размер клетки для каждой оси
  const gridSizeX = availableWidth / maxHorizontalCells;
  const gridSizeY = availableHeight / maxVerticalCells;
  
  // Используем минимальный размер для обеих осей, чтобы сохранить пропорции
  // Но не меньше минимального размера и не больше максимального
  const minGridSize = 5; // Минимальный размер клетки
  const maxGridSize = SIZES.GRID_SIZE * 2; // Максимальный размер клетки
  
  const gridSize = Math.max(
    minGridSize,
    Math.min(gridSizeX, gridSizeY, maxGridSize)
  );
  
  return { gridSizeX: gridSize, gridSizeY: gridSize };
};

/**
 * Вычисляет допустимую область перемещения для паттерна на основе его location
 * 
 * @param {Object} location - Объект location
 * @param {Object} parentBounds - Границы внутренней области (для внутренних паттернов)
 * @param {Object} childSize - Размеры дочернего паттерна
 * @param {Object} gridSize - Размеры клетки {gridSizeX, gridSizeY}
 * @param {boolean} isInner - true если внутренний паттерн
 * @param {Object} stageBounds - Границы всей сцены (для внешних паттернов)
 * @returns {Object} {minX, maxX, minY, maxY} - Допустимые границы перемещения
 */
export const calculateDragBounds = (location, parentBounds, childSize, gridSize, isInner = true, stageBounds = null) => {
  const { gridSizeX, gridSizeY } = gridSize || { gridSizeX: SIZES.GRID_SIZE, gridSizeY: SIZES.GRID_SIZE };

  if (isInner) {
    // Для внутренних паттернов - перемещение внутри parentBounds
    if (!location || typeof location !== 'object') {
      return {
        minX: parentBounds.x,
        maxX: parentBounds.x + parentBounds.width - childSize.width,
        minY: parentBounds.y,
        maxY: parentBounds.y + parentBounds.height - childSize.height
      };
    }

    // Нормализуем location
    const normalizedLocation = {};
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      if (location[side] !== undefined) normalizedLocation[side] = location[side];
      if (location[`margin-${side}`] !== undefined) normalizedLocation[side] = location[`margin-${side}`];
      if (location[`padding-${side}`] !== undefined) normalizedLocation[side] = location[`padding-${side}`];
    });

    // Парсим значения
    const topOffset = parseLocationValue(normalizedLocation.top);
    const rightOffset = parseLocationValue(normalizedLocation.right);
    const bottomOffset = parseLocationValue(normalizedLocation.bottom);
    const leftOffset = parseLocationValue(normalizedLocation.left);

    // Вычисляем границы в пикселях
    const leftMin = leftOffset.min * gridSizeX;
    const leftMax = (leftOffset.max === Infinity ? leftOffset.min + 10 : leftOffset.max) * gridSizeX;
    const rightMin = rightOffset.min * gridSizeX;
    const rightMax = (rightOffset.max === Infinity ? rightOffset.min + 10 : rightOffset.max) * gridSizeX;
    const topMin = topOffset.min * gridSizeY;
    const topMax = (topOffset.max === Infinity ? topOffset.min + 10 : topOffset.max) * gridSizeY;
    const bottomMin = bottomOffset.min * gridSizeY;
    const bottomMax = (bottomOffset.max === Infinity ? bottomOffset.min + 10 : bottomOffset.max) * gridSizeY;

    let minX = parentBounds.x;
    let maxX = parentBounds.x + parentBounds.width - childSize.width;
    let minY = parentBounds.y;
    let maxY = parentBounds.y + parentBounds.height - childSize.height;

    if (normalizedLocation.left !== undefined) {
      minX = parentBounds.x + leftMin;
      maxX = Math.min(maxX, parentBounds.x + leftMax);
    }
    if (normalizedLocation.right !== undefined) {
      minX = Math.max(minX, parentBounds.x + parentBounds.width - childSize.width - rightMax);
      maxX = Math.min(maxX, parentBounds.x + parentBounds.width - childSize.width - rightMin);
    }
    if (normalizedLocation.top !== undefined) {
      minY = parentBounds.y + topMin;
      maxY = Math.min(maxY, parentBounds.y + topMax);
    }
    if (normalizedLocation.bottom !== undefined) {
      minY = Math.max(minY, parentBounds.y + parentBounds.height - childSize.height - bottomMax);
      maxY = Math.min(maxY, parentBounds.y + parentBounds.height - childSize.height - bottomMin);
    }

    return { minX, maxX, minY, maxY };
  } else {
    // Для внешних паттернов - перемещение СНАРУЖИ parentBounds, но внутри stageBounds
    const stage = stageBounds || { x: 0, y: 0, width: 1000, height: 700 };
    
    if (!location || typeof location !== 'object') {
      // Если location не задан - вся область сцены минус внутренняя область
      return {
        minX: stage.x,
        maxX: stage.x + stage.width - childSize.width,
        minY: stage.y,
        maxY: stage.y + stage.height - childSize.height,
        forbiddenZone: {
          x: parentBounds.x,
          y: parentBounds.y,
          width: parentBounds.width,
          height: parentBounds.height
        }
      };
    }

    // Нормализуем location
    const normalizedLocation = {};
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      if (location[side] !== undefined) normalizedLocation[side] = location[side];
      if (location[`margin-${side}`] !== undefined) normalizedLocation[side] = location[`margin-${side}`];
      if (location[`padding-${side}`] !== undefined) normalizedLocation[side] = location[`padding-${side}`];
    });

    // Парсим значения
    const topOffset = parseLocationValue(normalizedLocation.top);
    const rightOffset = parseLocationValue(normalizedLocation.right);
    const bottomOffset = parseLocationValue(normalizedLocation.bottom);
    const leftOffset = parseLocationValue(normalizedLocation.left);

    const hasLeft = normalizedLocation.left !== undefined;
    const hasRight = normalizedLocation.right !== undefined;
    const hasTop = normalizedLocation.top !== undefined;
    const hasBottom = normalizedLocation.bottom !== undefined;
    
    const leftIsZero = hasLeft && leftOffset.min === 0;
    const rightIsZero = hasRight && rightOffset.min === 0;
    const topIsZero = hasTop && topOffset.min === 0;
    const bottomIsZero = hasBottom && bottomOffset.min === 0;

    // Вычисляем границы в пикселях
    const { gridSizeX, gridSizeY } = gridSize || { gridSizeX: SIZES.GRID_SIZE, gridSizeY: SIZES.GRID_SIZE };
    const leftMin = leftOffset.min * gridSizeX;
    const leftMax = (leftOffset.max === Infinity ? leftOffset.min + 10 : leftOffset.max) * gridSizeX;
    const rightMin = rightOffset.min * gridSizeX;
    const rightMax = (rightOffset.max === Infinity ? rightOffset.min + 10 : rightOffset.max) * gridSizeX;
    const topMin = topOffset.min * gridSizeY;
    const topMax = (topOffset.max === Infinity ? topOffset.min + 10 : topOffset.max) * gridSizeY;
    const bottomMin = bottomOffset.min * gridSizeY;
    const bottomMax = (bottomOffset.max === Infinity ? bottomOffset.min + 10 : bottomOffset.max) * gridSizeY;

    let minX = stage.x;
    let maxX = stage.x + stage.width - childSize.width;
    let minY = stage.y;
    let maxY = stage.y + stage.height - childSize.height;

    // Строгие ограничения перемещения на основе location
    // Паттерн может перемещаться только в той области, которая соответствует его location
    
    // Горизонтальные ограничения
    if (hasLeft) {
      // Паттерн ТОЛЬКО слева от внутренней области
      const leftBoundary = parentBounds.x - childSize.width;
      if (leftIsZero) {
        minX = maxX = leftBoundary;
      } else {
        minX = leftBoundary - leftMax;
        maxX = leftBoundary - leftMin;
      }
      // Строго запрещаем перемещение в другие области
      maxX = Math.min(maxX, parentBounds.x - childSize.width);
    } else if (hasRight) {
      // Паттерн ТОЛЬКО справа от внутренней области
      const rightBoundary = parentBounds.x + parentBounds.width;
      if (rightIsZero) {
        minX = maxX = rightBoundary;
      } else {
        minX = rightBoundary + rightMin;
        maxX = rightBoundary + rightMax;
      }
      // Строго запрещаем перемещение в другие области
      minX = Math.max(minX, parentBounds.x + parentBounds.width);
    } else {
      // Если не задан ни left, ни right - может перемещаться по всей ширине
      // НО не может заходить во внутреннюю область
      minX = stage.x;
      maxX = stage.x + stage.width - childSize.width;
    }

    // Вертикальные ограничения
    if (hasTop) {
      // Паттерн ТОЛЬКО сверху от внутренней области
      const topBoundary = parentBounds.y - childSize.height;
      if (topIsZero) {
        minY = maxY = topBoundary;
      } else {
        minY = topBoundary - topMax;
        maxY = topBoundary - topMin;
      }
      // Строго запрещаем перемещение в другие области
      maxY = Math.min(maxY, parentBounds.y - childSize.height);
    } else if (hasBottom) {
      // Паттерн ТОЛЬКО снизу от внутренней области
      const bottomBoundary = parentBounds.y + parentBounds.height;
      if (bottomIsZero) {
        minY = maxY = bottomBoundary;
      } else {
        minY = bottomBoundary + bottomMin;
        maxY = bottomBoundary + bottomMax;
      }
      // Строго запрещаем перемещение в другие области
      minY = Math.max(minY, parentBounds.y + parentBounds.height);
    } else {
      // Если не задан ни top, ни bottom - может перемещаться по всей высоте
      // НО не может заходить во внутреннюю область
      minY = stage.y;
      maxY = stage.y + stage.height - childSize.height;
    }

    // Дополнительные ограничения для комбинаций сторон
    // Например, если задан right + top, паттерн может быть только в правом верхнем углу
    if (hasLeft && hasTop) {
      // Левый верхний угол - паттерн слева И сверху одновременно
      // Дополнительных ограничений не нужно, уже ограничен выше
    } else if (hasRight && hasTop) {
      // Правый верхний угол - паттерн справа И сверху одновременно
      // Дополнительных ограничений не нужно, уже ограничен выше
    } else if (hasLeft && hasBottom) {
      // Левый нижний угол
      // Дополнительных ограничений не нужно, уже ограничен выше
    } else if (hasRight && hasBottom) {
      // Правый нижний угол
      // Дополнительных ограничений не нужно, уже ограничен выше
    }

    // Убеждаемся, что не выходим за границы сцены
    // Для внешних паттернов это критично, чтобы они оставались видимыми
    const stageMinX = stage.x;
    const stageMaxX = stage.x + stage.width - childSize.width;
    const stageMinY = stage.y;
    const stageMaxY = stage.y + stage.height - childSize.height;
    
    minX = Math.max(minX, stageMinX);
    maxX = Math.min(maxX, stageMaxX);
    minY = Math.max(minY, stageMinY);
    maxY = Math.min(maxY, stageMaxY);
    
    // Если после ограничений minX > maxX или minY > maxY, 
    // значит паттерн не помещается - ограничиваем границами сцены
    if (minX > maxX) {
      minX = stageMinX;
      maxX = stageMaxX;
    }
    if (minY > maxY) {
      minY = stageMinY;
      maxY = stageMaxY;
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      forbiddenZone: {
        x: parentBounds.x,
        y: parentBounds.y,
        width: parentBounds.width,
        height: parentBounds.height
      }
    };
  }
};

/**
 * Вычисляет позицию и размер дочернего паттерна на основе location относительно родительского паттерна
 * 
 * @param {Object} location - Объект location с полями top, right, bottom, left (и их вариантами с margin/padding)
 * @param {Object} parentBounds - Границы родительского паттерна {x, y, width, height}
 * @param {Object} childSize - Размеры дочернего паттерна {width, height}
 * @param {boolean} isInner - true если это внутренний паттерн, false если внешний
 * @param {Object} gridSize - Размеры клетки {gridSizeX, gridSizeY} (опционально)
 * @returns {Object} Позиция и размер дочернего паттерна {x, y, width, height}
 */
export const calculateChildPosition = (location, parentBounds, childSize, isInner = true, gridSize = null, stageBounds = null) => {
  if (!location || typeof location !== 'object') {
    // Если location не задан, размещаем по центру
    return {
      x: parentBounds.x + (parentBounds.width - childSize.width) / 2,
      y: parentBounds.y + (parentBounds.height - childSize.height) / 2,
      width: childSize.width,
      height: childSize.height,
    };
  }

  // Используем переданный gridSize или стандартный
  const actualGridSizeX = gridSize?.gridSizeX || SIZES.GRID_SIZE;
  const actualGridSizeY = gridSize?.gridSizeY || SIZES.GRID_SIZE;
  
  // Границы сцены для ограничения внешних паттернов
  const stage = stageBounds || { x: 0, y: 0, width: 1000, height: 700 };
  
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
    const left = leftOffset.min * actualGridSizeX;
    const top = topOffset.min * actualGridSizeY;
    const right = rightOffset.min * actualGridSizeX;
    const bottom = bottomOffset.min * actualGridSizeY;

    // Начальная позиция и размер
    let x = parentBounds.x + left;
    let y = parentBounds.y + top;
    let width = childSize.width;
    let height = childSize.height;

    // Проверяем, нужно ли растягивать по горизонтали
    const hasLeft = normalizedLocation.left !== undefined;
    const hasRight = normalizedLocation.right !== undefined;
    const leftIsZero = hasLeft && leftOffset.min === 0;
    const rightIsZero = hasRight && rightOffset.min === 0;

    // Проверяем, нужно ли растягивать по вертикали
    const hasTop = normalizedLocation.top !== undefined;
    const hasBottom = normalizedLocation.bottom !== undefined;
    const topIsZero = hasTop && topOffset.min === 0;
    const bottomIsZero = hasBottom && bottomOffset.min === 0;

    // Растягивание по горизонтали
    if (leftIsZero && rightIsZero) {
      // Растянуть между левой и правой сторонами
      x = parentBounds.x + left;
      width = parentBounds.width - left - right;
    } else if (leftIsZero) {
      // Прижать к левой стороне
      x = parentBounds.x + left;
    } else if (rightIsZero) {
      // Прижать к правой стороне
      x = parentBounds.x + parentBounds.width - childSize.width - right;
    } else if (hasLeft && hasRight) {
      // Если заданы обе стороны с ненулевыми отступами - используем left
      x = parentBounds.x + left;
    } else if (hasRight) {
      // Если задан только right с ненулевым отступом
      x = parentBounds.x + parentBounds.width - childSize.width - right;
    } else if (hasLeft) {
      // Если задан только left с ненулевым отступом
      x = parentBounds.x + left;
    }

    // Растягивание по вертикали
    if (topIsZero && bottomIsZero) {
      // Растянуть между верхней и нижней сторонами
      y = parentBounds.y + top;
      height = parentBounds.height - top - bottom;
    } else if (topIsZero) {
      // Прижать к верхней стороне
      y = parentBounds.y + top;
    } else if (bottomIsZero) {
      // Прижать к нижней стороне
      y = parentBounds.y + parentBounds.height - childSize.height - bottom;
    } else if (hasTop && hasBottom) {
      // Если заданы обе стороны с ненулевыми отступами - используем top
      y = parentBounds.y + top;
    } else if (hasBottom) {
      // Если задан только bottom с ненулевым отступом
      y = parentBounds.y + parentBounds.height - childSize.height - bottom;
    } else if (hasTop) {
      // Если задан только top с ненулевым отступом
      y = parentBounds.y + top;
    }

    return { x, y, width, height };
  } else {
    // Для внешних паттернов: отступы от краёв родительского паттерна наружу
    // Используем минимальное значение для позиционирования
    const left = leftOffset.min * actualGridSizeX;
    const top = topOffset.min * actualGridSizeY;
    const right = rightOffset.min * actualGridSizeX;
    const bottom = bottomOffset.min * actualGridSizeY;

    let x, y;
    let width = childSize.width;
    let height = childSize.height;

    // Проверяем, нужно ли растягивать
    const hasLeft = normalizedLocation.left !== undefined;
    const hasRight = normalizedLocation.right !== undefined;
    const hasTop = normalizedLocation.top !== undefined;
    const hasBottom = normalizedLocation.bottom !== undefined;
    
    const leftIsZero = hasLeft && leftOffset.min === 0;
    const rightIsZero = hasRight && rightOffset.min === 0;
    const topIsZero = hasTop && topOffset.min === 0;
    const bottomIsZero = hasBottom && bottomOffset.min === 0;

    // Определяем горизонтальную позицию
    // Для внешних паттернов: при left=0 паттерн прижимается к левой границе внутренней области (снаружи)
    if (hasLeft) {
      // Размещаем слева от внутренней области
      // При left=0 паттерн прижат к левой границе, при left>0 отступает влево
      x = parentBounds.x - childSize.width - left;
      
      // Ограничиваем левой границей сцены
      x = Math.max(stage.x, x);
      
      // Определяем вертикальную позицию
      if (leftIsZero && topIsZero && bottomIsZero) {
        // Растягиваем по высоте
        y = parentBounds.y;
        height = parentBounds.height;
      } else if (leftIsZero && topIsZero) {
        // Прижимаем к верхнему левому углу
        y = parentBounds.y;
      } else if (leftIsZero && bottomIsZero) {
        // Прижимаем к нижнему левому углу
        y = parentBounds.y + parentBounds.height - childSize.height;
      } else if (hasTop) {
        // Позиционируем по top (отступ от верхней границы внутренней области)
        y = parentBounds.y + top;
        y = Math.max(stage.y, Math.min(y, stage.y + stage.height - childSize.height));
      } else if (hasBottom) {
        // Позиционируем по bottom (отступ от нижней границы внутренней области)
        y = parentBounds.y + parentBounds.height - childSize.height - bottom;
        y = Math.max(stage.y, Math.min(y, stage.y + stage.height - childSize.height));
      } else {
        // По умолчанию - по центру вертикально
        y = parentBounds.y + (parentBounds.height - childSize.height) / 2;
      }
    } else if (hasRight) {
      // Размещаем справа от внутренней области
      // При right=0 паттерн прижат к правой границе, при right>0 отступает вправо
      x = parentBounds.x + parentBounds.width + right;
      
      // Ограничиваем правой границей сцены
      x = Math.min(stage.x + stage.width - childSize.width, x);
      
      // Определяем вертикальную позицию
      if (rightIsZero && topIsZero && bottomIsZero) {
        y = parentBounds.y;
        height = parentBounds.height;
      } else if (rightIsZero && topIsZero) {
        y = parentBounds.y;
      } else if (rightIsZero && bottomIsZero) {
        y = parentBounds.y + parentBounds.height - childSize.height;
      } else if (hasTop) {
        y = parentBounds.y + top;
        y = Math.max(stage.y, Math.min(y, stage.y + stage.height - childSize.height));
      } else if (hasBottom) {
        y = parentBounds.y + parentBounds.height - childSize.height - bottom;
        y = Math.max(stage.y, Math.min(y, stage.y + stage.height - childSize.height));
      } else {
        y = parentBounds.y + (parentBounds.height - childSize.height) / 2;
      }
    } else if (hasTop) {
      // Размещаем сверху от внутренней области
      // При top=0 паттерн прижат к верхней границе, при top>0 отступает вверх
      y = parentBounds.y - childSize.height - top;
      
      // Ограничиваем верхней границей сцены
      y = Math.max(stage.y, y);
      
      // Определяем горизонтальную позицию
      if (topIsZero && leftIsZero && rightIsZero) {
        x = parentBounds.x;
        width = parentBounds.width;
      } else if (topIsZero && leftIsZero) {
        x = parentBounds.x;
      } else if (topIsZero && rightIsZero) {
        x = parentBounds.x + parentBounds.width - childSize.width;
      } else if (hasLeft) {
        x = parentBounds.x + left;
        x = Math.max(stage.x, Math.min(x, stage.x + stage.width - childSize.width));
      } else if (hasRight) {
        x = parentBounds.x + parentBounds.width - childSize.width - right;
        x = Math.max(stage.x, Math.min(x, stage.x + stage.width - childSize.width));
      } else {
        // По умолчанию - по центру горизонтально
        x = parentBounds.x + (parentBounds.width - childSize.width) / 2;
      }
    } else if (hasBottom) {
      // Размещаем снизу от внутренней области
      // При bottom=0 паттерн прижат к нижней границе, при bottom>0 отступает вниз
      y = parentBounds.y + parentBounds.height + bottom;
      
      // Ограничиваем нижней границей сцены
      y = Math.min(stage.y + stage.height - childSize.height, y);
      
      // Определяем горизонтальную позицию
      if (bottomIsZero && leftIsZero && rightIsZero) {
        x = parentBounds.x;
        width = parentBounds.width;
      } else if (bottomIsZero && leftIsZero) {
        x = parentBounds.x;
      } else if (bottomIsZero && rightIsZero) {
        x = parentBounds.x + parentBounds.width - childSize.width;
      } else if (hasLeft) {
        x = parentBounds.x + left;
        x = Math.max(stage.x, Math.min(x, stage.x + stage.width - childSize.width));
      } else if (hasRight) {
        x = parentBounds.x + parentBounds.width - childSize.width - right;
        x = Math.max(stage.x, Math.min(x, stage.x + stage.width - childSize.width));
      } else {
        // По умолчанию - по центру горизонтально
        x = parentBounds.x + (parentBounds.width - childSize.width) / 2;
      }
    } else {
      // По умолчанию - справа по центру
      x = parentBounds.x + parentBounds.width;
      y = parentBounds.y + (parentBounds.height - childSize.height) / 2;
    }

    return { x, y, width, height };
  }
};


/**
 * Распределяет паттерны вдоль границы, чтобы они не накладывались друг на друга
 * Учитывает location каждого паттерна для определения стороны привязки
 * 
 * @param {Array} patternInfos - Массив информации о паттернах с location
 * @param {Object} parentBounds - Границы родительского контейнера
 * @returns {Array} Обновленный массив с новыми позициями
 */
export const distributePatterns = (patternInfos, parentBounds) => {
  if (!patternInfos || patternInfos.length === 0) return patternInfos;

  // Группируем паттерны по сторонам на основе их location
  const groups = {
    left: [],
    right: [],
    top: [],
    bottom: [],
    none: []
  };

  patternInfos.forEach((pattern, index) => {
    const { location, type } = pattern;
    
    if (!location) {
      groups.none.push({ ...pattern, originalIndex: index });
      return;
    }

    // Нормализуем location
    const normalizedLocation = {};
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      if (location[side] !== undefined) {
        normalizedLocation[side] = location[side];
      }
      if (location[`margin-${side}`] !== undefined) {
        normalizedLocation[side] = location[`margin-${side}`];
      }
      if (location[`padding-${side}`] !== undefined) {
        normalizedLocation[side] = location[`padding-${side}`];
      }
    });

    // Парсим значения location
    const leftOffset = parseLocationValue(normalizedLocation.left);
    const rightOffset = parseLocationValue(normalizedLocation.right);
    const topOffset = parseLocationValue(normalizedLocation.top);
    const bottomOffset = parseLocationValue(normalizedLocation.bottom);

    // Определяем приоритетную сторону для внешних паттернов
    if (type === 'external') {
      if (normalizedLocation.left !== undefined) {
        groups.left.push({ ...pattern, originalIndex: index });
      } else if (normalizedLocation.right !== undefined) {
        groups.right.push({ ...pattern, originalIndex: index });
      } else if (normalizedLocation.top !== undefined) {
        groups.top.push({ ...pattern, originalIndex: index });
      } else if (normalizedLocation.bottom !== undefined) {
        groups.bottom.push({ ...pattern, originalIndex: index });
      } else {
        groups.none.push({ ...pattern, originalIndex: index });
      }
    } else {
      // Для внутренних паттернов определяем сторону по отступам
      const hasLeft = normalizedLocation.left !== undefined;
      const hasRight = normalizedLocation.right !== undefined;
      const hasTop = normalizedLocation.top !== undefined;
      const hasBottom = normalizedLocation.bottom !== undefined;
      
      const leftIsZero = hasLeft && leftOffset.min === 0;
      const rightIsZero = hasRight && rightOffset.min === 0;
      const topIsZero = hasTop && topOffset.min === 0;
      const bottomIsZero = hasBottom && bottomOffset.min === 0;

      // Если паттерн растянут между двумя сторонами, не распределяем его
      if ((leftIsZero && rightIsZero) || (topIsZero && bottomIsZero)) {
        groups.none.push({ ...pattern, originalIndex: index });
      }
      // Если паттерн в углу (две смежные стороны с нулевым отступом), не распределяем его
      else if ((leftIsZero && topIsZero) || (leftIsZero && bottomIsZero) || 
               (rightIsZero && topIsZero) || (rightIsZero && bottomIsZero)) {
        groups.none.push({ ...pattern, originalIndex: index });
      }
      // Определяем основную сторону привязки (приоритет у нулевых отступов)
      else if (leftIsZero) {
        groups.left.push({ ...pattern, originalIndex: index });
      } else if (rightIsZero) {
        groups.right.push({ ...pattern, originalIndex: index });
      } else if (topIsZero) {
        groups.top.push({ ...pattern, originalIndex: index });
      } else if (bottomIsZero) {
        groups.bottom.push({ ...pattern, originalIndex: index });
      }
      // Если нет нулевых отступов, но есть ненулевые - группируем по ним
      else if (hasLeft) {
        groups.left.push({ ...pattern, originalIndex: index });
      } else if (hasRight) {
        groups.right.push({ ...pattern, originalIndex: index });
      } else if (hasTop) {
        groups.top.push({ ...pattern, originalIndex: index });
      } else if (hasBottom) {
        groups.bottom.push({ ...pattern, originalIndex: index });
      } else {
        groups.none.push({ ...pattern, originalIndex: index });
      }
    }
  });

  const result = [...patternInfos];
  const MIN_SPACING = 10; // Минимальный отступ между паттернами

  // Распределяем паттерны вдоль левой границы (вертикально)
  if (groups.left.length > 1) {
    const totalHeight = groups.left.reduce((sum, p) => sum + p.height, 0);
    const availableHeight = parentBounds.height;
    const spacing = Math.max(MIN_SPACING, (availableHeight - totalHeight) / (groups.left.length + 1));
    
    let currentY = parentBounds.y + spacing;

    groups.left.forEach((pattern) => {
      result[pattern.originalIndex] = {
        ...result[pattern.originalIndex],
        y: currentY
      };
      currentY += pattern.height + spacing;
    });
  }

  // Распределяем паттерны вдоль правой границы (вертикально)
  if (groups.right.length > 1) {
    const totalHeight = groups.right.reduce((sum, p) => sum + p.height, 0);
    const availableHeight = parentBounds.height;
    const spacing = Math.max(MIN_SPACING, (availableHeight - totalHeight) / (groups.right.length + 1));
    
    let currentY = parentBounds.y + spacing;

    groups.right.forEach((pattern) => {
      result[pattern.originalIndex] = {
        ...result[pattern.originalIndex],
        y: currentY
      };
      currentY += pattern.height + spacing;
    });
  }

  // Распределяем паттерны вдоль верхней границы (горизонтально)
  if (groups.top.length > 1) {
    const totalWidth = groups.top.reduce((sum, p) => sum + p.width, 0);
    const availableWidth = parentBounds.width;
    const spacing = Math.max(MIN_SPACING, (availableWidth - totalWidth) / (groups.top.length + 1));
    
    let currentX = parentBounds.x + spacing;

    groups.top.forEach((pattern) => {
      result[pattern.originalIndex] = {
        ...result[pattern.originalIndex],
        x: currentX
      };
      currentX += pattern.width + spacing;
    });
  }

  // Распределяем паттерны вдоль нижней границы (горизонтально)
  if (groups.bottom.length > 1) {
    const totalWidth = groups.bottom.reduce((sum, p) => sum + p.width, 0);
    const availableWidth = parentBounds.width;
    const spacing = Math.max(MIN_SPACING, (availableWidth - totalWidth) / (groups.bottom.length + 1));
    
    let currentX = parentBounds.x + spacing;

    groups.bottom.forEach((pattern) => {
      result[pattern.originalIndex] = {
        ...result[pattern.originalIndex],
        x: currentX
      };
      currentX += pattern.width + spacing;
    });
  }

  return result;
};
