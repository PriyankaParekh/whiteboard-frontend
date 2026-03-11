"use client";

import React, { useRef, useEffect } from "react";
import { Rect, Transformer, Text as KonvaText, Group } from "react-konva";
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
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSingleSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const width = element.width || 0;
  const height = element.height || 0;

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
            onTransformEnd(element.id, {
              x: node.x(),
              y: node.y(),
              width: Math.max(5, width * node.scaleX()),
              height: Math.max(5, height * node.scaleY()),
            });
            node.scaleX(1);
            node.scaleY(1);
          }
        }}
      >
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          stroke={
            isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
          }
          strokeWidth={element.strokeWidth || 2}
          fill={element.fillColor || COLORS.fill}
          cornerRadius={4}
        />
        {element.text ? (
          <KonvaText
            x={6}
            y={6}
            width={Math.max(0, width - 12)}
            height={Math.max(0, height - 12)}
            text={element.text}
            fontSize={element.fontSize || 14}
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

export default RectShape;
