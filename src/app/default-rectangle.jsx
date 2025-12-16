import React from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultExternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 100,
  height = 70,
  text = 'Внешний паттерн',
  fill = '#E3E3E3',
  isSelected = false,
  draggable = true,
  dragBoundFunc,
  onSelect,
  onDragEnd,
  onDragMove,
  nodeRef,
  stageSize, 
}) => {
  // Вычисляем границы внутреннего квадрата
  const innerRectX = (stageSize.width - stageSize.width / 1.5) / 2;
  const innerRectY = (stageSize.height - stageSize.height / 1.5) / 2;
  const innerRectWidth = stageSize.width / 1.5;
  const innerRectHeight = stageSize.height / 1.5;

  // Функция для проверки пересечения с внутренней областью
  const intersectsInnerArea = (posX, posY, patternWidth, patternHeight) => {
    const patternRight = posX + patternWidth;
    const patternBottom = posY + patternHeight;
    const innerRight = innerRectX + innerRectWidth;
    const innerBottom = innerRectY + innerRectHeight;

    // Проверяем, не пересекается ли паттерн с внутренней областью
    return !(
      patternRight <= innerRectX || 
      posX >= innerRight || 
      patternBottom <= innerRectY || 
      posY >= innerBottom
    );
  };

  // Функция для ограничения внешних паттернов - они не должны попадать во внутреннюю область (по умолчанию)
  const defaultDragBoundFunc = (pos) => {
    const patternWidth = width;
    const patternHeight = height;
    const stageW = stageSize.width;
    const stageH = stageSize.height;

    // Строго ограничиваем границами сцены, чтобы паттерн полностью оставался внутри
    // Убеждаемся, что весь паттерн помещается: x >= 0, x + width <= stageW
    let newX = Math.max(0, Math.min(Math.max(0, pos.x), Math.max(0, stageW - patternWidth)));
    let newY = Math.max(0, Math.min(Math.max(0, pos.y), Math.max(0, stageH - patternHeight)));

    // Дополнительная проверка: убеждаемся, что правая и нижняя границы не выходят
    if (newX + patternWidth > stageW) {
      newX = Math.max(0, stageW - patternWidth);
    }
    if (newY + patternHeight > stageH) {
      newY = Math.max(0, stageH - patternHeight);
    }

    // Если паттерн пересекается с внутренней областью, сдвигаем его наружу
    if (intersectsInnerArea(newX, newY, patternWidth, patternHeight)) {
      const innerRight = innerRectX + innerRectWidth;
      const innerBottom = innerRectY + innerRectHeight;

      // Вычисляем расстояния до каждой стороны внутренней области
      const distToLeft = newX + patternWidth - innerRectX;
      const distToRight = innerRight - newX;
      const distToTop = newY + patternHeight - innerRectY;
      const distToBottom = innerBottom - newY;

      // Выбираем наименьшее расстояние и сдвигаем паттерн
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft) {
        newX = Math.max(0, innerRectX - patternWidth);
      } else if (minDist === distToRight) {
        newX = Math.min(Math.max(0, stageW - patternWidth), innerRight);
      } else if (minDist === distToTop) {
        newY = Math.max(0, innerRectY - patternHeight);
      } else {
        newY = Math.min(Math.max(0, stageH - patternHeight), innerBottom);
      }

      // Финальная строгая проверка границ сцены после сдвига
      newX = Math.max(0, Math.min(newX, Math.max(0, stageW - patternWidth)));
      newY = Math.max(0, Math.min(newY, Math.max(0, stageH - patternHeight)));
      
      // Дополнительная проверка правой и нижней границ
      if (newX + patternWidth > stageW) {
        newX = Math.max(0, stageW - patternWidth);
      }
      if (newY + patternHeight > stageH) {
        newY = Math.max(0, stageH - patternHeight);
      }
    }

    return { x: newX, y: newY };
  };

  // Используем переданную функцию или дефолтную
  const finalDragBoundFunc = dragBoundFunc || defaultDragBoundFunc;

  return (
    <Group
      id={id}
      x={x}
      y={y}
      ref={nodeRef}
      name="rect"
      onClick={onSelect}
      onTap={onSelect}
      draggable={draggable}
      dragBoundFunc={finalDragBoundFunc}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
    >
      <Rect
        width={width}
        height={height}
        fill={fill}
        cornerRadius={8}
        stroke={isSelected ? "#D72B00" : "#949494"}
        strokeWidth={isSelected ? 2 : 1}
      />
      <Text
        x={width / 2}
        y={height / 2}
        text={text}
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fill="#333"
        align="center"
        verticalAlign="middle"
        offsetX={width / 2}
        offsetY={height / 2}
        width={width}
        height={height}
        wrap="word"
      />
    </Group>
  );
};

export { DefaultExternalRectangle };
