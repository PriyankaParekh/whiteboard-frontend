"use client";

import React, { useRef, useEffect } from "react";
import { Circle, Transformer, Text as KonvaText, Group } from "react-konva";
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
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const radius = Math.max(element.width || 50, element.height || 50) / 2;

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
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
          const node = groupRef.current;
          if (node) {
            const newRadius = radius * node.scaleX();
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(10, newRadius * 2),
              height: Math.max(10, newRadius * 2),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      >
        <Circle
          x={radius}
          y={radius}
          radius={radius}
          stroke={
            isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
          }
          strokeWidth={element.strokeWidth || 2}
          fill={element.fillColor || COLORS.fill}
        />
        {element.text ? (
          <KonvaText
            x={0}
            y={0}
            width={radius * 2}
            height={radius * 2}
            text={element.text}
            fontSize={element.fontSize || 13}
            fill="#1e293b"
            align="center"
            verticalAlign="middle"
            wrap="word"
            ellipsis
            listening={false}
          />
        ) : null}
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

export default CircleShape;
