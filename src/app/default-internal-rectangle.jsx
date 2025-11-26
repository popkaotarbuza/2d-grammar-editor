import React, { useState } from "react";
import { Group, Rect, Text } from "react-konva";

const DefaultInternalRectangle = ({
  id,
  x,
  y,
  width,
  height,
  text,
  fill,
  isSelected,
  stageSize,
  setPosition, 
}) => {
  const [shake, setShake] = useState(false);

  const innerRectX = (stageSize.width - stageSize.width / 1.5) / 2;
  const innerRectY = (stageSize.height - stageSize.height / 1.5) / 2;
  const innerRectWidth = stageSize.width / 1.5;
  const innerRectHeight = stageSize.height / 1.5;

  const moveStep = 20;                                                  // Ширина шага в пикселях

  const move = (direction) => {
    let newX = x;
    let newY = y;

    if (direction === "up") newY -= moveStep;
    if (direction === "down") newY += moveStep;
    if (direction === "left") newX -= moveStep;
    if (direction === "right") newX += moveStep;

    const limit =
      newX < innerRectX ||
      newY < innerRectY ||
      newX + width > innerRectX + innerRectWidth ||
      newY + height > innerRectY + innerRectHeight;

    // Прижимаем к границам вместо жесткого лимита
    newX = Math.max(innerRectX, Math.min(newX, innerRectX + innerRectWidth - width));
    newY = Math.max(innerRectY, Math.min(newY, innerRectY + innerRectHeight - height));

    // Если позиция не изменилась (уже уперлись), то shake
    if (newX === x && newY === y) {
      return triggerShake();
    }

    setPosition(id, newX, newY);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 150);
  };

  return (
    <Group x={x} y={y} draggable={false} scaleX={shake ? 1.05 : 1} scaleY={shake ? 1.05 : 1}>
      <Rect
        width={width}
        height={height}
        fill={fill}
        cornerRadius={8}
        stroke={isSelected ? "#D72B00" : "#949494"}
        strokeWidth={isSelected ? 2 : 1}
      />

      <Text
        text={text}
        x={10}
        y={10}
        width={width - 20}
        height={height - 20}
        align="center"
        verticalAlign="middle"
        fontSize={12}
        fill="#333"
      />

      {/* --- стрелки --- */}
      <Text text="▲" x={width/2 - 6} y={-20} fontSize={18} cursor="pointer" onClick={() => move("up")} />
      <Text text="▼" x={width/2 - 6} y={height + 2} fontSize={18} cursor="pointer" onClick={() => move("down")} />
      <Text text="◀" x={-20} y={height/2 - 10} fontSize={18} cursor="pointer" onClick={() => move("left")} />
      <Text text="▶" x={width + 2} y={height/2 - 10} fontSize={18} cursor="pointer" onClick={() => move("right")} />
    </Group>
  );
};

export { DefaultInternalRectangle };
