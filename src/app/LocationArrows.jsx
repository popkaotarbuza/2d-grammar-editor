import React, { useState, useRef, useEffect } from 'react';
import { Group, Line, Text, Arrow, Rect } from 'react-konva';

/**
 * Компонент для отрисовки стрелок location от паттерна до границ
 */
const LocationArrows = ({
  patternBounds,
  parentBounds,
  location,
  isInner = true,
  onLocationChange,
  stageRef,
}) => {
  const [editingSide, setEditingSide] = useState(null);
  const [editPosition, setEditPosition] = useState({ x: 0, y: 0 });
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Фокусируем input при появлении
  useEffect(() => {
    if (editingSide && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSide]);
  const ARROW_COLOR = '#D72B00';
  const TEXT_COLOR = '#D72B00';
  const ARROW_STROKE_WIDTH = 2;
  const ARROW_POINTER_LENGTH = 10;
  const ARROW_POINTER_WIDTH = 10;
  const TEXT_BG_COLOR = '#FFFFFF';
  const TEXT_BG_PADDING = 4;

  const arrows = [];

  // Нормализуем location - если не задан, используем "0+"
  const normalizedLocation = {};
  ['top', 'right', 'bottom', 'left'].forEach(side => {
    if (location && location[side] !== undefined) {
      normalizedLocation[side] = location[side];
    } else if (location && location[`margin-${side}`] !== undefined) {
      normalizedLocation[side] = location[`margin-${side}`];
    } else if (location && location[`padding-${side}`] !== undefined) {
      normalizedLocation[side] = location[`padding-${side}`];
    } else {
      // Если location не задан для этой стороны, показываем "0+"
      normalizedLocation[side] = '0+';
    }
  });

  // Сохраняем исходное значение для сравнения
  const [originalValue, setOriginalValue] = useState('');

  // Обработчик клика на текст для редактирования
  const handleTextClick = (side, displayValue, x, y) => {
    // Получаем позицию Stage относительно окна
    const stage = stageRef?.current;
    if (!stage) return;
    
    const stageBox = stage.container().getBoundingClientRect();
    
    // Получаем реальное значение из location (не нормализованное)
    let realValue = '';
    if (location && location[side] !== undefined) {
      realValue = location[side];
    } else if (location && location[`margin-${side}`] !== undefined) {
      realValue = location[`margin-${side}`];
    } else if (location && location[`padding-${side}`] !== undefined) {
      realValue = location[`padding-${side}`];
    }
    // Если реального значения нет, используем пустую строку (не "0+")
    
    setEditingSide(side);
    setEditValue(realValue); // Используем реальное значение, а не отображаемое
    setOriginalValue(realValue); // Сохраняем реальное исходное значение
    setEditPosition({
      x: stageBox.left + x,
      y: stageBox.top + y
    });
  };

  // Обработчик сохранения
  const handleSave = () => {
    if (onLocationChange) {
      const trimmedValue = editValue.trim();
      const trimmedOriginal = originalValue.trim();
      
      // Сохраняем только если значение действительно изменилось
      if (trimmedValue !== trimmedOriginal) {
        if (trimmedValue !== '') {
          // Если новое значение не пустое - сохраняем его
          const newLocation = { ...location, [editingSide]: trimmedValue };
          onLocationChange(newLocation);
        } else if (trimmedOriginal !== '') {
          // Если новое значение пустое, а старое было не пустое - удаляем параметр
          const newLocation = { ...location };
          delete newLocation[editingSide];
          onLocationChange(newLocation);
        }
        // Если оба значения пустые - ничего не делаем
      }
      // Если значение не изменилось - просто закрываем редактор без изменений
    }
    setEditingSide(null);
    setEditValue('');
    setOriginalValue('');
    if (typeof window !== 'undefined') {
      window.__locationEditorState = null;
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    setEditingSide(null);
    setEditValue('');
    setOriginalValue('');
    if (typeof window !== 'undefined') {
      window.__locationEditorState = null;
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Функция для отрисовки стрелки с указателями на концах
  const createArrowWithPointers = (x1, y1, x2, y2, label, key, side) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Вычисляем направление для стрелок
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 1) return null; // Слишком короткая линия

    const textWidth = label.length * 8;
    const textHeight = 20;

    // Общий обработчик клика для всей стрелки
    const handleArrowClick = () => handleTextClick(side, label, midX, midY);

    return (
      <Group 
        key={key}
        onClick={handleArrowClick}
        onTap={handleArrowClick}
        listening={true}
      >
        {/* Основная линия */}
        <Line
          points={[x1, y1, x2, y2]}
          stroke={ARROW_COLOR}
          strokeWidth={ARROW_STROKE_WIDTH}
          hitStrokeWidth={20}
          cursor="pointer"
        />
        
        {/* Стрелка у паттерна (указывает на паттерн) */}
        <Arrow
          points={[x1 + dx * 0.05, y1 + dy * 0.05, x1, y1]}
          stroke={ARROW_COLOR}
          fill={ARROW_COLOR}
          strokeWidth={ARROW_STROKE_WIDTH}
          pointerLength={ARROW_POINTER_LENGTH}
          pointerWidth={ARROW_POINTER_WIDTH}
          cursor="pointer"
        />
        
        {/* Стрелка у границы (указывает на границу) */}
        <Arrow
          points={[x2 - dx * 0.05, y2 - dy * 0.05, x2, y2]}
          stroke={ARROW_COLOR}
          fill={ARROW_COLOR}
          strokeWidth={ARROW_STROKE_WIDTH}
          pointerLength={ARROW_POINTER_LENGTH}
          pointerWidth={ARROW_POINTER_WIDTH}
          cursor="pointer"
        />
        
        {/* Фон для текста (белый прямоугольник) */}
        <Rect
          x={midX - textWidth / 2}
          y={midY - textHeight / 2}
          width={textWidth}
          height={textHeight}
          fill={TEXT_BG_COLOR}
          cornerRadius={3}
          cursor="pointer"
        />
        
        {/* Текст с параметром (кликабельный) */}
        <Text
          x={midX}
          y={midY}
          text={label}
          fontSize={13}
          fontFamily="Inter, sans-serif"
          fontStyle="bold"
          fill={TEXT_COLOR}
          align="center"
          verticalAlign="middle"
          offsetX={textWidth / 2}
          offsetY={textHeight / 2}
          cursor="pointer"
        />
      </Group>
    );
  };

  if (isInner) {
    // Для внутренних паттернов - стрелки до границ внутреннего прямоугольника
    
    // Стрелка к левой границе (всегда показываем)
    const leftX1 = patternBounds.x;
    const leftY1 = patternBounds.y + patternBounds.height / 2;
    const leftX2 = parentBounds.x;
    const leftY2 = leftY1;
    arrows.push(createArrowWithPointers(leftX1, leftY1, leftX2, leftY2, normalizedLocation.left, 'left', 'left'));

    // Стрелка к правой границе (всегда показываем)
    const rightX1 = patternBounds.x + patternBounds.width;
    const rightY1 = patternBounds.y + patternBounds.height / 2;
    const rightX2 = parentBounds.x + parentBounds.width;
    const rightY2 = rightY1;
    arrows.push(createArrowWithPointers(rightX1, rightY1, rightX2, rightY2, normalizedLocation.right, 'right', 'right'));

    // Стрелка к верхней границе (всегда показываем)
    const topX1 = patternBounds.x + patternBounds.width / 2;
    const topY1 = patternBounds.y;
    const topX2 = topX1;
    const topY2 = parentBounds.y;
    arrows.push(createArrowWithPointers(topX1, topY1, topX2, topY2, normalizedLocation.top, 'top', 'top'));

    // Стрелка к нижней границе (всегда показываем)
    const bottomX1 = patternBounds.x + patternBounds.width / 2;
    const bottomY1 = patternBounds.y + patternBounds.height;
    const bottomX2 = bottomX1;
    const bottomY2 = parentBounds.y + parentBounds.height;
    arrows.push(createArrowWithPointers(bottomX1, bottomY1, bottomX2, bottomY2, normalizedLocation.bottom, 'bottom', 'bottom'));
  } else {
    // Для внешних паттернов - всегда показываем 4 стрелки до границ внутреннего прямоугольника
    
    // Стрелка к левой границе (всегда показываем)
    const leftX1 = patternBounds.x;
    const leftY1 = patternBounds.y + patternBounds.height / 2;
    const leftX2 = parentBounds.x;
    const leftY2 = leftY1;
    arrows.push(createArrowWithPointers(leftX1, leftY1, leftX2, leftY2, normalizedLocation.left, 'left', 'left'));

    // Стрелка к правой границе (всегда показываем)
    const rightX1 = patternBounds.x + patternBounds.width;
    const rightY1 = patternBounds.y + patternBounds.height / 2;
    const rightX2 = parentBounds.x + parentBounds.width;
    const rightY2 = rightY1;
    arrows.push(createArrowWithPointers(rightX1, rightY1, rightX2, rightY2, normalizedLocation.right, 'right', 'right'));

    // Стрелка к верхней границе (всегда показываем)
    const topX1 = patternBounds.x + patternBounds.width / 2;
    const topY1 = patternBounds.y;
    const topX2 = topX1;
    const topY2 = parentBounds.y;
    arrows.push(createArrowWithPointers(topX1, topY1, topX2, topY2, normalizedLocation.top, 'top', 'top'));

    // Стрелка к нижней границе (всегда показываем)
    const bottomX1 = patternBounds.x + patternBounds.width / 2;
    const bottomY1 = patternBounds.y + patternBounds.height;
    const bottomX2 = bottomX1;
    const bottomY2 = parentBounds.y + parentBounds.height;
    arrows.push(createArrowWithPointers(bottomX1, bottomY1, bottomX2, bottomY2, normalizedLocation.bottom, 'bottom', 'bottom'));
  }

  return (
    <Group>
      {arrows}
      {/* Передаем состояние редактирования через window для доступа из App.jsx */}
      {editingSide && typeof window !== 'undefined' && (() => {
        window.__locationEditorState = {
          side: editingSide,
          value: editValue,
          position: editPosition,
          onSave: handleSave,
          onCancel: handleCancel,
          onKeyDown: handleKeyDown,
          onChange: setEditValue,
          inputRef: inputRef
        };
        return null;
      })()}
    </Group>
  );
};

export { LocationArrows };
