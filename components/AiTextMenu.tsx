"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "../store/useTheme";
import {
  Wand2,
  BriefcaseBusiness,
  MessageCircle,
  Scissors,
  NotebookPen,
  FileText,
  SpellCheck2,
  List,
  Languages,
  Bot,
  X,
  ArrowLeft,
  Globe,
  Check,
} from "lucide-react";

interface AITextMenuProps {
  x: number;
  y: number;
  currentText: string;
  elementType: "text" | "sticky";
  onApply: (newText: string, newHtml?: string) => void;
  onClose: () => void;
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const AI_ACTIONS = [
  {
    id: "improve",
    icon: <Wand2 size={13} strokeWidth={2} />,
    label: "Improve Writing",
    prompt:
      "Improve the writing quality of this text. Make it clearer, more engaging, and well-structured. Keep the same meaning and approximate length.",
  },
  {
    id: "formal",
    icon: <BriefcaseBusiness size={13} strokeWidth={2} />,
    label: "Make Formal",
    prompt:
      "Rewrite this text in a formal, professional tone suitable for business communication.",
  },
  {
    id: "casual",
    icon: <MessageCircle size={13} strokeWidth={2} />,
    label: "Make Casual",
    prompt: "Rewrite this text in a friendly, casual conversational tone.",
  },
  {
    id: "shorter",
    icon: <Scissors size={13} strokeWidth={2} />,
    label: "Make Shorter",
    prompt:
      "Shorten this text significantly while keeping the key points. Be concise.",
  },
  {
    id: "longer",
    icon: <NotebookPen size={13} strokeWidth={2} />,
    label: "Expand",
    prompt:
      "Expand this text with more detail, examples, and explanation. Keep the same tone.",
  },
  {
    id: "summarize",
    icon: <FileText size={13} strokeWidth={2} />,
    label: "Summarize",
    prompt: "Summarize this text in 1-2 sentences capturing the key points.",
  },
  {
    id: "grammar",
    icon: <SpellCheck2 size={13} strokeWidth={2} />,
    label: "Fix Grammar",
    prompt:
      "Fix all grammar, spelling, and punctuation errors in this text. Keep the original meaning and style exactly.",
  },
  {
    id: "bullets",
    icon: <List size={13} strokeWidth={2} />,
    label: "Convert to Bullets",
    prompt:
      "Convert this text into a clear bullet-point list. Each bullet should be concise.",
  },
  {
    id: "translate",
    icon: <Languages size={13} strokeWidth={2} />,
    label: "Translate...",
    prompt: "",
    isTranslate: true,
  },
];

const LANGUAGES = [
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "Russian",
  "Turkish",
];

const AITextMenu: React.FC<AITextMenuProps> = ({
  x,
  y,
  currentText,
  elementType,
  onApply,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Theme tokens ────────────────────────────────────────────────────────
  const bg = isDark ? "rgba(10,13,26,0.97)" : "rgba(255,255,255,0.98)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.6)";
  const shadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)"
    : "0 0 0 1px rgba(148,163,184,0.15), 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)";
  const titleColor = isDark ? "#e0e7ff" : "#1e1b4b";
  const subColor = isDark ? "rgba(148,163,184,0.5)" : "#94a3b8";
  const itemColor = isDark ? "#c8d3f5" : "#374151";
  const itemHoverBg = isDark
    ? "rgba(99,102,241,0.15)"
    : "rgba(99,102,241,0.07)";
  const itemHoverColor = isDark ? "#a5b4fc" : "#4f46e5";
  const dividerBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.4)";
  const resultBg = isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)";
  const resultBorder = isDark
    ? "rgba(99,102,241,0.25)"
    : "rgba(99,102,241,0.15)";
  const accentBar = "linear-gradient(90deg,#4f46e5,#7c3aed 50%,#a855f7)";
  const headerIconBg = isDark
    ? "rgba(99,102,241,0.18)"
    : "rgba(99,102,241,0.10)";

  // Smart positioning — stay inside viewport
  const [pos, setPos] = useState({ x, y });
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let nx = x,
      ny = y;
    if (x + rect.width > window.innerWidth - 16)
      nx = window.innerWidth - rect.width - 16;
    if (y + rect.height > window.innerHeight - 16)
      ny = window.innerHeight - rect.height - 16;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [x, y, showTranslate, result]);

  // Close on outside click / Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  const callGroq = useCallback(
    async (actionPrompt: string, actionId: string) => {
      if (!currentText.trim()) {
        setError("No text to process!");
        return;
      }
      setLoading(true);
      setLoadingId(actionId);
      setResult(null);
      setError(null);
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a text editor assistant. Return ONLY the rewritten text with no explanation, no quotes, no preamble. Just the improved text itself.",
                },
                {
                  role: "user",
                  content: `${actionPrompt}\n\nText:\n${currentText}`,
                },
              ],
              temperature: 0.7,
              max_tokens: 1024,
            }),
          },
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            err?.error?.message || `API error ${response.status}`,
          );
        }
        const data = await response.json();
        setResult(data?.choices?.[0]?.message?.content?.trim() || "");
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
        setLoadingId(null);
      }
    },
    [currentText],
  );

  const handleAction = (action: (typeof AI_ACTIONS)[0]) => {
    if (action.isTranslate) {
      setShowTranslate(true);
      return;
    }
    callGroq(action.prompt, action.id);
  };

  const handleTranslate = (lang: string) => {
    setShowTranslate(false);
    callGroq(
      `Translate this text to ${lang}. Return only the translated text.`,
      "translate",
    );
  };

  const handleApply = () => {
    if (!result) return;
    if (elementType === "text") {
      const html = result
        .split("\n")
        .filter(Boolean)
        .map((line) =>
          line.startsWith("•") || line.startsWith("-")
            ? `<ul><li style="color:#ffffff">${line.replace(/^[•\-]\s*/, "")}</li></ul>`
            : `<p><span style="color:#ffffff">${line}</span></p>`,
        )
        .join("");
      onApply(result, html);
    } else {
      onApply(result);
    }
    onClose();
  };

  const menu = (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 999999,
        width: result ? 340 : 230,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        boxShadow: shadow,
        overflow: "hidden",
        animation: "aitm .18s cubic-bezier(0.34,1.4,0.64,1)",
        transition: "width .2s ease",
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 2.5, background: accentBar }} />

      {/* Header */}
      <div
        style={{
          padding: "10px 14px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: headerIconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot
              size={13}
              strokeWidth={2}
              style={{ color: isDark ? "#a5b4fc" : "#4f46e5" }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: titleColor,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              AI Text Assistant
            </div>
            <div
              style={{
                fontSize: 9,
                color: subColor,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Powered by YIO
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: subColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(239,68,68,0.15)"
              : "#fee2e2";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = subColor;
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ height: 1, background: dividerBg }} />

      {/* Content */}
      <div style={{ display: "flex", maxHeight: 420, overflow: "hidden" }}>
        {/* Left: action list */}
        <div
          style={{
            width: result ? 180 : "100%",
            flexShrink: 0,
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          {showTranslate ? (
            <>
              <div
                style={{
                  padding: "6px 14px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: subColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Choose Language
              </div>
              <button
                onClick={() => setShowTranslate(false)}
                style={{
                  width: "100%",
                  padding: "7px 14px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: subColor,
                  fontSize: 11,
                  fontFamily: "system-ui,sans-serif",
                  transition: "all .1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = itemHoverBg;
                  e.currentTarget.style.color = itemHoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = subColor;
                }}
              >
                <ArrowLeft size={12} strokeWidth={2} /> Back
              </button>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleTranslate(lang)}
                  style={{
                    width: "100%",
                    padding: "7px 14px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 12,
                    color: itemColor,
                    fontFamily: "system-ui,sans-serif",
                    transition: "all .1s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = itemHoverBg;
                    e.currentTarget.style.color = itemHoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = itemColor;
                  }}
                >
                  <Globe size={12} strokeWidth={2} style={{ flexShrink: 0 }} />{" "}
                  {lang}
                </button>
              ))}
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "6px 14px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: subColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                {loading ? "Processing…" : "Choose Action"}
              </div>
              {AI_ACTIONS.map((action, i) => {
                const isLoading = loadingId === action.id && loading;
                return (
                  <React.Fragment key={action.id}>
                    {i === 6 && (
                      <div
                        style={{
                          height: 1,
                          background: dividerBg,
                          margin: "4px 0",
                        }}
                      />
                    )}
                    <button
                      onClick={() => !loading && handleAction(action)}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "8px 14px",
                        border: "none",
                        background: isLoading ? itemHoverBg : "transparent",
                        cursor: loading ? "not-allowed" : "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: isLoading ? itemHoverColor : itemColor,
                        opacity: loading && !isLoading ? 0.45 : 1,
                        fontSize: 12,
                        fontFamily: "system-ui,sans-serif",
                        transition: "all .1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = itemHoverBg;
                          e.currentTarget.style.color = itemHoverColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = itemColor;
                        }
                      }}
                    >
                      {/* Icon slot */}
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isLoading ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              border: "1.5px solid rgba(99,102,241,0.3)",
                              borderTopColor: "#818cf8",
                              borderRadius: "50%",
                              animation: "aispin .7s linear infinite",
                            }}
                          />
                        ) : (
                          action.icon
                        )}
                      </span>
                      {action.label}
                      {action.isTranslate && (
                        <span
                          style={{
                            marginLeft: "auto",
                            color: subColor,
                            fontSize: 10,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <svg
                            width="8"
                            height="12"
                            viewBox="0 0 8 12"
                            fill="none"
                          >
                            <path
                              d="M1 1l6 5-6 5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>

        {/* Right: result panel */}
        {result && (
          <>
            <div style={{ width: 1, background: dividerBg, flexShrink: 0 }} />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: subColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                AI Result
              </div>
              <div
                style={{ flex: 1, overflowY: "auto", padding: "0 12px 8px" }}
              >
                <div
                  style={{
                    background: resultBg,
                    border: `1px solid ${resultBorder}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: itemColor,
                    lineHeight: 1.6,
                    fontFamily: "system-ui,sans-serif",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {result}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderTop: `1px solid ${dividerBg}`,
                  display: "flex",
                  gap: 6,
                }}
              >
                <button
                  onClick={() => setResult(null)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 8,
                    border: `1px solid ${border}`,
                    background: "transparent",
                    color: subColor,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "system-ui,sans-serif",
                    transition: "all .12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={handleApply}
                  style={{
                    flex: 2,
                    padding: "7px 0",
                    borderRadius: 8,
                    border: "none",
                    background: isDark
                      ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                      : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "system-ui,sans-serif",
                    boxShadow: isDark
                      ? "0 2px 8px rgba(99,102,241,0.4)"
                      : "0 2px 6px rgba(124,58,237,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    transition: "all .12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 4px 14px rgba(99,102,241,0.55)"
                      : "0 4px 12px rgba(124,58,237,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 2px 8px rgba(99,102,241,0.4)"
                      : "0 2px 6px rgba(124,58,237,0.3)";
                  }}
                >
                  <Check size={11} strokeWidth={3} /> Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "8px 14px",
            background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
            borderTop: `1px solid ${dividerBg}`,
            color: isDark ? "#fca5a5" : "#dc2626",
            fontSize: 11,
            fontFamily: "system-ui,sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <style>{`
        @keyframes aitm   { from{opacity:0;transform:scale(0.92) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes aispin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(menu, document.body);
};

export default AITextMenu;
