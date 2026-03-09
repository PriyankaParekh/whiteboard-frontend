"use client";

import { useStore, ToolType } from "../store/useStore";
import {
  MousePointer2,
  Square,
  Circle,
  ArrowRight,
  Pen,
  StickyNote,
  Type,
  Minus,
  Hexagon,
  Triangle,
  Diamond,
  RotateCcw,
  RotateCw,
  Upload,
} from "lucide-react";

interface ToolbarButton {
  id: ToolType | "undo" | "redo" | "delete" | "upload";
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
}

const toolbarButtons: ToolbarButton[] = [
  { id: "select", icon: <MousePointer2 size={16} />, label: "Selection" },
  { id: "rectangle", icon: <Square size={16} />, label: "Rectangle" },
  { id: "circle", icon: <Circle size={16} />, label: "Circle" },
  { id: "line", icon: <Minus size={16} />, label: "Line" },
  { id: "arrow", icon: <ArrowRight size={16} />, label: "Arrow" },
  { id: "polygon", icon: <Hexagon size={16} />, label: "Polygon" },
  { id: "triangle", icon: <Triangle size={16} />, label: "Triangle" },
  { id: "diamond", icon: <Diamond size={16} />, label: "Diamond" },
  { id: "pencil", icon: <Pen size={16} />, label: "Pencil" },
  { id: "text", icon: <Type size={16} />, label: "Text" },
  {
    id: "sticky",
    icon: <StickyNote size={16} />,
    label: "Sticky Note",
    divider: true,
  },
  { id: "undo", icon: <RotateCcw size={16} />, label: "Undo" },
  { id: "redo", icon: <RotateCw size={16} />, label: "Redo" },
  {
    id: "upload",
    icon: <Upload size={16} />,
    label: "Upload File",
    divider: true,
  },
];

const DRAWING_TOOLS = [
  "select",
  "rectangle",
  "circle",
  "line",
  "arrow",
  "polygon",
  "triangle",
  "diamond",
  "pencil",
  "text",
  "sticky",
];

export interface ToolbarProps {
  isDark: boolean;
}

export default function Toolbar({ isDark }: ToolbarProps) {
  const {
    selectedTool,
    setTool,
    selectedElementId,
    deleteElement,
    undo,
    redo,
    historyIndex,
    history,
  } = useStore();

  const handleToolClick = (
    toolId: ToolType | "undo" | "redo" | "delete" | "upload",
  ) => {
    if (toolId === "undo") {
      undo();
      return;
    }
    if (toolId === "redo") {
      redo();
      return;
    }
    if (toolId === "delete") {
      if (selectedElementId) deleteElement(selectedElementId);
      return;
    }
    if (toolId === "upload") {
      return;
    }
    setTool(toolId as ToolType);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDelete = selectedElementId !== null;

  const panelBg = isDark ? "rgba(15,18,35,0.88)" : "rgba(255,255,255,0.82)";
  const panelBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(148,163,184,0.28)";
  const panelShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 8px 24px rgba(0,0,0,0.08)";
  const dividerBg = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(148,163,184,0.22)";
  const iconDef = isDark ? "rgba(190,205,235,0.75)" : "#64748b";
  const iconAct = isDark ? "#a5b4fc" : "#2563eb";
  const activeBg = isDark ? "rgba(99,102,241,0.22)" : "rgba(59,130,246,0.12)";
  const activeShadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2)"
    : "0 2px 8px rgba(59,130,246,0.2), 0 0 0 1px rgba(59,130,246,0.15)";
  const hoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(148,163,184,0.15)";
  const hoverColor = isDark ? "#ffffff" : "#1e293b";

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: panelBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${panelBorder}`,
          borderRadius: 14,
          boxShadow: panelShadow,
          padding: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {toolbarButtons.map((button, index) => {
          const isActive =
            DRAWING_TOOLS.includes(button.id as string) &&
            selectedTool === button.id;
          const isDisabled =
            (button.id === "undo" && !canUndo) ||
            (button.id === "redo" && !canRedo) ||
            (button.id === "delete" && !canDelete);

          return (
            <div key={button.id}>
              {button.divider && index > 0 && (
                <div
                  style={{
                    height: 1,
                    background: dividerBg,
                    margin: "4px 2px",
                  }}
                />
              )}
              <button
                onClick={() => handleToolClick(button.id)}
                disabled={isDisabled}
                title={button.label}
                aria-label={button.label}
                style={{
                  position: "relative",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.35 : 1,
                  transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                  background: isActive ? activeBg : "transparent",
                  color: isActive ? iconAct : iconDef,
                  boxShadow: isActive ? activeShadow : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isActive) {
                    e.currentTarget.style.background = hoverBg;
                    e.currentTarget.style.color = hoverColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = iconDef;
                  }
                }}
              >
                {button.icon}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
