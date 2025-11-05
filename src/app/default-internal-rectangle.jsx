import React from 'react';
import { Group, Rect } from 'react-konva';

const DefaultInternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 100,
  height = 70,
  text = 'Внутренний паттерн',
  fill = '#D9D9D9',
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

  // Функция для ограничения движения внутри внутреннего квадрата
  const dragBoundFunc = (pos) => {
    const minX = innerRectX;
    const maxX = innerRectX + innerRectWidth - width;
    const minY = innerRectY;
    const maxY = innerRectY + innerRectHeight - height;

    const newX = Math.max(minX, Math.min(pos.x, maxX));
    const newY = Math.max(minY, Math.min(pos.y, maxY));

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
      draggable={true}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={onDragEnd}
    >
      <Rect
        width={width}
        height={height}
        fill={fill}
        cornerRadius={8}
        stroke="#949494"
        strokeWidth={1}
      />
    </Group>
  );
};

export { DefaultInternalRectangle };

