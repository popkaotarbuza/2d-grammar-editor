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
 * Вычисляет позицию и размер дочернего паттерна на основе location относительно родительского паттерна
 * 
 * @param {Object} location - Объект location с полями top, right, bottom, left (и их вариантами с margin/padding)
 * @param {Object} parentBounds - Границы родительского паттерна {x, y, width, height}
 * @param {Object} childSize - Размеры дочернего паттерна {width, height}
 * @param {boolean} isInner - true если это внутренний паттерн, false если внешний
 * @returns {Object} Позиция и размер дочернего паттерна {x, y, width, height}
 */
export const calculateChildPosition = (location, parentBounds, childSize, isInner = true) => {
  if (!location || typeof location !== 'object') {
    // Если location не задан, размещаем по центру
    return {
      x: parentBounds.x + (parentBounds.width - childSize.width) / 2,
      y: parentBounds.y + (parentBounds.height - childSize.height) / 2,
      width: childSize.width,
      height: childSize.height,
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
    const left = leftOffset.min * gridSize;
    const top = topOffset.min * gridSize;
    const right = rightOffset.min * gridSize;
    const bottom = bottomOffset.min * gridSize;

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
    if (hasLeft) {
      // Размещаем слева от родителя
      x = parentBounds.x - childSize.width - left;
      
      // Если зафиксирован к левой стороне (left = 0), растягиваем по высоте родителя
      if (leftIsZero && topIsZero && bottomIsZero) {
        y = parentBounds.y;
        height = parentBounds.height;
      } else if (leftIsZero && topIsZero) {
        y = parentBounds.y;
      } else if (leftIsZero && bottomIsZero) {
        y = parentBounds.y + parentBounds.height - childSize.height;
      } else if (hasTop) {
        y = parentBounds.y - childSize.height - top;
      } else if (hasBottom) {
        y = parentBounds.y + parentBounds.height + bottom;
      } else {
        y = parentBounds.y;
      }
    } else if (hasRight) {
      // Размещаем справа от родителя
      x = parentBounds.x + parentBounds.width + right;
      
      // Если зафиксирован к правой стороне (right = 0), растягиваем по высоте родителя
      if (rightIsZero && topIsZero && bottomIsZero) {
        y = parentBounds.y;
        height = parentBounds.height;
      } else if (rightIsZero && topIsZero) {
        y = parentBounds.y;
      } else if (rightIsZero && bottomIsZero) {
        y = parentBounds.y + parentBounds.height - childSize.height;
      } else if (hasTop) {
        y = parentBounds.y - childSize.height - top;
      } else if (hasBottom) {
        y = parentBounds.y + parentBounds.height + bottom;
      } else {
        y = parentBounds.y;
      }
    } else if (hasTop) {
      // Размещаем сверху от родителя
      y = parentBounds.y - childSize.height - top;
      
      // Если зафиксирован к верхней стороне (top = 0), растягиваем по ширине родителя
      if (topIsZero && leftIsZero && rightIsZero) {
        x = parentBounds.x;
        width = parentBounds.width;
      } else if (topIsZero && leftIsZero) {
        x = parentBounds.x;
      } else if (topIsZero && rightIsZero) {
        x = parentBounds.x + parentBounds.width - childSize.width;
      } else {
        x = parentBounds.x;
      }
    } else if (hasBottom) {
      // Размещаем снизу от родителя
      y = parentBounds.y + parentBounds.height + bottom;
      
      // Если зафиксирован к нижней стороне (bottom = 0), растягиваем по ширине родителя
      if (bottomIsZero && leftIsZero && rightIsZero) {
        x = parentBounds.x;
        width = parentBounds.width;
      } else if (bottomIsZero && leftIsZero) {
        x = parentBounds.x;
      } else if (bottomIsZero && rightIsZero) {
        x = parentBounds.x + parentBounds.width - childSize.width;
      } else {
        x = parentBounds.x;
      }
    } else {
      // По умолчанию справа
      x = parentBounds.x + parentBounds.width + right;
      y = parentBounds.y;
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
