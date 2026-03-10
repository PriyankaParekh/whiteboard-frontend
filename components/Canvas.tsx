"use client";
export const dynamic = "force-dynamic";

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
import QuillEditorModal from "./QuillEditorModal";
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
  ImageShape,
} from "./shapes";
import {
  COLORS,
  getStickyNoteStrokeColor,
  getStrokeColors,
  getFillColors,
  getCanvasBgColors,
} from "../utils/constant";
import { useTheme } from "../store/useTheme";

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
function ThemeToggleButton({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: isDark
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(148,163,184,0.30)",
        background: isDark ? "rgba(15,18,35,0.88)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: isDark ? "#a5b4fc" : "#64748b",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 4px 16px rgba(0,0,0,0.08)",
        transition: "all 0.25s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1) rotate(15deg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) rotate(0deg)";
      }}
    >
      {isDark ? (
        // Sun
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ─── Multi-Select Box ─────────────────────────────────────────────────────────
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
  const PADDING = 16;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const selectedEls = elements.filter((el) => selectedIds.includes(el.id));

  for (const el of selectedEls) {
    const sp = Math.ceil((el.strokeWidth || 2) / 2) + 2;
    if (el.type === "circle") {
      const r = Math.max(el.width ?? 100, el.height ?? 100) / 2;
      const cx = (el.x ?? 0) + r,
        cy = (el.y ?? 0) + r;
      minX = Math.min(minX, cx - r - sp);
      minY = Math.min(minY, cy - r - sp);
      maxX = Math.max(maxX, cx + r + sp);
      maxY = Math.max(maxY, cy + r + sp);
    } else if (el.points && el.points.length > 0) {
      for (const p of el.points) {
        minX = Math.min(minX, p.x - sp);
        minY = Math.min(minY, p.y - sp);
        maxX = Math.max(maxX, p.x + sp);
        maxY = Math.max(maxY, p.y + sp);
      }
    } else {
      minX = Math.min(minX, (el.x ?? 0) - sp);
      minY = Math.min(minY, (el.y ?? 0) - sp);
      maxX = Math.max(maxX, (el.x ?? 0) + (el.width ?? 60) + sp);
      maxY = Math.max(maxY, (el.y ?? 0) + (el.height ?? 60) + sp);
    }
  }

  if (!isFinite(minX)) return null;

  const boxX = minX - PADDING,
    boxY = minY - PADDING;
  const boxW = maxX - minX + PADDING * 2,
    boxH = maxY - minY + PADDING * 2;

  useEffect(() => {
    if (rectRef.current && trRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds.length]);

  const handleGroupTransformEnd = () => {
    const node = rectRef.current;
    if (!node) return;
    const scaleX = node.scaleX(),
      scaleY = node.scaleY();
    const centerX = boxX + boxW / 2,
      centerY = boxY + boxH / 2;
    const updateEl = updateElementProp || useStore.getState().updateElement;
    for (const el of selectedEls) {
      let attrs: Partial<WhiteboardElement> = {};
      if (el.points && el.points.length > 0) {
        attrs.points = el.points.map((p) => ({
          x: centerX + (p.x - centerX) * scaleX,
          y: centerY + (p.y - centerY) * scaleY,
        }));
      } else if (el.type === "text") {
        attrs.fontSize = Math.max(
          10,
          (el.fontSize || 28) * Math.max(scaleX, scaleY),
        );
        attrs.x = centerX + ((el.x ?? 0) - centerX) * scaleX;
        attrs.y = centerY + ((el.y ?? 0) - centerY) * scaleY;
      } else {
        attrs.width = Math.max(10, (el.width ?? 60) * scaleX);
        attrs.height = Math.max(10, (el.height ?? 60) * scaleY);
        attrs.x = centerX + ((el.x ?? 0) - centerX) * scaleX;
        attrs.y = centerY + ((el.y ?? 0) - centerY) * scaleY;
      }
      updateEl(el.id, attrs);
    }
    node.scaleX(1);
    node.scaleY(1);
    if (onFlush) onFlush();
  };

  return (
    <Group
      ref={groupRef}
      x={0}
      y={0}
      draggable
      onDragStart={() => {
        groupRef.current?.position({ x: 0, y: 0 });
      }}
      onDragEnd={(e) => {
        onDragAll(e.target.x(), e.target.y());
        e.target.x(0);
        e.target.y(0);
      }}
      onClick={(e) => {
        if (e.target === groupRef.current) onSelect(null);
      }}
    >
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
      {(
        [
          [boxX, boxY],
          [boxX + boxW, boxY],
          [boxX, boxY + boxH],
          [boxX + boxW, boxY + boxH],
        ] as [number, number][]
      ).map(([cx, cy], i) => (
        <Rect
          key={i}
          x={cx - 4}
          y={cy - 4}
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

// ─── Control Panel (bottom-right) ────────────────────────────────────────────
type BgColor = { color: string; dotColor: string; name: string };

interface ControlPanelProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canvasBg: BgColor;
  onBgChange: (bg: BgColor) => void;
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  fillColor: string;
  onFillColorChange: (c: string) => void;
  isDark: boolean;
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
  isDark,
}) => {
  const strokeColors = getStrokeColors(isDark);
  const fillColors = getFillColors(isDark);
  const bgColors = getCanvasBgColors(isDark);
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

  const panelBg = isDark ? "rgba(15,18,35,0.90)" : "rgba(255,255,255,0.95)";
  const panelBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(148,163,184,0.25)";
  const panelShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)";
  const headColor = isDark ? "#e2e8f0" : "#1e293b";
  const textColor = isDark ? "rgba(190,205,235,0.75)" : "#64748b";
  const labelColor = isDark ? "rgba(140,158,200,0.60)" : "#94a3b8";
  const dividerBg = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const zoomBtnHoverBg = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";
  const zoomBtnHoverColor = isDark ? "#ffffff" : "#1e293b";

  const panelStyle: React.CSSProperties = {
    background: panelBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${panelBorder}`,
    borderRadius: 16,
    boxShadow: panelShadow,
  };

  const togglePopup = (name: "stroke" | "fill" | "bg") => {
    setActivePopup((p) => (p === name ? null : name));
  };

  useEffect(() => {
    if (!activePopup) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-color-panel]"))
        setActivePopup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activePopup]);

  const SwatchBtn = ({
    color,
    selected,
    name,
    onClick,
    transparent,
    isBg,
    bg,
  }: {
    color: string;
    selected: boolean;
    name: string;
    onClick: () => void;
    transparent?: boolean;
    isBg?: boolean;
    bg?: BgColor;
  }) => {
    const [hov, setHov] = useState(false);
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
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isBg
              ? `radial-gradient(circle, ${bg!.dotColor} 1.5px, ${bg!.color} 1.5px)`
              : transparent
                ? "linear-gradient(135deg,#fff 42%,#e2e8f0 42%)"
                : color,
            backgroundSize: isBg ? "8px 8px" : undefined,
            border: selected
              ? "2.5px solid #3b82f6"
              : hov
                ? "2px solid #94a3b8"
                : "2px solid rgba(0,0,0,0.08)",
            cursor: "pointer",
            outline: "none",
            flexShrink: 0,
            transform: selected
              ? "scale(1.1)"
              : hov
                ? "scale(1.15)"
                : "scale(1)",
            transition: "all 0.15s",
            boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.2)" : "none",
          }}
        />
        <span style={{ fontSize: 9, color: labelColor, whiteSpace: "nowrap" }}>
          {name}
        </span>
      </div>
    );
  };

  const PopupPanel = ({
    title,
    children,
    cols,
  }: {
    title: string;
    children: React.ReactNode;
    cols: number;
  }) => (
    <div
      data-color-panel
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: isDark ? "rgba(12,16,32,0.97)" : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${panelBorder}`,
        borderRadius: 12,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.6)"
          : "0 8px 32px rgba(0,0,0,0.12)",
        padding: "10px 12px 12px",
        zIndex: 200,
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: labelColor,
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
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gap: 6,
        }}
      >
        {children}
      </div>
    </div>
  );

  const zBtnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: "none",
    background: "transparent",
    color: textColor,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.13s",
  };

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
          color: textColor,
          minWidth: 190,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: headColor,
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
            <span
              style={{
                fontWeight: 600,
                color: isDark ? "rgba(190,200,230,0.85)" : "#475569",
              }}
            >
              {k}
            </span>
            <span style={{ color: labelColor, textAlign: "right" }}>{v}</span>
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
        {/* Stroke swatch */}
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
            <PopupPanel title="Stroke Color" cols={4}>
              {strokeColors.map((c) => (
                <SwatchBtn
                  key={c.color}
                  color={c.color}
                  selected={strokeColor === c.color}
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
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: "pointer",
              display: "block",
              background: strokeColor,
              border:
                activePopup === "stroke"
                  ? "2.5px solid #3b82f6"
                  : `2.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "white"}`,
              outline: `2px solid ${strokeColor === "transparent" ? "#cbd5e1" : strokeColor}`,
              transition: "all 0.13s",
              boxShadow:
                activePopup === "stroke"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: labelColor }}>Stroke</div>
        </div>

        {/* Fill swatch */}
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
            <PopupPanel title="Fill Color" cols={4}>
              {fillColors.map((c) => (
                <SwatchBtn
                  key={c.color}
                  color={c.color}
                  selected={fillColor === c.color}
                  name={c.name}
                  onClick={() => {
                    onFillColorChange(c.color);
                    setActivePopup(null);
                  }}
                  transparent={c.color === "transparent"}
                />
              ))}
            </PopupPanel>
          )}
          <button
            onClick={() => togglePopup("fill")}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: "pointer",
              display: "block",
              background:
                fillColor === "transparent"
                  ? "linear-gradient(135deg,#fff 42%,#e2e8f0 42%)"
                  : fillColor,
              border:
                activePopup === "fill"
                  ? "2.5px solid #3b82f6"
                  : `2.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "white"}`,
              outline: "2px solid #cbd5e1",
              transition: "all 0.13s",
              boxShadow:
                activePopup === "fill"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: labelColor }}>Fill</div>
        </div>

        {/* BG swatch */}
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
            <PopupPanel title="Canvas Background" cols={3}>
              {bgColors.map((bg) => (
                <SwatchBtn
                  key={bg.color}
                  color={bg.color}
                  selected={canvasBg.color === bg.color}
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
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: "pointer",
              display: "block",
              backgroundImage: `radial-gradient(circle, ${canvasBg.dotColor} 1.5px, ${canvasBg.color} 1.5px)`,
              backgroundSize: "7px 7px",
              border:
                activePopup === "bg"
                  ? "2.5px solid #3b82f6"
                  : `2.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "white"}`,
              outline: "2px solid #cbd5e1",
              transition: "all 0.13s",
              boxShadow:
                activePopup === "bg"
                  ? "0 0 0 3px rgba(59,130,246,0.2)"
                  : "none",
            }}
          />
          <div style={{ fontSize: 9, color: labelColor }}>Canvas</div>
        </div>

        <div
          style={{
            width: 1,
            height: 28,
            background: dividerBg,
            margin: "0 2px",
          }}
        />

        {/* Zoom */}
        <button
          onClick={onZoomOut}
          style={zBtnStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.background = zoomBtnHoverBg;
            e.currentTarget.style.color = zoomBtnHoverColor;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = textColor;
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
            color: textColor,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.13s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = zoomBtnHoverBg)
          }
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          style={zBtnStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.background = zoomBtnHoverBg;
            e.currentTarget.style.color = zoomBtnHoverColor;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = textColor;
          }}
        >
          +
        </button>
      </div>
    </div>
  );

  const mobilePanel = (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 100 }}>
      <button
        onClick={() => setIsMobileOpen((v) => !v)}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: isMobileOpen ? "#3b82f6" : panelBg,
          border: `1px solid ${panelBorder}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 20,
          color: isMobileOpen ? "white" : isDark ? "#a5b4fc" : "#475569",
          transition: "all 0.2s",
          backdropFilter: "blur(12px)",
        }}
        aria-label="Toggle controls"
      >
        {isMobileOpen ? "✕" : "⚙️"}
      </button>

      {isMobileOpen && (
        <div
          data-color-panel
          style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            background: isDark
              ? "rgba(12,16,32,0.97)"
              : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${panelBorder}`,
            borderRadius: 16,
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.6)"
              : "0 8px 32px rgba(0,0,0,0.15)",
            padding: 16,
            minWidth: 240,
            animation: "slideUp 0.2s ease",
          }}
        >
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div
            style={{
              fontWeight: 700,
              color: headColor,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            Controls
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: labelColor,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Zoom
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {(
                [
                  ["−", onZoomOut],
                  [`${Math.round(scale * 100)}%`, onResetZoom],
                  ["+", onZoomIn],
                ] as [string, () => void][]
              ).map(([lbl, fn], i) => (
                <button
                  key={i}
                  onClick={fn}
                  style={{
                    flex: i === 1 ? 2 : 1,
                    height: 36,
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                    color: isDark ? "#c8d3f5" : "#475569",
                    cursor: "pointer",
                    fontSize: i === 1 ? 13 : 18,
                    fontWeight: i === 1 ? 600 : 300,
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {[
            {
              title: "Stroke Color",
              colors: strokeColors,
              sel: strokeColor,
              set: onStrokeColorChange,
            },
            {
              title: "Fill Color",
              colors: fillColors,
              sel: fillColor,
              set: onFillColorChange,
            },
          ].map(({ title, colors, sel, set }) => (
            <div key={title} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: labelColor,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {title}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {colors.map((c: any) => (
                  <button
                    key={c.color}
                    onClick={() => set(c.color)}
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
                        sel === c.color
                          ? "3px solid #3b82f6"
                          : "2px solid rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      boxShadow:
                        sel === c.color
                          ? "0 0 0 2px rgba(59,130,246,0.3)"
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: labelColor,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Canvas Background
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {bgColors.map((bg) => (
                <button
                  key={bg.color}
                  onClick={() => onBgChange(bg)}
                  title={bg.name}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    backgroundImage: `radial-gradient(circle,${bg.dotColor} 1.5px,${bg.color} 1.5px)`,
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

// ─── Rich Text Overlay ────────────────────────────────────────────────────────
interface RichTextOverlayElProps {
  el: WhiteboardElement;
  isElSelected: boolean;
  position: { x: number; y: number };
  scale: number;
  selectElement: (id: string | null) => void;
  updateElement: (id: string, attrs: Partial<WhiteboardElement>) => void;
  flushChanges: (emitLeave?: boolean) => void;
  setQuillEditingElementId: (id: string | null) => void;
  isAnyTextEditingRef: React.MutableRefObject<boolean>;
  lastOverlaySelectTimeRef: React.MutableRefObject<number>;
  selectedTool: string;
}

const RichTextOverlayEl: React.FC<RichTextOverlayElProps> = ({
  el,
  isElSelected,
  position,
  scale,
  selectElement,
  updateElement,
  flushChanges,
  setQuillEditingElementId,
  isAnyTextEditingRef,
  lastOverlaySelectTimeRef,
  selectedTool,
}) => {
  const { isDark } = useTheme();

  const lastClickRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const sizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    elX: number;
    elY: number;
  } | null>(null);

  const syncSize = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cw = Math.ceil(rect.width / scale) + 2;
      const ch = Math.ceil(rect.height / scale) + 2;
      if (
        Math.abs((el.width ?? 0) - cw) > 2 ||
        Math.abs((el.height ?? 0) - ch) > 2
      ) {
        updateElement(el.id, { width: cw, height: ch });
      }
    });
  }, [el.id, el.width, el.height, scale, updateElement]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    roRef.current = new ResizeObserver(() => {
      if (sizeTimer.current) clearTimeout(sizeTimer.current);
      sizeTimer.current = setTimeout(syncSize, 60);
    });
    roRef.current.observe(node);
    syncSize();
    return () => {
      roRef.current?.disconnect();
      if (sizeTimer.current) clearTimeout(sizeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.htmlText]);

  useEffect(() => {
    syncSize();
  }, [scale, syncSize]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      elX: el.x,
      elY: el.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    updateElement(el.id, {
      x:
        dragStart.current.elX + (e.clientX - dragStart.current.clientX) / scale,
      y:
        dragStart.current.elY + (e.clientY - dragStart.current.clientY) / scale,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStart.current = null;
    void flushChanges(false);
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const isDouble = now - lastClickRef.current < 400;
    lastClickRef.current = now;
    lastOverlaySelectTimeRef.current = now;
    if (isDouble) {
      selectElement(el.id);
      setQuillEditingElementId(el.id);
      isAnyTextEditingRef.current = true;
    } else {
      selectElement(el.id);
    }
  };

  function recolorHtml(html: string, isDark: boolean): string {
    const newColor = isDark ? "#ffffff" : "#1e293b";
    // Replace any of the two "default" colors we ever write
    return html
      .replace(/color\s*:\s*#ffffff/gi, `color: ${newColor}`)
      .replace(/color\s*:\s*white/gi, `color: ${newColor}`)
      .replace(
        /color\s*:\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/gi,
        `color: ${newColor}`,
      )
      .replace(/color\s*:\s*#1e293b/gi, `color: ${newColor}`)
      .replace(
        /color\s*:\s*rgb\(\s*30\s*,\s*41\s*,\s*59\s*\)/gi,
        `color: ${newColor}`,
      );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: position.x + el.x * scale,
        top: position.y + el.y * scale,
        display: "inline-block",
        minWidth: 20,
        minHeight: 16,
        overflow: "visible",
        pointerEvents: selectedTool === "select" ? "none" : "auto",
        userSelect: "none",
        cursor: "move",
        touchAction: "none",
        outline: isElSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        borderRadius: 3,
        boxSizing: "border-box",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
    >
      <div
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: recolorHtml(el.htmlText!, isDark) }}
        style={{
          padding: 0,
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: (el.fontSize || 28) * scale,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          border: "none",
          outline: "none",
          boxSizing: "border-box",
          pointerEvents: "none",
          display: "block",
          color: isDark ? "#ffffff" : "#1e293b",
        }}
      />
    </div>
  );
};

// ─── Main Canvas ──────────────────────────────────────────────────────────────
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
    setElementStrokeColor,
    setElementFillColor,
    groupSelected,
    ungroupSelected,
  } = useStore();

  // ── Theme ──
  const { isDark, toggleTheme } = useTheme();

  // ── Refs & state ──
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const prevIsDarkRef = React.useRef(isDark);

  const lastOverlaySelectTimeRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const finishDrawRef = useRef<() => void>(() => {});
  const isPanningRef = useRef(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastEmitRef = useRef<number>(0);
  const saveTimerRef = useRef<number | null>(null);
  const lastSnapshotRef = useRef<Map<string, string>>(new Map());
  const isTextEditRef = useRef(false);
  const prevStateRef = useRef<{
    elements: WhiteboardElement[];
    historyIndex: number;
  } | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentEl, setCurrentEl] = useState<Partial<WhiteboardElement> | null>(
    null,
  );
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [canvasBg, setCanvasBg] = useState<BgColor>(
    () => getCanvasBgColors(false)[0],
  );

  useEffect(() => {
    if (prevIsDarkRef.current === isDark) return;
    prevIsDarkRef.current = isDark;

    // 1. Switch canvas background
    setCanvasBg(getCanvasBgColors(isDark)[0]);

    const oldStrokeColors = getStrokeColors(!isDark);
    const oldFillColors = getFillColors(!isDark);
    const newStrokeColors = getStrokeColors(isDark);
    const newFillColors = getFillColors(isDark);

    // 2. Remap stroke color by index
    const strokeIdx = oldStrokeColors.findIndex(
      (c) => c.color === elementStrokeColor,
    );
    if (strokeIdx !== -1 && newStrokeColors[strokeIdx]) {
      setElementStrokeColor(newStrokeColors[strokeIdx].color);
    } else {
      setElementStrokeColor(newStrokeColors[0].color);
    }

    // 3. Remap fill color by index
    const fillIdx = oldFillColors.findIndex(
      (c) => c.color === elementFillColor,
    );
    if (fillIdx !== -1 && newFillColors[fillIdx]) {
      setElementFillColor(newFillColors[fillIdx].color);
    } else {
      setElementFillColor(newFillColors[0].color);
    }

    // 4. Remap ALL existing elements' colors by index
    const currentElements = useStore.getState().elements;
    for (const el of currentElements) {
      const attrs: Partial<WhiteboardElement> = {};

      if (el.strokeColor) {
        const idx = oldStrokeColors.findIndex(
          (c) => c.color === el.strokeColor,
        );
        if (idx !== -1 && newStrokeColors[idx]) {
          attrs.strokeColor = newStrokeColors[idx].color;
        }
      }

      if (el.fillColor && el.fillColor !== "transparent") {
        const idx = oldFillColors.findIndex((c) => c.color === el.fillColor);
        if (idx !== -1 && newFillColors[idx]) {
          attrs.fillColor = newFillColors[idx].color;
        }
      }

      if (Object.keys(attrs).length > 0) {
        updateElement(el.id, attrs);
      }
    }
  }, [isDark]);

  const [quillEditId, setQuillEditId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "pending" | "saving" | "saved"
  >("idle");
  const [roomUsers, setRoomUsers] = useState<
    Array<{ name: string; color: string; socketId: string }>
  >([]);
  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, { x: number; y: number; userName: string; color: string }>
  >(new Map());
  const [toasts, setToasts] = useState<
    Array<{ id: number; message: string; color: string }>
  >([]);
  const [copied, setCopied] = useState(false);

  const userName =
    typeof window !== "undefined"
      ? localStorage.getItem("wb_user_name") || "Anonymous"
      : "Anonymous";

  // ── Toasts ──
  const showToast = useCallback((message: string, color: string) => {
    const tid = Date.now();
    setToasts((p) => [...p, { id: tid, message, color }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== tid)), 3500);
  }, []);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Room ID copied to clipboard!", "#4f46e5");
  }, [id, showToast]);

  // ── Socket setup ──
  useEffect(() => {
    const onLoad = (data: WhiteboardElement[]) => {
      const map = new Map<string, WhiteboardElement>();
      for (const item of data) map.set(item.id, item);
      const deduped = Array.from(map.values());
      useStore.getState().setElements(deduped);
      lastSnapshotRef.current.clear();
      for (const el of deduped)
        lastSnapshotRef.current.set(el.id, JSON.stringify(el));
      // Mark initial load as complete — changes after this are real user edits
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    };
    const onReceive = (el: WhiteboardElement) => {
      const s = useStore.getState();
      if (s.elements.find((e) => e.id === el.id)) s.updateElement(el.id, el);
      else s.addElement(el);
      lastSnapshotRef.current.set(el.id, JSON.stringify(el));
    };
    const onDelete = ({ elementId }: { elementId: string }) => {
      useStore.getState().deleteElement(elementId);
      lastSnapshotRef.current.delete(elementId);
    };
    const onDeleteBatch = ({ elementIds }: { elementIds: string[] }) => {
      for (const eid of elementIds) {
        useStore.getState().deleteElement(eid);
        lastSnapshotRef.current.delete(eid);
      }
    };
    const onExpired = () => {
      socket.disconnect();
      window.location.href = "/";
      alert("This room has expired.");
    };
    const onRoomUsers = (
      users: Array<{ name: string; color: string; socketId: string }>,
    ) => setRoomUsers(users);
    const onJoined = (u: { name: string; color: string; socketId: string }) => {
      setRoomUsers((p) => [...p.filter((x) => x.socketId !== u.socketId), u]);
      showToast(`${u.name} joined`, u.color);
    };
    const onLeft = ({ socketId, name }: { socketId: string; name: string }) => {
      setRoomUsers((p) => p.filter((u) => u.socketId !== socketId));
      setRemoteCursors((p) => {
        const n = new Map(p);
        n.delete(socketId);
        return n;
      });
      showToast(`${name} left`, "#94a3b8");
    };
    const onCursor = (d: {
      socketId: string;
      x: number;
      y: number;
      userName: string;
      color: string;
    }) => {
      setRemoteCursors((p) => {
        const n = new Map(p);
        n.set(d.socketId, {
          x: d.x,
          y: d.y,
          userName: d.userName,
          color: d.color,
        });
        return n;
      });
    };

    socket.on("load_canvas", onLoad);
    socket.on("receive_draw", onReceive);
    socket.on("element_deleted", onDelete);
    socket.on("elements_deleted", onDeleteBatch);
    socket.on("room_expired", onExpired);
    socket.on("room_users", onRoomUsers);
    socket.on("user_joined", onJoined);
    socket.on("user_left", onLeft);
    socket.on("cursor_moved", onCursor);

    socket.connect();
    socket.emit("join_room", id, userName);
    localStorage.setItem("wb_last_room_id", id);
    if (userName !== "Anonymous")
      localStorage.setItem("wb_user_name", userName);

    return () => {
      socket.off("load_canvas", onLoad);
      socket.off("receive_draw", onReceive);
      socket.off("element_deleted", onDelete);
      socket.off("elements_deleted", onDeleteBatch);
      socket.off("room_expired", onExpired);
      socket.off("room_users", onRoomUsers);
      socket.off("user_joined", onJoined);
      socket.off("user_left", onLeft);
      socket.off("cursor_moved", onCursor);
      socket.disconnect();
    };
  }, [id, userName, showToast]);

  // ── Flush changes ──
  const flushChanges = useCallback(
    async (emitLeave = false) => {
      const state = useStore.getState();
      const changed: WhiteboardElement[] = [];
      const deletedIds: string[] = [];

      for (const el of state.elements) {
        const s = JSON.stringify(el);
        if (lastSnapshotRef.current.get(el.id) !== s) {
          changed.push(el);
          lastSnapshotRef.current.set(el.id, s);
        }
      }
      const curIds = new Set(state.elements.map((e) => e.id));
      for (const k of Array.from(lastSnapshotRef.current.keys())) {
        if (!curIds.has(k)) {
          deletedIds.push(k);
          lastSnapshotRef.current.delete(k);
        }
      }
      if (changed.length === 0 && deletedIds.length === 0) return;
      try {
        setAutoSaveStatus("saving");
        for (const el of changed)
          socket.emit("draw_element", { roomId: id, element: el });
        if (deletedIds.length === 1)
          socket.emit("delete_element", {
            roomId: id,
            elementId: deletedIds[0],
          });
        else if (deletedIds.length > 1)
          socket.emit("delete_elements", {
            roomId: id,
            elementIds: deletedIds,
          });
        if (emitLeave) socket.emit("leave_room", id);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 1200);
      } catch (err) {
        console.error("Autosave failed", err);
        setAutoSaveStatus("idle");
      }
    },
    [id],
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { src, width, height } = (e as CustomEvent).detail;
      const stage = stageRef.current;
      const cx = stage ? (stage.width() / 2 - position.x) / scale : 400;
      const cy = stage ? (stage.height() / 2 - position.y) / scale : 300;
      const newEl = {
        id: `image-${Date.now()}`,
        type: "image" as const,
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
        src,
      } as WhiteboardElement;
      addElement(newEl);
      selectElement(newEl.id);
      setTool("select");
      void flushChanges(false);
    };
    window.addEventListener("wb_insert_image", handler);
    return () => window.removeEventListener("wb_insert_image", handler);
  }, [addElement, selectElement, setTool, flushChanges, position, scale]);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const schedule = () => {
      if (isInitialLoadRef.current) return; // skip during initial load
      setAutoSaveStatus("pending");
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        flushChanges(false);
        saveTimerRef.current = null;
      }, 400);
    };
    const unsub = useStore.subscribe((state, prev) => {
      if (state.elements !== prev.elements) schedule();
      prevStateRef.current = {
        elements: state.elements,
        historyIndex: state.historyIndex,
      };
    });
    return unsub;
  }, [flushChanges]);

  useEffect(() => {
    const handler = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      flushChanges(true);
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flushChanges]);

  const handleManualSave = useCallback(async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await flushChanges(true);
  }, [flushChanges]);

  // ── Zoom helpers ──
  const applyZoom = useCallback(
    (newScaleRaw: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const newScale = Math.max(0.3, Math.min(4, newScaleRaw));
      const pointer = stage.getPointerPosition() ?? {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };
      const old = scale;
      const mt = {
        x: pointer.x / old - stage.x() / old,
        y: pointer.y / old - stage.y() / old,
      };
      const np = {
        x: -(mt.x - pointer.x / newScale) * newScale,
        y: -(mt.y - pointer.y / newScale) * newScale,
      };
      setScale(newScale);
      setPosition(np);
      stage.scale({ x: newScale, y: newScale });
      stage.position(np);
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

  // ── Pointer helpers ──
  const getPointerPos = useCallback((): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const p = stage.getPointerPosition();
    if (!p) return { x: 0, y: 0 };
    const sp = stage.position();
    const ss = stage.scaleX();
    return { x: (p.x - sp.x) / ss, y: (p.y - sp.y) / ss };
  }, []);

  const getTouchPos = useCallback((touch: Touch): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.container().getBoundingClientRect();
    const sp = stage.position();
    const ss = stage.scaleX();
    return {
      x: (touch.clientX - rect.left - sp.x) / ss,
      y: (touch.clientY - rect.top - sp.y) / ss,
    };
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      )
        return;
      if (isTextEditRef.current) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = useStore.getState();
        if (s.selectedElementIds.length > 0) s.deleteSelected();
        else if (s.selectedElementId) s.deleteElement(s.selectedElementId);
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        void flushChanges(false);
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
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
      if (
        (e.key === "g" || e.key === "G") &&
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey
      ) {
        e.preventDefault();
        useStore.getState().groupSelected();
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
        setAutoSaveStatus("pending");
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
          flushChanges(false);
          saveTimerRef.current = null;
        }, 100);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleManualSave,
    flushChanges,
  ]);

  // ── Draw ──
  const startDraw = useCallback(
    (pos: { x: number; y: number }, isOnStage: boolean) => {
      if (isTextEditRef.current) return;
      drawStartRef.current = pos;

      if (selectedTool === "select") {
        if (!isOnStage) return;
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
        setIsDrawing(true);
        return;
      }
      if (selectedTool === "rectangle") {
        setCurrentEl({
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
        setCurrentEl({
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
        setCurrentEl({
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
        setCurrentEl({
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
        setCurrentEl({
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
        setCurrentEl({
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
        setCurrentEl({
          id: `pencil-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
        setQuillEditId(newEl.id);
        isTextEditRef.current = true;
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
      if (!currentEl) return;
      if (
        ["rectangle", "circle", "triangle", "diamond", "polygon"].includes(
          selectedTool,
        )
      ) {
        setCurrentEl((p) =>
          p
            ? {
                ...p,
                x: Math.min(pos.x, start.x),
                y: Math.min(pos.y, start.y),
                width: Math.abs(pos.x - start.x),
                height: Math.abs(pos.y - start.y),
              }
            : p,
        );
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setCurrentEl((p) => {
          if (!p) return p;
          const pts = p.points ? [...p.points] : [];
          pts[1] = { x: pos.x, y: pos.y };
          return { ...p, points: pts };
        });
      } else if (selectedTool === "pencil") {
        setCurrentEl((p) =>
          p
            ? { ...p, points: [...(p.points || []), { x: pos.x, y: pos.y }] }
            : p,
        );
      }
    },
    [selectedTool, currentEl],
  );

  const elementInBox = useCallback(
    (
      el: WhiteboardElement,
      box: { x: number; y: number; width: number; height: number },
    ): boolean => {
      const br = box.x + box.width,
        bb = box.y + box.height;
      if (el.points && el.points.length > 0) {
        for (const p of el.points)
          if (p.x >= box.x && p.x <= br && p.y >= box.y && p.y <= bb)
            return true;
        const mnx = Math.min(...el.points.map((p) => p.x)),
          mxx = Math.max(...el.points.map((p) => p.x));
        const mny = Math.min(...el.points.map((p) => p.y)),
          mxy = Math.max(...el.points.map((p) => p.y));
        return !(br < mnx || box.x > mxx || bb < mny || box.y > mxy);
      }
      const er = (el.x || 0) + (el.width || 0),
        eb = (el.y || 0) + (el.height || 0);
      return !(
        br < (el.x || 0) ||
        box.x > er ||
        bb < (el.y || 0) ||
        box.y > eb
      );
    },
    [],
  );

  const finishDraw = useCallback(() => {
    if (selectedTool === "select" && selectionBox) {
      if (selectionBox.width > 5 || selectionBox.height > 5) {
        const ids = elements
          .filter((el) => elementInBox(el, selectionBox))
          .map((el) => el.id);
        if (ids.length > 0) selectElements(ids);
        else selectElement(null);
      } else {
        if (Date.now() - lastOverlaySelectTimeRef.current >= 300)
          selectElement(null);
      }
      setSelectionBox(null);
      setIsDrawing(false);
      return;
    }
    if (!isDrawing || !currentEl) return;
    let addedId: string | null = null;

    if (
      ["rectangle", "circle", "triangle", "diamond"].includes(
        currentEl.type || "",
      )
    ) {
      if ((currentEl.width || 0) > 5 && (currentEl.height || 0) > 5) {
        addElement(currentEl as WhiteboardElement);
        addedId = currentEl.id as string;
        void flushChanges(false);
      }
    } else if (["line", "arrow", "pencil"].includes(currentEl.type || "")) {
      addElement(currentEl as WhiteboardElement);
      addedId = currentEl.id as string;
      void flushChanges(false);
    } else if (currentEl.type === "polygon") {
      const sides = (currentEl as any).sides || 6;
      const w = currentEl.width || 0,
        h = currentEl.height || 0;
      const cx = (currentEl.x || 0) + w / 2,
        cy = (currentEl.y || 0) + h / 2,
        r = Math.min(w, h) / 2;
      const pts = Array.from({ length: sides }).map((_, i) => {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      });
      const mnx = Math.min(...pts.map((p) => p.x)),
        mny = Math.min(...pts.map((p) => p.y));
      const mxx = Math.max(...pts.map((p) => p.x)),
        mxy = Math.max(...pts.map((p) => p.y));
      const el = {
        id: currentEl.id as string,
        type: "polygon",
        x: mnx,
        y: mny,
        width: mxx - mnx,
        height: mxy - mny,
        points: pts,
        strokeColor: currentEl.strokeColor,
        fillColor: currentEl.fillColor,
        strokeWidth: currentEl.strokeWidth,
      } as WhiteboardElement;
      addElement(el);
      addedId = el.id;
    }

    if (addedId && currentEl?.type !== "pencil") {
      selectElement(addedId);
      setTool("select");
    }
    setIsDrawing(false);
    setCurrentEl(null);
  }, [
    isDrawing,
    currentEl,
    selectedTool,
    selectionBox,
    elements,
    selectElement,
    selectElements,
    addElement,
    setTool,
    elementInBox,
    flushChanges,
  ]);

  useEffect(() => {
    finishDrawRef.current = finishDraw;
  }, [finishDraw]);

  // ── Multi-drag ──
  const handleMultiDragEnd = useCallback(
    (draggedId: string, newX: number, newY: number) => {
      const s = useStore.getState();
      if (s.selectedElementIds.length <= 1) {
        updateElement(draggedId, { x: newX, y: newY });
        return;
      }
      const dragged = s.elements.find((el) => el.id === draggedId);
      if (!dragged) return;
      const dx = dragged.points
        ? newX - (dragged.points[0]?.x ?? dragged.x)
        : newX - dragged.x;
      const dy = dragged.points
        ? newY - (dragged.points[0]?.y ?? dragged.y)
        : newY - dragged.y;
      updateElements(
        s.selectedElementIds.filter((i) => i !== draggedId),
        { dx, dy },
      );
      updateElement(draggedId, { x: newX, y: newY });
      void flushChanges(false);
    },
    [updateElement, updateElements, flushChanges],
  );

  const handleMultiBoxDrag = useCallback(
    (dx: number, dy: number) => {
      updateElements(selectedElementIds, { dx, dy });
      void flushChanges(false);
    },
    [selectedElementIds, updateElements, flushChanges],
  );

  // ── Mouse events ──
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isTextEditRef.current) return;
      if (e.evt.ctrlKey || e.evt.metaKey) {
        setIsDraggingStage(true);
        lastPosRef.current = stageRef.current?.getPointerPosition() ?? null;
        e.evt.preventDefault();
        return;
      }
      startDraw(getPointerPos(), e.target === e.target.getStage());
    },
    [getPointerPos, startDraw],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getPointerPos();
      const now = Date.now();
      if (now - lastEmitRef.current > 30) {
        const me = roomUsers.find((u) => u.socketId === socket.id);
        if (me) {
          socket.emit("cursor_move", {
            roomId: id,
            x: pos.x,
            y: pos.y,
            userName: me.name,
            color: me.color,
          });
          lastEmitRef.current = now;
        }
      }
      if (isDraggingStage && (e.evt.ctrlKey || e.evt.metaKey)) {
        const stage = stageRef.current;
        if (!stage) return;
        const pp = stage.getPointerPosition();
        if (!pp) return;
        const lp = lastPosRef.current ?? pp;
        const np = {
          x: position.x + (pp.x - lp.x),
          y: position.y + (pp.y - lp.y),
        };
        setPosition(np);
        stage.position(np);
        stage.batchDraw();
        lastPosRef.current = pp;
        return;
      }
      if (!isDrawing) return;
      updateDraw(pos);
    },
    [
      isDraggingStage,
      isDrawing,
      getPointerPos,
      updateDraw,
      position,
      roomUsers,
      id,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingStage) {
      setIsDraggingStage(false);
      lastPosRef.current = null;
      return;
    }
    finishDraw();
  }, [isDraggingStage, finishDraw]);

  // ── Touch events ──
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();
    const onStart = (e: TouchEvent) => {
      if (isTextEditRef.current) return;
      if (e.touches.length === 2) {
        isPanningRef.current = true;
        return;
      }
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      const rect = stage.container().getBoundingClientRect();
      const hit = stage.getIntersection({
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      }) as Konva.Node | null;
      startDraw(getTouchPos(t), !hit || hit === stage);
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && isPanningRef.current) {
        const t1 = e.touches[0],
          t2 = e.touches[1];
        const mx = (t1.clientX + t2.clientX) / 2,
          my = (t1.clientY + t2.clientY) / 2;
        if (lastTouchRef.current) {
          const np = {
            x: stage.x() + (mx - lastTouchRef.current.x),
            y: stage.y() + (my - lastTouchRef.current.y),
          };
          setPosition(np);
          stage.position(np);
          stage.batchDraw();
        }
        lastTouchRef.current = { x: mx, y: my };
        return;
      }
      const t = e.touches[0];
      const pos = getTouchPos(t);
      const now = Date.now();
      if (now - lastEmitRef.current > 30) {
        const me = roomUsers.find((u) => u.socketId === socket.id);
        if (me) {
          socket.emit("cursor_move", {
            roomId: id,
            x: pos.x,
            y: pos.y,
            userName: me.name,
            color: me.color,
          });
          lastEmitRef.current = now;
        }
      }
      updateDraw(pos);
    };
    const onEnd = (e: TouchEvent) => {
      if (isPanningRef.current && e.touches.length < 2) {
        isPanningRef.current = false;
        lastTouchRef.current = null;
        return;
      }
      finishDraw();
      lastTouchRef.current = null;
    };
    container.addEventListener("touchstart", onStart, { passive: false });
    container.addEventListener("touchmove", onMove, { passive: false });
    container.addEventListener("touchend", onEnd, { passive: false });
    return () => {
      container.removeEventListener("touchstart", onStart);
      container.removeEventListener("touchmove", onMove);
      container.removeEventListener("touchend", onEnd);
    };
  }, [getTouchPos, startDraw, updateDraw, finishDraw, roomUsers, id]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      applyZoom(scale + (e.evt.deltaY > 0 ? -1 : 1) * 0.1);
    },
    [scale, applyZoom],
  );

  // ── Status badge colours ──
  const statusStyles = (() => {
    switch (autoSaveStatus) {
      case "pending":
        return {
          bg: isDark ? "rgba(60,40,10,0.88)" : "rgba(253,242,233,0.95)",
          border: isDark ? "rgba(180,100,20,0.3)" : "rgba(253,195,126,0.4)",
          text: isDark ? "rgba(255,185,80,0.9)" : "rgba(146,95,38,0.9)",
          spin: isDark ? "rgba(255,160,50,0.8)" : "rgba(251,146,60,0.8)",
        };
      case "saving":
        return {
          bg: isDark ? "rgba(10,30,60,0.88)" : "rgba(225,242,254,0.95)",
          border: isDark ? "rgba(60,100,200,0.3)" : "rgba(147,197,253,0.4)",
          text: isDark ? "rgba(120,180,255,0.9)" : "rgba(30,58,138,0.9)",
          spin: isDark ? "rgba(80,140,255,0.8)" : "rgba(59,130,246,0.8)",
        };
      case "saved":
        return {
          bg: isDark ? "rgba(5,35,20,0.88)" : "rgba(236,253,245,0.95)",
          border: isDark ? "rgba(30,150,80,0.3)" : "rgba(134,239,172,0.4)",
          text: isDark ? "rgba(80,220,130,0.9)" : "rgba(5,107,47,0.9)",
          spin: isDark ? "rgba(60,200,110,0.8)" : "rgba(52,211,153,0.8)",
        };
      default:
        return {
          bg: isDark ? "rgba(15,20,40,0.80)" : "rgba(241,245,249,0.92)",
          border: isDark ? "rgba(255,255,255,0.07)" : "rgba(203,213,225,0.3)",
          text: isDark ? "rgba(140,155,200,0.75)" : "rgba(71,85,105,0.75)",
          spin: isDark ? "rgba(100,120,180,0.7)" : "rgba(148,163,184,0.7)",
        };
    }
  })();

  // ── Glass panel helper ──
  const glassBg = isDark ? "rgba(15,18,35,0.82)" : "rgba(255,255,255,0.70)";
  const glassBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.4)";
  const glassShadow = isDark
    ? "0 4px 16px rgba(0,0,0,0.50)"
    : "0 4px 16px rgba(0,0,0,0.08)";
  const glassBdrTop = isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(255,255,255,0.9)";
  const textPrimary = isDark ? "#e2e8f0" : "#334155";
  const textMuted = isDark ? "rgba(140,158,200,0.60)" : "#94a3b8";

  // Canvas dot bg
  // canvasBg already switches on theme toggle — just use it directly
  const dotBgColor = canvasBg.color;
  const dotColor = canvasBg.dotColor;

  const stageWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const stageHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  return (
    <>
      <Toolbar isDark={isDark} />
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── Top-center user status ── */}
        <div
          className="top-center-status"
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: glassBg,
            backdropFilter: "blur(12px) saturate(160%)",
            WebkitBackdropFilter: "blur(12px) saturate(160%)",
            padding: "6px 18px",
            borderRadius: "50px",
            border: `1px solid ${glassBorder}`,
            borderTopColor: glassBdrTop,
            boxShadow: glassShadow,
            transition: "background 0.3s, border-color 0.3s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {roomUsers.slice(0, 3).map((u, i) => {
              const isMe = u.name === userName;
              return (
                <div
                  key={u.socketId}
                  title={isMe ? `${u.name} (you)` : u.name}
                  style={{
                    position: "relative",
                    marginLeft: i > 0 ? -12 : 0,
                    zIndex: 10 - i,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: -2,
                      borderRadius: "50%",
                      border: `2px solid ${u.color}`,
                      animation: "pingRing 2s cubic-bezier(0,0,0.2,1) infinite",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: u.color,
                      border: isMe
                        ? "2.5px solid #a78bfa"
                        : `2.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "white"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 10,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      transition: "transform 0.2s",
                      transform: isMe ? "scale(1.1)" : "scale(1)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform =
                        "scale(1.2) translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = isMe
                        ? "scale(1.1)"
                        : "scale(1)")
                    }
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              );
            })}
            {roomUsers.length > 3 && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc",
                  border: `2.5px solid ${isDark ? "rgba(255,255,255,0.12)" : "white"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDark ? "#a5b4fc" : "#64748b",
                  fontWeight: 800,
                  fontSize: 10,
                  marginLeft: -12,
                  zIndex: 0,
                }}
              >
                +{roomUsers.length - 3}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: textPrimary,
              letterSpacing: "0.3px",
            }}
          >
            {roomUsers.length} online
          </span>
        </div>

        {/* ── Top-right actions ── */}
        <div
          className="top-right-actions"
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 60,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* Theme toggle */}
          <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />

          {/* Room ID */}
          <div
            onClick={handleCopyId}
            className="room-id-box"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: glassBg,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "14px",
              border: `1px solid ${glassBorder}`,
              borderTopColor: glassBdrTop,
              boxShadow: glassShadow,
              cursor: "pointer",
              transition: "all 0.2s",
              transform: copied ? "scale(0.96)" : "scale(1)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  className="room-id-label"
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    color: textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    lineHeight: 1,
                  }}
                >
                  Room
                </span>
                <span
                  className="share-label"
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#a78bfa",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    lineHeight: 1,
                  }}
                >
                  • SHARE
                </span>
                <span
                  className="mobile-share-text"
                  style={{
                    display: "none",
                    fontSize: 10,
                    fontWeight: 700,
                    color: textPrimary,
                  }}
                >
                  share id
                </span>
              </div>
              <span
                className="room-id-value"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: textPrimary,
                  fontFamily: "monospace",
                  lineHeight: 1,
                }}
              >
                {id.slice(0, 4)}...{id.slice(-4)}
              </span>
            </div>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: copied
                  ? "#10b981"
                  : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: copied ? "white" : isDark ? "#a5b4fc" : "#64748b",
                transition: "all 0.4s",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 13, height: 13 }}
              >
                {copied ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
            </div>
            {copied && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-32px",
                  right: 0,
                  background: "#0f172a",
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "50px",
                  fontSize: 9,
                  fontWeight: 700,
                  animation: "slideUpToast 0.3s ease both",
                  pointerEvents: "none",
                  zIndex: 100,
                }}
              >
                Copied!
              </div>
            )}
          </div>

          {/* Save & status */}
          <div
            className="save-status-group"
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <button
              onClick={handleManualSave}
              className="save-button"
              style={{
                background: isDark
                  ? "linear-gradient(135deg,rgba(30,35,60,0.9),rgba(20,25,50,0.9))"
                  : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
                color: isDark ? "#c4b5fd" : "#334155",
                padding: "10px 20px",
                borderRadius: "14px",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(203,213,225,0.5)",
                boxShadow: isDark
                  ? "0 4px 12px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.07)"
                  : "0 4px 12px rgba(0,0,0,0.05),inset 0 1px 0 white",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Save
            </button>

            <div
              className="status-badge"
              style={{
                minWidth: 130,
                padding: "10px 16px",
                borderRadius: 14,
                background: statusStyles.bg,
                border: `1.5px solid ${statusStyles.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                color: statusStyles.text,
                fontWeight: 600,
                transition: "all 0.3s",
                backdropFilter: "blur(8px)",
              }}
            >
              {(autoSaveStatus === "saving" ||
                autoSaveStatus === "pending") && (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `2px solid ${statusStyles.spin}`,
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
              {autoSaveStatus === "saved" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 14, height: 14 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className="status-text" style={{ letterSpacing: "0.2px" }}>
                {autoSaveStatus === "pending"
                  ? "Pending"
                  : autoSaveStatus === "saving"
                    ? "Saving..."
                    : autoSaveStatus === "saved"
                      ? "Saved"
                      : "Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Canvas background */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundColor: dotBgColor,
            backgroundImage: `radial-gradient(circle,${dotColor} 1px,transparent 1px)`,
            backgroundSize: `${20 * scale}px ${20 * scale}px`,
            backgroundPosition: `${position.x}px ${position.y}px`,
            transition: "background-color 0.3s",
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background: isDark
              ? "radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.25) 100%)"
              : "radial-gradient(ellipse at center,transparent 60%,rgba(148,163,184,0.08) 100%)",
          }}
        />

        {/* Stage */}
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
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <Layer ref={layerRef}>
            {elements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const isSingle = isSelected && selectedElementIds.length === 1;
              const sharedProps = {
                element,
                isSelected,
                isSingleSelected: isSingle,
                onSelect: selectElement,
                onTransformEnd: (
                  eid: string,
                  attrs: Partial<WhiteboardElement>,
                ) => {
                  updateElement(eid, attrs);
                  if (saveTimerRef.current) {
                    window.clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = null;
                  }
                  void flushChanges(false);
                },
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
                      onEditingChange={(v) => {
                        isTextEditRef.current = v;
                      }}
                    />
                  )}
                  {element.type === "sticky" && (
                    <StickyShape
                      {...sharedProps}
                      setTool={setTool}
                      onEditingChange={(v) => {
                        isTextEditRef.current = v;
                      }}
                    />
                  )}
                  {element.type === "image" && <ImageShape {...sharedProps} />}
                </React.Fragment>
              );
            })}

            {selectedElementIds.length > 1 && (
              <MultiSelectBox
                elements={elements}
                selectedIds={selectedElementIds}
                onDragAll={handleMultiBoxDrag}
                onSelect={selectElement}
                updateElement={updateElement}
                onFlush={() => void flushChanges(false)}
              />
            )}

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

            {isDrawing && currentEl && (
              <>
                {currentEl.type === "rectangle" && (
                  <Rect
                    x={currentEl.x}
                    y={currentEl.y}
                    width={currentEl.width || 0}
                    height={currentEl.height || 0}
                    stroke={COLORS.selection}
                    strokeWidth={2}
                    fill={currentEl.fillColor || COLORS.selectionFill}
                    cornerRadius={4}
                    dash={[4, 3]}
                    listening={false}
                    opacity={0.7}
                  />
                )}
                {currentEl.type === "circle" &&
                  (() => {
                    const r =
                      Math.max(currentEl.width || 0, currentEl.height || 0) / 2;
                    return (
                      <Circle
                        x={(currentEl.x || 0) + r}
                        y={(currentEl.y || 0) + r}
                        radius={r}
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentEl.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {(currentEl.type === "line" || currentEl.type === "arrow") && (
                  <Line
                    points={(currentEl.points || []).flatMap((p) => [p.x, p.y])}
                    stroke={COLORS.selection}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {currentEl.type === "triangle" &&
                  (() => {
                    const w = currentEl.width || 0,
                      h = currentEl.height || 0;
                    return (
                      <Line
                        x={currentEl.x}
                        y={currentEl.y}
                        points={[w / 2, 0, w, h, 0, h]}
                        closed
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentEl.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentEl.type === "diamond" &&
                  (() => {
                    const w = currentEl.width || 0,
                      h = currentEl.height || 0;
                    return (
                      <Line
                        x={currentEl.x}
                        y={currentEl.y}
                        points={[w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]}
                        closed
                        stroke={COLORS.selection}
                        strokeWidth={2}
                        fill={currentEl.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentEl.type === "polygon" &&
                  (() => {
                    const sides = (currentEl as any).sides || 6,
                      w = currentEl.width || 0,
                      h = currentEl.height || 0;
                    const cx = (currentEl.x || 0) + w / 2,
                      cy = (currentEl.y || 0) + h / 2,
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
                        fill={currentEl.fillColor || COLORS.selectionFill}
                        dash={[4, 3]}
                        listening={false}
                        opacity={0.7}
                      />
                    );
                  })()}
                {currentEl.type === "pencil" && (
                  <Line
                    points={(currentEl.points || []).flatMap((p) => [p.x, p.y])}
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

          <Layer>
            {Array.from(remoteCursors.entries())
              .filter(([sid]) => sid !== socket.id)
              .map(([sid, cursor]) => (
                <Group key={sid} x={cursor.x} y={cursor.y} listening={false}>
                  <Line
                    points={[0, 0, 0, 15, 4, 11, 10, 11]}
                    closed
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={12}
                    y={12}
                    width={cursor.userName.length * 7 + 10}
                    height={16}
                    fill={cursor.color}
                    cornerRadius={4}
                  />
                  <KonvaText
                    text={cursor.userName}
                    x={16}
                    y={15}
                    fill="white"
                    fontSize={10}
                    fontStyle="bold"
                  />
                </Group>
              ))}
          </Layer>
        </Stage>

        {/* Rich-text HTML overlay */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 3,
            overflow: "hidden",
          }}
        >
          {elements
            .filter((el) => el.type === "text" && el.htmlText)
            .map((el) => (
              <RichTextOverlayEl
                key={`${el.id}-${isDark}`}
                el={el}
                isElSelected={selectedElementIds.includes(el.id)}
                position={position}
                scale={scale}
                selectElement={selectElement}
                updateElement={updateElement}
                flushChanges={flushChanges}
                setQuillEditingElementId={setQuillEditId}
                isAnyTextEditingRef={isTextEditRef}
                lastOverlaySelectTimeRef={lastOverlaySelectTimeRef}
                selectedTool={selectedTool}
              />
            ))}
        </div>

        {/* Quill modal */}
        {quillEditId &&
          (() => {
            const editEl = elements.find((el) => el.id === quillEditId);
            return editEl ? (
              <QuillEditorModal
                initialHtml={editEl.htmlText || ""}
                onSave={(html, plain) => {
                  updateElement(quillEditId, {
                    text: plain || " ",
                    htmlText: html,
                  });
                  setQuillEditId(null);
                  isTextEditRef.current = false;
                  void flushChanges(false);
                }}
                onClose={() => {
                  setQuillEditId(null);
                  isTextEditRef.current = false;
                }}
              />
            ) : null;
          })()}

        {/* YIO logo */}
        <div
          className="top-left-logo"
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 60,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "1.8rem",
              fontWeight: 800,
              letterSpacing: "-1px",
              background:
                "linear-gradient(135deg,#a78bfa 0%,#f472b6 55%,#38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            YIO
          </div>
        </div>

        {/* Toasts */}
        <div
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: isDark ? "rgba(15,18,35,0.97)" : "#0f172a",
                color: "white",
                padding: "8px 16px",
                borderRadius: "50px",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                borderLeft: `3px solid ${t.color}`,
                animation: "slideUpToast 0.3s ease",
                whiteSpace: "nowrap",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pingRing    { 0%{transform:scale(1);opacity:.5} 70%{transform:scale(1.45);opacity:0} 100%{transform:scale(1.45);opacity:0} }
          @keyframes slideUpToast{ from{opacity:0;transform:translateY(12px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes spin        { to{transform:rotate(360deg)} }

          @media(max-width:800px){
            .top-left-logo     { top:15px!important; left:15px!important; }
            .top-center-status { top:15px!important; padding:4px 10px!important; }
            .top-right-actions { top:15px!important; right:15px!important; gap:6px!important; }
            .save-status-group {
              position:fixed!important; bottom:15px!important; left:50%!important;
              transform:translateX(-50%)!important;
              background:${isDark ? "rgba(15,18,35,0.88)" : "rgba(255,255,255,0.88)"}!important;
              backdrop-filter:blur(8px)!important; padding:6px 12px!important;
              border-radius:50px!important; border:1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}!important;
              box-shadow:0 4px 15px rgba(0,0,0,0.08)!important; z-index:100!important;
              white-space:nowrap!important; gap:8px!important;
            }
            .save-button   { padding:6px 14px!important; font-size:11px!important; border-radius:50px!important; }
            .status-badge  { min-width:auto!important; padding:6px 10px!important; background:transparent!important; border:none!important; box-shadow:none!important; gap:6px!important; }
            .status-text   { font-size:10px!important; }
            .room-id-box   { padding:4px 8px!important; border-radius:8px!important; }
          }
          @media(max-width:500px){
            .top-left-logo div         { font-size:1.5rem!important; }
            .top-center-status span    { display:none!important; }
            .room-id-label,.room-id-value,.share-label { display:none!important; }
            .mobile-share-text         { display:block!important; }
            .save-status-group         { bottom:10px!important; gap:4px!important; padding:4px 10px!important; }
          }
        `}</style>

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
          isDark={isDark}
        />
      </div>
    </>
  );
}
