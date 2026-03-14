"use client";

import { useStore, ToolType } from "../store/useStore";
import { useState } from "react";
import BrainstormModal from "./BrainstromModal";
import ImageUploadModal from "./ImageUploadModal";
import DiagramModal from "./DiagramGenerator";
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
  { id: "select", icon: <MousePointer2 size={15} />, label: "Selection" },
  { id: "rectangle", icon: <Square size={15} />, label: "Rectangle" },
  { id: "circle", icon: <Circle size={15} />, label: "Circle" },
  { id: "line", icon: <Minus size={15} />, label: "Line" },
  { id: "arrow", icon: <ArrowRight size={15} />, label: "Arrow" },
  { id: "polygon", icon: <Hexagon size={15} />, label: "Polygon" },
  { id: "triangle", icon: <Triangle size={15} />, label: "Triangle" },
  { id: "diamond", icon: <Diamond size={15} />, label: "Diamond" },
  { id: "pencil", icon: <Pen size={15} />, label: "Pencil" },
  { id: "text", icon: <Type size={15} />, label: "Text" },
  {
    id: "sticky",
    icon: <StickyNote size={15} />,
    label: "Sticky Note",
    divider: true,
  },
  { id: "undo", icon: <RotateCcw size={15} />, label: "Undo" },
  { id: "redo", icon: <RotateCw size={15} />, label: "Redo" },
  {
    id: "upload",
    icon: <Upload size={15} />,
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

// Sparkle star SVG icon (no external dep)
const StarIcon = ({
  size = 16,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    <path d="M5 2v3M3.5 3.5h3M19 19v3M17.5 20.5h3" />
  </svg>
);

// Flow diagram icon
const FlowIcon = ({
  size = 16,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="3" width="6" height="6" rx="1" />
    <rect x="9" y="15" width="6" height="6" rx="1" />
    <path d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9" />
  </svg>
);

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

  const [showImageModal, setShowImageModal] = useState(false);
  const [showBrainstorm, setShowBrainstorm] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);

  const handleToolClick = (
    toolId:
      | ToolType
      | "undo"
      | "redo"
      | "delete"
      | "upload"
      | "brainstorm"
      | "diagram",
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
      setShowImageModal(true);
      return;
    }
    if (toolId === "brainstorm") {
      setShowBrainstorm(true);
      return;
    }
    if (toolId === "diagram") {
      setShowDiagram(true);
      return;
    }
    setTool(toolId as ToolType);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDelete = selectedElementId !== null;

  const panelBg = isDark ? "rgba(15,18,35,0.92)" : "rgba(255,255,255,0.88)";
  const panelBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(148,163,184,0.28)";
  const panelShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 4px 16px rgba(0,0,0,0.08)";
  const dividerBg = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(148,163,184,0.22)";
  const iconDef = isDark ? "rgba(190,205,235,0.7)" : "#64748b";
  const iconAct = isDark ? "#a5b4fc" : "#2563eb";
  const activeBg = isDark ? "rgba(99,102,241,0.22)" : "rgba(59,130,246,0.12)";
  const activeShadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.4)"
    : "0 0 0 1px rgba(59,130,246,0.2)";
  const hoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(148,163,184,0.15)";
  const hoverColor = isDark ? "#ffffff" : "#1e293b";

  // AI button colors
  const bsBg = isDark ? "#1a1040" : "rgba(168,85,247,0.07)";
  const bsBgHover = isDark ? "#261660" : "rgba(168,85,247,0.14)";
  const bsBorder = isDark ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.22)";
  const bsIconColor = isDark ? "#c084fc" : "#9333ea";
  const bsTextColor = isDark ? "#a855f7" : "#9333ea";
  const bsBadgeColor = isDark ? "#c084fc" : "#9333ea";

  const dgBg = isDark ? "#0e1a38" : "rgba(99,102,241,0.07)";
  const dgBgHover = isDark ? "#152554" : "rgba(99,102,241,0.14)";
  const dgBorder = isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.22)";
  const dgIconColor = isDark ? "#818cf8" : "#4f46e5";
  const dgTextColor = isDark ? "#6366f1" : "#4f46e5";
  const dgBadgeColor = isDark ? "#818cf8" : "#4f46e5";

  return (
    <>
      <style>{`
        .wb-toolbar-wrapper {
          position: fixed;
          left: 16px;
          top: 0;
          bottom: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transform-origin: left center;
        }
        .wb-toolbar-wrapper > * {
          pointer-events: auto;
        }
        .ai-tools-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 8px; /* space between AI buttons and main toolbar */
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 768px) {
          .wb-toolbar-wrapper {
            transform: scale(0.75);
          }
        }
        }
      `}</style>
      <div className="wb-toolbar-wrapper">
        <div className="ai-tools-group">
          {/* ── AI Brainstorm ── */}
          <button
            onClick={() => setShowBrainstorm(true)}
            title="AI Brainstorm — generate sticky note ideas"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `1px solid ${bsBorder}`,
              background: bsBg,
              cursor: "pointer",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              transition:
                "background 0.15s, border-color 0.15s, transform 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = bsBgHover;
              e.currentTarget.style.borderColor = isDark
                ? "rgba(168,85,247,0.45)"
                : "rgba(168,85,247,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = bsBg;
              e.currentTarget.style.borderColor = bsBorder;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* AI badge top-left */}
            <span
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                fontSize: 8,
                fontWeight: 700,
                color: bsBadgeColor,
                fontFamily: "system-ui,sans-serif",
                letterSpacing: "-0.2px",
                lineHeight: 1,
              }}
            >
              AI
            </span>

            <StarIcon size={15} color={bsIconColor} />

            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: bsTextColor,
                fontFamily: "system-ui,sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              Storm
            </span>
          </button>

          {/* ── AI Diagram ── */}
          <button
            onClick={() => setShowDiagram(true)}
            title="AI Diagram — generate flowcharts & diagrams"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `1px solid ${dgBorder}`,
              background: dgBg,
              cursor: "pointer",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              transition:
                "background 0.15s, border-color 0.15s, transform 0.15s",
              flexShrink: 0,
              marginBottom: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = dgBgHover;
              e.currentTarget.style.borderColor = isDark
                ? "rgba(99,102,241,0.45)"
                : "rgba(79,70,229,0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = dgBg;
              e.currentTarget.style.borderColor = dgBorder;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* AI badge top-left */}
            <span
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                fontSize: 8,
                fontWeight: 700,
                color: dgBadgeColor,
                fontFamily: "system-ui,sans-serif",
                letterSpacing: "-0.2px",
                lineHeight: 1,
              }}
            >
              AI
            </span>

            <FlowIcon size={15} color={dgIconColor} />

            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: dgTextColor,
                fontFamily: "system-ui,sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              Diagram
            </span>
          </button>

          {/* ── Tool panel ── */}
        </div>

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
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.35 : 1,
                    transition: "background 0.15s, color 0.15s",
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

      {/* ── Modals ── */}
      {showImageModal && (
        <ImageUploadModal
          onInsert={(src, width, height) => {
            window.dispatchEvent(
              new CustomEvent("wb_insert_image", {
                detail: { src, width, height },
              }),
            );
            setShowImageModal(false);
          }}
          onClose={() => setShowImageModal(false)}
        />
      )}
      {showBrainstorm && (
        <BrainstormModal
          onInsert={(ideas) => {
            window.dispatchEvent(
              new CustomEvent("wb_brainstorm_insert", { detail: { ideas } }),
            );
            setShowBrainstorm(false);
          }}
          onClose={() => setShowBrainstorm(false)}
        />
      )}
      {showDiagram && (
        <DiagramModal
          onInsert={(data) => {
            window.dispatchEvent(
              new CustomEvent("wb_diagram_insert", { detail: { data } }),
            );
            setShowDiagram(false);
          }}
          onClose={() => setShowDiagram(false)}
        />
      )}
    </>
  );
}
