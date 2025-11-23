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
import { stringify as yamlStringifyOriginal, YAMLSeq, Scalar } from "yaml";
import { getInnerRectBounds, intersectsInnerArea, constrainToStage, calculateChildPosition } from './utils.js';
import './mainWindow.css';

// локальная обёртка для компактного YAML
const yamlStringify = (obj) => yamlStringifyOriginal(obj, {
  indent: 2,      // читаемый отступ
  flowLevel: 1,   // массивы на первом уровне будут в виде [a, b]
});


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



  const normalizeExtendsFormat = (patterns) => {
  const clone = structuredClone(patterns);

  for (const key in clone) {
    const p = clone[key];
    if (!p.extends) continue;

    // Если extends был объектом типа {"0": "pattern_2"} → делаем нормальный массив
    if (typeof p.extends === "object" && !Array.isArray(p.extends)) {
      p.extends = Object.values(p.extends);
    }

    if (Array.isArray(p.extends)) {
      // Создаём YAMLSeq для flow-стиля
      const seq = new YAMLSeq();
      seq.flow = true; // <--- Это заставляет YAML печатать [a, b]

      // Добавляем элементы как Scalar
      p.extends.forEach(e => seq.items.push(new Scalar(e)));

      p.extends = seq;
    }
  }

  return clone;
};










  /**
   * Обработчик сохранения файла
   */
  const handleSave = () => {
  // если нет имени — предупреждаем
  if (!fileName || fileName.trim() === '') {
    alert('Введите имя файла в поле "Название файла" или используйте "Сохранить как".');
    return;
  }

  try {
    const payload = {
      patterns: normalizeExtendsFormat(patterns),
      blocks: blocks,
      fileName: fileName || 'untitled',
    };

    // сериализуем в YAML
    const yamlText = yamlStringify(payload);

    // имя файла — гарантируем расширение .yaml
    const finalName = fileName.match(/\.(ya?ml|json)$/i)
      ? fileName.replace(/\.(json|ya?ml)$/i, '.yaml')
      : `${fileName}.yaml`;

    const blob = new Blob([yamlText], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Ошибка при сохранении:', err);
    alert('Ошибка при сохранении: ' + (err.message || err));
  }
};


  /**
   * Обработчик сохранения как
   */
  const handleSaveAs = async () => {
  try {
    // Предлагаем пользователю выбрать место, имя и расширение
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: fileName || 'untitled.yaml',
      types: [
        {
          description: 'YAML файлы',
          accept: { 'text/yaml': ['.yaml', '.yml'] }
        },
        {
          description: 'JSON файлы',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });

    const ext = fileHandle.name.split('.').pop().toLowerCase();
    const payload = {
      patterns: normalizeExtendsFormat(patterns),
      blocks: blocks,
    };

    let blob;
    if (ext === 'json') {
      blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      });
    } else {
      blob = new Blob([yamlStringify(payload)], {
        type: 'text/yaml'
      });
    }

    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    setFileName(fileHandle.name.replace(/\.(json|ya?ml)$/i, ''));

    console.log('Файл успешно сохранён:', fileHandle.name);

  } catch (err) {
    if (err.name === 'AbortError') return; // пользователь отменил
    console.error('Ошибка Save As:', err);
    alert('Ошибка при сохранении: ' + err.message);
  }
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

    // Размещаем родительский паттерн по центру поля
    const parentWidth = DEFAULT_PATTERN.EXTERNAL.width;
    const parentHeight = DEFAULT_PATTERN.EXTERNAL.height;
    const parentX = (stageSize.width - parentWidth) / 2;
    const parentY = (stageSize.height - parentHeight) / 2;
    const parentBounds = { x: parentX, y: parentY, width: parentWidth, height: parentHeight };

    const childElements = [];

    // Отрисовываем внутренние паттерны
    Object.entries(innerPatterns).forEach(([componentName, componentData]) => {
      if (!componentData || !componentData.pattern) return;

      const childPatternId = componentData.pattern;
      const childPattern = patterns[childPatternId];
      if (!childPattern) return;

      const childSize = {
        width: DEFAULT_PATTERN.INTERNAL.width,
        height: DEFAULT_PATTERN.INTERNAL.height,
      };

      const position = calculateChildPosition(
        componentData.location,
        parentBounds,
        childSize,
        true // isInner
      );

      childElements.push(
        <DefaultInternalRectangle
          key={`inner-${componentName}`}
          id={`inner-${componentName}`}
          x={position.x}
          y={position.y}
          width={childSize.width}
          height={childSize.height}
          text={componentName}
          isSelected={false}
          onSelect={() => {}}
          onDragEnd={() => {}}
          nodeRef={() => {}}
          stageSize={stageSize}
        />
      );
    });

    // Отрисовываем внешние паттерны
    Object.entries(outerPatterns).forEach(([componentName, componentData]) => {
      if (!componentData || !componentData.pattern) return;

      const childPatternId = componentData.pattern;
      const childPattern = patterns[childPatternId];
      if (!childPattern) return;

      const childSize = {
        width: DEFAULT_PATTERN.EXTERNAL.width,
        height: DEFAULT_PATTERN.EXTERNAL.height,
      };

      const position = calculateChildPosition(
        componentData.location,
        parentBounds,
        childSize,
        false // isInner
      );

      childElements.push(
        <DefaultExternalRectangle
          key={`outer-${componentName}`}
          id={`outer-${componentName}`}
          x={position.x}
          y={position.y}
          width={childSize.width}
          height={childSize.height}
          text={componentName}
          isSelected={false}
          onSelect={() => {}}
          onDragEnd={() => {}}
          nodeRef={() => {}}
          stageSize={stageSize}
        />
      );
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
