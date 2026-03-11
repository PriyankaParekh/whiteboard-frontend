"use client";

import React, { useRef, useEffect } from "react";
import { Line, Transformer, Text as KonvaText, Group } from "react-konva";
import Konva from "konva";
import { ShapeProps } from "./shared";
import { COLORS, getShiftKey } from "./shared";

const DiamondShape: React.FC<ShapeProps> = ({
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

  const width = element.width || 100;
  const height = element.height || 100;

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
        <Line
          x={0}
          y={0}
          points={[
            width / 2,
            0,
            width,
            height / 2,
            width / 2,
            height,
            0,
            height / 2,
          ]}
          closed
          stroke={
            isSelected ? COLORS.selection : element.strokeColor || COLORS.stroke
          }
          strokeWidth={element.strokeWidth || 2}
          fill={element.fillColor || COLORS.fill}
        />
        {element.text ? (
          <KonvaText
            x={width * 0.2}
            y={height * 0.25}
            width={width * 0.6}
            height={height * 0.5}
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

export default DiamondShape;
