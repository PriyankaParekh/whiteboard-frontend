"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Group, Rect, Transformer, Text as KonvaText } from "react-konva";
import Konva from "konva";
import { ShapeProps, getShiftKey, getStickyNoteStrokeColor } from "./shared";
import { COLORS } from "./shared";

// ── Parse any color string → { r, g, b, a } ─────────────────────────────────
function parseColor(
  color: string,
): { r: number; g: number; b: number; a: number } | null {
  if (!color) return null;

  // rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/,
  );
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  // #rrggbb or #rgb
  const hex = color.replace("#", "");
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }
  return null;
}

// ── Decide text color based on fill ─────────────────────────────────────────
// For rgba with low alpha (dark mode fills like rgba(x,y,z,0.15)):
// the actual rendered color blends with dark canvas bg (~#0d1117).
// So we always use light text for low-alpha fills on dark canvas.
function getTextColorForFill(fillColor: string): string {
  if (!fillColor || fillColor === "transparent") return "#e2e8f0"; // transparent = dark bg = light text

  const parsed = parseColor(fillColor);
  if (!parsed) return "#1e293b";

  // Low alpha fill (dark mode rgba fills) → dark background shows through → light text
  if (parsed.a < 0.5) return "#f1f5f9";

  // Solid or high-opacity color → compute luminance
  const toLinear = (c: number) => {
    const n = c / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * toLinear(parsed.r) +
    0.7152 * toLinear(parsed.g) +
    0.0722 * toLinear(parsed.b);

  // Dark fill → light text, Light fill → dark text
  return L < 0.35 ? "#f1f5f9" : "#1e293b";
}

const StickyShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
  setTool,
  onEditingChange,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef(0);
  const isEditingRef = useRef(false);

  const width = element.width || 180;
  const height = element.height || 180;
  const fillColor = element.fillColor || "#fef3c7";
  const textColor = getTextColorForFill(fillColor);

  useEffect(() => {
    if (isSingleSelected && trRef.current && groupRef.current && !isEditing) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected, isEditing]);

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
    textarea.style.cssText = `
      position:fixed;
      left:${stageBox.left + absPos.x}px;
      top:${stageBox.top + absPos.y}px;
      width:${width * screenScale}px;
      height:${height * screenScale}px;
      font-size:${(element.fontSize || 16) * screenScale}px;
      padding:10px;
      border:2px solid ${COLORS.selection};
      background-color:${fillColor};
      color:${textColor};
      caret-color:${textColor};
      z-index:10000;
      font-family:inherit;
      resize:none;
      outline:none;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);
      box-sizing:border-box;
      border-radius:4px;
      line-height:1.45;
    `;
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

  const handleContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      onSelect(element.id, false);
      window.dispatchEvent(
        new CustomEvent("wb_ai_text_menu", {
          detail: {
            x: e.evt.clientX,
            y: e.evt.clientY,
            elementId: element.id,
            text: element.text || "",
            elementType: "sticky",
          },
        }),
      );
    },
    [element.id, element.text, onSelect],
  );

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        draggable={isSingleSelected}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={handleContextMenu}
        onDragEnd={(e) => {
          const nx = e.target.x(),
            ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
      >
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fillColor}
          stroke={
            isSelected && !isSingleSelected
              ? COLORS.selection
              : element.strokeColor || getStickyNoteStrokeColor(fillColor)
          }
          strokeWidth={isSelected && !isSingleSelected ? 2.5 : 1.5}
          cornerRadius={6}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={8}
          shadowOffset={{ x: 2, y: 2 }}
        />
        <KonvaText
          x={10}
          y={10}
          width={width - 20}
          height={height - 20}
          text={element.text || "Note"}
          fontSize={element.fontSize || 16}
          fill={textColor}
          wrap="word"
          ellipsis
          lineHeight={1.45}
        />
      </Group>

      {isSingleSelected && !isEditing && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          borderStroke={COLORS.selection}
          borderStrokeWidth={1.5}
          anchorStroke={COLORS.selection}
          anchorFill="white"
          anchorSize={8}
          anchorCornerRadius={2}
          onTransformEnd={() => {
            const node = groupRef.current;
            if (!node) return;
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(60, width * node.scaleX()),
              height: Math.max(60, height * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }}
        />
      )}
    </>
  );
};

export default StickyShape;
