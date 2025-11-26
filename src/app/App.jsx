/**
 * Главный компонент приложения 2D Grammar Editor
 * 
 * Реализует:
 * - Холст с сеткой для размещения паттернов
 * - Управление паттернами (внутренние и внешние)
 * - Выбор и перемещение паттернов
 * - Работу с файлами (открытие, сохранение, экспорт)
 * - Редактирование паттернов через sidebar
 */

import { Stage, Layer, Rect, Shape } from "react-konva";
import Konva from "konva";
import { useState, useEffect, useRef } from "react";
import { DefaultExternalRectangle } from './default-rectangle.jsx';
import { DefaultInternalRectangle } from './default-internal-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";
import { Header } from './Header.jsx';
import { LeftSidebar } from './LeftSidebar.jsx';
import { RightSidebar } from './RightSidebar.jsx';
import { SIZES, COLORS, DEFAULT_PATTERN } from './constants.js';
import { containerStyles } from './styles.js';
import { getInnerRectBounds, intersectsInnerArea, constrainToStage, calculateChildPosition, checkCollision, getFixedSides } from './utils.js';
import './mainWindow.css';

const App = () => {
  // ==================== Вычисление размеров ====================
  
  /**
   * Вычисляет размеры Stage с учетом размеров sidebar и отступов
   * @returns {Object} {width, height} - размеры Stage
   */
  const calculateStageSize = () => {
    const availableWidth = window.innerWidth 
      - SIZES.SIDEBAR_LEFT_WIDTH 
      - SIZES.SIDEBAR_RIGHT_WIDTH 
      - (SIZES.SIDEBAR_MARGIN * 2) 
      - (SIZES.SIDEBAR_GAP * 2) 
      - SIZES.CENTRAL_PADDING;
    const availableHeight = window.innerHeight 
      - SIZES.HEADER_HEIGHT 
      - SIZES.VERTICAL_PADDING;
    
    return {
      width: Math.max(SIZES.MIN_STAGE_WIDTH, Math.floor(availableWidth)),
      height: Math.max(SIZES.MIN_STAGE_HEIGHT, Math.floor(availableHeight)),
    };
  };

  // ==================== Состояние ====================
  
  const [stageSize, setStageSize] = useState(calculateStageSize());
  const [fileName, setFileName] = useState('');
  const [patterns, setPatterns] = useState({});
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [blocks, setBlocks] = useState([]); // Блоки паттернов на холсте
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Состояние для прямоугольника выделения (множественный выбор)
  const [selectionRectangle, setSelectionRectangle] = useState({
    visible: false,
    x1: 0, y1: 0, x2: 0, y2: 0,
  });

  // Состояние для позиций дочерних паттернов (для физики и перетаскивания)
  const [childPatternPositions, setChildPatternPositions] = useState({});

  // Refs
  const isSelecting = useRef(false); // Флаг начала выделения
  const rectRefs = useRef(new Map()); // Map для быстрого доступа к узлам по ID

  // ==================== Эффекты ====================
  
  /**
   * Обновляет размер Stage при изменении размера окна
   */
  useEffect(() => {
    const handleResize = () => {
      setStageSize(calculateStageSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Сбрасывает позиции дочерних паттернов при смене выбранного паттерна
   */
  useEffect(() => {
    setChildPatternPositions({});
  }, [selectedPatternId]);

  // ==================== Обработчики событий Stage ====================
  
  /**
   * Обработчик клика по Stage
   * - Клик по пустой области снимает выделение
   * - Клик по паттерну выделяет его
   * - Поддержка множественного выбора (Shift/Ctrl/Cmd)
   */
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      setSelectedPatternId(null);
      setSelectedComponentId(null);
      setSelectedPattern(null);
      return;
    }

    if (!e.target.hasName("rect")) return;

    const clickedId = e.target.id();
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const isSelected = selectedIds.includes(clickedId);

    if (!metaPressed && !isSelected) {
      setSelectedIds([clickedId]);
      if (patterns[clickedId]) {
        handleSelectPattern(clickedId, null);
      }
    } else if (metaPressed && isSelected) {
      setSelectedIds(selectedIds.filter((id) => id !== clickedId));
      if (selectedIds.length === 1 && selectedIds[0] === clickedId) {
        setSelectedPatternId(null);
        setSelectedComponentId(null);
        setSelectedPattern(null);
      }
    } else if (metaPressed && !isSelected) {
      setSelectedIds([...selectedIds, clickedId]);
    }
  };

  /**
   * Обработчик начала выделения прямоугольником
   */
  const handleMouseDown = (e) => {
    if (e.target !== e.target.getStage()) return;

    isSelecting.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle({
      visible: true,
      x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y,
    });
  };

  /**
   * Обработчик движения мыши при выделении
   */
  const handleMouseMove = (e) => {
    if (!isSelecting.current) return;

    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle(prev => ({
      ...prev,
      x2: pos.x,
      y2: pos.y,
    }));
  };

  /**
   * Обработчик завершения выделения
   * Выбирает все паттерны, которые пересекаются с выделенной областью
   */
  const handleMouseUp = () => {
    if (!isSelecting.current) return;
    
    isSelecting.current = false;

    setTimeout(() => {
      setSelectionRectangle(prev => ({ ...prev, visible: false }));
    });

    const selBox = {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };

    const selected = blocks.filter((rect) => {
      return Konva.Util.haveIntersection(selBox, getClientRect(rect));
    });

    setSelectedIds(selected.map((rect) => rect.id));
  };

  // ==================== Обработчики файлов ====================
  
  /**
   * Обработчик открытия файла
   * Поддерживает JSON и YAML форматы
   */
  const handleOpen = (content, name) => {
    if (content.patterns) {
      setPatterns(content.patterns);
    }
    if (content.blocks) {
      setBlocks(content.blocks);
    }
    if (name) {
      setFileName(name.replace(/\.(json|yaml)$/, ''));
    }
  };

  /**
   * Обработчик сохранения файла
   */
  const handleSave = () => {
    const data = {
      patterns: patterns,
      blocks: blocks,
      fileName: fileName || 'untitled',
    };
    downloadJSON(data, `${fileName || 'untitled'}.json`);
  };

  /**
   * Обработчик сохранения как
   */
  const handleSaveAs = () => {
    const name = prompt('Введите название файла:', fileName || 'untitled');
    if (name) {
      setFileName(name);
      const data = {
        patterns: patterns,
        blocks: blocks,
        fileName: name,
      };
      downloadJSON(data, `${name}.json`);
    }
  };

  /**
   * Обработчик экспорта
   */
  const handleExport = () => {
    const data = {
      patterns: patterns,
      blocks: blocks,
      fileName: fileName || 'untitled',
    };
    downloadJSON(data, `${fileName || 'export'}.json`);
  };

  /**
   * Утилита для скачивания JSON файла
   */
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==================== Обработчики паттернов ====================
  
  /**
   * Обработчик выбора паттерна
   * Обновляет состояние выбранного паттерна для отображения в sidebar
   */
  const handleSelectPattern = (patternId, componentId) => {
    setSelectedPatternId(patternId);
    setSelectedComponentId(componentId);
    const pattern = patterns[patternId];
    if (pattern) {
      setSelectedPattern({
        ...pattern,
        id: patternId,
      });
    }
  };

  /**
   * Обработчик обновления паттерна (промежуточное состояние)
   */
  const handleUpdatePattern = (updatedPattern) => {
    setSelectedPattern(updatedPattern);
  };

  /**
   * Обработчик сохранения паттерна
   * Сохраняет изменения паттерна и обрабатывает переименование
   */
  const handleSavePattern = (patternData) => {
    if (patternData.oldId && patternData.pattern) {
      const newPatternId = patternData.newId || patternData.oldId;
      
      setPatterns(prev => {
        const newPatterns = { ...prev };
        
        // Если название изменилось, удаляем старый паттерн и создаем новый
        if (patternData.newId && patternData.newId !== patternData.oldId) {
          delete newPatterns[patternData.oldId];
          newPatterns[newPatternId] = patternData.pattern;
          if (selectedPatternId === patternData.oldId) {
            setSelectedPatternId(newPatternId);
          }
        } else {
          newPatterns[patternData.oldId] = patternData.pattern;
        }
        
        return newPatterns;
      });
      
      setSelectedPattern({
        ...patternData.pattern,
        id: newPatternId,
      });
      
      if (patternData.newId && patternData.newId !== patternData.oldId) {
        setSelectedPatternId(newPatternId);
      }
    }
  };

  /**
   * Обработчик отмены изменений паттерна
   * Восстанавливает исходное состояние паттерна
   */
  const handleCancelPattern = () => {
    if (selectedPatternId) {
      const pattern = patterns[selectedPatternId];
      if (pattern) {
        setSelectedPattern({
          ...pattern,
          id: selectedPatternId,
        });
      }
    }
  };

  // ==================== Создание паттернов ====================
  
  /**
   * Генерирует уникальное короткое имя паттерна (pattern_1, pattern_2, ...)
   * @param {Object} patternsObj - Объект с паттернами (по умолчанию текущее состояние)
   * @returns {string} Уникальное имя паттерна
   */
  const generatePatternId = (patternsObj = patterns) => {
    const existingIds = Object.keys(patternsObj);
    const patternNumbers = existingIds
      .map(id => {
        const match = id.match(/^pattern_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    const nextNumber = patternNumbers.length > 0 
      ? Math.max(...patternNumbers) + 1 
      : 1;
    
    return `pattern_${nextNumber}`;
  };
  
  /**
   * Создает новый внешний паттерн
   * Добавляет паттерн в список patterns и создает блок на холсте
   */
  const createExternalPattern = () => {
    // границы внутреннего прямоугольника
    const innerRect = getInnerRectBounds(stageSize);
    let patternId;
    let patternNumber;
    
    setPatterns(prev => {
      patternId = generatePatternId(prev);
      patternNumber = Object.keys(prev).length + 1;
      return {
        ...prev,
        [patternId]: {
          name: `Паттерн ${patternNumber}`,
          description: '',
          kind: 'external',
          components: {},
          inner: {},
          outer: {},
        }
      };
    });

    const { width, height, xOffset, yOffset } = DEFAULT_PATTERN.EXTERNAL;
    const { x, y } = constrainToStage(
      innerRect.x + xOffset,
      yOffset,
      width,
      height,
      stageSize.width,
      stageSize.height
    );
    // добавляем блок на холст
    setBlocks(prev => [
      ...prev,
      {
        id: patternId,
        text: '',
        type: 'external',
        x, y, width, height,
      }
    ]);
  };

  /**
   * Создает новый внутренний паттерн
   * Добавляет паттерн в список patterns и создает блок внутри внутренней области
   */
  const createInternalPattern = () => {
    const innerRect = getInnerRectBounds(stageSize);
    let patternId;
    let patternNumber;
    
    setPatterns(prev => {
      patternId = generatePatternId(prev);
      patternNumber = Object.keys(prev).length + 1;
      return {
        ...prev,
        [patternId]: {
          name: `Паттерн ${patternNumber}`,
          description: '',
          kind: 'internal',
          components: {},
          inner: {},
          outer: {},
        }
      };
    });

    const { width, height, xOffset, yOffset } = DEFAULT_PATTERN.INTERNAL;
    
    setBlocks(prev => [
      ...prev,
      {
        id: patternId,
        text: '',
        type: 'internal',
        x: innerRect.x + xOffset,
        y: innerRect.y + yOffset,
        width, height,
      }
    ]);
  };

  /**
   * Создает новый пустой паттерн
   * Добавляет паттерн в список patterns, но НЕ создает блок на холсте
   */
  const createEmptyPattern = () => {
    setPatterns(prev => {
      const patternId = generatePatternId(prev);
      const patternNumber = Object.keys(prev).length + 1;
      return {
        ...prev,
        [patternId]: {
          name: `Паттерн ${patternNumber}`,
          description: '',
          kind: 'external',
          components: {},
          inner: {},
          outer: {},
        }
      };
    });
  };

  // ==================== Рендер сетки ====================
  
  /**
   * Рендерит сетку на холсте
   * Использует Konva Shape для оптимизированной отрисовки
   */
  const renderGrid = () => (
    <Layer listening={false}>
      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.strokeStyle = COLORS.GRID;
          context.lineWidth = 1;
          
          // Вертикальные линии
          for (let x = 0; x < stageSize.width; x += SIZES.GRID_SIZE) {
            context.moveTo(x, 0);
            context.lineTo(x, stageSize.height);
          }
          
          // Горизонтальные линии
          for (let y = 0; y < stageSize.height; y += SIZES.GRID_SIZE) {
            context.moveTo(0, y);
            context.lineTo(stageSize.width, y);
          }
          
          context.stroke();
          context.closePath();
        }}
      />
    </Layer>
  );

  // ==================== Рендер внутренней области ====================
  
  /**
   * Рендерит черную границу внутренней области для внутренних паттернов
   */
  const renderInnerRect = () => {
    const innerRect = getInnerRectBounds(stageSize);
    return (
      <Layer listening={false}>
        <Rect
          x={innerRect.x}
          y={innerRect.y}
          width={innerRect.width}
          height={innerRect.height}
          stroke={COLORS.INNER_BORDER}
          strokeWidth={2}
          fillEnabled={false}
          cornerRadius={SIZES.BORDER_RADIUS}
        />
      </Layer>
    );
  };

  // ==================== Рендер паттернов ====================
  
  /**
   * Рендерит дочерние паттерны (inner и outer) выбранного паттерна
   */
  const renderChildPatterns = () => {
    if (!selectedPatternId || !selectedPattern) return null;

    const parentPattern = selectedPattern;
    const innerPatterns = parentPattern.inner || {};
    const outerPatterns = parentPattern.outer || {};

    // Используем границы внутреннего прямоугольника как родительские границы
    const innerRect = getInnerRectBounds(stageSize);
    const parentBounds = {
      x: innerRect.x,
      y: innerRect.y,
      width: innerRect.width,
      height: innerRect.height
    };

    // Сначала собираем информацию о всех паттернах
    const patternInfos = [];

    // Собираем внутренние паттерны
    Object.entries(innerPatterns).forEach(([componentName, componentData]) => {
      if (!componentData || !componentData.pattern) return;

      const childPatternId = componentData.pattern;
      const childPattern = patterns[childPatternId];
      if (!childPattern) return;

      const childSize = {
        width: DEFAULT_PATTERN.INTERNAL.width,
        height: DEFAULT_PATTERN.INTERNAL.height,
      };

      const positionAndSize = calculateChildPosition(
        componentData.location,
        parentBounds,
        childSize,
        true // isInner
      );

      const savedPosition = childPatternPositions[componentName];
      const finalX = savedPosition?.x ?? positionAndSize.x;
      const finalY = savedPosition?.y ?? positionAndSize.y;

      const fixedSides = getFixedSides(componentData.location);

      patternInfos.push({
        componentName,
        type: 'internal',
        x: finalX,
        y: finalY,
        width: positionAndSize.width,
        height: positionAndSize.height,
        fixedSides,
        initialBounds: positionAndSize,
      });
    });

    // Собираем внешние паттерны
    Object.entries(outerPatterns).forEach(([componentName, componentData]) => {
      if (!componentData || !componentData.pattern) return;

      const childPatternId = componentData.pattern;
      const childPattern = patterns[childPatternId];
      if (!childPattern) return;

      const childSize = {
        width: DEFAULT_PATTERN.EXTERNAL.width,
        height: DEFAULT_PATTERN.EXTERNAL.height,
      };

      const positionAndSize = calculateChildPosition(
        componentData.location,
        parentBounds,
        childSize,
        false // isInner
      );

      const savedPosition = childPatternPositions[componentName];
      const finalX = savedPosition?.x ?? positionAndSize.x;
      const finalY = savedPosition?.y ?? positionAndSize.y;

      const fixedSides = getFixedSides(componentData.location);

      patternInfos.push({
        componentName,
        type: 'external',
        x: finalX,
        y: finalY,
        width: positionAndSize.width,
        height: positionAndSize.height,
        fixedSides,
        initialBounds: positionAndSize,
      });
    });

    /**
     * Создает функцию dragBoundFunc для паттерна с проверкой столкновений
     */
    const createDragBoundFunc = (currentPatternInfo) => {
      return (pos) => {
        const { componentName, type, width, height, fixedSides, initialBounds } = currentPatternInfo;
        
        let newX = pos.x;
        let newY = pos.y;
        const oldX = currentPatternInfo.x;
        const oldY = currentPatternInfo.y;

        // Ограничиваем движение по зафиксированным сторонам
        if (fixedSides.left && fixedSides.right) {
          newX = initialBounds.x;
        } else if (fixedSides.left) {
          newX = initialBounds.x;
        } else if (fixedSides.right) {
          newX = initialBounds.x;
        }

        if (fixedSides.top && fixedSides.bottom) {
          newY = initialBounds.y;
        } else if (fixedSides.top) {
          newY = initialBounds.y;
        } else if (fixedSides.bottom) {
          newY = initialBounds.y;
        }

        // Ограничиваем границами
        if (type === 'internal') {
          // Для внутренних паттернов - ограничиваем внутри parentBounds
          newX = Math.max(parentBounds.x, Math.min(newX, parentBounds.x + parentBounds.width - width));
          newY = Math.max(parentBounds.y, Math.min(newY, parentBounds.y + parentBounds.height - height));
        } else {
          // Для внешних паттернов - ограничиваем в зависимости от прикрепленной стороны
          
          // Определяем, к какой стороне прикреплен паттерн
          const isAttachedLeft = fixedSides.left;
          const isAttachedRight = fixedSides.right;
          const isAttachedTop = fixedSides.top;
          const isAttachedBottom = fixedSides.bottom;

          if (isAttachedLeft) {
            // Прикреплен к левой стороне - может двигаться только вдоль левой границы
            newX = initialBounds.x; // Фиксируем X
            // Y ограничиваем высотой родительского контейнера
            newY = Math.max(parentBounds.y, Math.min(newY, parentBounds.y + parentBounds.height - height));
          } else if (isAttachedRight) {
            // Прикреплен к правой стороне - может двигаться только вдоль правой границы
            newX = initialBounds.x; // Фиксируем X
            // Y ограничиваем высотой родительского контейнера
            newY = Math.max(parentBounds.y, Math.min(newY, parentBounds.y + parentBounds.height - height));
          } else if (isAttachedTop) {
            // Прикреплен к верхней стороне - может двигаться только вдоль верхней границы
            newY = initialBounds.y; // Фиксируем Y
            // X ограничиваем шириной родительского контейнера
            newX = Math.max(parentBounds.x, Math.min(newX, parentBounds.x + parentBounds.width - width));
          } else if (isAttachedBottom) {
            // Прикреплен к нижней стороне - может двигаться только вдоль нижней границы
            newY = initialBounds.y; // Фиксируем Y
            // X ограничиваем шириной родительского контейнера
            newX = Math.max(parentBounds.x, Math.min(newX, parentBounds.x + parentBounds.width - width));
          } else {
            // Не прикреплен ни к одной стороне - ограничиваем границами Stage
            newX = Math.max(0, Math.min(newX, stageSize.width - width));
            newY = Math.max(0, Math.min(newY, stageSize.height - height));
          }
        }

        // Проверяем столкновения с другими паттернами
        for (const otherPattern of patternInfos) {
          if (otherPattern.componentName === componentName) continue;
          
          const otherRect = {
            x: otherPattern.x,
            y: otherPattern.y,
            width: otherPattern.width,
            height: otherPattern.height
          };

          // Проверяем столкновение с новой позицией
          const testRect = { x: newX, y: newY, width, height };
          
          if (checkCollision(testRect, otherRect)) {
            // Есть столкновение - пытаемся двигаться только по одной оси
            
            // Пробуем двигаться только по X (сохраняя старый Y)
            const testRectX = { x: newX, y: oldY, width, height };
            const canMoveX = !checkCollision(testRectX, otherRect);
            
            // Пробуем двигаться только по Y (сохраняя старый X)
            const testRectY = { x: oldX, y: newY, width, height };
            const canMoveY = !checkCollision(testRectY, otherRect);
            
            if (canMoveX && !canMoveY) {
              // Можем двигаться только по X
              newY = oldY;
            } else if (canMoveY && !canMoveX) {
              // Можем двигаться только по Y
              newX = oldX;
            } else {
              // Не можем двигаться ни по одной оси - останавливаемся
              newX = oldX;
              newY = oldY;
            }
          }
        }

        return { x: newX, y: newY };
      };
    };

    /**
     * Обработчик завершения перетаскивания
     */
    const handleChildDragEnd = (e, componentName) => {
      const node = e.target;
      const newX = node.x();
      const newY = node.y();
      
      // Обновляем позицию в состоянии
      setChildPatternPositions(prev => ({
        ...prev,
        [componentName]: { x: newX, y: newY }
      }));

      // Обновляем позицию в patternInfos для последующих проверок
      const patternInfo = patternInfos.find(p => p.componentName === componentName);
      if (patternInfo) {
        patternInfo.x = newX;
        patternInfo.y = newY;
      }
    };

    const childElements = [];

    // Рендерим все паттерны
    patternInfos.forEach((patternInfo) => {
      const { componentName, type, x, y, width, height, fixedSides } = patternInfo;
      const isDraggable = !(fixedSides.left && fixedSides.right && fixedSides.top && fixedSides.bottom);

      const commonProps = {
        key: `${type}-${componentName}`,
        id: `${type}-${componentName}`,
        x,
        y,
        width,
        height,
        text: componentName,
        isSelected: false,
        draggable: isDraggable,
        dragBoundFunc: createDragBoundFunc(patternInfo),
        onDragEnd: (e) => handleChildDragEnd(e, componentName),
        onSelect: () => {},
        nodeRef: () => {},
        stageSize,
      };

      if (type === 'internal') {
        childElements.push(<DefaultInternalRectangle {...commonProps} />);
      } else {
        childElements.push(<DefaultExternalRectangle {...commonProps} />);
      }
    });

    return childElements;
  };

  /**
   * Рендерит все паттерны на холсте
   */
  const renderBlocks = () => (
    <Layer>
      {blocks.map(block => {
        const handleDragEnd = (e) => {
          const node = e.target;
          setBlocks(prev => prev.map(b => 
            b.id === block.id ? { ...b, x: node.x(), y: node.y() } : b
          ));
        };

        const handleBlockSelect = () => {
          setSelectedIds([block.id]);
          if (patterns[block.id]) {
            handleSelectPattern(block.id, null);
          }
        };

        const commonProps = {
          key: block.id,
          id: block.id,
          x: block.x ?? 0,
          y: block.y ?? 0,
          width: block.width ?? DEFAULT_PATTERN.EXTERNAL.width,
          height: block.height ?? DEFAULT_PATTERN.EXTERNAL.height,
          text: '',
          isSelected: selectedIds.includes(block.id),
          onSelect: handleBlockSelect,
          onDragEnd: handleDragEnd,
          nodeRef: (node) => {
            if (node) rectRefs.current.set(block.id, node);
          },
          stageSize: stageSize,
        };

        return block.type === 'internal' 
          ? <DefaultInternalRectangle {...commonProps} />
          : <DefaultExternalRectangle {...commonProps} />;
      })}

      {/* Отрисовываем дочерние паттерны выбранного паттерна */}
      {renderChildPatterns()}

      {/* Прямоугольник выделения */}
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
  );

  // ==================== Рендер ====================
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: '100vh', 
      backgroundColor: COLORS.BACKGROUND 
    }}>
      <Header
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
        fileName={fileName}
        onFileNameChange={setFileName}
      />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flex: 1, 
        overflow: 'hidden', 
        backgroundColor: COLORS.BACKGROUND, 
        minWidth: 0, 
        padding: `${SIZES.SIDEBAR_MARGIN}px`, 
        gap: `${SIZES.SIDEBAR_GAP}px` 
      }}>
        {/* Левый sidebar */}
        <div style={containerStyles.sidebarWrapper}>
          <LeftSidebar
            patterns={patterns}
            selectedPatternId={selectedPatternId}
            selectedComponentId={selectedComponentId}
            onSelectPattern={handleSelectPattern}
            onCreateEmptyPattern={createEmptyPattern}
          />
        </div>

        {/* Центральная область */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: `${SIZES.SIDEBAR_MARGIN}px`, 
          gap: '10px', 
          overflow: 'auto', 
          minWidth: 0 
        }}>
          {/* Кнопки создания паттернов */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={createExternalPattern}
              style={{
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: `${SIZES.BORDER_RADIUS}px`,
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Добавить внешний паттерн
            </button>
            <button
              onClick={createInternalPattern}
              style={{
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: `${SIZES.BORDER_RADIUS}px`,
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Добавить внутренний паттерн
            </button>
          </div>

          {/* Контейнер Stage */}
          <div style={containerStyles.stageContainer}>
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleMouseDown}
              onMousemove={handleMouseMove}
              onMouseup={handleMouseUp}
              onClick={handleStageClick}
              style={{
                backgroundColor: COLORS.BACKGROUND, 
                display: 'block',
              }}
            >
              {renderGrid()}
              {renderInnerRect()}
              {renderBlocks()}
            </Stage>
          </div>
        </div>

        {/* Правый sidebar */}
        <div style={containerStyles.sidebarWrapper}>
          <RightSidebar
            selectedPattern={selectedPattern}
            selectedPatternId={selectedPatternId}
            onUpdatePattern={handleUpdatePattern}
            onSavePattern={handleSavePattern}
            onCancelPattern={handleCancelPattern}
            allPatterns={patterns}
          />
        </div>
      </div>
    </div>
  );
};

export { App };
