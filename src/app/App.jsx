import { Stage, Layer, Rect, Transformer, Shape, Line } from "react-konva";
import Konva from "konva";
import { useState, useEffect, useRef } from "react";
import { DefaultInput } from './default-input.jsx';
import { DefaultExternalRectangle } from './default-rectangle.jsx';
import { DefaultInternalRectangle } from './default-internal-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";
import { Header } from './Header.jsx';
import { LeftSidebar } from './LeftSidebar.jsx';
import { RightSidebar } from './RightSidebar.jsx';
import './mainWindow.css';

// Главный компонент приложения, реализующий холст с прямоугольниками, которые можно выбирать, перемещать и трансформировать
const App = () => {
  const calculateStageSize = () => {
    const leftSidebarWidth = 250;
    const rightSidebarWidth = 300;
    const centralPadding = 40; // padding центральной области (20px с каждой стороны)
    const headerHeight = 80;
    const verticalPadding = 80; // padding сверху и снизу центральной области
    
    const availableWidth = window.innerWidth - leftSidebarWidth - rightSidebarWidth - centralPadding;
    const availableHeight = window.innerHeight - headerHeight - verticalPadding;
    
    return {
      width: Math.max(400, Math.floor(availableWidth)),
      height: Math.max(400, Math.floor(availableHeight)),
    };
  };

  const [stageSize, setStageSize] = useState(calculateStageSize());

  const [fileName, setFileName] = useState('');

  const [patterns, setPatterns] = useState({});
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);

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

  // Update stage size on window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize(calculateStageSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          setSelectedPatternId(null);
          setSelectedComponentId(null);
          setSelectedPattern(null);
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
          
          // Синхронизируем выбор паттерна в LeftSidebar
          if (patterns[clickedId]) {
            handleSelectPattern(clickedId, null);
          }
      } else if (metaPressed && isSelected) {
          // Если клавиши нажаты и выбран - снимаем выбор с него
          setSelectedIds(selectedIds.filter((selectedId) => selectedId !== clickedId));
          if (selectedIds.length === 1 && selectedIds[0] === clickedId) {
            setSelectedPatternId(null);
            setSelectedComponentId(null);
            setSelectedPattern(null);
          }
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

  // File operations handlers
  const handleOpen = (content, name) => {
    if (content.patterns) {
      setPatterns(content.patterns);
    } else if (content.blocks) {
      setBlocks(content.blocks);
    }
    if (name) {
      setFileName(name.replace(/\.(json|yaml)$/, ''));
    }
  };

  const handleSave = () => {
    const data = {
      patterns: patterns,
      blocks: blocks,
      fileName: fileName || 'untitled',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAs = () => {
    const name = prompt('Введите название файла:', fileName || 'untitled');
    if (name) {
      setFileName(name);
      const data = {
        patterns: patterns,
        blocks: blocks,
        fileName: name,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExport = () => {
    const data = {
      patterns: patterns,
      blocks: blocks,
      fileName: fileName || 'untitled',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pattern handlers
  const handleSelectPattern = (patternId, componentId) => {
    setSelectedPatternId(patternId);
    setSelectedComponentId(componentId);
    const pattern = patterns[patternId];
    if (pattern) {
      setSelectedPattern({
        ...pattern,
        id: patternId,
        name: pattern.name || patternId,
        selectedComponentId: componentId,
      });
    }
  };

  const handleUpdatePattern = (updatedPattern) => {
    setSelectedPattern(updatedPattern);
  };

  const handleSavePattern = (patternData) => {
    if (patternData.id) {
      setPatterns(prev => ({
        ...prev,
        [patternData.id]: {
          ...prev[patternData.id],
          name: patternData.name || prev[patternData.id].name,
          description: patternData.description || prev[patternData.id].description,
          kind: patternData.kind || prev[patternData.id].kind,
          components: patternData.components || prev[patternData.id].components || {},
        }
      }));
      setSelectedPattern(patternData);
    }
  };

  const handleCancelPattern = () => {
    if (selectedPatternId) {
      const pattern = patterns[selectedPatternId];
      if (pattern) {
        setSelectedPattern({
          ...pattern,
          id: selectedPatternId,
          name: pattern.name || selectedPatternId,
        });
      }
    }
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

      const innerRect = getInnerRectBounds();
      const stage = transformerRef.current?.getStage();
      if (!stage) return;

      const { width: sw, height: sh } = stage.size();

      // Корректируем позиции для каждого узла с учетом типа паттерна
      nodes.forEach(node => {
          const nodeId = node.id();
          const block = blocks.find(b => b.id === nodeId);
          if (!block) return;

          const absPos = node.getAbsolutePosition();
          let newX = absPos.x;
          let newY = absPos.y;
          const nodeWidth = node.width();
          const nodeHeight = node.height();

          // Ограничения для внутренних паттернов
          if (block.type === 'internal') {
            const innerRight = innerRect.x + innerRect.width;
            const innerBottom = innerRect.y + innerRect.height;
            
            newX = Math.max(innerRect.x, Math.min(newX, innerRight - nodeWidth));
            newY = Math.max(innerRect.y, Math.min(newY, innerBottom - nodeHeight));
          } 
          // Ограничения для внешних паттернов
          else if (block.type === 'external') {
            // Проверяем границы сцены
            newX = Math.max(0, Math.min(newX, sw - nodeWidth));
            newY = Math.max(0, Math.min(newY, sh - nodeHeight));

            // Проверяем, не попадает ли во внутреннюю область
            const innerRight = innerRect.x + innerRect.width;
            const innerBottom = innerRect.y + innerRect.height;

            if (intersectsInnerArea({ x: newX, y: newY, width: nodeWidth, height: nodeHeight })) {
              // Сдвигаем наружу от внутренней области
              const distToLeft = newX + nodeWidth - innerRect.x;
              const distToRight = innerRight - newX;
              const distToTop = newY + nodeHeight - innerRect.y;
              const distToBottom = innerBottom - newY;

              const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

              if (minDist === distToLeft) {
                newX = innerRect.x - nodeWidth;
              } else if (minDist === distToRight) {
                newX = innerRight;
              } else if (minDist === distToTop) {
                newY = innerRect.y - nodeHeight;
              } else {
                newY = innerBottom;
              }

              // Проверяем границы сцены после сдвига
              newX = Math.max(0, Math.min(newX, sw - nodeWidth));
              newY = Math.max(0, Math.min(newY, sh - nodeHeight));
            }
          }

          node.setAbsolutePosition({ x: newX, y: newY });

          // Обновляем позицию блока в состоянии
          setBlocks(prev => prev.map(b => 
            b.id === nodeId ? { ...b, x: newX, y: newY } : b
          ));
      });
  };

  // Обработчик завершения трансформации
  const handleTransformEnd = () => {
    const nodes = transformerRef.current?.nodes();
    if (!nodes || nodes.length === 0) return;

    nodes.forEach(node => {
      const nodeId = node.id();
      const width = node.width();
      const height = node.height();
      const x = node.x();
      const y = node.y();

      setBlocks(prev => prev.map(b => 
        b.id === nodeId ? { ...b, x, y, width, height } : b
      ));
    });
  };

  // Вычисляем границы внутреннего квадрата
  const getInnerRectBounds = () => {
    return {
      x: (stageSize.width - stageSize.width / 1.5) / 2,
      y: (stageSize.height - stageSize.height / 1.5) / 2,
      width: stageSize.width / 1.5,
      height: stageSize.height / 1.5,
    };
  };

  // Функция для проверки пересечения с внутренней областью
  const intersectsInnerArea = (box) => {
    const innerRect = getInnerRectBounds();
    const boxRight = box.x + box.width;
    const boxBottom = box.y + box.height;
    const innerRight = innerRect.x + innerRect.width;
    const innerBottom = innerRect.y + innerRect.height;

    return !(
      boxRight <= innerRect.x ||
      box.x >= innerRight ||
      boxBottom <= innerRect.y ||
      box.y >= innerBottom
    );
  };

  // Функция для ограничения bounding box трансформера
  const boundBoxFunc = (oldBox, newBox) => {
    const box = getClientRect(newBox);
    const innerRect = getInnerRectBounds();
    
    // Проверяем границы сцены
    const isOutOfStage =
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > stageSize.width ||
      box.y + box.height > stageSize.height;

    if (isOutOfStage) {
      return oldBox;
    }

    // Проверяем тип паттерна для выбранных блоков
    if (selectedIds.length > 0) {
      const selectedBlock = blocks.find(b => b.id === selectedIds[0]);
      if (selectedBlock) {
        if (selectedBlock.type === 'internal') {
          // Внутренний паттерн - должен оставаться внутри квадрата
          const innerRight = innerRect.x + innerRect.width;
          const innerBottom = innerRect.y + innerRect.height;
          
          if (
            box.x < innerRect.x ||
            box.y < innerRect.y ||
            box.x + box.width > innerRight ||
            box.y + box.height > innerBottom
          ) {
            return oldBox;
          }
        } else if (selectedBlock.type === 'external') {
          // Внешний паттерн - не должен попадать во внутреннюю область
          if (intersectsInnerArea(box)) {
            return oldBox;
          }
        }
      }
    }
    
    return newBox;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', backgroundColor: '#ffffff' }}>
      <Header
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
        fileName={fileName}
        onFileNameChange={setFileName}
      />
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', backgroundColor: '#ffffff', minWidth: 0 }}>
        <LeftSidebar
          patterns={patterns}
          selectedPatternId={selectedPatternId}
          selectedComponentId={selectedComponentId}
          onSelectPattern={handleSelectPattern}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px', overflow: 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={() => {
                const innerRect = getInnerRectBounds();
                const timestamp = Date.now();
                const patternId = `pattern_${timestamp}`;
                const patternNumber = Object.keys(patterns).length + 1;
                
                // Создаем паттерн в patterns
                setPatterns(prev => ({
                  ...prev,
                  [patternId]: {
                    name: `Паттерн ${patternNumber}`,
                    description: '',
                    kind: 'external',
                    components: {},
                  }
                }));

                // Создаем блок на холсте
                setBlocks(prev => [
                  ...prev,
                  {
                    id: patternId,
                    text: `Внешний паттерн ${prev.filter(b => b.type === 'external').length + 1}`,
                    type: 'external',
                    x: Math.max(0, innerRect.x - 120),
                    y: 50,
                    width: 100,
                    height: 70,
                  }
                ]);
              }}
              style={{
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Добавить внешний паттерн
            </button>
            <button
              onClick={() => {
                const innerRect = getInnerRectBounds();
                const timestamp = Date.now();
                const patternId = `pattern_${timestamp}`;
                const patternNumber = Object.keys(patterns).length + 1;
                
                // Создаем паттерн в patterns
                setPatterns(prev => ({
                  ...prev,
                  [patternId]: {
                    name: `Паттерн ${patternNumber}`,
                    description: '',
                    kind: 'internal',
                    components: {},
                  }
                }));

                // Создаем блок на холсте
                setBlocks(prev => [
                  ...prev,
                  {
                    id: patternId,
                    text: `Внутренний паттерн ${prev.filter(b => b.type === 'internal').length + 1}`,
                    type: 'internal',
                    x: innerRect.x + 20,
                    y: innerRect.y + 20,
                    width: 100,
                    height: 70,
                  }
                ]);
              }}
              style={{
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Добавить внутренний паттерн
            </button>
          </div>

          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onClick={handleStageClick}
            style={{
              backgroundColor: '#ffffff', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            {/* Слой сетки */}
            <Layer listening={false}>
              <Shape
                sceneFunc={(context, shape) => {
                  const gridSize = 50; // сторона клетки (50 px)
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
              {blocks.map(block => {
                const handleDragEnd = (e) => {
                  const node = e.target;
                  setBlocks(prev => prev.map(b => 
                    b.id === block.id ? { ...b, x: node.x(), y: node.y() } : b
                  ));
                };

                const handleBlockSelect = () => {
                  setSelectedIds([block.id]);
                  // Синхронизируем выбор паттерна в LeftSidebar
                  if (patterns[block.id]) {
                    handleSelectPattern(block.id, null);
                  }
                };

                const commonProps = {
                  key: block.id,
                  id: block.id,
                  x: block.x ?? 0,
                  y: block.y ?? 0,
                  width: block.width ?? 100,
                  height: block.height ?? 70,
                  text: block.text || (block.type === 'internal' ? 'Внутренний паттерн' : 'Внешний паттерн'),
                  isSelected: selectedIds.includes(block.id),
                  onSelect: handleBlockSelect,
                  onDragEnd: handleDragEnd,
                  nodeRef: (node) => {
                    if (node) rectRefs.current.set(block.id, node);
                  },
                  stageSize: stageSize,
                };

                if (block.type === 'internal') {
                  return <DefaultInternalRectangle {...commonProps} />;
                } else {
                  return <DefaultExternalRectangle {...commonProps} />;
                }
              })}

              {/* Единый трансформер для всех выбранных фигур */}
              <Transformer
                ref={transformerRef}
                onDragMove={handleTransformerDrag}
                onTransformEnd={handleTransformEnd}
                rotateEnabled={true}
                borderStroke="#D72B00"
                borderStrokeWidth={3}
                anchorFill="#fff"
                anchorStroke="#D72B00"
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
        <RightSidebar
          selectedPattern={selectedPattern}
          onUpdatePattern={handleUpdatePattern}
          onSavePattern={handleSavePattern}
          onCancelPattern={handleCancelPattern}
        />
      </div>
    </div>
  );
};

export { App };



