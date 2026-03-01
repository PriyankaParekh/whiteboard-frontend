"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface QuillEditorModalProps {
  initialHtml?: string;
  onSave: (html: string, plainText: string) => void;
  onClose: () => void;
}

// Dynamically import ReactQuill only on the client to avoid SSR issues
let ReactQuill: any = null;

const QuillEditorModal: React.FC<QuillEditorModalProps> = ({
  initialHtml,
  onSave,
  onClose,
}) => {
  const [quillLoaded, setQuillLoaded] = useState(false);
  const [value, setValue] = useState(initialHtml || "");
  const quillRef = useRef<any>(null);

  // Dynamically load react-quill-new on client side
  useEffect(() => {
    import("react-quill-new").then((mod) => {
      ReactQuill = mod.default;
      setQuillLoaded(true);
    });
  }, []);

  // Load quill CSS once
  useEffect(() => {
    if (document.getElementById("quill-modal-css")) return;
    const link = document.createElement("link");
    link.id = "quill-modal-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
    document.head.appendChild(link);
  }, []);

  const handleSave = () => {
    const html = value;
    // Extract plain text by stripping HTML tags
    const div = document.createElement("div");
    div.innerHTML = html;
    const plain = div.textContent || div.innerText || "";
    onSave(html, plain);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
  ];

  const modalContent = (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        // Close if backdrop clicked
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)",
          width: 620,
          maxWidth: "90vw",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "quill-modal-in 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 10px",
            borderBottom: "1px solid #e2e8f0",
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(99,102,241,0.05) 100%)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1e293b",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Text Editor
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 18,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            ✕
          </button>
        </div>

        {/* Quill Editor Area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {quillLoaded && ReactQuill ? (
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={value}
              onChange={setValue}
              modules={modules}
              formats={formats}
              placeholder="Type your text here..."
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 260,
                color: "#94a3b8",
                fontSize: 14,
              }}
            >
              Loading editor…
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 9,
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              color: "#475569",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 24px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(59,130,246,0.3)";
            }}
          >
            Save
          </button>
        </div>
      </div>

      <style>{`
        @keyframes quill-modal-in {
          from { opacity:0; transform: scale(0.93) translateY(12px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
        .ql-container {
          flex: 1 !important;
          font-size: 15px !important;
          min-height: 200px;
          border-bottom-left-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
        }
        .ql-editor {
          min-height: 200px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        .ql-toolbar {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modalContent, document.body);
};

export default QuillEditorModal;
