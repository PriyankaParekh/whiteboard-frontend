"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Transformer, Rect } from "react-konva";
import Konva from "konva";
import { Text as KonvaText } from "react-konva";
import { ShapeProps, getShiftKey, COLORS } from "./shared";
import QuillEditorModal from "../QuillEditorModal";

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
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    if (isSingleSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected, isEditing]);

  const finishEditing = useCallback(
    (html: string, plainText: string) => {
      setIsEditing(false);
      onEditingChange?.(false);
      onTransformEnd(element.id, { text: plainText || " ", htmlText: html });
      setTool?.("select");
    },
    [element.id, onTransformEnd, onEditingChange, setTool],
  );

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    onEditingChange?.(false);
    // If this is a brand-new element with no text yet, keep the default
    setTool?.("select");
  }, [onEditingChange, setTool]);

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

  // Plain text to display in the Konva node (used for positioning/sizing when no HTML)
  const displayText = element.text || "Text";

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
        scaleX={element.scaleX || 1}
        scaleY={element.scaleY || 1}
        rotation={element.rotation || 0}
        text={element.htmlText ? displayText : displayText}
        fontSize={element.fontSize || 28}
        fill={
          element.htmlText ? "transparent" : element.strokeColor || "#1e293b"
        }
        opacity={element.htmlText ? 0.01 : 1}
        draggable={isSingleSelected}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) => {
          const nx = e.target.x(),
            ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          onTransformEnd(element.id, {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
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

      {/* Quill Editor Modal — rendered into document.body via portal */}
      {isEditing && (
        <QuillEditorModal
          initialHtml={element.htmlText || ""}
          onSave={finishEditing}
          onClose={cancelEditing}
        />
      )}
    </>
  );
};

export default TextShape;
