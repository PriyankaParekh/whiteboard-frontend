"use client";

import React, { useRef, useEffect } from "react";
import { Group, Line, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps, computeArrowHead } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const ArrowShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const points = element.points || [];

  return (
    <>
      <Group
        ref={groupRef}
        draggable={isSingleSelected}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const nx = e.target.x(),
            ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
      >
        <Line
          points={points.flatMap((p) => [p.x, p.y])}
          stroke={
            isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
          }
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
            stroke={
              isSelected
                ? COLORS.selection
                : element.strokeColor || COLORS.stroke
            }
            strokeWidth={element.strokeWidth || 2}
            fill={element.strokeColor || COLORS.stroke}
            closed
          />
        )}
      </Group>
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

export default ArrowShape;
