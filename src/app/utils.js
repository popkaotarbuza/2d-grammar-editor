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


/*Мой код с прошлого коммита 
const patternWidth = width;
            const patternHeight = height;
            const stageW = stageSize.width;
            const stageH = stageSize.height;

            const bound = 1 / 6;

            const maxX = stageW - patternWidth;
            const maxY = stageH - patternHeight;

            const leftLimit = stageW * bound - patternWidth;
            const rightLimit = stageW - stageW * bound;
            const topLimit = stageH * bound - patternHeight;
            const bottomLimit = stageH - stageH * bound;

            let newX = Math.max(0, Math.min(pos.x, maxX));
            let newY = Math.max(0, Math.min(pos.y, maxY));

            // Проверяем вертикальные полосы (левая или правая)
            const inVerticalL = newX <= leftLimit || newX >= rightLimit;

            // Проверяем горизонтальные полосы (верхняя или нижняя)
            const inHorizontalL = newY <= topLimit || newY >= bottomLimit;

            if (!inVerticalL && !inHorizontalL) {
                // В запрещённой зоне — притягиваем к ближайшей линии
                const deltaLeft = Math.abs(newX - leftLimit);
                const deltaRight = Math.abs(newX - rightLimit);
                const deltaTop = Math.abs(newY - topLimit);
                const deltaBottom = Math.abs(newY - bottomLimit);

                const minDeltaX = Math.min(deltaLeft, deltaRight);
                const minDeltaY = Math.min(deltaTop, deltaBottom);

                if (minDeltaX < minDeltaY) {
                newX = deltaLeft < deltaRight ? leftLimit : rightLimit;
                } else {
                newY = deltaTop < deltaBottom ? topLimit : bottomLimit;
                }
            }

            return { x: newX, y: newY };
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

