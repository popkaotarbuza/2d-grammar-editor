import { Stage, Layer, Rect, Transformer, Group } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { DefaultInput } from './default-input.jsx';
import { DefaultRectangle } from './default-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";
import Konva from 'konva';  
import './mainWindow.css';

// Главный компонент приложения
const App = () => {
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth - 700,
    height: window.innerHeight - 100,
  });

  // Два отдельных списка для блоков
  const [outerBlocks, setOuterBlocks] = useState([]);
  const [innerBlocks, setInnerBlocks] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionRectangle, setSelectionRectangle] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  const isSelecting = useRef(false);
  const transformerRef = useRef();
  const rectRefs = useRef(new Map());

  // Параметры внутреннего "stage" (Group с clip)
  const innerContainer = {
    x: 100,  // Положение внутреннего
    y: 100,
    width: 400,
    height: 300,
  };

  // Эффект для трансформера
  useEffect(() => {
    if (selectedIds.length && transformerRef.current) {
      const nodes = selectedIds
        .map((id) => rectRefs.current.get(id))
        .filter((node) => node);
      transformerRef.current.nodes(nodes);
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds]);

  // Общий список блоков для удобства (outer + inner с префиксом для уникальности ID, если нужно)
  const allBlocks = [
    ...outerBlocks.map(b => ({ ...b, type: 'outer' })),
    ...innerBlocks.map(b => ({ ...b, type: 'inner', x: b.x + innerContainer.x, y: b.y + innerContainer.y }))  // Корректируем координаты для проверки
  ];

  // Handle stage click (адаптировано для обоих)
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      return;
    }
    if (!e.target.hasName("rect")) {
      return;
    }
    const clickedId = e.target.id();
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const isSelected = selectedIds.includes(clickedId);

    if (!metaPressed && !isSelected) {
      setSelectedIds([clickedId]);
    } else if (metaPressed && isSelected) {
      setSelectedIds(selectedIds.filter((id) => id !== clickedId));
    } else if (metaPressed && !isSelected) {
      setSelectedIds([...selectedIds, clickedId]);
    }
  };

  // Mouse down для selection
  const handleMouseDown = (e) => {
    if (e.target !== e.target.getStage()) {
      return;
    }
    isSelecting.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle({
      visible: true,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isSelecting.current) {
      return;
    }
    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle({
      ...selectionRectangle,
      x2: pos.x,
      y2: pos.y,
    });
  };

  const handleMouseUp = () => {
    if (!isSelecting.current) {
      return;
    }
    isSelecting.current = false;
    setTimeout(() => {
      setSelectionRectangle({ ...selectionRectangle, visible: false });
    });

    const selBox = {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };

    const selected = allBlocks.filter((rect) => {
      return Konva.Util.haveIntersection(selBox, getClientRect(rect));
    });

    setSelectedIds(selected.map((rect) => rect.id));
  };

  // Get total box (как было)
  const getTotalBox = (boxes) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    boxes.forEach(box => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  // Handle transformer drag (как было, но можно адаптировать если нужно)
  const handleTransformerDrag = (e) => {
    const nodes = transformerRef.current?.nodes();
    if (!nodes || nodes.length === 0) return;

    const boxes = nodes.map(node => node.getClientRect());
    const totalBox = getTotalBox(boxes);

    const stage = transformerRef.current?.getStage();
    if (!stage) return;

    const { width: sw, height: sh } = stage.size();

    nodes.forEach(node => {
      const absPos = node.getAbsolutePosition();
      let newX = absPos.x;
      let newY = absPos.y;

      if (totalBox.x < 0) {
        newX -= totalBox.x;
      }
      if (totalBox.y < 0) {
        newY -= totalBox.y;
      }
      if (totalBox.x + totalBox.width > sw) {
        newX -= (totalBox.x + totalBox.width - sw);
      }
      if (totalBox.y + totalBox.height > sh) {
        newY -= (totalBox.y + totalBox.height - sh);
      }

      node.setAbsolutePosition({ x: newX, y: newY });
    });
  };

  // Bound box for transformer (как было)
  const boundBoxFunc = (oldBox, newBox) => {
    const box = getClientRect(newBox);
    const isOut =
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > stageSize.width ||
      box.y + box.height > stageSize.height;
    if (isOut) {
      return oldBox;
    }
    return newBox;
  };

  // Drag bound func для ВНУТРЕННИХ блоков (не вылезти за inner)
  const innerDragBoundFunc = (pos) => {
    const newX = Math.max(0, Math.min(pos.x, innerContainer.width - 100));  // 100 - ширина блока, адаптируй под width
    const newY = Math.max(0, Math.min(pos.y, innerContainer.height - 50));   // 50 - height
    return { x: newX, y: newY };
  };

  // Drag bound func для ВНЕШНИХ блоков (не залезть в inner)
  const outerDragBoundFunc = (pos) => {
    const blockRect = { x: pos.x, y: pos.y, width: 100, height: 50 };  // Адаптируй под реальные размеры
    if (Konva.Util.haveIntersection(blockRect, innerContainer)) {
      // Если пересекает inner - верни старые координаты (или скорректируй)
      return { x: this.x(), y: this.y() };  // this - контекст Konva node
    }
    // Иначе ограничиваем по stage
    const newX = Math.max(0, Math.min(pos.x, stageSize.width - 100));
    const newY = Math.max(0, Math.min(pos.y, stageSize.height - 50));
    return { x: newX, y: newY };
  };

  return (
    <div className="mainWindow">
      <DefaultInput
        value={allBlocks.find(b => b.id === selectedIds[0])?.text || ''}
        onChange={(e) => {
          const id = selectedIds[0];
          // Обновляем в зависимости от типа
          if (outerBlocks.some(b => b.id === id)) {
            setOuterBlocks(prev => prev.map(b => b.id === id ? { ...b, text: e.target.value } : b));
          } else {
            setInnerBlocks(prev => prev.map(b => b.id === id ? { ...b, text: e.target.value } : b));
          }
        }}
        placeholder="Введите текст"
      />

      {/* Кнопки для добавления в outer или inner */}
      <button onClick={() => {
        const newId = (outerBlocks.length + innerBlocks.length + 1).toString();
        setOuterBlocks(prev => [
          ...prev,
          {
            id: newId,
            text: 'Паттерн outer ' + newId,
            x: 20,  // Дефолт позиция вне inner
            y: 20,
            width: 100,
            height: 50,
          }
        ]);
      }}>
        Добавить во внешний
      </button>

      <button onClick={() => {
        const newId = (outerBlocks.length + innerBlocks.length + 1).toString();
        setInnerBlocks(prev => [
          ...prev,
          {
            id: newId,
            text: 'Паттерн inner ' + newId,
            x: 20,  // Относительно inner Group
            y: 20,
            width: 100,
            height: 50,
          }
        ]);
      }}>
        Добавить во внутренний
      </button>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleStageClick}
        style={{ backgroundColor: '#777575ff', left: "200px" }}
      >
        <Layer>
          {/* Внешние блоки */}
          {outerBlocks.map(block => (
            <DefaultRectangle
              key={block.id}
              id={block.id}
              x={block.x}
              y={block.y}
              width={block.width}
              height={block.height}
              text={block.text}
              isSelected={selectedIds.includes(block.id)}
              onSelect={() => setSelectedIds([block.id])}
              nodeRef={(node) => { if (node) rectRefs.current.set(block.id, node); }}
              dragBoundFunc={outerDragBoundFunc}  // Ограничение для outer
            />
          ))}

          {/* Внутренний контейнер (Group с clip) */}
          <Group
            x={innerContainer.x}
            y={innerContainer.y}
            clipX={0}
            clipY={0}
            clipWidth={innerContainer.width}
            clipHeight={innerContainer.height}
          >
            {/* Видимая граница внутреннего */}
            <Rect
              x={0}
              y={0}
              width={innerContainer.width}
              height={innerContainer.height}
              fill="#cccccc"  // Или stroke для рамки
              stroke="black"
              strokeWidth={2}
            />

            {/* Внутренние блоки (координаты относительны Group) */}
            {innerBlocks.map(block => (
              <DefaultRectangle
                key={block.id}
                id={block.id}
                x={block.x}
                y={block.y}
                width={block.width}
                height={block.height}
                text={block.text}
                isSelected={selectedIds.includes(block.id)}
                onSelect={() => setSelectedIds([block.id])}
                nodeRef={(node) => { if (node) rectRefs.current.set(block.id, node); }}
                dragBoundFunc={innerDragBoundFunc}  // Ограничение для inner
              />
            ))}
          </Group>

          <Transformer
            ref={transformerRef}
            onDragMove={handleTransformerDrag}
            rotateEnabled={true}
            borderStroke="#ff0000ff"
            borderStrokeWidth={3}
            anchorFill="#fff"
            anchorStroke="#ff0000ff"
            anchorStrokeWidth={2}
            anchorSize={20}
            anchorCornerRadius={50}
            ignoreStroke={true}
            boundBoxFunc={boundBoxFunc}
          />

          {selectionRectangle.visible && (
            <Rect
              x={Math.min(selectionRectangle.x1, selectionRectangle.x2)}
              y={Math.min(selectionRectangle.y1, selectionRectangle.y2)}
              width={Math.abs(selectionRectangle.x2 - selectionRectangle.x1)}
              height={Math.abs(selectionRectangle.y2 - selectionRectangle.y1)}
              fill="rgba(0,0,255,0.5)"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export { App };