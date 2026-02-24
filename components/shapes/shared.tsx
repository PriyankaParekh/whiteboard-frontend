"use client";

import React from "react";
import Konva from "konva";
import { WhiteboardElement, ToolType } from "../../store/useStore";
import {
  COLORS,
  STICKY_NOTE_COLORS,
  getStickyNoteStrokeColor,
} from "../../utils/constant";

export { COLORS, STICKY_NOTE_COLORS, getStickyNoteStrokeColor };

export interface ShapeProps {
  element: WhiteboardElement;
  isSelected: boolean;
  isSingleSelected: boolean;
  onSelect: (id: string | null, additive?: boolean) => void;
  onTransformEnd: (id: string, newAttrs: Partial<WhiteboardElement>) => void;
  onMultiDragEnd?: (id: string, newX: number, newY: number) => void;
  setTool?: (tool: ToolType) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export function getShiftKey(evt: MouseEvent | TouchEvent): boolean {
  return (evt as MouseEvent).shiftKey ?? false;
}

export function computeArrowHead(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const size = 12;
  const hx = b.x - ux * size,
    hy = b.y - uy * size;
  const px = -uy * (size * 0.6),
    py = ux * (size * 0.6);
  return [b.x, b.y, hx + px, hy + py, hx - px, hy - py];
}

export type { WhiteboardElement, ToolType };
