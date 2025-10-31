import React from 'react';
import { Group, Rect, Text } from 'react-konva';

const DefaultRectangle = ({
    id,
    x = 0,
    y = 0,
    width = 300,
    height = 150,
    text = 'Перемещай меня',
    fill = 'white',
    isSelected = false,
    onSelect,
    nodeRef, // для rectRefs.current.set(id, node)
}) => {
    return (
        // Внутренний Group — масштабируется Transformer'ом
        <Group
            x={x}
            y={y}
            onClick={onSelect}
            onTap={onSelect}
            id={id}
            ref={nodeRef}
            name="rect" // важно для handleStageClick
            draggable={isSelected} // можно перемещать только если выбран
        >
            <Rect
                width={width}
                height={height}
                fill={fill}
                cornerRadius={8}
            />
            <Text
                width={width}
                height={height}
                text={text}
                fontSize={30}
                fontStyle="bold"
                fill={isSelected ? 'red' : 'black'}
                align="center"
                verticalAlign="middle"
            />
        </Group>
    );
};

export { DefaultRectangle };