"use client";

import React, { useRef, useEffect } from "react";
import { Rect, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS } from "./shared";
import { getShiftKey } from "./shared";

const RectShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  return (
    <>
      <Rect
        ref={rectRef}
        x={element.x}
        y={element.y}
        width={element.width || 0}
        height={element.height || 0}
        stroke={
          isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
        }
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        cornerRadius={4}
        draggable={isSelected}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const nx = e.target.x(),
            ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
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
      {isSingleSelected && (
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

export default RectShape;
