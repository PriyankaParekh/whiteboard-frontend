"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "../store/useTheme";

interface ImageUploadModalProps {
  onInsert: (src: string, width: number, height: number) => void;
  onClose: () => void;
}

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  onInsert,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg = isDark
    ? "linear-gradient(160deg,#0d1117 0%,#0a0d1a 100%)"
    : "linear-gradient(160deg,#ffffff 0%,#f7f8fc 100%)";
  const shadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.18),0 8px 16px rgba(0,0,0,0.5),0 32px 64px rgba(0,0,0,0.6)"
    : "0 0 0 1px rgba(148,163,184,0.18),0 8px 16px rgba(0,0,0,0.06),0 32px 64px rgba(0,0,0,0.13)";
  const accentBar = isDark
    ? "linear-gradient(90deg,#4f46e5,#7c3aed 30%,#a855f7 65%,#ec4899)"
    : "linear-gradient(90deg,#a5b4fc,#818cf8 30%,#c084fc 65%,#f0abfc)";
  const titleColor = isDark ? "#e0e7ff" : "#1e1b4b";
  const subColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const borderColor = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(203,213,225,0.6)";
  const footerBg = isDark ? "rgba(10,13,26,0.8)" : "rgba(248,250,252,0.7)";
  const footerBorder = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(226,232,240,0.9)";
  const dropBg = isDark ? "rgba(99,102,241,0.06)" : "rgba(139,92,246,0.04)";
  const dropBgHover = isDark
    ? "rgba(99,102,241,0.14)"
    : "rgba(139,92,246,0.10)";
  const dropBorder = isDark ? "rgba(99,102,241,0.35)" : "rgba(139,92,246,0.35)";
  const tabActiveBg = isDark
    ? "rgba(99,102,241,0.20)"
    : "rgba(139,92,246,0.12)";
  const tabActiveColor = isDark ? "#a5b4fc" : "#7c3aed";
  const tabInactiveColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const inputBorder = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(203,213,225,0.8)";
  const inputColor = isDark ? "#e2e8f0" : "#1e293b";
  const closeBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(241,245,249,0.8)";
  const closeBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(148,163,184,0.2)";
  const closeColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const previewBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)";
  const infoTextColor = isDark ? "rgba(148,163,184,0.7)" : "#64748b";

  // ── File processing ───────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError(`Unsupported format. Use: JPG, PNG, GIF, WEBP, SVG, BMP`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Max 500 MB (yours: ${formatBytes(file.size)})`);
      return;
    }
    setLoading(true);
    setProgress(0);
    setFileInfo({ name: file.name, size: formatBytes(file.size) });

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 90));
    };
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setPreview(src);
        setPreviewSize({ w: img.naturalWidth, h: img.naturalHeight });
        setProgress(100);
        setLoading(false);
      };
      img.onerror = () => {
        setError("Could not load image. File may be corrupt.");
        setLoading(false);
      };
      img.src = src;
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // ── URL load ─────────────────────────────────────────────────────────────
  const loadFromUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setError(null);
    setLoading(true);
    setProgress(0);
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setPreview(url);
        setPreviewSize({ w: img.naturalWidth, h: img.naturalHeight });
        setFileInfo({ name: url.split("/").pop() || "image", size: "URL" });
        setProgress(100);
        setLoading(false);
      };
      img.onerror = () => {
        setError("Could not load image from URL. CORS or invalid URL.");
        setLoading(false);
      };
      img.src = url;
    } catch {
      setError("Invalid URL.");
      setLoading(false);
    }
  }, [urlInput]);

  // ── Insert ────────────────────────────────────────────────────────────────
  const handleInsert = useCallback(() => {
    if (!preview || !previewSize) return;
    // Scale down to fit canvas nicely (max 600px wide)
    const maxW = 600;
    let w = previewSize.w;
    let h = previewSize.h;
    if (w > maxW) {
      h = Math.round((h / w) * maxW);
      w = maxW;
    }
    onInsert(preview, w, h);
  }, [preview, previewSize, onInsert]);

  const handleReset = useCallback(() => {
    setPreview(null);
    setPreviewSize(null);
    setFileInfo(null);
    setError(null);
    setProgress(0);
    setUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

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
        background: isDark ? "rgba(4,6,16,0.72)" : "rgba(8,10,20,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "imgbdrop .18s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: "96vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: bg,
          borderRadius: 20,
          boxShadow: shadow,
          overflow: "hidden",
          animation: "imgmodal .22s cubic-bezier(0.34,1.4,0.64,1)",
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
            padding: "16px 20px 12px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                flexShrink: 0,
                background: isDark
                  ? "linear-gradient(135deg,#1e1b4b,#312e81)"
                  : "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isDark
                  ? "0 2px 6px rgba(99,102,241,0.35)"
                  : "0 2px 6px rgba(139,92,246,0.18)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDark ? "#818cf8" : "#7c3aed"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: titleColor,
                  letterSpacing: "-0.3px",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Insert Image
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subColor,
                  marginTop: 1,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Upload a file or paste a URL • Max 500 MB
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${closeBorder}`,
              background: closeBg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: closeColor,
              fontSize: 14,
              transition: "all .15s",
              fontFamily: "system-ui,sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(239,68,68,0.15)"
                : "#fee2e2";
              e.currentTarget.style.borderColor = isDark
                ? "rgba(239,68,68,0.4)"
                : "#fca5a5";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = closeBg;
              e.currentTarget.style.borderColor = closeBorder;
              e.currentTarget.style.color = closeColor;
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "0 20px 12px",
            flexShrink: 0,
          }}
        >
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                handleReset();
              }}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: tab === t ? tabActiveBg : "transparent",
                color: tab === t ? tabActiveColor : tabInactiveColor,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all .15s",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {t === "upload" ? "📁 Upload File" : "🔗 From URL"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 8px",
            minHeight: 0,
          }}
        >
          {/* ── Preview ── */}
          {preview && (
            <div
              style={{
                position: "relative",
                background: previewBg,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 12,
                border: `1px solid ${borderColor}`,
              }}
            >
              <img
                src={preview}
                alt="preview"
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 12,
                }}
              />
              {/* Overlay info */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {fileInfo?.name}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 10,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {previewSize?.w} × {previewSize?.h}px • {fileInfo?.size}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    color: "#fca5a5",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "system-ui,sans-serif",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* ── Loading progress ── */}
          {loading && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  height: 4,
                  background: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: isDark
                      ? "linear-gradient(90deg,#4f46e5,#a855f7)"
                      : "linear-gradient(90deg,#7c3aed,#c084fc)",
                    borderRadius: 2,
                    transition: "width .2s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subColor,
                  marginTop: 4,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Loading… {progress}%
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                background: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`,
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
                color: isDark ? "#fca5a5" : "#dc2626",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "system-ui,sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              {error}
            </div>
          )}

          {/* ── Upload tab ── */}
          {tab === "upload" && !preview && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: dragOver ? dropBgHover : dropBg,
                  border: `2px dashed ${dragOver ? (isDark ? "#818cf8" : "#7c3aed") : dropBorder}`,
                  borderRadius: 14,
                  padding: "36px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all .18s",
                  transform: dragOver ? "scale(1.01)" : "scale(1)",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    margin: "0 auto 14px",
                    background: isDark
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(139,92,246,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  {dragOver ? "🎯" : "🖼️"}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: titleColor,
                    marginBottom: 4,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {dragOver ? "Drop to upload" : "Drop image here"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: subColor,
                    marginBottom: 14,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  or click to browse
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {["JPG", "PNG", "GIF", "WEBP", "SVG", "BMP"].map((fmt) => (
                    <span
                      key={fmt}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.05)",
                        color: infoTextColor,
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: "system-ui,sans-serif",
                      }}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: subColor,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Max file size: 500 MB
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={handleFileInput}
                style={{ display: "none" }}
              />
            </>
          )}

          {/* ── URL tab ── */}
          {tab === "url" && !preview && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: subColor,
                  marginBottom: 6,
                  fontFamily: "system-ui,sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Image URL
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadFromUrl();
                  }}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${inputBorder}`,
                    background: inputBg,
                    color: inputColor,
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "system-ui,sans-serif",
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = isDark
                      ? "#818cf8"
                      : "#7c3aed";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = inputBorder;
                  }}
                />
                <button
                  onClick={loadFromUrl}
                  disabled={!urlInput.trim() || loading}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    background:
                      !urlInput.trim() || loading
                        ? isDark
                          ? "rgba(255,255,255,0.06)"
                          : "#f1f5f9"
                        : isDark
                          ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                          : "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                    color: !urlInput.trim() || loading ? subColor : "white",
                    cursor:
                      !urlInput.trim() || loading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "system-ui,sans-serif",
                    transition: "all .15s",
                    flexShrink: 0,
                  }}
                >
                  Load
                </button>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subColor,
                  marginTop: 6,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Note: Image must allow cross-origin access (CORS)
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
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
            {preview && previewSize
              ? `Ready to insert • ${previewSize.w}×${previewSize.h}px`
              : "Select an image to insert"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.9)"}`,
                background: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.95)",
                color: isDark ? "rgba(148,163,184,0.8)" : "#64748b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!preview}
              style={{
                padding: "9px 24px",
                borderRadius: 10,
                border: "none",
                background: !preview
                  ? isDark
                    ? "rgba(255,255,255,0.06)"
                    : "#f1f5f9"
                  : isDark
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed 55%,#a855f7)"
                    : "linear-gradient(135deg,#8b5cf6,#7c3aed 55%,#6d28d9)",
                color: !preview ? subColor : "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: !preview ? "not-allowed" : "pointer",
                transition: "all .18s",
                boxShadow: !preview
                  ? "none"
                  : isDark
                    ? "0 2px 12px rgba(99,102,241,0.5)"
                    : "0 2px 8px rgba(124,58,237,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "system-ui,sans-serif",
              }}
              onMouseEnter={(e) => {
                if (preview)
                  e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
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
              Insert Image
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes imgmodal { from{opacity:0;transform:scale(0.93) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes imgbdrop { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modal, document.body);
};

export default ImageUploadModal;
