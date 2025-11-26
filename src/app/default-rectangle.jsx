import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultExternalRectangle = ({
  id,
  x = 0,
  y = 0,
  width = 100,
  height = 70,
  text = 'Внешний паттерн',
  fill = '#D9D9D9',
  isSelected = false,
  draggable = true,
  dragBoundFunc,
  onSelect,
  onDragEnd,
  onDragMove,
  nodeRef,
  stageSize, 
  setPosition, // <--- обязательно передаётся сверху для перемещения по стрелкам
}) => {
  const [shake, setShake] = useState(false);

  // Вычисляем границы внутреннего квадрата
  const innerRectX = (stageSize.width - stageSize.width / 1.5) / 2;
  const innerRectY = (stageSize.height - stageSize.height / 1.5) / 2;
  const innerRectWidth = stageSize.width / 1.5;
  const innerRectHeight = stageSize.height / 1.5;

  const moveStep = 20;                              // Ширина шага в пикселях

  const move = (direction) => {
    let newX = x;
    let newY = y;

    if (direction === "up") newY -= moveStep;
    if (direction === "down") newY += moveStep;
    if (direction === "left") newX -= moveStep;
    if (direction === "right") newX += moveStep;

    // Проверяем пересечение с внутренней областью
    const intersects = intersectsInnerArea(newX, newY, width, height);

    // Также ограничиваем границами stage
    newX = Math.max(0, Math.min(newX, stageSize.width - width));
    newY = Math.max(0, Math.min(newY, stageSize.height - height));

    if (intersects) return triggerShake();

    setPosition(id, newX, newY);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 150);
  };

  // Функция для проверки пересечения с внутренней областью (как в оригинале)
  const intersectsInnerArea = (posX, posY, patternWidth, patternHeight) => {
    const patternRight = posX + patternWidth;
    const patternBottom = posY + patternHeight;
    const innerRight = innerRectX + innerRectWidth;
    const innerBottom = innerRectY + innerRectHeight;

    return !(
      patternRight <= innerRectX || 
      posX >= innerRight || 
      patternBottom <= innerRectY || 
      posY >= innerBottom
    );
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
      draggable={false}
      scaleX={shake ? 1.05 : 1}
      scaleY={shake ? 1.05 : 1}
      /*dragBoundFunc={finalDragBoundFunc}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}*/
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

      {/* --- стрелки (добавлено для перемещения) --- */}
      <Text text="▲" x={width/2 - 6} y={-20} fontSize={18} cursor="pointer" onClick={() => move("up")} />
      <Text text="▼" x={width/2 - 6} y={height + 2} fontSize={18} cursor="pointer" onClick={() => move("down")} />
      <Text text="◀" x={-20} y={height/2 - 10} fontSize={18} cursor="pointer" onClick={() => move("left")} />
      <Text text="▶" x={width + 2} y={height/2 - 10} fontSize={18} cursor="pointer" onClick={() => move("right")} />
    </Group>
  );
};

export { DefaultExternalRectangle };