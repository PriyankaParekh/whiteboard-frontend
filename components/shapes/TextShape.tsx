"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Transformer, Rect } from "react-konva";
import Konva from "konva";
import { ShapeProps, getShiftKey, COLORS } from "./shared";
import QuillEditorModal from "../QuillEditorModal";

// Minimum size so brand-new elements are clickable before content is measured
const MIN_W = 60;
const MIN_H = 28;

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
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const lastClickTimeRef = useRef(0);

  // Use whatever size the overlay measured and stored, or a small default
  const elW = Math.max(MIN_W, element.width || MIN_W);
  const elH = Math.max(MIN_H, element.height || MIN_H);

  // Attach transformer whenever single-selected and not editing
  useEffect(() => {
    if (isSingleSelected && !isEditing && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected, isEditing, elW, elH]); // re-attach when size changes

  const finishEditing = useCallback(
    (html: string, plainText: string) => {
      setIsEditing(false);
      onEditingChange?.(false);
      // Save content — width/height will be updated by ResizeObserver in overlay
      onTransformEnd(element.id, {
        text: plainText || " ",
        htmlText: html,
      });
      setTool?.("select");
    },
    [element.id, onTransformEnd, onEditingChange, setTool],
  );

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    onEditingChange?.(false);
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

  const handleTransformEnd = useCallback(
    (_e: Konva.KonvaEventObject<Event>) => {
      const node = rectRef.current;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const newW = Math.max(MIN_W, elW * scaleX);
      const newH = Math.max(MIN_H, elH * scaleY);
      // Scale font proportionally
      const fontScale = Math.max(scaleX, scaleY);
      const newFontSize = Math.max(8, (element.fontSize || 28) * fontScale);
      node.scaleX(1);
      node.scaleY(1);
      onTransformEnd(element.id, {
        x: node.x(),
        y: node.y(),
        width: newW,
        height: newH,
        fontSize: newFontSize,
        scaleX: 1,
        scaleY: 1,
        rotation: node.rotation(),
      });
    },
    [element.id, element.fontSize, elW, elH, onTransformEnd],
  );

  return (
    <>
      {/*
        Invisible Rect — its size mirrors element.width/height which the
        ResizeObserver in RichTextOverlayEl keeps in sync with actual content.
        This means the Transformer box always wraps the content perfectly.
      */}
      <Rect
        ref={rectRef}
        x={element.x}
        y={element.y}
        width={elW}
        height={elH}
        scaleX={element.scaleX || 1}
        scaleY={element.scaleY || 1}
        rotation={element.rotation || 0}
        fill="transparent"
        stroke="transparent"
        strokeWidth={0}
        draggable={isSingleSelected || (isSelected && !isSingleSelected)}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) => {
          const nx = e.target.x();
          const ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
        onTransformEnd={handleTransformEnd}
      />

      {/* Multi-select: dashed outline sized to content */}
      {isSelected && !isSingleSelected && (
        <Rect
          x={element.x - 3}
          y={element.y - 3}
          width={elW + 6}
          height={elH + 6}
          fill="transparent"
          stroke={COLORS.selection}
          strokeWidth={1.5}
          dash={[4, 3]}
          cornerRadius={3}
          listening={false}
        />
      )}

      {/* Single-select: Transformer with resize handles */}
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
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < MIN_W || newBox.height < MIN_H) return oldBox;
            return newBox;
          }}
        />
      )}

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
