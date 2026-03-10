"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Image as KonvaImage, Transformer, Rect } from "react-konva";
import Konva from "konva";
import { ShapeProps, getShiftKey, COLORS } from "./shared";

const MIN_W = 20;
const MIN_H = 20;

const ImageShape: React.FC<ShapeProps> = ({
  element,
  isSelected,
  isSingleSelected,
  onSelect,
  onTransformEnd,
  onMultiDragEnd,
}) => {
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!element.src) return;
    const image = new window.Image();
    image.src = element.src;
    image.onload = () => setImg(image);
  }, [element.src]);

  useEffect(() => {
    const tr = trRef.current;
    const node = imageRef.current;
    if (!tr || !node) return;
    if (isSingleSelected) {
      if (node.getLayer()) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
      }
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [isSingleSelected]);

  const handleTransformEnd = useCallback(() => {
    const node = imageRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(MIN_W, (element.width ?? 200) * scaleX),
      height: Math.max(MIN_H, (element.height ?? 200) * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const elW = element.width ?? 200;
  const elH = element.height ?? 200;

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={img ?? undefined}
        x={element.x}
        y={element.y}
        width={elW}
        height={elH}
        rotation={element.rotation ?? 0}
        draggable={isSingleSelected}
        onClick={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onTap={(e) => onSelect(element.id, getShiftKey(e.evt))}
        onDragEnd={(e) => {
          const nx = e.target.x();
          const ny = e.target.y();
          if (onMultiDragEnd) onMultiDragEnd(element.id, nx, ny);
          else onTransformEnd(element.id, { x: nx, y: ny });
        }}
        onTransformEnd={handleTransformEnd}
        cornerRadius={element.cornerRadius ?? 0}
        opacity={element.opacity ?? 1}
        shadowEnabled={false}
        perfectDrawEnabled={false}
      />

      {/* Multi-select outline */}
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

      <Transformer
        ref={trRef}
        rotateEnabled={true}
        borderStroke={COLORS.selection}
        borderStrokeWidth={1.5}
        anchorStroke={COLORS.selection}
        anchorFill="white"
        anchorSize={8}
        anchorCornerRadius={2}
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < MIN_W || newBox.height < MIN_H) return oldBox;
          return newBox;
        }}
        visible={isSingleSelected}
      />
    </>
  );
};

export default ImageShape;
