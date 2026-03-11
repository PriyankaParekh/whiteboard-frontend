"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "../store/useTheme";

interface BrainstormIdea {
  title: string;
  body: string;
  color: string;
}

interface BrainstormModalProps {
  onInsert: (ideas: BrainstormIdea[]) => void;
  onClose: () => void;
}

const GEMINI_API_KEY =
  "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";

const STICKY_COLORS = [
  "#fef3c7", // amber
  "#dbeafe", // blue
  "#dcfce7", // green
  "#fce7f3", // pink
  "#ede9fe", // purple
  "#ffedd5", // orange
  "#cffafe", // cyan
  "#fef9c3", // yellow
];

const STICKY_COLORS_DARK = [
  "#78350f", // amber dark
  "#1e3a5f", // blue dark
  "#14532d", // green dark
  "#831843", // pink dark
  "#3b0764", // purple dark
  "#7c2d12", // orange dark
  "#164e63", // cyan dark
  "#713f12", // yellow dark
];

const EXAMPLE_TOPICS = [
  "Mobile app for meditation",
  "Marketing strategy for a startup",
  "Features for a whiteboard tool",
  "Ways to improve team productivity",
  "Ideas for a side project",
];

const BrainstormModal: React.FC<BrainstormModalProps> = ({
  onInsert,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<BrainstormIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [phase, setPhase] = useState<"input" | "generating" | "result">(
    "input",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const bg = isDark
    ? "linear-gradient(160deg,#080c1a 0%,#0d1117 100%)"
    : "linear-gradient(160deg,#fafbff 0%,#f0f4ff 100%)";
  const shadow = isDark
    ? "0 0 0 1px rgba(139,92,246,0.2), 0 24px 80px rgba(0,0,0,0.7)"
    : "0 0 0 1px rgba(139,92,246,0.12), 0 24px 80px rgba(0,0,0,0.15)";
  const accentBar =
    "linear-gradient(90deg,#7c3aed,#a855f7 40%,#ec4899 70%,#f59e0b)";
  const titleColor = isDark ? "#e0e7ff" : "#1e1b4b";
  const subColor = isDark ? "rgba(148,163,184,0.55)" : "#94a3b8";
  const borderColor = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(203,213,225,0.5)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)";
  const inputBorder = isDark
    ? "rgba(255,255,255,0.09)"
    : "rgba(203,213,225,0.7)";
  const inputColor = isDark ? "#e2e8f0" : "#1e293b";
  const footerBg = isDark ? "rgba(5,8,18,0.85)" : "rgba(248,250,252,0.8)";
  const footerBorder = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(226,232,240,0.8)";
  const closeBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(241,245,249,0.8)";
  const closeColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const chipBg = isDark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.07)";
  const chipColor = isDark ? "#a78bfa" : "#7c3aed";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)";
  const cardBorder = isDark
    ? "rgba(255,255,255,0.07)"
    : "rgba(226,232,240,0.6)";
  const generatingBg = isDark
    ? "rgba(139,92,246,0.06)"
    : "rgba(139,92,246,0.03)";

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const generateIdeas = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null);
    setIdeas([]);
    setStreamText("");
    setPhase("generating");
    setLoading(true);

    abortRef.current = new AbortController();

    const prompt = `You are a creative brainstorming assistant for a collaborative whiteboard tool.

Topic: "${topic.trim()}"

Generate exactly ${count} distinct, actionable brainstorming ideas for this topic.

Respond ONLY with a JSON array, no markdown, no explanation. Each object must have:
- "title": short catchy title (3-5 words max)
- "body": 1-2 sentence explanation (max 100 chars)
- "color": one of these hex colors randomly assigned: ${STICKY_COLORS.join(", ")}

Example format:
[{"title":"User Research First","body":"Talk to 10 real users before building anything.","color":"#fef3c7"},...]

Respond with ONLY the JSON array, starting with [ and ending with ]`;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GEMINI_API_KEY}`,
          },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.9,
            max_tokens: 1024,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";

      // Animate text appearing
      setStreamText(rawText);

      // Parse JSON
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch)
        throw new Error("Could not parse AI response. Try again.");

      const parsed: BrainstormIdea[] = JSON.parse(jsonMatch[0]);

      // Assign dark colors if dark mode
      const colored = parsed.map((idea, i) => ({
        ...idea,
        color: isDark
          ? STICKY_COLORS_DARK[i % STICKY_COLORS_DARK.length]
          : STICKY_COLORS[i % STICKY_COLORS.length],
      }));

      setIdeas(colored);
      setPhase("result");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Something went wrong. Try again.");
      setPhase("input");
    } finally {
      setLoading(false);
    }
  }, [topic, count, isDark]);

  const handleInsert = useCallback(() => {
    if (ideas.length === 0) return;
    onInsert(ideas);
  }, [ideas, onInsert]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generateIdeas();
    }
  };

  const modal = (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "rgba(2,4,12,0.80)" : "rgba(8,10,24,0.50)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        animation: "bsBdrop .2s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 620,
          maxWidth: "96vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: bg,
          borderRadius: 24,
          boxShadow: shadow,
          overflow: "hidden",
          animation: "bsModal .25s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: accentBar, flexShrink: 0 }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px 14px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                flexShrink: 0,
                background: isDark
                  ? "linear-gradient(135deg,#2d1b69,#4c1d95)"
                  : "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: isDark
                  ? "0 2px 10px rgba(139,92,246,0.4)"
                  : "0 2px 8px rgba(139,92,246,0.2)",
              }}
            >
              🧠
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: titleColor,
                  letterSpacing: "-0.4px",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                AI Brainstorm
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subColor,
                  marginTop: 1,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Powered by Gemini • Generates sticky notes on canvas
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: `1px solid ${borderColor}`,
              background: closeBg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: closeColor,
              fontSize: 14,
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(239,68,68,0.15)"
                : "#fee2e2";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = closeBg;
              e.currentTarget.style.color = closeColor;
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 10px",
            minHeight: 0,
          }}
        >
          {/* Input phase */}
          {phase === "input" && (
            <>
              {/* Error */}
              {error && (
                <div
                  style={{
                    background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
                    border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 14,
                    color: isDark ? "#fca5a5" : "#dc2626",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Topic input */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: subColor,
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Topic / Prompt
                </div>
                <textarea
                  ref={inputRef}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Marketing ideas for a fitness app, Features for a social platform..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${inputBorder}`,
                    background: inputBg,
                    color: inputColor,
                    fontSize: 13,
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "system-ui,sans-serif",
                    lineHeight: 1.5,
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#7c3aed";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = inputBorder;
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: subColor,
                    marginTop: 4,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Ctrl+Enter to generate quickly
                </div>
              </div>

              {/* Example chips */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: subColor,
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Try an example
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EXAMPLE_TOPICS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTopic(ex)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: `1px solid ${isDark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.2)"}`,
                        background: chipBg,
                        color: chipColor,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        transition: "all .15s",
                        fontFamily: "system-ui,sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark
                          ? "rgba(139,92,246,0.22)"
                          : "rgba(139,92,246,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = chipBg;
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count selector */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: subColor,
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Number of ideas:{" "}
                  <span style={{ color: isDark ? "#a78bfa" : "#7c3aed" }}>
                    {count}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[4, 6, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      style={{
                        padding: "7px 20px",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1.5px solid ${count === n ? "#7c3aed" : borderColor}`,
                        background:
                          count === n
                            ? isDark
                              ? "rgba(139,92,246,0.2)"
                              : "rgba(139,92,246,0.08)"
                            : "transparent",
                        color:
                          count === n
                            ? isDark
                              ? "#a78bfa"
                              : "#7c3aed"
                            : subColor,
                        fontSize: 13,
                        fontWeight: 700,
                        transition: "all .15s",
                        fontFamily: "system-ui,sans-serif",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Generating phase */}
          {phase === "generating" && (
            <div
              style={{
                background: generatingBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 16,
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Brain pulse animation */}
              <div style={{ position: "relative", width: 64, height: 64 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "2px solid rgba(139,92,246,0.4)",
                      animation: `bsPulse 1.8s ease-out ${i * 0.4}s infinite`,
                      opacity: 0,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  🧠
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: titleColor,
                    marginBottom: 4,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Generating ideas…
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: subColor,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Gemini is brainstorming "{topic.slice(0, 40)}
                  {topic.length > 40 ? "…" : ""}"
                </div>
              </div>

              {/* Loading dots */}
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isDark ? "#a78bfa" : "#7c3aed",
                      animation: `bsDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  abortRef.current?.abort();
                  setPhase("input");
                  setLoading(false);
                }}
                style={{
                  padding: "7px 18px",
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  background: "transparent",
                  color: subColor,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Result phase */}
          {phase === "result" && ideas.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: subColor,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                {ideas.length} ideas generated for "{topic.slice(0, 30)}
                {topic.length > 30 ? "…" : ""}"
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {ideas.map((idea, i) => (
                  <div
                    key={i}
                    style={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      borderLeft: `4px solid ${isDark ? STICKY_COLORS[i % STICKY_COLORS.length] : idea.color}`,
                      animation: `bsCard .3s ease ${i * 0.06}s both`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          flexShrink: 0,
                          background: isDark
                            ? STICKY_COLORS[i % STICKY_COLORS.length]
                            : idea.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                        }}
                      >
                        {
                          ["💡", "🎯", "🚀", "⚡", "🔥", "✨", "🌟", "💎"][
                            i % 8
                          ]
                        }
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: titleColor,
                          fontFamily: "system-ui,sans-serif",
                          lineHeight: 1.2,
                        }}
                      >
                        {idea.title}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: subColor,
                        lineHeight: 1.5,
                        fontFamily: "system-ui,sans-serif",
                      }}
                    >
                      {idea.body}
                    </div>
                  </div>
                ))}
              </div>

              {/* Regenerate */}
              <button
                onClick={() => {
                  setPhase("input");
                  setIdeas([]);
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: 9,
                  border: `1px solid ${borderColor}`,
                  background: "transparent",
                  color: subColor,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "system-ui,sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                🔄 Try different ideas
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 22px",
            borderTop: `1px solid ${footerBorder}`,
            background: footerBg,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: subColor,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {phase === "input" && "Ideas will appear as sticky notes on canvas"}
            {phase === "generating" && "⏳ Contacting Gemini AI…"}
            {phase === "result" &&
              `✅ ${ideas.length} sticky notes ready to place`}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.8)"}`,
                background: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.9)",
                color: isDark ? "rgba(148,163,184,0.8)" : "#64748b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Cancel
            </button>

            {phase !== "result" ? (
              <button
                onClick={generateIdeas}
                disabled={!topic.trim() || loading}
                style={{
                  padding: "9px 24px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    !topic.trim() || loading
                      ? isDark
                        ? "rgba(255,255,255,0.06)"
                        : "#f1f5f9"
                      : "linear-gradient(135deg,#7c3aed,#a855f7 55%,#ec4899)",
                  color: !topic.trim() || loading ? subColor : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !topic.trim() || loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow:
                    !topic.trim() || loading
                      ? "none"
                      : "0 2px 14px rgba(139,92,246,0.5)",
                  transition: "all .18s",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                <span>🧠</span> Generate Ideas
              </button>
            ) : (
              <button
                onClick={handleInsert}
                style={{
                  padding: "9px 24px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg,#7c3aed,#a855f7 55%,#ec4899)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 14px rgba(139,92,246,0.5)",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Place on Canvas
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bsModal  { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bsBdrop  { from{opacity:0} to{opacity:1} }
        @keyframes bsPulse  { 0%{transform:scale(0.5);opacity:0.6} 100%{transform:scale(2);opacity:0} }
        @keyframes bsDot    { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes bsCard   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modal, document.body);
};

export default BrainstormModal;
