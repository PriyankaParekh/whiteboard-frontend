"use client";

import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const TriangleShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const polyRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && polyRef.current) {
      trRef.current.nodes([polyRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const width = element.width || 100,
    height = element.height || 100;

  return (
    <>
      <Line
        ref={polyRef}
        x={element.x}
        y={element.y}
        points={[width / 2, 0, width, height, 0, height]}
        closed
        stroke={
          isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
        }
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
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

export default TriangleShape;
