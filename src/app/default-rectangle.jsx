import React from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultExternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 100,
  height = 70,
  text = 'Перемещай меня',
  fill = 'white',
  isSelected = false,
  onSelect,
  nodeRef,
  stageSize, 
}) => {
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
      /*Функция для ограничения внешних паттернов (левая сторона+ верхняя сторона. Задана одна треть)*/
      dragBoundFunc={(pos) => {
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
}}
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
