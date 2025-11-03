import { Stage, Layer, Rect, Transformer } from "react-konva";
import Konva from "konva";
import { useState, useEffect, useRef } from "react";
import { DefaultInput } from './default-input.jsx';
import { DefaultRectangle } from './default-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";
import { Header } from './Header.jsx';
import { LeftSidebar } from './LeftSidebar.jsx';
import { RightSidebar } from './RightSidebar.jsx';

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

    const [blocks, setBlocks] = useState([]);

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

    // Update stage size on window resize
    useEffect(() => {
      const handleResize = () => {
        setStageSize(calculateStageSize());
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update transformer when selection changes
    useEffect(() => {
        if (selectedIds.length && transformerRef.current) {
        // Get the nodes from the refs Map
        const nodes = selectedIds
            .map((id) => rectRefs.current.get(id))
            .filter((node) => node);

        transformerRef.current.nodes(nodes);
        } else if (transformerRef.current) {
        // Clear selection
        transformerRef.current.nodes([]);
        }
    }, [selectedIds]);

    // Click handler for stage
    const handleStageClick = (e) => {

        // If click on empty area - remove all selections
        if (e.target === e.target.getStage()) {
          setSelectedIds([]);
          return;
        }

        // Do nothing if clicked NOT on our rectangles
        if (!e.target.hasName("rect")) {
          return;
        }

        const clickedId = e.target.id();

        // Do we pressed shift or ctrl?
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = selectedIds.includes(clickedId);

        if (!metaPressed && !isSelected) {
        // If no key pressed and the node is not selected
        // select just one
        setSelectedIds([clickedId]);
        //const block = blocks.find(b => b.id === clickedId);
        } else if (metaPressed && isSelected) {
        // If we pressed keys and node was selected
        // we need to remove it from selection
        setSelectedIds(selectedIds.filter((selectedId) => selectedId !== clickedId));
        } else if (metaPressed && !isSelected) {
        // Add the node into selection
        setSelectedIds([...selectedIds, clickedId]);
        }
    };

    const handleMouseDown = (e) => {
        // Do nothing if we mousedown on any shape
        if (e.target !== e.target.getStage()) {
          return;
        }

        // Start selection rectangle
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
        // Do nothing if we didn't start selection
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
        // Do nothing if we didn't start selection
        if (!isSelecting.current) {
          return;
        }
        isSelecting.current = false;

        // Update visibility in timeout, so we can check it in click event
        setTimeout(() => {
          setSelectionRectangle({
              ...selectionRectangle,
              visible: false,
          });
        });

        const selBox = {
          x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
          y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
          width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
          height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
        };

        const selected = blocks.filter((rect) => {
          // Check if rectangle intersects with selection box
          return Konva.Util.haveIntersection(selBox, getClientRect(rect));
        });

        setSelectedIds(selected.map((rect) => rect.id));
    };

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
          name: patternId,
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
            components: patternData.components,
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
            name: selectedPatternId,
          });
        }
      }
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
        <button
          onClick={() => {
            const newId = `pattern_${Date.now()}`;
            const firstComponentId = `component_${Date.now()}`;
            const newPattern = {
              name: `Паттерн ${Object.keys(patterns).length + 1}`,
              description: '',
              kind: 'area',
              components: {
                [firstComponentId]: {
                  description: '',
                  kind: 'area',
                  size: '',
                }
              },
            };
            setPatterns(prev => ({
              ...prev,
              [newId]: newPattern,
            }));
            setSelectedPatternId(newId);
            handleSelectPattern(newId, firstComponentId);
          }}
          style={{
            backgroundColor: '#D72B00',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '10px',
          }}
        >
          Добавить новый паттерн
        </button>

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
          <Layer>
            
            {/* Render rectangles directly */}
            {blocks.map(block => (
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
                nodeRef={(node) => {
                  if (node) rectRefs.current.set(block.id, node);
                }}
              />
            ))}
            

            {/* Single transformer for all selected shapes */}
            <Transformer
              ref={transformerRef}
              onDragMove={handleTransformerDrag}
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

            {/* Selection rectangle */}
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