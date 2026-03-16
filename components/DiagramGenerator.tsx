"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "../store/useTheme";
import {
  GitFork,
  Network,
  Building2,
  CalendarClock,
  MousePointerClick,
} from "lucide-react";

interface DiagramNode {
  id: string;
  type: "rectangle" | "circle" | "diamond" | "sticky";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface DiagramModalProps {
  onInsert: (data: DiagramData) => void;
  onClose: () => void;
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

const DIAGRAM_TYPES = [
  {
    id: "flowchart",
    label: "Flowchart",
    desc: "Process steps with decisions",
  },
  {
    id: "mindmap",
    label: "Mind Map",
    desc: "Central idea with branches",
  },
  {
    id: "orgchart",
    label: "Org Chart",
    desc: "Hierarchy / team structure",
  },
  {
    id: "timeline",
    label: "Timeline",
    desc: "Sequential events in order",
  },
  {
    id: "userflow",
    label: "User Flow",
    desc: "App screens & navigation",
  },
];

const EXAMPLE_PROMPTS: Record<string, string> = {
  flowchart: "User login and authentication process",
  mindmap: "Features of a mobile fitness app",
  orgchart: "Startup company team structure",
  timeline: "Product launch phases for a SaaS app",
  userflow: "E-commerce checkout flow",
};

// Colors for nodes
const NODE_COLORS = {
  start: { fill: "#dcfce7", stroke: "#16a34a" },
  end: { fill: "#fee2e2", stroke: "#dc2626" },
  process: { fill: "#dbeafe", stroke: "#2563eb" },
  decision: { fill: "#fef9c3", stroke: "#ca8a04" },
  data: { fill: "#ede9fe", stroke: "#7c3aed" },
  default: { fill: "#f1f5f9", stroke: "#64748b" },
};

const NODE_COLORS_DARK = {
  start: { fill: "#14532d", stroke: "#4ade80" },
  end: { fill: "#7f1d1d", stroke: "#f87171" },
  process: { fill: "#1e3a5f", stroke: "#60a5fa" },
  decision: { fill: "#713f12", stroke: "#fbbf24" },
  data: { fill: "#3b0764", stroke: "#c084fc" },
  default: { fill: "#1e293b", stroke: "#94a3b8" },
};

const DiagramModal: React.FC<DiagramModalProps> = ({ onInsert, onClose }) => {
  const { isDark } = useTheme();
  const [diagramType, setDiagramType] = useState("flowchart");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DiagramData | null>(null);
  const [phase, setPhase] = useState<"input" | "generating" | "result">(
    "input",
  );
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Theme tokens
  const bg = isDark
    ? "linear-gradient(160deg,#080c1a 0%,#0d1117 100%)"
    : "linear-gradient(160deg,#fafbff 0%,#f0f4ff 100%)";
  const shadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.2), 0 24px 80px rgba(0,0,0,0.7)"
    : "0 0 0 1px rgba(99,102,241,0.12), 0 24px 80px rgba(0,0,0,0.15)";
  const accentBar =
    "linear-gradient(90deg,#2563eb,#4f46e5 40%,#7c3aed 70%,#0ea5e9)";
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
  const typeCardBg = isDark
    ? "rgba(255,255,255,0.03)"
    : "rgba(255,255,255,0.7)";
  const typeCardActiveBg = isDark
    ? "rgba(99,102,241,0.18)"
    : "rgba(99,102,241,0.08)";
  const typeCardActiveBorder = isDark
    ? "rgba(99,102,241,0.5)"
    : "rgba(99,102,241,0.35)";
  const previewBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)";

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // When diagram type changes, update placeholder
  useEffect(() => {
    if (!prompt) setPrompt("");
  }, [diagramType]);

  const buildPrompt = (type: string, userPrompt: string): string => {
    const colors = isDark ? NODE_COLORS_DARK : NODE_COLORS;

    const typeInstructions: Record<string, string> = {
      flowchart: `Create a flowchart. Use:
- type "rectangle" for process steps (${colors.process.fill} fill, ${colors.process.stroke} stroke)
- type "diamond" for decisions (${colors.decision.fill} fill, ${colors.decision.stroke} stroke)  
- type "circle" for start/end (${colors.start.fill}/${colors.end.fill} fill)
- Connect with edges using arrows showing flow direction
- Diamond nodes should have 2 outgoing edges labeled "Yes" and "No"`,

      mindmap: `Create a mind map. Use:
- type "circle" for the central idea (larger: width:180, height:60, ${colors.data.fill} fill)
- type "rectangle" for main branches (${colors.process.fill} fill)
- type "sticky" for sub-ideas (${colors.decision.fill} fill)
- Arrange in a radial pattern from center
- Connect center to branches, branches to sub-ideas`,

      orgchart: `Create an org chart. Use:
- type "rectangle" for all roles
- Top role: ${colors.data.fill} fill
- Department heads: ${colors.process.fill} fill
- Team members: ${colors.default.fill} fill
- Connect top-to-bottom showing reporting structure`,

      timeline: `Create a timeline. Use:
- type "circle" for milestone markers (small: width:40, height:40, ${colors.start.fill} fill)
- type "rectangle" for event descriptions (${colors.process.fill} fill)
- Arrange left-to-right or top-to-bottom
- Connect milestone circles to their description boxes`,

      userflow: `Create a user flow. Use:
- type "rectangle" for screens/pages (${colors.process.fill} fill)
- type "diamond" for user decisions (${colors.decision.fill} fill)
- type "circle" for entry/exit points (${colors.start.fill}/${colors.end.fill} fill)
- Connect with edges showing navigation flow`,
    };

    return `You are a diagram generator for a collaborative whiteboard canvas tool.

Generate a "${type}" diagram for: "${userPrompt}"

${typeInstructions[type] || typeInstructions.flowchart}

LAYOUT RULES:
- Canvas coordinates start at (0,0)
- Spread nodes out properly with enough spacing (min 60px gap between nodes)
- Standard node sizes: rectangles 160x50, diamonds 130x70, circles 60x60
- For flowcharts: arrange top-to-bottom, x centered around 300, y spacing ~120px
- For mindmaps: center node at (300,250), branches radiate outward
- For orgcharts: top node at (250,50), spread children horizontally
- For timelines: arrange left-to-right, y around 200
- For userflows: arrange top-to-bottom like flowchart

RESPOND ONLY WITH VALID JSON. No markdown, no explanation. Format:
{
  "nodes": [
    {
      "id": "node1",
      "type": "rectangle",
      "label": "Short Label",
      "x": 220,
      "y": 50,
      "width": 160,
      "height": 50,
      "fillColor": "#dbeafe",
      "strokeColor": "#2563eb"
    }
  ],
  "edges": [
    {
      "from": "node1",
      "to": "node2",
      "label": "optional edge label"
    }
  ]
}

Generate 5-10 nodes with meaningful connections. Make it realistic and useful.`;
  };

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setPreview(null);
    setPhase("generating");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "user", content: buildPrompt(diagramType, prompt) },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error("Could not parse AI response. Try again.");

      const parsed: DiagramData = JSON.parse(jsonMatch[0]);

      if (!parsed.nodes || parsed.nodes.length === 0) {
        throw new Error("AI returned empty diagram. Try a different prompt.");
      }

      setPreview(parsed);
      setPhase("result");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Something went wrong. Try again.");
      setPhase("input");
    } finally {
      setLoading(false);
    }
  }, [prompt, diagramType, isDark]);

  const handleInsert = () => {
    if (!preview) return;
    onInsert(preview);
  };

  // Mini SVG preview of the diagram
  const renderMiniPreview = (data: DiagramData) => {
    if (!data.nodes.length) return null;

    // Find bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of data.nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    const W = maxX - minX + 40;
    const H = maxY - minY + 40;
    const scale = Math.min(460 / W, 220 / H, 1);
    const ox = 20 - minX * scale;
    const oy = 20 - minY * scale;

    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

    return (
      <svg
        width="100%"
        height="240"
        viewBox={`0 0 ${Math.max(460, W * scale + 40)} ${Math.max(220, H * scale + 40)}`}
        style={{ display: "block" }}
      >
        {/* Edges */}
        {data.edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x * scale + ox + (from.width * scale) / 2;
          const y1 = from.y * scale + oy + (from.height * scale) / 2;
          const x2 = to.x * scale + ox + (to.width * scale) / 2;
          const y2 = to.y * scale + oy + (to.height * scale) / 2;
          const mx = (x1 + x2) / 2,
            my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <defs>
                <marker
                  id={`arr${i}`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L0,6 L6,3 z"
                    fill={isDark ? "#6366f1" : "#4f46e5"}
                  />
                </marker>
              </defs>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isDark ? "#6366f1" : "#4f46e5"}
                strokeWidth="1.5"
                strokeOpacity="0.6"
                markerEnd={`url(#arr${i})`}
              />
              {edge.label && (
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill={isDark ? "#a5b4fc" : "#4f46e5"}
                  fontWeight="600"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {data.nodes.map((node) => {
          const nx = node.x * scale + ox;
          const ny = node.y * scale + oy;
          const nw = node.width * scale;
          const nh = node.height * scale;
          const cx = nx + nw / 2,
            cy = ny + nh / 2;
          return (
            <g key={node.id}>
              {node.type === "circle" ? (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={nw / 2}
                  ry={nh / 2}
                  fill={node.fillColor}
                  stroke={node.strokeColor}
                  strokeWidth="1.5"
                />
              ) : node.type === "diamond" ? (
                <polygon
                  points={`${cx},${ny} ${nx + nw},${cy} ${cx},${ny + nh} ${nx},${cy}`}
                  fill={node.fillColor}
                  stroke={node.strokeColor}
                  strokeWidth="1.5"
                />
              ) : (
                <rect
                  x={nx}
                  y={ny}
                  width={nw}
                  height={nh}
                  rx="3"
                  fill={node.fillColor}
                  stroke={node.strokeColor}
                  strokeWidth="1.5"
                />
              )}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.max(7, 10 * scale)}
                fill={isDark ? "#e2e8f0" : "#1e293b"}
                fontWeight="600"
                fontFamily="system-ui,sans-serif"
              >
                {node.label.length > 14
                  ? node.label.slice(0, 13) + "…"
                  : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
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
        animation: "dgBdrop .2s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: "96vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: bg,
          borderRadius: 24,
          boxShadow: shadow,
          overflow: "hidden",
          animation: "dgModal .25s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* Accent */}
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
                background: isDark
                  ? "linear-gradient(135deg,#1e3a5f,#1e40af)"
                  : "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: isDark
                  ? "0 2px 10px rgba(37,99,235,0.4)"
                  : "0 2px 8px rgba(37,99,235,0.2)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDark ? "#60a5fa" : "#2563eb"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M17.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" />
                <path d="M6.5 10v4M17.5 10v5M6.5 14h11" />
              </svg>
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
                AI Diagram Generator
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subColor,
                  marginTop: 1,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Powered by YIO • Generates real shapes & arrows on canvas
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

          {/* Input phase */}
          {phase === "input" && (
            <>
              {/* Diagram type selector */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: subColor,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Diagram Type
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5,1fr)",
                    gap: 6,
                  }}
                >
                  {DIAGRAM_TYPES.map((dt) => (
                    <button
                      key={dt.id}
                      onClick={() => {
                        setDiagramType(dt.id);
                        setPrompt("");
                      }}
                      style={{
                        padding: "10px 6px",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1.5px solid ${diagramType === dt.id ? typeCardActiveBorder : borderColor}`,
                        background:
                          diagramType === dt.id ? typeCardActiveBg : typeCardBg,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        transition: "all .15s",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 20,
                          color: isDark ? "#ffffff" : titleColor,
                        }}
                      >
                        {dt.id === "flowchart" && (
                          <GitFork
                            size={18}
                            strokeWidth={2}
                            style={{ transform: "rotate(180deg)" }}
                          />
                        )}
                        {dt.id === "mindmap" && (
                          <Network size={18} strokeWidth={2} />
                        )}
                        {dt.id === "orgchart" && (
                          <Building2 size={18} strokeWidth={2} />
                        )}
                        {dt.id === "timeline" && (
                          <CalendarClock size={18} strokeWidth={2} />
                        )}
                        {dt.id === "userflow" && (
                          <MousePointerClick size={18} strokeWidth={2} />
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            diagramType === dt.id
                              ? isDark
                                ? "#a5b4fc"
                                : "#4f46e5"
                              : titleColor,
                          fontFamily: "system-ui,sans-serif",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {dt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div style={{ marginBottom: 14 }}>
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
                  Describe your diagram
                </div>
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                      generate();
                  }}
                  placeholder={EXAMPLE_PROMPTS[diagramType]}
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
                    e.currentTarget.style.borderColor = "#2563eb";
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
                  Ctrl+Enter to generate • Try: "{EXAMPLE_PROMPTS[diagramType]}"
                </div>
              </div>
            </>
          )}

          {/* Generating phase */}
          {phase === "generating" && (
            <div
              style={{
                border: `1px solid ${borderColor}`,
                borderRadius: 16,
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                background: isDark
                  ? "rgba(37,99,235,0.05)"
                  : "rgba(37,99,235,0.02)",
              }}
            >
              <div style={{ position: "relative", width: 64, height: 64 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "2px solid rgba(37,99,235,0.35)",
                      animation: `dgPulse 1.8s ease-out ${i * 0.4}s infinite`,
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
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isDark ? "#60a5fa" : "#2563eb"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M17.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" />
                    <path d="M6.5 10v4M17.5 10v5M6.5 14h11" />
                  </svg>
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
                  Building your diagram…
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: subColor,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  YIO is generating a{" "}
                  {DIAGRAM_TYPES.find((d) => d.id === diagramType)?.label}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isDark ? "#60a5fa" : "#2563eb",
                      animation: `dgDot 1.2s ease-in-out ${i * 0.15}s infinite`,
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
          {phase === "result" && preview && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: subColor,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Preview — {preview.nodes.length} shapes, {preview.edges.length}{" "}
                connections
              </div>
              <div
                style={{
                  background: previewBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                {renderMiniPreview(preview)}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {preview.nodes.slice(0, 5).map((n, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      background: n.fillColor,
                      color: n.strokeColor,
                      border: `1px solid ${n.strokeColor}`,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {n.type === "diamond"
                      ? "◇"
                      : n.type === "circle"
                        ? "○"
                        : "▭"}{" "}
                    {n.label.slice(0, 12)}
                  </div>
                ))}
                {preview.nodes.length > 5 && (
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      color: subColor,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    +{preview.nodes.length - 5} more
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPhase("input");
                  setPreview(null);
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
                🔄 Regenerate
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
            {phase === "input" && "Shapes & arrows will be placed on canvas"}
            {phase === "generating" && "⏳ YIO is thinking…"}
            {phase === "result" && `✅ ${preview?.nodes.length} shapes ready`}
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
                onClick={generate}
                disabled={!prompt.trim() || loading}
                style={{
                  padding: "9px 24px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    !prompt.trim() || loading
                      ? isDark
                        ? "rgba(255,255,255,0.06)"
                        : "#f1f5f9"
                      : "linear-gradient(135deg,#1d4ed8,#4f46e5 55%,#2563eb)",
                  color: !prompt.trim() || loading ? subColor : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow:
                    !prompt.trim() || loading
                      ? "none"
                      : "0 2px 14px rgba(37,99,235,0.45)",
                  transition: "all .18s",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                <span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isDark ? "#b1b6bbff" : "#c3c5caff"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M17.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" />
                    <path d="M6.5 10v4M17.5 10v5M6.5 14h11" />
                  </svg>
                </span>{" "}
                Generate Diagram
              </button>
            ) : (
              <button
                onClick={handleInsert}
                style={{
                  padding: "9px 24px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg,#1d4ed8,#4f46e5 55%,#2563eb)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 14px rgba(37,99,235,0.45)",
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
        @keyframes dgModal  { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes dgBdrop  { from{opacity:0} to{opacity:1} }
        @keyframes dgPulse  { 0%{transform:scale(0.5);opacity:0.6} 100%{transform:scale(2);opacity:0} }
        @keyframes dgDot    { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modal, document.body);
};

export default DiagramModal;
