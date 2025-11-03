import React from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultExternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 300,
  height = 150,
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

                const maxX = stageW - patternWidth;
                const maxY = stageH - patternHeight;
                const leftMax = stageW / 3 - patternWidth;
                const topMax = stageH / 3 - patternHeight;

                // Базовое ограничение по границам сцены
                let newX = Math.max(0, Math.min(pos.x, maxX));
                let newY = Math.max(0, Math.min(pos.y, maxY));

                // Проверка на запрещённую область (нижне-правый угол за пределами "Г")
                if (newX > leftMax && newY > topMax) {
                    const xOvershoot = newX - leftMax;
                    const yOvershoot = newY - topMax;

                    // Ограничить измерение с меньшим перебором (для более плавного "снапа")
                    if (xOvershoot <= yOvershoot) {
                    newX = leftMax;
                    } 
                    else {
                    newY = topMax;
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
