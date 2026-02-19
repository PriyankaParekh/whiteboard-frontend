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
  Trash2,
  Upload,
} from "lucide-react";

interface ToolbarButton {
  id: ToolType | "undo" | "redo" | "delete" | "upload";
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
}

const toolbarButtons: ToolbarButton[] = [
  {
    id: "select",
    icon: <MousePointer2 size={20} />,
    label: "Selection",
  },
  {
    id: "rectangle",
    icon: <Square size={20} />,
    label: "Rectangle",
  },
  {
    id: "circle",
    icon: <Circle size={20} />,
    label: "Circle",
  },
  {
    id: "line",
    icon: <Minus size={20} />,
    label: "Line",
  },
  {
    id: "arrow",
    icon: <ArrowRight size={20} />,
    label: "Arrow",
  },
  {
    id: "polygon",
    icon: <Hexagon size={20} />,
    label: "Polygon",
  },
  {
    id: "triangle",
    icon: <Triangle size={20} />,
    label: "Triangle",
  },
  {
    id: "diamond",
    icon: <Diamond size={20} />,
    label: "Diamond",
  },
  {
    id: "pencil",
    icon: <Pen size={20} />,
    label: "Pencil",
  },
  {
    id: "text",
    icon: <Type size={20} />,
    label: "Text",
  },
  {
    id: "sticky",
    icon: <StickyNote size={20} />,
    label: "Sticky Note",
    divider: true,
  },
  {
    id: "undo",
    icon: <RotateCcw size={20} />,
    label: "Undo",
  },
  {
    id: "redo",
    icon: <RotateCw size={20} />,
    label: "Redo",
  },
  {
    id: "delete",
    icon: <Trash2 size={20} />,
    label: "Delete",
  },
  {
    id: "upload",
    icon: <Upload size={20} />,
    label: "Upload File",
    divider: true,
  },
];

export default function Toolbar() {
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
    } else if (toolId === "redo") {
      redo();
    } else if (toolId === "delete") {
      if (selectedElementId) {
        deleteElement(selectedElementId);
      }
    } else if (toolId === "upload") {
      // Upload file functionality - placeholder for now
      console.log("Upload file clicked");
    } else {
      setTool(toolId as ToolType);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDelete = selectedElementId !== null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-lg p-3 flex flex-col gap-2">
        {toolbarButtons.map((button, index) => (
          <div key={button.id}>
            {button.divider && index > 0 && (
              <div className="h-px bg-gradient-to-r from-slate-200/0 via-slate-300/30 to-slate-200/0 my-2" />
            )}

            <button
              onClick={() => handleToolClick(button.id)}
              disabled={
                (button.id === "undo" && !canUndo) ||
                (button.id === "redo" && !canRedo) ||
                (button.id === "delete" && !canDelete)
              }
              className={`relative w-11 h-11 rounded-xl transition-all duration-200 flex items-center justify-center font-medium text-sm
                ${
                  ["undo", "redo", "delete", "upload"].includes(
                    button.id as string,
                  )
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : selectedTool === button.id
                      ? "bg-blue-100 text-blue-700 shadow-md shadow-blue-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }
                ${
                  (button.id === "undo" && !canUndo) ||
                  (button.id === "redo" && !canRedo) ||
                  (button.id === "delete" && !canDelete)
                    ? "opacity-40 cursor-not-allowed"
                    : "active:scale-95"
                }
              `}
              title={button.label}
              aria-label={button.label}
            >
              <span className="flex items-center justify-center">
                {button.icon}
              </span>

              {[
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
              ].includes(button.id as string) &&
                selectedTool === button.id && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-transparent pointer-events-none" />
                )}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        button[title]:hover::after {
          content: attr(title);
          position: absolute;
          left: 110%;
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          color: #fff;
          font-size: 12px;
          border-radius: 6px;
          padding: 4px 10px;
          white-space: nowrap;
          z-index: 100;
          pointer-events: none;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
