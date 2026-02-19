"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useStore, WhiteboardElement, ToolType } from "../store/useStore";

const COLORS = {
  stroke: "#94a3b8",
  fill: "transparent",
  accent: "#cbd5e1",
  canvasBg: "#f1f5f9",
  selection: "#3b82f6",
  selectionFill: "rgba(59, 130, 246, 0.08)",
};

export const STICKY_NOTE_COLORS = [
  { fill: "#fef3c7", stroke: "#fcd34d", name: "Yellow" },
  { fill: "#dbeafe", stroke: "#93c5fd", name: "Blue" },
  { fill: "#fce7f3", stroke: "#f9a8d4", name: "Pink" },
  { fill: "#d1fae5", stroke: "#6ee7b7", name: "Green" },
  { fill: "#e9d5ff", stroke: "#c084fc", name: "Purple" },
];

export const ELEMENT_STROKE_COLORS = [
  { color: "#94a3b8", name: "Slate" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#8b5cf6", name: "Purple" },
  { color: "#ec4899", name: "Pink" },
  { color: "#10b981", name: "Emerald" },
  { color: "#f59e0b", name: "Amber" },
  { color: "#ef4444", name: "Red" },
  { color: "#1e293b", name: "Dark" },
];

export const ELEMENT_FILL_COLORS = [
  { color: "transparent", name: "None" },
  { color: "#f1f5f9", name: "Slate" },
  { color: "#dbeafe", name: "Blue" },
  { color: "#e9d5ff", name: "Purple" },
  { color: "#fce7f3", name: "Pink" },
  { color: "#d1fae5", name: "Green" },
  { color: "#fef3c7", name: "Yellow" },
  { color: "#fee2e2", name: "Red" },
];

export const CANVAS_BG_COLORS = [
  { color: "#f1f5f9", name: "Slate", dotColor: "#cbd5e1" },
  { color: "#fafafa", name: "White", dotColor: "#e4e4e7" },
  { color: "#fef9f0", name: "Cream", dotColor: "#fcd34d" },
  { color: "#f0f9ff", name: "Sky", dotColor: "#bae6fd" },
  { color: "#fdf4ff", name: "Lavender", dotColor: "#e879f9" },
  { color: "#f0fdf4", name: "Mint", dotColor: "#86efac" },
];

function getStickyNoteStrokeColor(fillColor: string): string {
  const color = STICKY_NOTE_COLORS.find((c) => c.fill === fillColor);
  return color ? color.stroke : "#fcd34d";
}

interface ShapeProps {
  element: WhiteboardElement;
  isSelected: boolean;
  onSelect: (id: string | null, additive?: boolean) => void;
  onTransformEnd: (id: string, newAttrs: Partial<WhiteboardElement>) => void;
  setTool?: (tool: ToolType) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

function getShiftKey(evt: MouseEvent | TouchEvent): boolean {
  return (evt as MouseEvent).shiftKey ?? false;
}

function computeArrowHead(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const size = 12;
  const hx = b.x - ux * size,
    hy = b.y - uy * size;
  const px = -uy * (size * 0.6),
    py = ux * (size * 0.6);
  return [b.x, b.y, hx + px, hy + py, hx - px, hy - py];
}

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
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
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
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
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
        points={points.flatMap((p) => [p.x, p.y])}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const node = lineRef.current;
          if (node && element.points) {
            const dx = node.x(),
              dy = node.y();
            onTransformEnd(element.id, {
              x: 0,
              y: 0,
              points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            });
            node.x(0);
            node.y(0);
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
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
      >
        <Line
          points={points.flatMap((p) => [p.x, p.y])}
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
  const width = element.width || 100,
    height = element.height || 100;
  return (
    <>
      <Line
        closed
        ref={polyRef}
        x={element.x}
        y={element.y}
        points={[width / 2, 0, width, height, 0, height]}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
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
  const width = element.width || 100,
    height = element.height || 100;
  return (
    <>
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
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
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

const PolygonShape: React.FC<ShapeProps> = ({
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
  if (points.length === 0) return null;
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const relativePoints = points.map((p) => [p.x - minX, p.y - minY]).flat();
  return (
    <>
      <Line
        closed
        ref={lineRef}
        x={minX}
        y={minY}
        points={relativePoints}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const node = lineRef.current;
          if (node && element.points) {
            const dx = node.x() - minX,
              dy = node.y() - minY;
            const updatedPoints = element.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
            const newMinX = Math.min(...updatedPoints.map((p) => p.x));
            const newMinY = Math.min(...updatedPoints.map((p) => p.y));
            onTransformEnd(element.id, {
              x: newMinX,
              y: newMinY,
              points: updatedPoints,
            });
            node.x(newMinX);
            node.y(newMinY);
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
        points={points.flatMap((p) => [p.x, p.y])}
        stroke={element.strokeColor || COLORS.stroke}
        strokeWidth={element.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        draggable
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const node = lineRef.current;
          if (node && element.points) {
            const dx = node.x(),
              dy = node.y();
            onTransformEnd(element.id, {
              x: 0,
              y: 0,
              points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            });
            node.x(0);
            node.y(0);
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

const TextShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
  setTool,
  onEditingChange,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditing]);

  const finishEditing = useCallback(
    (newText: string) => {
      if (!isEditingRef.current) return;
      isEditingRef.current = false;
      setIsEditing(false);
      onEditingChange?.(false);
      onTransformEnd(element.id, { text: newText });
      setTool?.("select");
    },
    [element.id, onTransformEnd, onEditingChange, setTool],
  );

  useEffect(() => {
    if (!isEditing) {
      if (inputRef.current) {
        inputRef.current.remove();
        inputRef.current = null;
      }
      return;
    }
    isEditingRef.current = true;
    if (!textRef.current) return;
    const stage = textRef.current.getStage();
    if (!stage) return;
    const stageBox = stage.container().getBoundingClientRect();
    const absPos = textRef.current.getAbsolutePosition();
    const screenScale = stage.scaleX();
    const input = document.createElement("input");
    input.type = "text";
    input.value = element.text || "";
    input.style.cssText = `position:fixed;left:${stageBox.left + absPos.x}px;top:${stageBox.top + absPos.y}px;font-size:${(element.fontSize || 28) * screenScale}px;padding:4px 8px;border:2px solid ${COLORS.selection};background-color:white;z-index:10000;min-width:200px;outline:none;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:4px;`;
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("pointerdown", (e) => e.stopPropagation());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        finishEditing(input.value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finishEditing(element.text || "");
      }
    });
    input.addEventListener("blur", () => {
      if (isEditingRef.current) finishEditing(input.value);
    });
    document.body.appendChild(input);
    inputRef.current = input;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 10);
    return () => {
      input.remove();
      if (inputRef.current === input) inputRef.current = null;
    };
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
        onEditingChange?.(true);
        return;
      }
      onSelect(element.id, getShiftKey(e.evt));
    },
    [element.id, onSelect, onEditingChange],
  );

  return (
    <>
      <KonvaText
        ref={textRef}
        x={element.x}
        y={element.y}
        text={isEditing ? "" : element.text || "Double-click to edit"}
        fontSize={element.fontSize || 28}
        fill={element.strokeColor || COLORS.stroke}
        draggable={!isEditing}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          borderStroke={COLORS.selection}
        />
      )}
    </>
  );
};

const StickyShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  onSelect,
  onTransformEnd,
  setTool,
  onEditingChange,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const isEditingRef = useRef(false);
  const width = element.width || 180,
    height = element.height || 180;

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current && !isEditing) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditing]);

  const finishEditing = useCallback(
    (newText: string) => {
      if (!isEditingRef.current) return;
      isEditingRef.current = false;
      setIsEditing(false);
      onEditingChange?.(false);
      onTransformEnd(element.id, { text: newText });
      setTool?.("select");
    },
    [element.id, onTransformEnd, onEditingChange, setTool],
  );

  useEffect(() => {
    if (!isEditing) {
      if (textareaRef.current) {
        textareaRef.current.remove();
        textareaRef.current = null;
      }
      return;
    }
    isEditingRef.current = true;
    if (!groupRef.current) return;
    const stage = groupRef.current.getStage();
    if (!stage) return;
    const stageBox = stage.container().getBoundingClientRect();
    const absPos = groupRef.current.getAbsolutePosition();
    const screenScale = stage.scaleX();
    const textarea = document.createElement("textarea");
    textarea.value = element.text || "";
    textarea.style.cssText = `position:fixed;left:${stageBox.left + absPos.x}px;top:${stageBox.top + absPos.y}px;width:${width * screenScale}px;height:${height * screenScale}px;font-size:${(element.fontSize || 20) * screenScale}px;padding:10px;border:2px solid ${COLORS.selection};background-color:${element.fillColor || "#fef3c7"};z-index:10000;font-family:inherit;resize:none;outline:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);box-sizing:border-box;border-radius:4px;`;
    textarea.addEventListener("mousedown", (e) => e.stopPropagation());
    textarea.addEventListener("pointerdown", (e) => e.stopPropagation());
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        finishEditing(textarea.value);
      } else if (e.key === "Escape") {
        e.stopPropagation();
        finishEditing(element.text || "");
      }
    });
    textarea.addEventListener("blur", () => {
      if (isEditingRef.current) finishEditing(textarea.value);
    });
    document.body.appendChild(textarea);
    textareaRef.current = textarea;
    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 10);
    return () => {
      textarea.remove();
      if (textareaRef.current === textarea) textareaRef.current = null;
    };
  }, [isEditing]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const now = Date.now();
      const isDoubleClick = now - lastClickTimeRef.current < 400;
      lastClickTimeRef.current = now;
      if (isDoubleClick && !isEditing) {
        e.evt.preventDefault();
        e.evt.stopPropagation();
        setIsEditing(true);
        onEditingChange?.(true);
        return;
      }
      if (!isEditing) onSelect(element.id, getShiftKey(e.evt));
    },
    [element.id, onSelect, isEditing, onEditingChange],
  );

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        draggable={!isEditing}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) =>
          onTransformEnd(element.id, { x: e.target.x(), y: e.target.y() })
        }
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
    </>
  );
};

// ─── Bottom-Right Control Panel ───────────────────────────────────────────────
interface ControlPanelProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canvasBg: (typeof CANVAS_BG_COLORS)[0];
  onBgChange: (bg: (typeof CANVAS_BG_COLORS)[0]) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canvasBg,
  onBgChange,
  strokeColor,
  onStrokeColorChange,
  fillColor,
  onFillColorChange,
}) => {
  const [activePopup, setActivePopup] = useState<
    "stroke" | "fill" | "bg" | null
  >(null);

  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  };

  const popupStyle: React.CSSProperties = {
    ...panelStyle,
    position: "absolute",
    bottom: "calc(100% + 8px)",
    right: 0,
    padding: 8,
    display: "grid",
    gap: 5,
    zIndex: 400,
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      {/* Help card */}
      <div
        style={{
          ...panelStyle,
          padding: "10px 14px",
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.75,
          minWidth: 192,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 10,
            color: "#94a3b8",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Controls
        </div>
        {[
          ["Select", "Click shapes"],
          ["Multi-select", "Shift+Click / Drag"],
          ["Pan", "Ctrl/Cmd + Drag"],
          ["Edit text", "Double-click"],
          ["Delete", "Del / Backspace"],
          ["Zoom", "Scroll  or  +  /  −"],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span style={{ fontWeight: 600, color: "#475569" }}>{k}</span>
            <span style={{ color: "#94a3b8", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Color + Zoom bar */}
      <div
        style={{
          ...panelStyle,
          padding: "7px 10px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {/* Stroke swatch */}
        <div style={{ position: "relative" }}>
          <button
            title="Stroke color"
            onMouseEnter={() => setActivePopup("stroke")}
            onMouseLeave={() => setActivePopup(null)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              border: "2.5px solid white",
              outline: `2px solid ${strokeColor === "transparent" ? "#cbd5e1" : strokeColor}`,
              background: strokeColor,
              cursor: "pointer",
              transition: "transform 0.13s",
              display: "block",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.18)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          {activePopup === "stroke" && (
            <div
              onMouseEnter={() => setActivePopup("stroke")}
              onMouseLeave={() => setActivePopup(null)}
              style={{
                ...popupStyle,
                gridTemplateColumns: "repeat(4,1fr)",
                width: 120,
              }}
            >
              <div
                style={{
                  gridColumn: "1/-1",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                Stroke
              </div>
              {ELEMENT_STROKE_COLORS.map((c) => (
                <button
                  key={c.color}
                  title={c.name}
                  onClick={() => onStrokeColorChange(c.color)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: c.color,
                    border:
                      strokeColor === c.color
                        ? "2.5px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    transform:
                      strokeColor === c.color ? "scale(1.22)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Fill swatch */}
        <div style={{ position: "relative" }}>
          <button
            title="Fill color"
            onMouseEnter={() => setActivePopup("fill")}
            onMouseLeave={() => setActivePopup(null)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              border: "2.5px solid white",
              outline: "2px solid #cbd5e1",
              background:
                fillColor === "transparent"
                  ? "linear-gradient(135deg,#fff 42%,#f1f5f9 42%)"
                  : fillColor,
              cursor: "pointer",
              transition: "transform 0.13s",
              display: "block",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.18)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          {activePopup === "fill" && (
            <div
              onMouseEnter={() => setActivePopup("fill")}
              onMouseLeave={() => setActivePopup(null)}
              style={{
                ...popupStyle,
                gridTemplateColumns: "repeat(4,1fr)",
                width: 120,
              }}
            >
              <div
                style={{
                  gridColumn: "1/-1",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                Fill
              </div>
              {ELEMENT_FILL_COLORS.map((c) => (
                <button
                  key={c.color}
                  title={c.name}
                  onClick={() => onFillColorChange(c.color)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background:
                      c.color === "transparent"
                        ? "linear-gradient(135deg,#fff 42%,#f1f5f9 42%)"
                        : c.color,
                    border:
                      fillColor === c.color
                        ? "2.5px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    transform:
                      fillColor === c.color ? "scale(1.22)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* BG swatch */}
        <div style={{ position: "relative" }}>
          <button
            title="Canvas background"
            onMouseEnter={() => setActivePopup("bg")}
            onMouseLeave={() => setActivePopup(null)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              border: "2.5px solid white",
              outline: "2px solid #cbd5e1",
              backgroundImage: `radial-gradient(circle, ${canvasBg.dotColor} 1.5px, ${canvasBg.color} 1.5px)`,
              backgroundSize: "7px 7px",
              cursor: "pointer",
              transition: "transform 0.13s",
              display: "block",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.18)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          {activePopup === "bg" && (
            <div
              onMouseEnter={() => setActivePopup("bg")}
              onMouseLeave={() => setActivePopup(null)}
              style={{
                ...popupStyle,
                gridTemplateColumns: "repeat(3,1fr)",
                width: 96,
              }}
            >
              <div
                style={{
                  gridColumn: "1/-1",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                Canvas
              </div>
              {CANVAS_BG_COLORS.map((bg) => (
                <button
                  key={bg.color}
                  title={bg.name}
                  onClick={() => onBgChange(bg)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundImage: `radial-gradient(circle, ${bg.dotColor} 1.5px, ${bg.color} 1.5px)`,
                    backgroundSize: "7px 7px",
                    border:
                      canvasBg.color === bg.color
                        ? "2.5px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    transform:
                      canvasBg.color === bg.color ? "scale(1.18)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: "#e2e8f0",
            margin: "0 1px",
          }}
        />

        {/* Zoom out */}
        <button
          onClick={onZoomOut}
          title="Zoom out (−)"
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1,
            transition: "background 0.1s,color 0.1s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#1e293b";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          −
        </button>

        {/* Zoom % */}
        <button
          onClick={onResetZoom}
          title="Reset zoom (Ctrl+0)"
          style={{
            minWidth: 38,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#475569",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.02em",
            transition: "background 0.1s",
            padding: "0 3px",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom in */}
        <button
          onClick={onZoomIn}
          title="Zoom in (+)"
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1,
            transition: "background 0.1s,color 0.1s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#1e293b";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

// ─── Main Canvas ──────────────────────────────────────────────────────────────
export default function Canvas() {
  const {
    elements,
    selectedTool,
    selectedElementId,
    selectedElementIds,
    addElement,
    updateElement,
    selectElement,
    selectElements,
    deleteElement,
    deleteSelected,
    setTool,
    stickyNoteColor,
    elementStrokeColor,
    elementFillColor,
    setStickyNoteColor,
    setElementStrokeColor,
    setElementFillColor,
  } = useStore();

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] =
    useState<Partial<WhiteboardElement> | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [canvasBg, setCanvasBg] = useState(CANVAS_BG_COLORS[0]);

  const isAnyTextEditingRef = useRef(false);
  const handleEditingChange = useCallback((editing: boolean) => {
    isAnyTextEditingRef.current = editing;
  }, []);

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

  const applyZoom = useCallback(
    (newScaleRaw: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const newScale = Math.max(0.3, Math.min(4, newScaleRaw));
      const pointer = stage.getPointerPosition() ?? {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };
      const oldScale = scale;
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

  const handleZoomIn = useCallback(
    () => applyZoom(scale + 0.15),
    [scale, applyZoom],
  );
  const handleZoomOut = useCallback(
    () => applyZoom(scale - 0.15),
    [scale, applyZoom],
  );
  const handleResetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    setScale(1);
    setPosition({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = useStore.getState();
        if (s.selectedElementIds.length > 0) s.deleteSelected();
        else if (s.selectedElementId) s.deleteElement(s.selectedElementId);
      }
      if ((e.key === "=" || e.key === "+") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === "-" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isAnyTextEditingRef.current) return;
      if (e.evt.ctrlKey || e.evt.metaKey) {
        setIsDraggingStage(true);
        lastPosRef.current = stageRef.current?.getPointerPosition() ?? null;
        e.evt.preventDefault();
        return;
      }
      if (selectedTool === "select") {
        if (e.target !== e.target.getStage()) return;
        const pos = getMousePos();
        drawStartRef.current = pos;
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
        setIsDrawing(true);
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
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
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
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
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
          strokeColor: elementStrokeColor,
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
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
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
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
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
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        } as Partial<WhiteboardElement>);
        setIsDrawing(true);
      } else if (selectedTool === "pencil") {
        setCurrentElement({
          id: `pencil-${Date.now()}`,
          type: "pencil",
          x: 0,
          y: 0,
          points: [{ x: pos.x, y: pos.y }],
          strokeColor: elementStrokeColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "text") {
        if (e.target !== e.target.getStage()) return;
        const newEl = {
          id: `text-${Date.now()}`,
          type: "text" as const,
          x: pos.x,
          y: pos.y,
          text: "Text",
          fontSize: 28,
          strokeColor: elementStrokeColor,
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setTool("select");
      } else if (selectedTool === "sticky") {
        if (e.target !== e.target.getStage()) return;
        const newEl = {
          id: `sticky-${Date.now()}`,
          type: "sticky" as const,
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 150,
          text: "Note",
          fillColor: stickyNoteColor,
          strokeColor: getStickyNoteStrokeColor(stickyNoteColor),
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setTool("select");
      }
    },
    [
      selectedTool,
      addElement,
      selectElement,
      setTool,
      getMousePos,
      elementStrokeColor,
      elementFillColor,
      stickyNoteColor,
    ],
  );

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
      if (!isDrawing) return;
      const pos = getMousePos();
      const start = drawStartRef.current;
      if (selectedTool === "select") {
        setSelectionBox({
          x: Math.min(pos.x, start.x),
          y: Math.min(pos.y, start.y),
          width: Math.abs(pos.x - start.x),
          height: Math.abs(pos.y - start.y),
        });
        return;
      }
      if (!currentElement) return;
      if (
        ["rectangle", "circle", "triangle", "diamond", "polygon"].includes(
          selectedTool,
        )
      ) {
        setCurrentElement((prev) =>
          prev
            ? {
                ...prev,
                x: Math.min(pos.x, start.x),
                y: Math.min(pos.y, start.y),
                width: Math.abs(pos.x - start.x),
                height: Math.abs(pos.y - start.y),
              }
            : prev,
        );
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentElement((prev) => {
          if (!prev) return prev;
          const pts = prev.points ? [...prev.points] : [];
          pts[1] = { x: pos.x, y: pos.y };
          return { ...prev, points: pts };
        });
      } else if (selectedTool === "pencil") {
        setCurrentElement((prev) =>
          prev
            ? {
                ...prev,
                points: [...(prev.points || []), { x: pos.x, y: pos.y }],
              }
            : prev,
        );
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

  const elementIntersectsBox = useCallback(
    (
      element: WhiteboardElement,
      box: { x: number; y: number; width: number; height: number },
    ): boolean => {
      const boxRight = box.x + box.width,
        boxBottom = box.y + box.height;
      if (element.points && element.points.length > 0) {
        for (const point of element.points) {
          if (
            point.x >= box.x &&
            point.x <= boxRight &&
            point.y >= box.y &&
            point.y <= boxBottom
          )
            return true;
        }
        const minX = Math.min(...element.points.map((p) => p.x)),
          maxX = Math.max(...element.points.map((p) => p.x));
        const minY = Math.min(...element.points.map((p) => p.y)),
          maxY = Math.max(...element.points.map((p) => p.y));
        return !(
          boxRight < minX ||
          box.x > maxX ||
          boxBottom < minY ||
          box.y > maxY
        );
      }
      const elRight = (element.x || 0) + (element.width || 0),
        elBottom = (element.y || 0) + (element.height || 0);
      return !(
        boxRight < (element.x || 0) ||
        box.x > elRight ||
        boxBottom < (element.y || 0) ||
        box.y > elBottom
      );
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingStage) {
      setIsDraggingStage(false);
      lastPosRef.current = null;
      return;
    }
    if (selectedTool === "select" && selectionBox) {
      if (selectionBox.width > 5 || selectionBox.height > 5) {
        const selectedIds = elements
          .filter((el) => elementIntersectsBox(el, selectionBox))
          .map((el) => el.id);
        if (selectedIds.length > 0) selectElements(selectedIds);
        else selectElement(null);
      } else {
        selectElement(null);
      }
      setSelectionBox(null);
      setIsDrawing(false);
      return;
    }
    if (!isDrawing || !currentElement) return;
    if (
      ["rectangle", "circle", "triangle", "diamond"].includes(
        currentElement.type || "",
      )
    ) {
      if ((currentElement.width || 0) > 5 && (currentElement.height || 0) > 5)
        addElement(currentElement as WhiteboardElement);
    } else if (
      ["line", "arrow", "pencil"].includes(currentElement.type || "")
    ) {
      addElement(currentElement as WhiteboardElement);
    } else if (currentElement.type === "polygon") {
      const sides = (currentElement as any).sides || 6;
      const w = currentElement.width || 0,
        h = currentElement.height || 0;
      const cx = (currentElement.x || 0) + w / 2,
        cy = (currentElement.y || 0) + h / 2,
        r = Math.min(w, h) / 2;
      const points = Array.from({ length: sides }).map((_, i) => {
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
  }, [
    isDraggingStage,
    isDrawing,
    currentElement,
    selectedTool,
    selectionBox,
    elements,
    elementIntersectsBox,
    selectElement,
    selectElements,
    addElement,
  ]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      applyZoom(scale + direction * 0.1);
    },
    [scale, applyZoom],
  );

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{
        backgroundImage: `radial-gradient(circle, ${canvasBg.dotColor} 1.2px, transparent 1.2px)`,
        backgroundSize: "26px 26px",
        backgroundColor: canvasBg.color,
        transition: "background-color 0.3s",
      }}
    >
      {/* Soft vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.035) 100%)",
          zIndex: 1,
        }}
      />

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
          zIndex: 2,
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
                <PolygonShape
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
                  setTool={setTool}
                  onEditingChange={handleEditingChange}
                />
              )}
              {element.type === "sticky" && (
                <StickyShape
                  element={element}
                  isSelected={selectedElementIds.includes(element.id)}
                  onSelect={selectElement}
                  onTransformEnd={updateElement}
                  setTool={setTool}
                  onEditingChange={handleEditingChange}
                />
              )}
            </React.Fragment>
          ))}

          {isDrawing && selectedTool === "select" && selectionBox && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              stroke={COLORS.selection}
              strokeWidth={2}
              fill={COLORS.selectionFill}
              dash={[5, 5]}
              listening={false}
            />
          )}

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
                  points={(currentElement.points || []).flatMap((p) => [
                    p.x,
                    p.y,
                  ])}
                  stroke={COLORS.selection}
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.7}
                  listening={false}
                />
              )}
              {currentElement.type === "triangle" &&
                (() => {
                  const w = currentElement.width || 0,
                    h = currentElement.height || 0;
                  return (
                    <Line
                      closed
                      points={[
                        currentElement.x! + w / 2,
                        currentElement.y!,
                        currentElement.x! + w,
                        currentElement.y! + h,
                        currentElement.x!,
                        currentElement.y! + h,
                      ]}
                      stroke={COLORS.selection}
                      strokeWidth={2}
                      fill={COLORS.selectionFill}
                      opacity={0.7}
                      listening={false}
                    />
                  );
                })()}
              {currentElement.type === "diamond" &&
                (() => {
                  const w = currentElement.width || 0,
                    h = currentElement.height || 0;
                  return (
                    <Line
                      closed
                      points={[
                        currentElement.x! + w / 2,
                        currentElement.y!,
                        currentElement.x! + w,
                        currentElement.y! + h / 2,
                        currentElement.x! + w / 2,
                        currentElement.y! + h,
                        currentElement.x!,
                        currentElement.y! + h / 2,
                      ]}
                      stroke={COLORS.selection}
                      strokeWidth={2}
                      fill={COLORS.selectionFill}
                      opacity={0.7}
                      listening={false}
                    />
                  );
                })()}
              {currentElement.type === "polygon" &&
                (() => {
                  const sides = (currentElement as any).sides || 6,
                    w = currentElement.width || 0,
                    h = currentElement.height || 0;
                  const cx = (currentElement.x || 0) + w / 2,
                    cy = (currentElement.y || 0) + h / 2,
                    r = Math.min(w, h) / 2;
                  const pts: number[] = [];
                  for (let i = 0; i < sides; i++) {
                    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
                    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                  }
                  return (
                    <Line
                      closed
                      points={pts}
                      stroke={COLORS.selection}
                      strokeWidth={2}
                      fill={COLORS.selectionFill}
                      opacity={0.7}
                      listening={false}
                    />
                  );
                })()}
              {currentElement.type === "pencil" && (
                <Line
                  points={(currentElement.points || []).flatMap((p) => [
                    p.x,
                    p.y,
                  ])}
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

      <ControlPanel
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        canvasBg={canvasBg}
        onBgChange={setCanvasBg}
        strokeColor={elementStrokeColor}
        onStrokeColorChange={setElementStrokeColor}
        fillColor={elementFillColor}
        onFillColorChange={setElementFillColor}
      />
    </div>
  );
}
