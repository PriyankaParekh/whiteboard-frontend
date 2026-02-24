"use client";

import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const PencilShape: React.FC<ShapeProps> = ({
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

  return (
    <>
      <Line
        ref={lineRef}
        points={points.flatMap((p) => [p.x, p.y])}
        stroke={
          isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
        }
        strokeWidth={element.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        draggable={isSelected}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const node = lineRef.current;
          if (node && element.points) {
            const dx = node.x(),
              dy = node.y();
            onTransformEnd(element.id, {
              x: 0,
              y: 0,
              points: element.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            });
            node.x(0);
            node.y(0);
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

export default PencilShape;
