"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Transformer, Rect } from "react-konva";
import Konva from "konva";
import { Text as KonvaText } from "react-konva";
import { ShapeProps, getShiftKey, COLORS } from "./shared";

const TextShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
  setTool,
  onEditingChange,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef(0);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isSingleSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
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
      {isSelected && !isSingleSelected && (
        <Rect
          x={element.x - 4}
          y={element.y - 4}
          width={(textRef.current?.width() || 100) + 8}
          height={(textRef.current?.height() || 36) + 8}
          fill="transparent"
          stroke={COLORS.selection}
          strokeWidth={1.5}
          dash={[4, 3]}
          cornerRadius={3}
          listening={false}
        />
      )}
      <KonvaText
        ref={textRef}
        x={element.x}
        y={element.y}
        text={element.text || "Text"}
        fontSize={element.fontSize || 28}
        fill={element.strokeColor || "#1e293b"}
        draggable={isSingleSelected}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) => {
          const nx = e.target.x(),
            ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
      />
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
        />
      )}
    </>
  );
};

export default TextShape;
