"use client";

import React, { useRef, useEffect } from "react";
import { Circle, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const CircleShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const circleRef = useRef<Konva.Circle>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && circleRef.current) {
      trRef.current.nodes([circleRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const radius = Math.max(element.width || 50, element.height || 50) / 2;

  return (
    <>
      <Circle
        ref={circleRef}
        x={element.x + radius}
        y={element.y + radius}
        radius={radius}
        stroke={
          isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
        }
        strokeWidth={element.strokeWidth || 2}
        fill={element.fillColor || COLORS.fill}
        draggable={isSelected}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const nx = e.target.x() - radius,
            ny = e.target.y() - radius;
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
        onTransformEnd={() => {
          const node = circleRef.current;
          if (node) {
            const newRadius = node.radius() * node.scaleX();
            onTransformEnd(element.id, {
              x: node.x() - newRadius,
              y: node.y() - newRadius,
              width: Math.max(10, newRadius * 2),
              height: Math.max(10, newRadius * 2),
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

export default CircleShape;
