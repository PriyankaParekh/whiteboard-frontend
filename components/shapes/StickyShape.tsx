"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Group, Rect, Transformer, Text as KonvaText } from "react-konva";
import Konva from "konva";
import { ShapeProps, getShiftKey, getStickyNoteStrokeColor } from "./shared";
import { COLORS } from "./shared";

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
  const width = element.width || 180,
    height = element.height || 180;

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
        draggable={isSingleSelected}
        onClick={handleClick}
        onTap={handleClick}
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
          fill={element.fillColor || "#fef3c7"}
          stroke={
            isSelected && !isSingleSelected
              ? COLORS.selection
              : element.strokeColor ||
                getStickyNoteStrokeColor(element.fillColor || "#fef3c7")
          }
          strokeWidth={isSelected && !isSingleSelected ? 2.5 : 1.5}
          cornerRadius={6}
          shadowColor="rgba(0,0,0,0.08)"
          shadowBlur={8}
          shadowOffset={{ x: 2, y: 2 }}
        />
        <KonvaText
          x={10}
          y={10}
          width={width - 20}
          height={height - 20}
          text={element.text || "Note"}
          fontSize={element.fontSize || 20}
          fill="#374151"
          wrap="word"
          ellipsis
        />
        {isSelected && !isEditing && (
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
      </Group>
    </>
  );
};

export default StickyShape;
