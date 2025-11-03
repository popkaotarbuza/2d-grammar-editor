import { Stage, Layer, Rect, Transformer,Shape,Line } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { DefaultInput } from './default-input.jsx';
import { DefaultExternalRectangle } from './default-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";
import './mainWindow.css';

// Главный компонент приложения, реализующий холст с прямоугольниками, которые можно выбирать, перемещать и трансформировать
const App = () => {
  // Состояние для размеров сцены (stage), инициализируется на основе размеров окна браузера с отступами
  const [stageSize, setStageSize] = useState({
      width: window.innerWidth - 740,                // какого-то хуя ширину экрана мы регулируем здесь
      height: window.innerHeight - 135,               // какого-то хуя высоту экрана мы регулируем здесь
    });

  // Состояние для списка блоков (прямоугольников), каждый блок имеет id и текст (по умолчанию без координат и размеров)
  const [blocks, setBlocks] = useState([]);

  // Состояние для ID выбранных блоков
  const [selectedIds, setSelectedIds] = useState([]);

  // Состояние для прямоугольника выделения (selection rectangle), используется для множественного выбора
  const [selectionRectangle, setSelectionRectangle] = useState({
      visible: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
  });

  // Ref для отслеживания состояния выделения (нажата ли мышь для выделения)
  const isSelecting = useRef(false);

  // Ref для трансформера (инструмент для трансформации выбранных элементов)
  const transformerRef = useRef();

  // Ref для хранения ссылок на узлы прямоугольников (Map для быстрого доступа по ID)
  const rectRefs = useRef(new Map());

  // Эффект для обновления трансформера при изменении выбранных ID
  useEffect(() => {
      if (selectedIds.length && transformerRef.current) {
          // Получаем узлы из Map refs
          const nodes = selectedIds
              .map((id) => rectRefs.current.get(id))
              .filter((node) => node);

          // Привязываем узлы к трансформеру
          transformerRef.current.nodes(nodes);
      } else if (transformerRef.current) {
          // Очищаем выбор, если ничего не выбрано
          transformerRef.current.nodes([]);
      }
  }, [selectedIds]);

  // Обработчик клика по сцене
  const handleStageClick = (e) => {
      // Если клик по пустой области - снимаем все выделения
      if (e.target === e.target.getStage()) {
          setSelectedIds([]);
          return;
      }

      // Ничего не делаем, если клик не по прямоугольнику
      if (!e.target.hasName("rect")) {
          return;
      }

      const clickedId = e.target.id();

      // Проверяем, нажаты ли shift/ctrl/meta для множественного выбора
      const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      const isSelected = selectedIds.includes(clickedId);

      if (!metaPressed && !isSelected) {
          // Если нет клавиш и не выбран - выбираем только этот
          setSelectedIds([clickedId]);
      } else if (metaPressed && isSelected) {
          // Если клавиши нажаты и выбран - снимаем выбор с него
          setSelectedIds(selectedIds.filter((selectedId) => selectedId !== clickedId));
      } else if (metaPressed && !isSelected) {
          // Если клавиши нажаты и не выбран - добавляем в выбор
          setSelectedIds([...selectedIds, clickedId]);
      }
  };

  // Обработчик нажатия мыши (mousedown) на сцене
  const handleMouseDown = (e) => {
      // Ничего не делаем, если нажатие не по пустой сцене
      if (e.target !== e.target.getStage()) {
          return;
      }

      // Начинаем выделение прямоугольником
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

  // Обработчик движения мыши (mousemove)
  const handleMouseMove = (e) => {
      // Ничего не делаем, если выделение не начато
      if (!isSelecting.current) {
          return;
      }

      // Обновляем координаты прямоугольника выделения
      const pos = e.target.getStage().getPointerPosition();
      setSelectionRectangle({
          ...selectionRectangle,
          x2: pos.x,
          y2: pos.y,
      });
  };

  // Обработчик отпускания мыши (mouseup)
  const handleMouseUp = () => {
      // Ничего не делаем, если выделение не начато
      if (!isSelecting.current) {
          return;
      }
      isSelecting.current = false;

      // Скрываем прямоугольник выделения с задержкой (для обработки клика)
      setTimeout(() => {
          setSelectionRectangle({
              ...selectionRectangle,
              visible: false,
          });
      });

      // Вычисляем bounding box выделения
      const selBox = {
          x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
          y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
          width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
          height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
      };

      // Фильтруем блоки, которые пересекаются с выделением
      const selected = blocks.filter((rect) => {
          // Проверяем пересечение с использованием Konva.Util
          return Konva.Util.haveIntersection(selBox, getClientRect(rect));
      });

      // Устанавливаем выбранные ID
      setSelectedIds(selected.map((rect) => rect.id));
  };

  // Функция для вычисления общего bounding box для списка боксов
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

  // Обработчик перетаскивания трансформера (drag move)
  const handleTransformerDrag = (e) => {
      const nodes = transformerRef.current?.nodes();
      if (!nodes || nodes.length === 0) return;

      // Получаем bounding boxes выбранных узлов
      const boxes = nodes.map(node => node.getClientRect());
      const totalBox = getTotalBox(boxes);

      const stage = transformerRef.current?.getStage();
      if (!stage) return;

      const { width: sw, height: sh } = stage.size();

      // Корректируем позиции, чтобы не выходить за границы сцены
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

  // Функция для ограничения bounding box трансформера (не дает выйти за границы сцены)
  const boundBoxFunc = (oldBox, newBox) => {
      const box = getClientRect(newBox);
      
      // Проверяем, выходит ли за границы
      // ебанем границу сцены для разграничения внутреннего и внешнего пространства
      const isOut =
          box.x < 0 ||
          box.y < 0 ||
          box.x + box.width > stageSize.width ||
          box.y + box.height > stageSize.height;
          
      if (isOut) {
          // Если выходит - возвращаем старый box
          return oldBox;
      }
      
      // Иначе - новый
      return newBox;
  };

  // Рендеринг компонента
  return (
      <div className="mainWindow">
        {/* Поле ввода для редактирования текста первого выбранного блока */}
          <DefaultInput
              value={blocks.find(b => b.id === selectedIds[0])?.text || ''}
              onChange={(e) => {
                  const id = selectedIds[0];
                  setBlocks(prev => prev.map(b => b.id === id ? { ...b, text: e.target.value } : b));
              }}
              placeholder="Введите текст"
          />
          {/* Кнопка для добавления нового блока (паттерна)*/} 
          <button
              onClick={() => {
                setBlocks(prev => [
                  ...prev,
                  {
                    id: (prev.length + 1).toString(),
                    text: 'Паттерн ' + (prev.length + 1).toString(),
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 70,
                  }
                ]);
              }}
            >
              Добавить паттерн
            </button>
          {/* Сцена Konva */}
          <Stage
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
              onClick={handleStageClick}
              style={{backgroundColor: 'white', left: "200px", border: '1px solid grey', borderRadius: '8px'}}
          >

              {/* Слой сетки*/}
              <Layer listening={false}>
                <Shape
                  sceneFunc={(context, shape) => {
                    const gridSize = 50;// сторона клетки (50 px)
                    context.beginPath();

                    context.strokeStyle = "grey";
                    // отрисовка вертикальных линий
                    for (let x = 0; x < stageSize.width; x += gridSize) {
                      context.moveTo(x, 0);
                      context.lineTo(x, stageSize.height);
                    }
                    // отрисовка горизонтальных линий
                    for (let y = 0; y < stageSize.height; y += gridSize) {
                      context.moveTo(0, y);
                      context.lineTo(stageSize.width, y);
                    }
                    // реальная отрисовка линий
                    context.stroke();
                    // завершаем отрисовку
                    context.closePath();
                  }}
                />
              </Layer>
                  {/* Новый слой для квадратной границы с отступами на 1/4 */}
                <Layer listening={false}>
                    {/* Квадратная рамка: отступ 1/4 от каждой стороны, но квадрат по мин. стороне */}
                    <Rect
                        x={(stageSize.width - stageSize.width / 1.5) / 2}
                        y={(stageSize.height - stageSize.height / 1.5) / 2}
                        width={stageSize.width / 1.5}
                        height={stageSize.height / 1.5}
                        stroke="black"
                        strokeWidth={2}
                        fillEnabled={false}
                    />
                </Layer>
              <Layer>
                  {/* Рендерим все прямоугольники */}
                  {blocks.map(block => (
                      <DefaultExternalRectangle
                            key={block.id}
                            id={block.id}
                            x={block.x ?? 0}
                            y={block.y ?? 0}
                            width={block.width ?? 300}
                            height={block.height ?? 150}
                            text={block.text}
                            isSelected={selectedIds.includes(block.id)}
                            onSelect={() => setSelectedIds([block.id])}
                            nodeRef={(node) => {
                              if (node) rectRefs.current.set(block.id, node);
                            }}
                            stageSize={stageSize} 
                          />
                  ))}
                  

                  {/* Единый трансформер для всех выбранных фигур */}
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

                  {/* Прямоугольник выделения, если видим */}
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



