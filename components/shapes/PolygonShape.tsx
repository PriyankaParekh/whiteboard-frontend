"use client";

import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const PolygonShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const lineRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const points = element.points || [];
  if (points.length === 0) return null;

  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const relativePoints = points.map((p) => [p.x - minX, p.y - minY]).flat();

  return (
    <>
      <Line
        ref={lineRef}
        x={minX}
        y={minY}
        points={relativePoints}
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

export default PolygonShape;
