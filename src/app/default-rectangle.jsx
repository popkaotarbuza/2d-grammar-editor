import React from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultExternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 100,
  height = 70,
  text = 'Внешний паттерн',
  fill = 'white',
  isSelected = false,
  onSelect,
  onDragEnd,
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

  // Функция для ограничения внешних паттернов - они не должны попадать во внутреннюю область
  const dragBoundFunc = (pos) => {
    const patternWidth = width;
    const patternHeight = height;
    const stageW = stageSize.width;
    const stageH = stageSize.height;

    let newX = Math.max(0, Math.min(pos.x, stageW - patternWidth));
    let newY = Math.max(0, Math.min(pos.y, stageH - patternHeight));

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
        newX = innerRectX - patternWidth;
      } else if (minDist === distToRight) {
        newX = innerRight;
      } else if (minDist === distToTop) {
        newY = innerRectY - patternHeight;
      } else {
        newY = innerBottom;
      }

      // Проверяем границы сцены после сдвига
      newX = Math.max(0, Math.min(newX, stageW - patternWidth));
      newY = Math.max(0, Math.min(newY, stageH - patternHeight));
    }

    return { x: newX, y: newY };
  };

  return (
    <Group
      id={id}
      x={x}
      y={y}
      ref={nodeRef}
      name="rect"
      onClick={onSelect}
      onTap={onSelect}
      draggable={isSelected}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={onDragEnd}
    >
      <Rect
        width={width}
        height={height}
        fill={fill}
        cornerRadius={8}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.2}
      />
      <Text
        width={width}
        height={height}
        text={text}
        fontSize={24}
        fontStyle="bold"
        fill={isSelected ? 'red' : 'black'}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export { DefaultExternalRectangle };
