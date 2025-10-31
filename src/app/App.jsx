import { Stage, Layer, Rect, Transformer } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { DefaultInput } from './default-input.jsx';
import { DefaultRectangle } from './default-rectangle.jsx';
import { getClientRect } from "./getClientRect.js";

const App = () => {
  const [stageSize, setStageSize] = useState({
      width: window.innerWidth - 1000,
      height: window.innerHeight - 200,
    });


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

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '500px', gap: '10px', paddingTop: '10px', paddingBottom: '10px' }}>
        <button
          onClick={() => {
            setBlocks(prev => [
              ...prev,
              {
                id: (blocks.length + 1).toString(),
                text: 'Паттерн ' + (blocks.length + 1).toString(),
              }
            ])}}>
              Добавить новый паттерн
        </button>

        <DefaultInput
          value={blocks.find(b => b.id === selectedIds[0])?.text || ''}
          onChange={(e) => {
            const id = selectedIds[0];
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, text: e.target.value } : b));
          }}
          placeholder="Введите текст"
        />

        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onClick={handleStageClick}
          style={{backgroundColor: '#777575ff', left: "200px"}}
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
    );
};

export { App };

