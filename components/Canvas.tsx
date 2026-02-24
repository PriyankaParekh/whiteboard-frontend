"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Line,
  Transformer,
  Group,
  Text as KonvaText,
} from "react-konva";
import Konva from "konva";
import { useStore, WhiteboardElement, ToolType } from "../store/useStore";
import Toolbar from "./Toolbar";
import { socket } from "@/socket/connection";
import {
  RectShape,
  CircleShape,
  LineShape,
  ArrowShape,
  TriangleShape,
  DiamondShape,
  PolygonShape,
  PencilShape,
  TextShape,
  StickyShape,
} from "./shapes";
import {
  COLORS,
  ELEMENT_STROKE_COLORS,
  ELEMENT_FILL_COLORS,
  CANVAS_BG_COLORS,
  getStickyNoteStrokeColor,
} from "../utils/constant";

// moved constants are imported from ../utils/constant

// ─── Unified Multi-Select Box ─────────────────────────────────────────────────
// Renders one dashed bounding box around ALL selected elements + handles group drag
interface MultiSelectBoxProps {
  elements: WhiteboardElement[];
  selectedIds: string[];
  onDragAll: (dx: number, dy: number) => void;
  onSelect: (id: string | null) => void;
  onFlush?: () => void;
  updateElement?: (id: string, attrs: Partial<WhiteboardElement>) => void;
}

const MultiSelectBox: React.FC<MultiSelectBoxProps> = ({
  elements,
  selectedIds,
  onDragAll,
  onSelect,
  onFlush,
  updateElement: updateElementProp,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const PADDING = 12; // increased padding to account for stroke width

  // Compute bounding box of all selected elements
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const selectedEls = elements.filter((el) => selectedIds.includes(el.id));

  for (const el of selectedEls) {
    const strokeWidth = el.strokeWidth || 2;
    const strokePadding = Math.ceil(strokeWidth / 2) + 2; // account for half stroke + small buffer

    if (el.type === "circle") {
      // Circle: x and y are stored as top-left corner in element data
      // but width/height define the bounding box
      const x = el.x ?? 0,
        y = el.y ?? 0;
      const w = el.width ?? 100,
        h = el.height ?? 100;
      minX = Math.min(minX, x - strokePadding);
      minY = Math.min(minY, y - strokePadding);
      maxX = Math.max(maxX, x + w + strokePadding);
      maxY = Math.max(maxY, y + h + strokePadding);
    } else if (el.points && el.points.length > 0) {
      // For elements with points (polygon, arrow, line, pencil)
      // need to account for stroke width extending beyond points
      for (const p of el.points) {
        minX = Math.min(minX, p.x - strokePadding);
        minY = Math.min(minY, p.y - strokePadding);
        maxX = Math.max(maxX, p.x + strokePadding);
        maxY = Math.max(maxY, p.y + strokePadding);
      }
    } else if (el.type === "text") {
      // Text: use x, y and estimate dimensions from fontSize and text length
      const x = el.x ?? 0,
        y = el.y ?? 0;
      const fontSize = el.fontSize || 28;
      const textLength = (el.text || "Text").length;
      const estimatedWidth = Math.max(textLength * (fontSize * 0.6), 100);
      const estimatedHeight = fontSize + 8;
      minX = Math.min(minX, x - strokePadding);
      minY = Math.min(minY, y - strokePadding);
      maxX = Math.max(maxX, x + estimatedWidth + strokePadding);
      maxY = Math.max(maxY, y + estimatedHeight + strokePadding);
    } else {
      // Default for rectangles, triangles, diamonds, sticky notes
      const x = el.x ?? 0,
        y = el.y ?? 0;
      const w = el.width ?? 60,
        h = el.height ?? 60;
      minX = Math.min(minX, x - strokePadding);
      minY = Math.min(minY, y - strokePadding);
      maxX = Math.max(maxX, x + w + strokePadding);
      maxY = Math.max(maxY, y + h + strokePadding);
    }
  }

  if (!isFinite(minX)) return null;

  const boxX = minX - PADDING;
  const boxY = minY - PADDING;
  const boxW = maxX - minX + PADDING * 2;
  const boxH = maxY - minY + PADDING * 2;

  // Attach transformer to rect when there are selected elements
  useEffect(() => {
    if (rectRef.current && trRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds.length]);

  // Handle resizing all selected elements together
  const handleGroupTransformEnd = () => {
    const node = rectRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Get the original bounding box (before scaling)
    const origBoxX = boxX;
    const origBoxY = boxY;
    const origBoxW = boxW;
    const origBoxH = boxH;

    // Center of the original bounding box
    const centerX = origBoxX + origBoxW / 2;
    const centerY = origBoxY + origBoxH / 2;

    // Update all selected elements with scaled dimensions
    const updateEl = updateElementProp || useStore.getState().updateElement;
    for (const el of selectedEls) {
      let newAttrs: Partial<WhiteboardElement> = {};

      if (
        el.type === "circle" ||
        el.type === "rectangle" ||
        el.type === "sticky"
      ) {
        // Scale width and height
        const w = el.width ?? 60;
        const h = el.height ?? 60;
        newAttrs.width = Math.max(10, w * scaleX);
        newAttrs.height = Math.max(10, h * scaleY);

        // Scale position relative to center
        const x = el.x ?? 0;
        const y = el.y ?? 0;
        const relX = x - centerX;
        const relY = y - centerY;
        newAttrs.x = centerX + relX * scaleX;
        newAttrs.y = centerY + relY * scaleY;
      } else if (el.points && el.points.length > 0) {
        // For point-based shapes, scale each point around center
        const scaledPoints = el.points.map((p) => ({
          x: centerX + (p.x - centerX) * scaleX,
          y: centerY + (p.y - centerY) * scaleY,
        }));
        newAttrs.points = scaledPoints;
      } else if (el.type === "text") {
        // For text, scale position and font size
        const fontSize = el.fontSize || 28;
        newAttrs.fontSize = Math.max(10, fontSize * Math.max(scaleX, scaleY));

        const x = el.x ?? 0;
        const y = el.y ?? 0;
        const relX = x - centerX;
        const relY = y - centerY;
        newAttrs.x = centerX + relX * scaleX;
        newAttrs.y = centerY + relY * scaleY;
      } else {
        // For other shapes (triangle, diamond, polygon), scale dims
        const w = el.width ?? 60;
        const h = el.height ?? 60;
        newAttrs.width = Math.max(10, w * scaleX);
        newAttrs.height = Math.max(10, h * scaleY);

        const x = el.x ?? 0;
        const y = el.y ?? 0;
        const relX = x - centerX;
        const relY = y - centerY;
        newAttrs.x = centerX + relX * scaleX;
        newAttrs.y = centerY + relY * scaleY;
      }

      updateEl(el.id, newAttrs);
    }

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    // Trigger autosave
    if (onFlush) onFlush();
  };

  return (
    <Group
      ref={groupRef}
      x={0}
      y={0}
      draggable
      onDragStart={() => {
        // reset group position each drag start
        groupRef.current?.position({ x: 0, y: 0 });
      }}
      onDragMove={() => {
        // keep visual snappy — nothing needed, Konva handles it
      }}
      onDragEnd={(e) => {
        const dx = e.target.x();
        const dy = e.target.y();
        // move all selected elements
        onDragAll(dx, dy);
        // reset group back to origin
        e.target.x(0);
        e.target.y(0);
      }}
      onClick={(e) => {
        if (e.target === groupRef.current) onSelect(null);
      }}
    >
      {/* The unified selection rectangle */}
      <Rect
        ref={rectRef}
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        fill="rgba(59,130,246,0.04)"
        stroke={COLORS.selection}
        strokeWidth={1.5}
        dash={[6, 3]}
        listening={true}
        cornerRadius={4}
        onTransformEnd={handleGroupTransformEnd}
      />
      {/* Transformer for resizing grouped elements */}
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
      {/* Corner anchors for visual feedback */}
      {[
        [boxX, boxY],
        [boxX + boxW, boxY],
        [boxX, boxY + boxH],
        [boxX + boxW, boxY + boxH],
      ].map(([cx, cy], i) => (
        <Rect
          key={i}
          x={(cx as number) - 4}
          y={(cy as number) - 4}
          width={8}
          height={8}
          fill="white"
          stroke={COLORS.selection}
          strokeWidth={1.5}
          cornerRadius={2}
          listening={false}
        />
      ))}
    </Group>
  );
};

// ─── Bottom-Right Control Panel ──────────────────────────────────────────────
interface ControlPanelProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canvasBg: (typeof CANVAS_BG_COLORS)[0];
  onBgChange: (bg: (typeof CANVAS_BG_COLORS)[0]) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canvasBg,
  onBgChange,
  strokeColor,
  onStrokeColorChange,
  fillColor,
  onFillColorChange,
}) => {
  const [activePopup, setActivePopup] = useState<
    "stroke" | "fill" | "bg" | null
  >(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(148,163,184,0.25)",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
  };

  const togglePopup = (name: "stroke" | "fill" | "bg") => {
    setActivePopup((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    if (!activePopup) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-color-panel]")) {
        setActivePopup(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activePopup]);

  const ColorSwatch = ({
    color,
    isSelected,
    name,
    onClick,
    isTransparent,
    isBg,
    bg,
  }: {
    color: string;
    isSelected: boolean;
    name: string;
    onClick: () => void;
    isTransparent?: boolean;
    isBg?: boolean;
    bg?: (typeof CANVAS_BG_COLORS)[0];
  }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <button
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isBg
              ? `radial-gradient(circle, ${bg!.dotColor} 1.5px, ${bg!.color} 1.5px)`
              : isTransparent
                ? "linear-gradient(135deg, #fff 42%, #e2e8f0 42%)"
                : color,
            backgroundSize: isBg ? "8px 8px" : undefined,
            border: isSelected
              ? "2.5px solid #3b82f6"
              : hovered
                ? "2px solid #94a3b8"
                : "2px solid rgba(0,0,0,0.08)",
            cursor: "pointer",
            transform: hovered
              ? "scale(1.15)"
              : isSelected
                ? "scale(1.1)"
                : "scale(1)",
            transition: "all 0.15s ease",
            boxShadow: isSelected
              ? "0 0 0 3px rgba(59,130,246,0.2)"
              : hovered
                ? "0 2px 8px rgba(0,0,0,0.15)"
                : "none",
            outline: "none",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>
          {name}
        </span>
      </div>
    );
  };

  const PopupPanel = ({
    title,
    children,
    columns,
  }: {
    title: string;
    children: React.ReactNode;
    columns: number;
  }) => (
    <div
      data-color-panel
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(148,163,184,0.25)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: "10px 12px 12px",
        zIndex: 200,
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 8,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 6,
        }}
      >
        {children}
      </div>
    </div>
  );

  // ── Desktop layout (unchanged) ──
  const desktopPanel = (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {/* Help card */}
      <div
        style={{
          ...panelStyle,
          padding: "10px 14px",
          fontSize: 11,
          color: "#64748b",
          minWidth: 190,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 6,
            fontSize: 12,
          }}
        >
          Controls
        </div>
        {[
          ["Select", "Click shapes"],
          ["Multi-select", "Shift+Click / Drag"],
          ["Pan", "Ctrl/Cmd + Drag"],
          ["Edit text", "Double-click"],
          ["Delete", "Del / Backspace"],
          ["Zoom", "Scroll or + / −"],
          ["Undo", "Ctrl+Z"],
          ["Redo", "Ctrl+Shift+Z or Ctrl+Y"],
          ["Group", "Ctrl+G"],
          ["Ungroup", "Ctrl+Shift+G"],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 2,
            }}
          >
            <span style={{ fontWeight: 600, color: "#475569" }}>{k}</span>
            <span style={{ color: "#94a3b8", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Color + Zoom bar */}
      <div
        data-color-panel
        style={{
          ...panelStyle,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "relative",
        }}
      >
        {/* Stroke */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          {activePopup === "stroke" && (
            <PopupPanel title="Stroke Color" columns={4}>
              {ELEMENT_STROKE_COLORS.map((c) => (
                <ColorSwatch
                  key={c.color}
                  color={c.color}
                  isSelected={strokeColor === c.color}
                  name={c.name}
                  onClick={() => {
                    onStrokeColorChange(c.color);
                    setActivePopup(null);
                  }}
                />
              ))}
            </PopupPanel>
          )}
          <button
            onClick={() => togglePopup("stroke")}
            title="Stroke color"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border:
                activePopup === "stroke"
                  ? "2.5px solid #3b82f6"
                  : "2.5px solid white",
              outline: `2px solid ${strokeColor === "transparent" ? "#cbd5e1" : strokeColor}`,
              background: strokeColor,
              cursor: "pointer",
              transition: "all 0.13s",
              display: "block",
              boxShadow:
                activePopup === "stroke"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: "#94a3b8" }}>Stroke</div>
        </div>

        {/* Fill */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          {activePopup === "fill" && (
            <PopupPanel title="Fill Color" columns={4}>
              {ELEMENT_FILL_COLORS.map((c) => (
                <ColorSwatch
                  key={c.color}
                  color={c.color}
                  isSelected={fillColor === c.color}
                  name={c.name}
                  onClick={() => {
                    onFillColorChange(c.color);
                    setActivePopup(null);
                  }}
                  isTransparent={c.color === "transparent"}
                />
              ))}
            </PopupPanel>
          )}
          <button
            onClick={() => togglePopup("fill")}
            title="Fill color"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border:
                activePopup === "fill"
                  ? "2.5px solid #3b82f6"
                  : "2.5px solid white",
              outline: "2px solid #cbd5e1",
              background:
                fillColor === "transparent"
                  ? "linear-gradient(135deg,#fff 42%,#e2e8f0 42%)"
                  : fillColor,
              cursor: "pointer",
              transition: "all 0.13s",
              display: "block",
              boxShadow:
                activePopup === "fill"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: "#94a3b8" }}>Fill</div>
        </div>

        {/* BG */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          {activePopup === "bg" && (
            <PopupPanel title="Canvas Background" columns={3}>
              {CANVAS_BG_COLORS.map((bg) => (
                <ColorSwatch
                  key={bg.color}
                  color={bg.color}
                  isSelected={canvasBg.color === bg.color}
                  name={bg.name}
                  onClick={() => {
                    onBgChange(bg);
                    setActivePopup(null);
                  }}
                  isBg
                  bg={bg}
                />
              ))}
            </PopupPanel>
          )}
          <button
            onClick={() => togglePopup("bg")}
            title="Canvas background"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border:
                activePopup === "bg"
                  ? "2.5px solid #3b82f6"
                  : "2.5px solid white",
              outline: "2px solid #cbd5e1",
              backgroundImage: `radial-gradient(circle, ${canvasBg.dotColor} 1.5px, ${canvasBg.color} 1.5px)`,
              backgroundSize: "7px 7px",
              cursor: "pointer",
              transition: "all 0.13s",
              display: "block",
              boxShadow:
                activePopup === "bg"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: "#94a3b8" }}>Canvas</div>
        </div>

        {/* divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: "#e2e8f0",
            margin: "0 2px",
          }}
        />

        {/* Zoom */}
        <button
          onClick={onZoomOut}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.13s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#1e293b";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          −
        </button>
        <button
          onClick={onResetZoom}
          style={{
            minWidth: 44,
            height: 28,
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "#475569",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.13s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.13s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#1e293b";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          +
        </button>
      </div>
    </div>
  );

  // ── Mobile layout ──
  const mobilePanel = (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 100 }}>
      {/* Floating action button */}
      <button
        onClick={() => setIsMobileOpen((v) => !v)}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: isMobileOpen ? "#3b82f6" : "rgba(255,255,255,0.95)",
          border: "1px solid rgba(148,163,184,0.3)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 20,
          color: isMobileOpen ? "white" : "#475569",
          transition: "all 0.2s",
          backdropFilter: "blur(12px)",
        }}
        aria-label="Toggle controls"
      >
        {isMobileOpen ? "✕" : "⚙️"}
      </button>

      {/* Slide-up panel */}
      {isMobileOpen && (
        <div
          data-color-panel
          style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            padding: 16,
            minWidth: 240,
            animation: "slideUp 0.2s ease",
          }}
        >
          <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <div
            style={{
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            Controls
          </div>

          {/* Zoom row */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Zoom
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={onZoomOut}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 300,
                }}
              >
                −
              </button>
              <button
                onClick={onResetZoom}
                style={{
                  flex: 2,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={onZoomIn}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 300,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Color rows */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Stroke Color
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ELEMENT_STROKE_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => onStrokeColorChange(c.color)}
                  title={c.name}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: c.color,
                    border:
                      strokeColor === c.color
                        ? "3px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    boxShadow:
                      strokeColor === c.color
                        ? "0 0 0 2px rgba(59,130,246,0.3)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Fill Color
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ELEMENT_FILL_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => onFillColorChange(c.color)}
                  title={c.name}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background:
                      c.color === "transparent"
                        ? "linear-gradient(135deg,#fff 42%,#e2e8f0 42%)"
                        : c.color,
                    border:
                      fillColor === c.color
                        ? "3px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    boxShadow:
                      fillColor === c.color
                        ? "0 0 0 2px rgba(59,130,246,0.3)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Canvas Background
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CANVAS_BG_COLORS.map((bg) => (
                <button
                  key={bg.color}
                  onClick={() => onBgChange(bg)}
                  title={bg.name}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    backgroundImage: `radial-gradient(circle, ${bg.dotColor} 1.5px, ${bg.color} 1.5px)`,
                    backgroundSize: "7px 7px",
                    border:
                      canvasBg.color === bg.color
                        ? "3px solid #3b82f6"
                        : "2px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    boxShadow:
                      canvasBg.color === bg.color
                        ? "0 0 0 2px rgba(59,130,246,0.3)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return isMobile ? mobilePanel : desktopPanel;
};

// ─── Main Canvas ─────────────────────────────────────────────────────────────
export default function Canvas({ id }: { id: string }) {
  const {
    elements,
    selectedTool,
    selectedElementId,
    selectedElementIds,
    addElement,
    updateElement,
    updateElements,
    selectElement,
    selectElements,
    deleteElement,
    deleteSelected,
    setTool,
    stickyNoteColor,
    elementStrokeColor,
    elementFillColor,
    setStickyNoteColor,
    setElementStrokeColor,
    setElementFillColor,
    groupSelected,
    ungroupSelected,
  } = useStore();

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] =
    useState<Partial<WhiteboardElement> | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [canvasBg, setCanvasBg] = useState(CANVAS_BG_COLORS[0]);
  const isAnyTextEditingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  // Tracks element positions at drag-start for multi-drag
  const multiDragStartPositionsRef = useRef<
    Map<string, { x: number; y: number; points?: { x: number; y: number }[] }>
  >(new Map());
  const multiDragAnchorRef = useRef<{ x: number; y: number } | null>(null);
  // --- Autosave state and helpers (declared early so socket handlers can use them)
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<
    "idle" | "pending" | "saving" | "saved"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const lastSentSnapshotRef = useRef<Map<string, string>>(new Map());
  const prevStateRef = useRef<{
    elements: WhiteboardElement[];
    historyIndex: number;
  } | null>(null);
  useEffect(() => {
    socket.connect();
    socket.emit("join_room", id);

    // When server sends full canvas (on join)
    const handleLoad = (data: WhiteboardElement[]) => {
      // dedupe by id keeping last occurrence (server may contain multiple versions)
      const map = new Map<string, WhiteboardElement>();
      for (const item of data) map.set(item.id, item);
      const deduped = Array.from(map.values());
      useStore.getState().setElements(deduped);
      // reset lastSentSnapshot to reflect what's on server
      const snapshot = lastSentSnapshotRef.current;
      snapshot.clear();
      for (const el of deduped) snapshot.set(el.id, JSON.stringify(el));
    };

    socket.on("load_canvas", handleLoad);

    // When other user draws/updates one element
    const handleReceive = (el: WhiteboardElement) => {
      const state = useStore.getState();
      const exists = state.elements.find((e) => e.id === el.id);
      if (exists) state.updateElement(el.id, el);
      else state.addElement(el);
      // update snapshot so we don't re-send same payload
      lastSentSnapshotRef.current.set(el.id, JSON.stringify(el));
    };

    socket.on("receive_draw", handleReceive);

    return () => {
      socket.off("load_canvas", handleLoad);
      socket.off("receive_draw", handleReceive);
      socket.disconnect();
    };
  }, [id]);

  const flushChanges = React.useCallback(
    async (emitLeave = false) => {
      const state = useStore.getState();
      const changed: WhiteboardElement[] = [];
      for (const el of state.elements) {
        const str = JSON.stringify(el);
        const prev = lastSentSnapshotRef.current.get(el.id);
        if (!prev || prev !== str) {
          changed.push(el);
          lastSentSnapshotRef.current.set(el.id, str);
        }
      }
      if (changed.length === 0) return;
      try {
        setAutoSaveStatus("saving");
        // emit each changed element (backend appends to Redis)
        for (const el of changed) {
          socket.emit("draw_element", { roomId: id, element: el });
        }
        // optionally request server to persist Redis -> Mongo
        if (emitLeave) socket.emit("leave_room", id);
        setAutoSaveStatus("saved");
        setLastSavedAt(Date.now());
        setTimeout(() => setAutoSaveStatus("idle"), 1200);
      } catch (err) {
        console.error("Autosave failed", err);
        setAutoSaveStatus("idle");
      }
    },
    [id],
  );

  // debounce changes
  useEffect(() => {
    const handler = () => {
      setAutoSaveStatus("pending");
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        flushChanges(false);
        saveTimerRef.current = null;
      }, 300); // 300ms idle for faster autosave
    };
    // subscribe to store changes via elements + historyIndex (for autosave debounce)
    const unsubscribe = useStore.subscribe((state) => {
      // Check if elements or historyIndex changed
      const elementsChanged =
        !prevStateRef.current ||
        prevStateRef.current.elements !== state.elements;
      const historyChanged =
        !prevStateRef.current ||
        prevStateRef.current.historyIndex !== state.historyIndex;

      if (elementsChanged || historyChanged) {
        handler();
      }

      prevStateRef.current = {
        elements: state.elements,
        historyIndex: state.historyIndex,
      };
    });

    return unsubscribe;
  }, [flushChanges]);

  // Manual save handler (flush immediately and persist)
  const handleManualSave = React.useCallback(async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await flushChanges(true);
  }, [flushChanges]);

  const handleEditingChange = useCallback((editing: boolean) => {
    isAnyTextEditingRef.current = editing;
  }, []);

  const getStatusStyles = () => {
    switch (autoSaveStatus) {
      case "pending":
        return {
          bgColor: "rgba(253, 242, 233, 0.95)",
          borderColor: "rgba(253, 195, 126, 0.4)",
          textColor: "rgba(146, 95, 38, 0.9)",
          spinnerColor: "rgba(251, 146, 60, 0.8)",
        };
      case "saving":
        return {
          bgColor: "rgba(225, 242, 254, 0.95)",
          borderColor: "rgba(147, 197, 253, 0.4)",
          textColor: "rgba(30, 58, 138, 0.9)",
          spinnerColor: "rgba(59, 130, 246, 0.8)",
        };
      case "saved":
        return {
          bgColor: "rgba(236, 253, 245, 0.95)",
          borderColor: "rgba(134, 239, 172, 0.4)",
          textColor: "rgba(5, 107, 47, 0.9)",
          spinnerColor: "rgba(52, 211, 153, 0.8)",
        };
      default:
        return {
          bgColor: "rgba(241, 245, 249, 0.92)",
          borderColor: "rgba(203, 213, 225, 0.3)",
          textColor: "rgba(71, 85, 105, 0.75)",
          spinnerColor: "rgba(148, 163, 184, 0.7)",
        };
    }
  };

  const styles = getStatusStyles();

  // ── Multi-element drag: when dragging one selected element, move all selected ──
  const handleMultiDragEnd = useCallback(
    (draggedId: string, newX: number, newY: number) => {
      const state = useStore.getState();
      const allSelected = state.selectedElementIds;

      // If only one element selected, do normal single update
      if (allSelected.length <= 1) {
        updateElement(draggedId, { x: newX, y: newY });
        return;
      }

      // Find the dragged element to compute delta
      const draggedEl = state.elements.find((el) => el.id === draggedId);
      if (!draggedEl) return;

      // For point-based elements, x/y is 0 so use element.x as anchor
      const oldX = draggedEl.points
        ? (draggedEl.points[0]?.x ?? draggedEl.x)
        : draggedEl.x;
      const oldY = draggedEl.points
        ? (draggedEl.points[0]?.y ?? draggedEl.y)
        : draggedEl.y;
      const dx = draggedEl.points ? newX - oldX : newX - draggedEl.x;
      const dy = draggedEl.points ? newY - oldY : newY - draggedEl.y;

      // Move all OTHER selected elements by the same delta
      const otherIds = allSelected.filter((id) => id !== draggedId);
      updateElements(otherIds, { dx, dy });

      // Update the dragged element itself
      updateElement(draggedId, { x: newX, y: newY });
      // flush changes immediately after multi-drag
      void flushChanges(false);
    },
    [updateElement, updateElements, flushChanges],
  );

  // Handler for unified multi-select box drag (moves all selected elements together)
  const handleMultiSelectBoxDrag = useCallback(
    (dx: number, dy: number) => {
      updateElements(selectedElementIds, { dx, dy });
      // flush immediately after grouped element movement
      void flushChanges(false);
    },
    [selectedElementIds, updateElements, flushChanges],
  );

  // ── Get position from pointer or touch ────────────────────────────────────
  const getPointerPos = useCallback((): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    return {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };
  }, []);

  // ── Get stage-space coords from a touch ──────────────────────────────────
  const getTouchPos = useCallback((touch: Touch): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const container = stage.container();
    const rect = container.getBoundingClientRect();
    const rawX = touch.clientX - rect.left;
    const rawY = touch.clientY - rect.top;
    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    return {
      x: (rawX - stagePos.x) / stageScale,
      y: (rawY - stagePos.y) / stageScale,
    };
  }, []);

  const applyZoom = useCallback(
    (newScaleRaw: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const newScale = Math.max(0.3, Math.min(4, newScaleRaw));
      const pointer = stage.getPointerPosition() ?? {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };
      const oldScale = scale;
      const mousePointTo = {
        x: pointer.x / oldScale - stage.x() / oldScale,
        y: pointer.y / oldScale - stage.y() / oldScale,
      };
      const newPos = {
        x: -(mousePointTo.x - pointer.x / newScale) * newScale,
        y: -(mousePointTo.y - pointer.y / newScale) * newScale,
      };
      setScale(newScale);
      setPosition(newPos);
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    },
    [scale],
  );

  const handleZoomIn = useCallback(
    () => applyZoom(scale + 0.15),
    [scale, applyZoom],
  );
  const handleZoomOut = useCallback(
    () => applyZoom(scale - 0.15),
    [scale, applyZoom],
  );
  const handleResetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    setScale(1);
    setPosition({ x: 0, y: 0 });
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = useStore.getState();
        if (s.selectedElementIds.length > 0) s.deleteSelected();
        else if (s.selectedElementId) s.deleteElement(s.selectedElementId);
      }
      if ((e.key === "=" || e.key === "+") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === "-" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetZoom();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
      }
      if (
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === "y" && (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        useStore.getState().redo();
      }
      // Group / Ungroup
      if (
        (e.key === "g" || e.key === "G") &&
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey
      ) {
        e.preventDefault();
        useStore.getState().groupSelected();
        // flush immediately after grouping
        setAutoSaveStatus("pending");
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
          flushChanges(false);
          saveTimerRef.current = null;
        }, 100);
      }
      if (
        (e.key === "g" || e.key === "G") &&
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        useStore.getState().ungroupSelected();
        // flush immediately after ungrouping
        setAutoSaveStatus("pending");
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
          flushChanges(false);
          saveTimerRef.current = null;
        }, 100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // ══════════════════════════════════════════════════════════════════════════
  // Shared draw-start logic (used by both mouse and touch)
  // ═══════════════════════════���══════════════════════════════════════════════
  const startDraw = useCallback(
    (pos: { x: number; y: number }, isOnStage: boolean) => {
      if (isAnyTextEditingRef.current) return;

      drawStartRef.current = pos;

      if (selectedTool === "select") {
        if (!isOnStage) return;
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
        setIsDrawing(true);
        return;
      }

      if (selectedTool === "rectangle") {
        setCurrentElement({
          id: `rect-${Date.now()}`,
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "circle") {
        setCurrentElement({
          id: `circle-${Date.now()}`,
          type: "circle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentElement({
          id: `line-${Date.now()}`,
          type: selectedTool === "arrow" ? "arrow" : "line",
          x: 0,
          y: 0,
          points: [
            { x: pos.x, y: pos.y },
            { x: pos.x, y: pos.y },
          ],
          strokeColor: elementStrokeColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "triangle") {
        setCurrentElement({
          id: `triangle-${Date.now()}`,
          type: "triangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "diamond") {
        setCurrentElement({
          id: `diamond-${Date.now()}`,
          type: "diamond",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "polygon") {
        setCurrentElement({
          id: `polygon-${Date.now()}`,
          type: "polygon",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          strokeColor: elementStrokeColor,
          fillColor: elementFillColor,
          strokeWidth: 2,
        } as Partial<WhiteboardElement>);
        setIsDrawing(true);
      } else if (selectedTool === "pencil") {
        setCurrentElement({
          id: `pencil-${Date.now()}`,
          type: "pencil",
          x: 0,
          y: 0,
          points: [{ x: pos.x, y: pos.y }],
          strokeColor: elementStrokeColor,
          strokeWidth: 2,
        });
        setIsDrawing(true);
      } else if (selectedTool === "text") {
        if (!isOnStage) return;
        const newEl = {
          id: `text-${Date.now()}`,
          type: "text" as const,
          x: pos.x,
          y: pos.y,
          text: "Text",
          fontSize: 28,
          strokeColor: elementStrokeColor,
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setTool("select");
      } else if (selectedTool === "sticky") {
        if (!isOnStage) return;
        const newEl = {
          id: `sticky-${Date.now()}`,
          type: "sticky" as const,
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 150,
          text: "Note",
          fillColor: stickyNoteColor,
          strokeColor: getStickyNoteStrokeColor(stickyNoteColor),
        } as WhiteboardElement;
        addElement(newEl);
        selectElement(newEl.id);
        setTool("select");
      }
    },
    [
      selectedTool,
      addElement,
      selectElement,
      setTool,
      elementStrokeColor,
      elementFillColor,
      stickyNoteColor,
    ],
  );

  const updateDraw = useCallback(
    (pos: { x: number; y: number }) => {
      const start = drawStartRef.current;

      if (selectedTool === "select") {
        setSelectionBox({
          x: Math.min(pos.x, start.x),
          y: Math.min(pos.y, start.y),
          width: Math.abs(pos.x - start.x),
          height: Math.abs(pos.y - start.y),
        });
        return;
      }

      if (!currentElement) return;

      if (
        ["rectangle", "circle", "triangle", "diamond", "polygon"].includes(
          selectedTool,
        )
      ) {
        setCurrentElement((prev) =>
          prev
            ? {
                ...prev,
                x: Math.min(pos.x, start.x),
                y: Math.min(pos.y, start.y),
                width: Math.abs(pos.x - start.x),
                height: Math.abs(pos.y - start.y),
              }
            : prev,
        );
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentElement((prev) => {
          if (!prev) return prev;
          const pts = prev.points ? [...prev.points] : [];
          pts[1] = { x: pos.x, y: pos.y };
          return { ...prev, points: pts };
        });
      } else if (selectedTool === "pencil") {
        setCurrentElement((prev) =>
          prev
            ? {
                ...prev,
                points: [...(prev.points || []), { x: pos.x, y: pos.y }],
              }
            : prev,
        );
      }
    },
    [selectedTool, currentElement],
  );

  const finishDraw = useCallback(() => {
    if (selectedTool === "select" && selectionBox) {
      if (selectionBox.width > 5 || selectionBox.height > 5) {
        const selectedIds = elements
          .filter((el) => elementIntersectsBox(el, selectionBox))
          .map((el) => el.id);
        if (selectedIds.length > 0) selectElements(selectedIds);
        else selectElement(null);
      } else {
        selectElement(null);
      }
      setSelectionBox(null);
      setIsDrawing(false);
      return;
    }

    if (!isDrawing || !currentElement) return;

    let addedId: string | null = null;

    if (
      ["rectangle", "circle", "triangle", "diamond"].includes(
        currentElement.type || "",
      )
    ) {
      if ((currentElement.width || 0) > 5 && (currentElement.height || 0) > 5) {
        addElement(currentElement as WhiteboardElement);
        addedId = currentElement.id as string;
        // Fast autosave: flush this new element to server/Redis immediately
        void flushChanges(false);
      }
    } else if (
      ["line", "arrow", "pencil"].includes(currentElement.type || "")
    ) {
      addElement(currentElement as WhiteboardElement);
      addedId = currentElement.id as string;
      // Fast autosave for strokes/lines
      void flushChanges(false);
    } else if (currentElement.type === "polygon") {
      const sides = (currentElement as any).sides || 6;
      const w = currentElement.width || 0,
        h = currentElement.height || 0;
      const cx = (currentElement.x || 0) + w / 2,
        cy = (currentElement.y || 0) + h / 2,
        r = Math.min(w, h) / 2;
      const points = Array.from({ length: sides }).map((_, i) => {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
      });
      const el = {
        id: currentElement.id as string,
        type: "polygon",
        x: currentElement.x || 0,
        y: currentElement.y || 0,
        points,
        strokeColor: currentElement.strokeColor,
        fillColor: currentElement.fillColor,
        strokeWidth: currentElement.strokeWidth,
      } as WhiteboardElement;
      addElement(el);
      addedId = el.id;
    }

    // Auto-select and switch to select tool — but NOT for pencil (stay in pencil mode)
    if (addedId && currentElement?.type !== "pencil") {
      selectElement(addedId);
      setTool("select");
    }

    setIsDrawing(false);
    setCurrentElement(null);
  }, [
    isDrawing,
    currentElement,
    selectedTool,
    selectionBox,
    elements,
    selectElement,
    selectElements,
    addElement,
    setTool,
  ]);

  const elementIntersectsBox = useCallback(
    (
      element: WhiteboardElement,
      box: { x: number; y: number; width: number; height: number },
    ): boolean => {
      const boxRight = box.x + box.width,
        boxBottom = box.y + box.height;
      if (element.points && element.points.length > 0) {
        for (const point of element.points) {
          if (
            point.x >= box.x &&
            point.x <= boxRight &&
            point.y >= box.y &&
            point.y <= boxBottom
          )
            return true;
        }
        const minX = Math.min(...element.points.map((p) => p.x)),
          maxX = Math.max(...element.points.map((p) => p.x));
        const minY = Math.min(...element.points.map((p) => p.y)),
          maxY = Math.max(...element.points.map((p) => p.y));
        return !(
          boxRight < minX ||
          box.x > maxX ||
          boxBottom < minY ||
          box.y > maxY
        );
      }
      const elRight = (element.x || 0) + (element.width || 0),
        elBottom = (element.y || 0) + (element.height || 0);
      return !(
        boxRight < (element.x || 0) ||
        box.x > elRight ||
        boxBottom < (element.y || 0) ||
        box.y > elBottom
      );
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MOUSE events (desktop)
  // ══════════════════════════════════════════════════════════════════════════
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isAnyTextEditingRef.current) return;
      if (e.evt.ctrlKey || e.evt.metaKey) {
        setIsDraggingStage(true);
        lastPosRef.current = stageRef.current?.getPointerPosition() ?? null;
        e.evt.preventDefault();
        return;
      }
      const isOnStage = e.target === e.target.getStage();
      const pos = getPointerPos();
      startDraw(pos, isOnStage);
    },
    [getPointerPos, startDraw],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDraggingStage && (e.evt.ctrlKey || e.evt.metaKey)) {
        const stage = stageRef.current;
        if (!stage) return;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        const lastPos = lastPosRef.current ?? pointerPos;
        const newPos = {
          x: position.x + (pointerPos.x - lastPos.x),
          y: position.y + (pointerPos.y - lastPos.y),
        };
        setPosition(newPos);
        stage.position(newPos);
        stage.batchDraw();
        lastPosRef.current = pointerPos;
        return;
      }
      if (!isDrawing) return;
      updateDraw(getPointerPos());
    },
    [isDraggingStage, isDrawing, getPointerPos, updateDraw, position],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingStage) {
      setIsDraggingStage(false);
      lastPosRef.current = null;
      return;
    }
    finishDraw();
  }, [isDraggingStage, finishDraw]);

  // ══════════════════════════════════════════════════════════════════════════
  // TOUCH events (mobile) — attached to the stage container via useEffect
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();

    const onTouchStart = (e: TouchEvent) => {
      if (isAnyTextEditingRef.current) return;

      // Two-finger = pan
      if (e.touches.length === 2) {
        isPanningRef.current = true;
        return;
      }

      const touch = e.touches[0];
      const pos = getTouchPos(touch);

      // Store for panning reference
      lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Determine if touch is on a Konva shape by checking what's under the finger
      // We do a simple hittest: use Konva's getIntersection
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const container2 = stage.container().getBoundingClientRect();
      const rawX = touch.clientX - container2.left;
      const rawY = touch.clientY - container2.top;
      const hit = stage.getIntersection({
        x: rawX,
        y: rawY,
      }) as Konva.Node | null;
      const isOnStage = !hit || hit === stage;

      startDraw(pos, isOnStage);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevent scroll while drawing

      if (e.touches.length === 2 && isPanningRef.current) {
        // Two-finger pan
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        if (lastTouchPosRef.current) {
          const dx = midX - lastTouchPosRef.current.x;
          const dy = midY - lastTouchPosRef.current.y;
          const newPos = { x: stage.x() + dx, y: stage.y() + dy };
          setPosition(newPos);
          stage.position(newPos);
          stage.batchDraw();
        }
        lastTouchPosRef.current = { x: midX, y: midY };
        return;
      }

      if (!isDrawing) return;
      const touch = e.touches[0];
      updateDraw(getTouchPos(touch));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isPanningRef.current && e.touches.length < 2) {
        isPanningRef.current = false;
        lastTouchPosRef.current = null;
        return;
      }
      finishDraw();
      lastTouchPosRef.current = null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [getTouchPos, startDraw, updateDraw, finishDraw, isDrawing]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      applyZoom(scale + direction * 0.1);
    },
    [scale, applyZoom],
  );

  const stageWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const stageHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  return (
    <>
      <Toolbar />
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Save controls */}

        <div
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 60,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Save Button */}
          <button
            onClick={handleManualSave}
            style={{
              background:
                "linear-gradient(135deg, rgba(236, 240, 241, 0.9) 0%, rgba(207, 216, 220, 0.9) 100%)",
              color: "rgba(52, 73, 94, 0.95)",
              padding: "10px 18px",
              borderRadius: 12,
              border: "1px solid rgba(189, 195, 199, 0.3)",
              boxShadow:
                "0 8px 20px rgba(174, 190, 205, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "-0.3px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(174, 190, 205, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(174, 190, 205, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)";
            }}
          >
            Save
          </button>

          {/* Status Badge */}
          <div
            style={{
              minWidth: 130,
              padding: "10px 16px",
              borderRadius: 12,
              background: styles.bgColor,
              border: `1.5px solid ${styles.borderColor}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: styles.textColor,
              fontWeight: 500,
              transition: "all 0.3s ease-out",
              backdropFilter: "blur(8px)",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 4px 12px ${styles.spinnerColor}20`,
              animation:
                autoSaveStatus === "saving" || autoSaveStatus === "pending"
                  ? "soft-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{
                  animation:
                    autoSaveStatus === "saving" || autoSaveStatus === "pending"
                      ? "spin 1.5s linear infinite"
                      : "none",
                  color: styles.spinnerColor,
                  flexShrink: 0,
                }}
              >
                {autoSaveStatus === "pending" && (
                  <circle cx="12" cy="12" r="10" />
                )}
                {autoSaveStatus === "saving" && (
                  <>
                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <polyline points="20 6 9 17 4 12" />
                )}
                {autoSaveStatus === "idle" && (
                  <polyline points="20 6 9 17 4 12" />
                )}
              </svg>
              <span
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {autoSaveStatus === "pending" && "Pending…"}
                {autoSaveStatus === "saving" && "Saving…"}
                {autoSaveStatus === "saved" && "Saved"}
                {autoSaveStatus === "idle" && "All saved"}
              </span>
            </div>

            {autoSaveStatus === "saved" && lastSavedAt && (
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.65,
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                  fontWeight: 400,
                }}
              >
                {new Date(lastSavedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes soft-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
        </div>

        {/* Canvas background with dots - fixed to viewport, moves with pan */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundColor: canvasBg.color,
            backgroundImage: `radial-gradient(circle, ${canvasBg.dotColor} 1px, transparent 1px)`,
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${position.x}px ${position.y}px`,
          }}
        />
        {/* Soft vignette overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(148,163,184,0.08) 100%)",
          }}
        />

        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          style={{
            position: "relative",
            zIndex: 2,
            cursor: isDraggingStage
              ? "grabbing"
              : selectedTool === "select"
                ? "default"
                : "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <Layer ref={layerRef}>
            {elements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const isSingleSelected =
                isSelected && selectedElementIds.length === 1;
              const sharedProps = {
                element,
                isSelected,
                isSingleSelected,
                onSelect: selectElement,
                // update store and flush autosave immediately after transform
                onTransformEnd: (
                  id: string,
                  attrs: Partial<WhiteboardElement>,
                ) => {
                  updateElement(id, attrs);
                  void flushChanges(false);
                },
                // Only pass onMultiDragEnd when multi-selected (single drag handles itself)
                onMultiDragEnd:
                  selectedElementIds.length > 1
                    ? handleMultiDragEnd
                    : undefined,
              };
              return (
                <React.Fragment key={element.id}>
                  {element.type === "rectangle" && (
                    <RectShape {...sharedProps} />
                  )}
                  {element.type === "circle" && (
                    <CircleShape {...sharedProps} />
                  )}
                  {element.type === "line" && <LineShape {...sharedProps} />}
                  {element.type === "arrow" && <ArrowShape {...sharedProps} />}
                  {element.type === "triangle" && (
                    <TriangleShape {...sharedProps} />
                  )}
                  {element.type === "diamond" && (
                    <DiamondShape {...sharedProps} />
                  )}
                  {element.type === "polygon" && (
                    <PolygonShape {...sharedProps} />
                  )}
                  {element.type === "pencil" && (
                    <PencilShape {...sharedProps} />
                  )}
                  {element.type === "text" && (
                    <TextShape
                      {...sharedProps}
                      setTool={setTool}
                      onEditingChange={handleEditingChange}
                    />
                  )}
                  {element.type === "sticky" && (
                    <StickyShape
                      {...sharedProps}
                      setTool={setTool}
                      onEditingChange={handleEditingChange}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Unified multi-select box — shown when 2+ elements selected */}
            {selectedElementIds.length > 1 && (
              <MultiSelectBox
                elements={elements}
                selectedIds={selectedElementIds}
                onDragAll={handleMultiSelectBoxDrag}
                onSelect={selectElement}
                updateElement={updateElement}
                onFlush={() => void flushChanges(false)}
              />
            )}

            {/* Selection box */}
            {isDrawing && selectedTool === "select" && selectionBox && (
              <Rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill={COLORS.selectionFill}
                stroke={COLORS.selection}
                strokeWidth={1}
                dash={[4, 3]}
                listening={false}
              />
            )}

            {/* Preview while drawing */}
            {isDrawing && currentElement && (
              <>
                {currentElement.type === "rectangle" && (
                  <Rect
                    x={currentElement.x}
                    y={currentElement.y}
                    width={currentElement.width || 0}
                    height={currentElement.height || 0}
                    stroke={COLORS.selection}
                    strokeWidth={2}
                    fill={currentElement.fillColor || COLORS.selectionFill}
                    cornerRadius={4}
                    dash={[4, 3]}
                    listening={false}
                    opacity={0.7}
                  />
                )}
                {currentElement.type === "circle" &&
                  (() => {
                    const r =
                      Math.max(
                        currentElement.width || 0,
                        currentElement.height || 0,
                      ) / 2;
                    return (
                      <Circle
                        x={(currentElement.x || 0) + r}
                        y={(currentElement.y || 0) + r}
                        radius={r}
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentElement.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {(currentElement.type === "line" ||
                  currentElement.type === "arrow") && (
                  <Line
                    points={(currentElement.points || []).flatMap((p) => [
                      p.x,
                      p.y,
                    ])}
                    stroke={COLORS.selection}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {currentElement.type === "triangle" &&
                  (() => {
                    const w = currentElement.width || 0,
                      h = currentElement.height || 0;
                    return (
                      <Line
                        x={currentElement.x}
                        y={currentElement.y}
                        points={[w / 2, 0, w, h, 0, h]}
                        closed
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentElement.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentElement.type === "diamond" &&
                  (() => {
                    const w = currentElement.width || 0,
                      h = currentElement.height || 0;
                    return (
                      <Line
                        x={currentElement.x}
                        y={currentElement.y}
                        points={[w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]}
                        closed
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentElement.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentElement.type === "polygon" &&
                  (() => {
                    const sides = (currentElement as any).sides || 6,
                      w = currentElement.width || 0,
                      h = currentElement.height || 0;
                    const cx = (currentElement.x || 0) + w / 2,
                      cy = (currentElement.y || 0) + h / 2,
                      r = Math.min(w, h) / 2;
                    const pts: number[] = [];
                    for (let i = 0; i < sides; i++) {
                      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
                      pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                    }
                    return (
                      <Line
                        points={pts}
                        closed
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentElement.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentElement.type === "pencil" && (
                  <Line
                    points={(currentElement.points || []).flatMap((p) => [
                      p.x,
                      p.y,
                    ])}
                    stroke={COLORS.selection}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    opacity={0.7}
                    listening={false}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>

        <ControlPanel
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          canvasBg={canvasBg}
          onBgChange={setCanvasBg}
          strokeColor={elementStrokeColor}
          onStrokeColorChange={setElementStrokeColor}
          fillColor={elementFillColor}
          onFillColorChange={setElementFillColor}
        />
      </div>
    </>
  );
}
