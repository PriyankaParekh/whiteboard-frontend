"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Line,
  Transformer,
  Group,
  Text as KonvaText,
} from "react-konva";
import Konva from "konva";
import { useStore, WhiteboardElement } from "../store/useStore";

// 🎨 Soft Color Palette
const COLORS = {
  stroke: "#94a3b8",
  fill: "transparent",
  accent: "#cbd5e1",
  canvasBg: "#f1f5f9",
  selection: "#3b82f6",
  selectionFill: "rgba(59, 130, 246, 0.08)",
};

interface ShapeProps {
  element: WhiteboardElement;
  isSelected: boolean;
  onSelect: (id: string | null, additive?: boolean) => void;
  onTransformEnd: (id: string, newAttrs: Partial<WhiteboardElement>) => void;
}

// Safe shiftKey extraction — TouchEvent doesn't have shiftKey
function getShiftKey(evt: MouseEvent | TouchEvent): boolean {
  return (evt as MouseEvent).shiftKey ?? false;
}

// helpers
function computeArrowHead(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 12;
  const hx = b.x - ux * size;
  const hy = b.y - uy * size;
  const px = -uy * (size * 0.6);
  const py = ux * (size * 0.6);
  return [b.x, b.y, hx + px, hy + py, hx - px, hy - py];
}

// ✏️ Rectangle Shape
const RectShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      {isSelected && (
        <Rect
          x={(element.x || 0) - 2}
          y={(element.y || 0) - 2}
          width={(element.width || 100) + 4}
          height={(element.height || 100) + 4}
          stroke={COLORS.selection}
          strokeWidth={2}
          cornerRadius={8}
          opacity={0.5}
          dash={[5, 5]}
          listening={false}
        />
      )}
      <Rect
        ref={rectRef}
        x={element.x}
        y={element.y}
        width={element.width || 100}
        height={element.height || 100}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        cornerRadius={8}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = rectRef.current;
          if (node) {
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * node.scaleX()),
              height: Math.max(5, node.height() * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// ⭕ Circle Shape
const CircleShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const circleRef = useRef<Konva.Circle>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && circleRef.current) {
      trRef.current.nodes([circleRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const radius = Math.max(element.width || 50, element.height || 50) / 2;

  return (
    <>
      {isSelected && (
        <Circle
          x={element.x}
          y={element.y}
          radius={radius + 2}
          stroke={COLORS.selection}
          strokeWidth={2}
          opacity={0.5}
          dash={[5, 5]}
          listening={false}
        />
      )}
      <Circle
        ref={circleRef}
        x={element.x}
        y={element.y}
        radius={radius}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = circleRef.current;
          if (node) {
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(10, node.radius() * 2 * node.scaleX()),
              height: Math.max(10, node.radius() * 2 * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// ➡️ Line Shape
const LineShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const points = element.points || [];

  return (
    <>
      <Line
        ref={lineRef}
        points={points.flatMap((p: { x: number; y: number }) => [p.x, p.y])}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = lineRef.current;
          if (node) {
            onTransformEnd(element.id, { x: node.x(), y: node.y() });
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// ⬆️ Arrow Shape
const ArrowShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const points = element.points || [];

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
      >
        <Line
          points={points.flatMap((p: { x: number; y: number }) => [p.x, p.y])}
          stroke={element.strokeColor || COLORS.stroke}
          strokeWidth={element.strokeWidth || 2}
          lineCap="round"
          lineJoin="round"
        />
        {points.length >= 2 && (
          <Line
            points={computeArrowHead(
              points[points.length - 2],
              points[points.length - 1],
            )}
            fill={element.strokeColor || COLORS.stroke}
            closed
            strokeWidth={0}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// △ Triangle Shape
const TriangleShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const polyRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && polyRef.current) {
      trRef.current.nodes([polyRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const width = element.width || 100;
  const height = element.height || 100;

  return (
    <>
      {isSelected && (
        <Rect
          x={element.x || 0}
          y={element.y || 0}
          width={width}
          height={height}
          stroke={COLORS.selection}
          strokeWidth={2}
          opacity={0.3}
          dash={[5, 5]}
          listening={false}
        />
      )}
      <Line
        closed
        ref={polyRef}
        x={element.x}
        y={element.y}
        points={[width / 2, 0, width, height, 0, height]}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = polyRef.current;
          if (node) {
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * node.scaleX()),
              height: Math.max(5, node.height() * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// ◆ Diamond Shape
const DiamondShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const polyRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && polyRef.current) {
      trRef.current.nodes([polyRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const width = element.width || 100;
  const height = element.height || 100;

  return (
    <>
      {isSelected && (
        <Rect
          x={element.x || 0}
          y={element.y || 0}
          width={width}
          height={height}
          stroke={COLORS.selection}
          strokeWidth={2}
          opacity={0.3}
          dash={[5, 5]}
          listening={false}
        />
      )}
      <Line
        closed
        ref={polyRef}
        x={element.x}
        y={element.y}
        points={[
          width / 2,
          0,
          width,
          height / 2,
          width / 2,
          height,
          0,
          height / 2,
        ]}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = polyRef.current;
          if (node) {
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * node.scaleX()),
              height: Math.max(5, node.height() * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// ✏️ Pencil/Freehand Shape
const PencilShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const points = element.points || [];

  return (
    <>
      <Line
        ref={lineRef}
        points={points.flatMap((p: { x: number; y: number }) => [p.x, p.y])}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        draggable
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

// 📝 Text Shape
const TextShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Store screen position in state (not derived from ref during render)
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [screenScale, setScreenScale] = useState(1);
  const lastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Compute screen position when editing starts, then focus
  useEffect(() => {
    if (!isEditing) return;
    if (textRef.current) {
      const stage = textRef.current.getStage();
      if (stage) {
        const stageBox = stage.container().getBoundingClientRect();
        const absPos = textRef.current.getAbsolutePosition();
        setScreenPos({
          x: stageBox.left + absPos.x,
          y: stageBox.top + absPos.y,
        });
        setScreenScale(stage.scaleX());
      }
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(timer);
  }, [isEditing]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const now = Date.now();
      const isDoubleClick = now - lastClickTimeRef.current < 400;
      lastClickTimeRef.current = now;
      if (isDoubleClick) {
        e.evt.preventDefault();
        e.evt.stopPropagation();
        setIsEditing(true);
      } else {
        onSelect(element.id, getShiftKey(e.evt));
      }
    },
    [element.id, onSelect],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <>
      <KonvaText
        ref={textRef}
        x={element.x}
        y={element.y}
        text={isEditing ? "" : element.text || "Double-click to edit"}
        fontSize={element.fontSize || 28}
        fill={element.strokeColor || COLORS.stroke}
        onClick={handleClick}
        onTap={handleClick}
        draggable={!isEditing}
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
      {/* Portal: render input outside Konva entirely, directly into document.body */}
      {isEditing &&
        typeof document !== "undefined" &&
        createPortal(
          <input
            ref={inputRef}
            type="text"
            defaultValue={element.text || ""}
            onChange={(e) =>
              onTransformEnd(element.id, { text: e.target.value })
            }
            onBlur={handleBlur}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" || e.key === "Escape") handleBlur();
            }}
            style={{
              position: "fixed",
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              fontSize: `${(element.fontSize || 28) * screenScale}px`,
              padding: "4px 8px",
              border: `2px solid ${COLORS.selection}`,
              backgroundColor: "white",
              zIndex: 10000,
              minWidth: "200px",
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          />,
          document.body,
        )}
    </>
  );
};

// 📌 Sticky Note Shape
const StickyShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Store screen position in state (not derived from ref during render)
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [screenScale, setScreenScale] = useState(1);
  const lastClickTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Compute screen position when editing starts, then focus
  useEffect(() => {
    if (!isEditing) return;
    if (groupRef.current) {
      const stage = groupRef.current.getStage();
      if (stage) {
        const stageBox = stage.container().getBoundingClientRect();
        const absPos = groupRef.current.getAbsolutePosition();
        setScreenPos({
          x: stageBox.left + absPos.x,
          y: stageBox.top + absPos.y,
        });
        setScreenScale(stage.scaleX());
      }
    }
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
    return () => clearTimeout(timer);
  }, [isEditing]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      const now = Date.now();
      const isDoubleClick = now - lastClickTimeRef.current < 300;
      lastClickTimeRef.current = now;
      if (isDoubleClick && !isEditing) {
        setIsEditing(true);
      } else if (!isDoubleClick && !isEditing) {
        onSelect(element.id, getShiftKey(e.evt));
      }
    },
    [element.id, onSelect, isEditing],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const width = element.width || 180;
  const height = element.height || 180;

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        onClick={handleClick}
        onTap={handleClick}
        draggable={!isEditing}
        onDragEnd={(e) => {
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() });
        }}
      >
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={element.fillColor || "#fef3c7"}
          stroke={
            isEditing ? COLORS.selection : element.strokeColor || "#fcd34d"
          }
          strokeWidth={2}
          cornerRadius={4}
        />
        <KonvaText
          x={10}
          y={10}
          width={width - 20}
          text={isEditing ? "" : element.text || "Double-click to edit"}
          fontSize={element.fontSize || 20}
          fill="#333333"
          wrap="word"
        />
      </Group>
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
      {/* Portal: render textarea outside Konva entirely, directly into document.body */}
      {isEditing &&
        typeof document !== "undefined" &&
        createPortal(
          <textarea
            ref={textareaRef}
            defaultValue={element.text || ""}
            onChange={(e) =>
              onTransformEnd(element.id, { text: e.target.value })
            }
            onBlur={handleBlur}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") handleBlur();
            }}
            style={{
              position: "fixed",
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              width: `${width * screenScale}px`,
              height: `${height * screenScale}px`,
              fontSize: `${(element.fontSize || 20) * screenScale}px`,
              padding: "10px",
              border: `2px solid ${COLORS.selection}`,
              backgroundColor: element.fillColor || "#fef3c7",
              zIndex: 10000,
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              boxSizing: "border-box",
            }}
          />,
          document.body,
        )}
    </>
  );
};

// 🎯 Main Canvas Component
export default function Canvas() {
  const storeValues = useStore();
  const {
    elements,
    selectedTool,
    selectedElementId,
    selectedElementIds,
    addElement,
    updateElement,
    selectElement,
    deleteElement,
    deleteSelected,
  } = storeValues;

  // setSelectedTool is optional — only use if it exists in the store
  const setSelectedTool = (storeValues as unknown as Record<string, unknown>)
    .setSelectedTool as ((tool: string) => void) | undefined;

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  // Store the drawing start position separately so setCurrentElement functional updates work
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] =
    useState<Partial<WhiteboardElement> | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  // 🖱️ Get Mouse Position adjusted for pan/zoom
  const getMousePos = useCallback((): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  }, []);

  // 🎯 Handle Mouse Down
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        setIsDraggingStage(true);
        lastPosRef.current = stageRef.current?.getPointerPosition() ?? null;
        e.evt.preventDefault();
        return;
      }

      if (selectedTool === "select") {
        if (e.target !== e.target.getStage()) return;
        selectElement(null);
        return;
      }

      const pos = getMousePos();
      drawStartRef.current = pos;

      if (selectedTool === "rectangle") {
        setCurrentElement({
          id: `rect-${Date.now()}`,
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: COLORS.stroke,
          fillColor: COLORS.fill,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "circle") {
        setCurrentElement({
          id: `circle-${Date.now()}`,
          type: "circle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: COLORS.stroke,
          fillColor: COLORS.fill,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentElement({
          id: `line-${Date.now()}`,
          type: selectedTool === "arrow" ? "arrow" : "line",
          x: 0,
          y: 0,
          points: [
            { x: pos.x, y: pos.y },
            { x: pos.x, y: pos.y },
          ],
          strokeColor: COLORS.stroke,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "triangle") {
        setCurrentElement({
          id: `triangle-${Date.now()}`,
          type: "triangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: COLORS.stroke,
          fillColor: COLORS.fill,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "diamond") {
        setCurrentElement({
          id: `diamond-${Date.now()}`,
          type: "diamond",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: COLORS.stroke,
          fillColor: COLORS.fill,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "polygon") {
        setCurrentElement({
          id: `polygon-${Date.now()}`,
          type: "polygon",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: COLORS.stroke,
          fillColor: COLORS.fill,
          strokeWidth: 2,
          sides: 6,
        } as Partial<WhiteboardElement>);
        setIsDrawing(true);
      } else if (selectedTool === "pencil") {
        setCurrentElement({
          id: `pencil-${Date.now()}`,
          type: "pencil",
          x: 0,
          y: 0,
          points: [{ x: pos.x, y: pos.y }],
          strokeColor: COLORS.stroke,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "text") {
        if (e.target !== e.target.getStage()) return;
        const newEl: WhiteboardElement = {
          id: `text-${Date.now()}`,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "Text",
          fontSize: 28,
          strokeColor: COLORS.stroke,
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setSelectedTool?.("select");
      } else if (selectedTool === "sticky") {
        if (e.target !== e.target.getStage()) return;
        const newEl: WhiteboardElement = {
          id: `sticky-${Date.now()}`,
          type: "sticky",
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 150,
          text: "Note",
          fillColor: "#fef3c7",
          strokeColor: "#fcd34d",
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setSelectedTool?.("select");
      }
    },
    [selectedTool, addElement, selectElement, setSelectedTool, getMousePos],
  );

  // 🖱️ Handle Mouse Move
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDraggingStage && (e.evt.ctrlKey || e.evt.metaKey)) {
        const stage = stageRef.current;
        if (!stage) return;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        const lastPos = lastPosRef.current ?? pointerPos;
        const newPos = {
          x: position.x + (pointerPos.x - lastPos.x),
          y: position.y + (pointerPos.y - lastPos.y),
        };
        setPosition(newPos);
        stage.position(newPos);
        stage.batchDraw();
        lastPosRef.current = pointerPos;
        return;
      }

      if (!isDrawing || !currentElement) return;

      const pos = getMousePos();
      const start = drawStartRef.current;

      if (
        selectedTool === "rectangle" ||
        selectedTool === "circle" ||
        selectedTool === "triangle" ||
        selectedTool === "diamond" ||
        selectedTool === "polygon"
      ) {
        setCurrentElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            x: Math.min(pos.x, start.x),
            y: Math.min(pos.y, start.y),
            width: Math.abs(pos.x - start.x),
            height: Math.abs(pos.y - start.y),
          };
        });
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentElement((prev) => {
          if (!prev) return prev;
          const pts = prev.points ? [...prev.points] : [];
          pts[1] = { x: pos.x, y: pos.y };
          return { ...prev, points: pts };
        });
      } else if (selectedTool === "pencil") {
        setCurrentElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            points: [...(prev.points || []), { x: pos.x, y: pos.y }],
          };
        });
      }
    },
    [
      isDraggingStage,
      isDrawing,
      currentElement,
      selectedTool,
      position,
      getMousePos,
    ],
  );

  // 🖱️ Handle Mouse Up
  const handleMouseUp = useCallback(() => {
    if (isDraggingStage) {
      setIsDraggingStage(false);
      lastPosRef.current = null;
      return;
    }

    if (!isDrawing || !currentElement) return;

    if (
      currentElement.type === "rectangle" ||
      currentElement.type === "circle" ||
      currentElement.type === "triangle" ||
      currentElement.type === "diamond"
    ) {
      if ((currentElement.width || 0) > 5 && (currentElement.height || 0) > 5) {
        addElement(currentElement as WhiteboardElement);
      }
    } else if (
      currentElement.type === "line" ||
      currentElement.type === "arrow" ||
      currentElement.type === "pencil"
    ) {
      addElement(currentElement as WhiteboardElement);
    } else if (currentElement.type === "polygon") {
      const sides =
        (currentElement as Partial<WhiteboardElement> & { sides?: number })
          .sides || 6;
      const w = currentElement.width || 0;
      const h = currentElement.height || 0;
      const cx = (currentElement.x || 0) + w / 2;
      const cy = (currentElement.y || 0) + h / 2;
      const r = Math.min(w, h) / 2;
      const points: { x: number; y: number }[] = Array.from({
        length: sides,
      }).map((_, i) => {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
      });
      addElement({
        id: currentElement.id as string,
        type: "polygon",
        x: currentElement.x || 0,
        y: currentElement.y || 0,
        points,
        strokeColor: currentElement.strokeColor,
        fillColor: currentElement.fillColor,
        strokeWidth: currentElement.strokeWidth,
      } as WhiteboardElement);
    }

    setIsDrawing(false);
    setCurrentElement(null);
  }, [isDraggingStage, isDrawing, currentElement, addElement]);

  // 🔍 Handle Zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(0.5, Math.min(3, oldScale + direction * 0.1));
      const mousePointTo = {
        x: pointer.x / oldScale - stage.x() / oldScale,
        y: pointer.y / oldScale - stage.y() / oldScale,
      };
      const newPos = {
        x: -(mousePointTo.x - pointer.x / newScale) * newScale,
        y: -(mousePointTo.y - pointer.y / newScale) * newScale,
      };
      setScale(newScale);
      setPosition(newPos);
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    },
    [scale],
  );

  // ⌨️ Handle Keyboard (Delete) — skip when focus is inside an input/textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Delete") {
        if (selectedElementIds && selectedElementIds.length > 0) {
          deleteSelected();
        } else if (selectedElementId) {
          deleteElement(selectedElementId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, selectedElementIds, deleteElement, deleteSelected]);

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: COLORS.canvasBg }}
    >
      {/* Control Info Panel */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "12px",
          zIndex: 100,
          fontFamily: "monospace",
          maxWidth: "250px",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
          🎨 Controls
        </div>
        <div style={{ marginBottom: "6px", color: "#555" }}>
          <strong>Select:</strong> Click shapes
        </div>
        <div style={{ marginBottom: "6px", color: "#555" }}>
          <strong>Multi-select:</strong> Shift + Click
        </div>
        <div style={{ marginBottom: "6px", color: "#555" }}>
          <strong>Pan canvas:</strong> Ctrl/Cmd + Drag
        </div>
        <div style={{ marginBottom: "6px", color: "#555" }}>
          <strong>Edit text/sticky:</strong> Double-click
        </div>
        <div style={{ color: "#555" }}>
          <strong>Delete:</strong> Press Delete key
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1920}
        height={typeof window !== "undefined" ? window.innerHeight : 1080}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          cursor: isDraggingStage ? "grabbing" : "default",
        }}
      >
        <Layer ref={layerRef} opacity={0.95}>
          {elements.map((element) => (
            <React.Fragment key={element.id}>
              {element.type === "rectangle" && (
                <RectShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "circle" && (
                <CircleShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "line" && (
                <LineShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "arrow" && (
                <ArrowShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "triangle" && (
                <TriangleShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "diamond" && (
                <DiamondShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "polygon" && (
                <LineShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "pencil" && (
                <PencilShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "text" && (
                <TextShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
              {element.type === "sticky" && (
                <StickyShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                />
              )}
            </React.Fragment>
          ))}

          {/* Preview while drawing */}
          {isDrawing && currentElement && (
            <>
              {currentElement.type === "rectangle" && (
                <Rect
                  x={currentElement.x}
                  y={currentElement.y}
                  width={currentElement.width}
                  height={currentElement.height}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  fill={COLORS.selectionFill}
                  cornerRadius={8}
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "circle" && (
                <Circle
                  x={currentElement.x}
                  y={currentElement.y}
                  radius={
                    Math.max(
                      currentElement.width || 0,
                      currentElement.height || 0,
                    ) / 2
                  }
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  fill={COLORS.selectionFill}
                  opacity={0.7}
                  listening={false}
                />
              )}
              {(currentElement.type === "line" ||
                currentElement.type === "arrow") && (
                <Line
                  points={(currentElement.points || []).flatMap(
                    (p: { x: number; y: number }) => [p.x, p.y],
                  )}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "triangle" && (
                <Line
                  closed
                  points={(() => {
                    const w = currentElement.width || 0;
                    const h = currentElement.height || 0;
                    return [
                      currentElement.x! + w / 2,
                      currentElement.y!,
                      currentElement.x! + w,
                      currentElement.y! + h,
                      currentElement.x!,
                      currentElement.y! + h,
                    ];
                  })()}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  fill={COLORS.selectionFill}
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "diamond" && (
                <Line
                  closed
                  points={(() => {
                    const w = currentElement.width || 0;
                    const h = currentElement.height || 0;
                    return [
                      currentElement.x! + w / 2,
                      currentElement.y!,
                      currentElement.x! + w,
                      currentElement.y! + h / 2,
                      currentElement.x! + w / 2,
                      currentElement.y! + h,
                      currentElement.x!,
                      currentElement.y! + h / 2,
                    ];
                  })()}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  fill={COLORS.selectionFill}
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "polygon" && (
                <Line
                  closed
                  points={(() => {
                    const sides =
                      (
                        currentElement as Partial<WhiteboardElement> & {
                          sides?: number;
                        }
                      ).sides || 6;
                    const w = currentElement.width || 0;
                    const h = currentElement.height || 0;
                    const cx = (currentElement.x || 0) + w / 2;
                    const cy = (currentElement.y || 0) + h / 2;
                    const r = Math.min(w, h) / 2;
                    const pts: number[] = [];
                    for (let i = 0; i < sides; i++) {
                      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                      pts.push(
                        cx + Math.cos(angle) * r,
                        cy + Math.sin(angle) * r,
                      );
                    }
                    return pts;
                  })()}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  fill={COLORS.selectionFill}
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "pencil" && (
                <Line
                  points={(currentElement.points || []).flatMap(
                    (p: { x: number; y: number }) => [p.x, p.y],
                  )}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}
                  opacity={0.7}
                  listening={false}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
}
