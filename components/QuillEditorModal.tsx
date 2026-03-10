"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "../store/useTheme";

interface QuillEditorModalProps {
  initialHtml?: string;
  onSave: (html: string, plainText: string) => void;
  onClose: () => void;
}

const FONTS = [
  { value: "inter", label: "Inter", family: "'Inter', sans-serif" },
  { value: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { value: "opensans", label: "Open Sans", family: "'Open Sans', sans-serif" },
  { value: "lato", label: "Lato", family: "'Lato', sans-serif" },
  { value: "poppins", label: "Poppins", family: "'Poppins', sans-serif" },
  {
    value: "montserrat",
    label: "Montserrat",
    family: "'Montserrat', sans-serif",
  },
  { value: "nunito", label: "Nunito", family: "'Nunito', sans-serif" },
  { value: "raleway", label: "Raleway", family: "'Raleway', sans-serif" },
  { value: "playfair", label: "Playfair", family: "'Playfair Display', serif" },
  {
    value: "merriweather",
    label: "Merriweather",
    family: "'Merriweather', serif",
  },
  { value: "lora", label: "Lora", family: "'Lora', serif" },
  {
    value: "sourcecodepro",
    label: "Source Code",
    family: "'Source Code Pro', monospace",
  },
  {
    value: "inconsolata",
    label: "Inconsolata",
    family: "'Inconsolata', monospace",
  },
];

const GFONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Roboto:wght@400;700&family=Open+Sans:wght@400;600&family=Lato:wght@400;700&family=Poppins:wght@400;600&family=Montserrat:wght@400;700&family=Nunito:wght@400;600&family=Raleway:wght@400;600&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Source+Code+Pro&family=Inconsolata&display=swap";

const TIPS: Record<string, string> = {
  "ql-bold": "Bold (Ctrl+B)",
  "ql-italic": "Italic (Ctrl+I)",
  "ql-underline": "Underline (Ctrl+U)",
  "ql-strike": "Strikethrough",
  "ql-blockquote": "Blockquote",
  "ql-code-block": "Code Block",
  "ql-link": "Insert Link",
  "ql-clean": "Clear Formatting",
  "ql-list-ordered": "Numbered List",
  "ql-list-bullet": "Bullet List",
  "ql-indent--1": "Decrease Indent",
  "ql-indent-+1": "Increase Indent",
  "ql-script-sub": "Subscript",
  "ql-script-super": "Superscript",
};

const QuillEditorModal: React.FC<QuillEditorModalProps> = ({
  initialHtml,
  onSave,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(
    (initialHtml || "").replace(/<[^>]+>/g, "").trim().length,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<string>(initialHtml || "");

  // ── Quill init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current) return;
    let destroyed = false;

    if (!document.getElementById("qe-gfonts")) {
      document.head.appendChild(
        Object.assign(document.createElement("link"), {
          id: "qe-gfonts",
          rel: "stylesheet",
          href: GFONTS,
        }),
      );
    }
    if (!document.getElementById("qe-snow")) {
      document.head.appendChild(
        Object.assign(document.createElement("link"), {
          id: "qe-snow",
          rel: "stylesheet",
          href: "https://cdn.quilljs.com/1.3.6/quill.snow.css",
        }),
      );
    }

    import("quill").then((mod) => {
      if (destroyed || !wrapperRef.current) return;
      const Quill: any = (mod as any).default ?? mod;

      const Font = Quill.import("formats/font");
      Font.whitelist = FONTS.map((f) => f.value);
      Quill.register(Font, true);

      const Size = Quill.import("attributors/style/size");
      Size.whitelist = [
        "10px",
        "12px",
        "14px",
        "16px",
        "18px",
        "24px",
        "32px",
        "48px",
      ];
      Quill.register(Size, true);

      const wrapper = wrapperRef.current!;
      wrapper.innerHTML = "";
      const quillDiv = document.createElement("div");
      wrapper.appendChild(quillDiv);

      const quill = new Quill(quillDiv, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: FONTS.map((f) => f.value) }],
            [
              {
                size: [
                  "10px",
                  "12px",
                  "14px",
                  "16px",
                  "18px",
                  "24px",
                  "32px",
                  "48px",
                ],
              },
            ],
            ["bold", "italic", "underline", "strike"],
            [{ script: "sub" }, { script: "super" }],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["blockquote", "code-block", "link", "clean"],
          ],
        },
        formats: [
          "header",
          "font",
          "size",
          "bold",
          "italic",
          "underline",
          "strike",
          "script",
          "color",
          "background",
          "list",
          "indent",
          "align",
          "blockquote",
          "code-block",
          "link",
        ],
        placeholder: "Start typing something wonderful…",
      });

      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
        quill.setSelection(quill.getLength(), 0);
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        valueRef.current = html === "<p><br></p>" ? "" : html;
        setCharCount(quill.getText().trim().length);
      });

      setTimeout(() => {
        const tb = wrapper.querySelector(".ql-toolbar");
        if (!tb) return;
        tb.querySelectorAll("button").forEach((btn) => {
          const cls = [...btn.classList].find(
            (c) => c.startsWith("ql-") && c !== "ql-active",
          );
          if (!cls) return;
          const val = btn.value || "";
          const tip = TIPS[val ? `${cls}-${val}` : cls];
          if (tip) btn.title = tip;
        });
      }, 200);

      setTimeout(() => quill.focus(), 100);
      (wrapper as any).__quill = quill;
    });

    return () => {
      destroyed = true;
    };
  }, []);
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 140));
    const div = document.createElement("div");
    div.innerHTML = valueRef.current;

    // Save a theme-neutral marker color that recolorHtml can always detect
    // We save #ffffff as the "default" marker — recolorHtml will swap it on render
    const applyDefaultColor = (el: Element) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.style) return;
      if (!htmlEl.style.color) {
        htmlEl.style.color = "#ffffff"; // neutral marker — recolorHtml handles display
      }
      Array.from(el.children).forEach(applyDefaultColor);
    };
    Array.from(div.children).forEach(applyDefaultColor);

    const processedHtml = div.innerHTML;
    onSave(processedHtml, div.textContent || "");
    setIsSaving(false);
  }, [onSave]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Theme-derived tokens ────────────────────────────────────────────────────
  const backdropBg = isDark ? "rgba(4,6,16,0.72)" : "rgba(8,10,20,0.45)";
  const modalBg = isDark
    ? "linear-gradient(160deg,#0d1117 0%,#0a0d1a 100%)"
    : "linear-gradient(160deg,#fff 0%,#f7f8fc 100%)";
  const modalShadow = isDark
    ? "0 0 0 1px rgba(99,102,241,0.18),0 8px 16px rgba(0,0,0,0.5),0 32px 64px rgba(0,0,0,0.6)"
    : "0 0 0 1px rgba(148,163,184,0.18),0 8px 16px rgba(0,0,0,0.06),0 32px 64px rgba(0,0,0,0.13)";
  const accentBar = isDark
    ? "linear-gradient(90deg,#4f46e5,#7c3aed 30%,#a855f7 65%,#ec4899)"
    : "linear-gradient(90deg,#a5b4fc,#818cf8 30%,#c084fc 65%,#f0abfc)";
  const headerIconBg = isDark
    ? "linear-gradient(135deg,#1e1b4b,#312e81)"
    : "linear-gradient(135deg,#ede9fe,#ddd6fe)";
  const headerIconShadow = isDark
    ? "0 2px 6px rgba(99,102,241,0.35)"
    : "0 2px 6px rgba(139,92,246,0.18)";
  const titleColor = isDark ? "#e0e7ff" : "#1e1b4b";
  const subtitleColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const closeBtnBg = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(241,245,249,0.8)";
  const closeBtnBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(148,163,184,0.2)";
  const closeBtnColor = isDark ? "rgba(148,163,184,0.6)" : "#94a3b8";
  const footerBorder = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(226,232,240,0.9)";
  const footerBg = isDark ? "rgba(10,13,26,0.8)" : "rgba(248,250,252,0.7)";
  const charCountColor = isDark ? "rgba(100,116,139,0.5)" : "#cbd5e1";
  const cancelBtnBg = isDark
    ? "rgba(255,255,255,0.04)"
    : "rgba(255,255,255,0.95)";
  const cancelBtnBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(203,213,225,0.9)";
  const cancelBtnColor = isDark ? "rgba(148,163,184,0.8)" : "#64748b";

  // Quill toolbar & editor CSS — changes with isDark
  const quillCSS = isDark
    ? `
    /* ── DARK toolbar shell ── */
    .ql-toolbar.ql-snow {
      border:none !important;
      border-bottom:1px solid rgba(255,255,255,0.06) !important;
      background:rgba(10,13,26,0.97) !important;
      padding:6px 12px !important;
      display:flex !important; flex-wrap:wrap !important;
      gap:2px !important; align-items:center !important; flex-shrink:0 !important;
    }
    .ql-toolbar .ql-formats { display:inline-flex !important; align-items:center !important; margin-right:4px !important; gap:1px !important; }
    .ql-toolbar .ql-formats+.ql-formats { border-left:1px solid rgba(255,255,255,0.07) !important; padding-left:6px !important; margin-left:2px !important; }

    /* Buttons */
    .ql-toolbar button {
      width:28px !important; height:28px !important; border-radius:6px !important;
      border:none !important; background:transparent !important; padding:3px !important;
      display:inline-flex !important; align-items:center !important; justify-content:center !important;
      cursor:pointer !important; transition:background .12s, color .12s !important;
      color:rgba(148,163,184,0.75) !important;
    }
    .ql-toolbar button:hover           { background:rgba(99,102,241,0.18) !important; color:#a5b4fc !important; }
    .ql-toolbar button.ql-active       { background:rgba(99,102,241,0.22) !important; color:#818cf8 !important; }
    .ql-toolbar button .ql-stroke      { stroke:currentColor !important; }
    .ql-toolbar button .ql-fill        { fill:currentColor !important; }
    .ql-toolbar button.ql-active .ql-stroke { stroke:#818cf8 !important; }
    .ql-toolbar button.ql-active .ql-fill   { fill:#818cf8 !important; }

    /* Tooltip bubbles */
    .ql-toolbar button[title] { position:relative !important; overflow:visible !important; }
    .ql-toolbar button[title]:hover::after {
      content:attr(title); position:absolute; top:calc(100% + 8px); left:50%;
      transform:translateX(-50%); background:#0a0d1a; color:#e0e7ff;
      border:1px solid rgba(99,102,241,0.25);
      font-size:11px; font-weight:500; white-space:nowrap; padding:5px 10px;
      border-radius:6px; pointer-events:none; z-index:999999;
      font-family:system-ui,sans-serif; box-shadow:0 4px 16px rgba(0,0,0,0.5);
      line-height:normal;
    }
    .ql-toolbar button[title]:hover::before {
      content:""; position:absolute; top:calc(100% + 2px); left:50%;
      transform:translateX(-50%); border:5px solid transparent;
      border-bottom-color:#0a0d1a; pointer-events:none; z-index:999999;
    }

    /* Picker labels */
    .ql-toolbar .ql-picker          { position:relative !important; height:28px !important; }
    .ql-toolbar .ql-picker-label {
      border:1px solid rgba(255,255,255,0.09) !important; border-radius:6px !important;
      background:rgba(255,255,255,0.04) !important; padding:0 22px 0 8px !important;
      height:28px !important; font-size:11px !important; font-weight:600 !important;
      color:rgba(148,163,184,0.75) !important; display:inline-flex !important; align-items:center !important;
      cursor:pointer !important; transition:all .12s !important; white-space:nowrap !important;
    }
    .ql-toolbar .ql-picker-label:hover { border-color:rgba(99,102,241,0.5) !important; color:#a5b4fc !important; background:rgba(99,102,241,0.1) !important; }
    .ql-toolbar .ql-picker.ql-expanded .ql-picker-label { border-color:#818cf8 !important; color:#a5b4fc !important; background:rgba(99,102,241,0.14) !important; }
    .ql-toolbar .ql-picker-label svg .ql-stroke { stroke:currentColor !important; }

    /* Dropdown */
    .ql-toolbar .ql-picker-options {
      border-radius:10px !important; border:1px solid rgba(99,102,241,0.2) !important;
      box-shadow:0 8px 32px rgba(0,0,0,0.7),0 2px 6px rgba(0,0,0,0.4) !important;
      background:#0d1117 !important; padding:4px !important; margin-top:4px !important;
      z-index:999999 !important; max-height:220px !important; overflow-y:auto !important;
    }
    .ql-toolbar .ql-picker-item {
      border-radius:6px !important; padding:5px 10px !important;
      font-size:12px !important; color:rgba(148,163,184,0.8) !important; cursor:pointer !important; transition:all .1s !important;
    }
    .ql-toolbar .ql-picker-item:hover,
    .ql-toolbar .ql-picker-item.ql-selected { background:rgba(99,102,241,0.18) !important; color:#a5b4fc !important; }

    /* Color pickers */
    .ql-toolbar .ql-color .ql-picker-label,
    .ql-toolbar .ql-background .ql-picker-label { width:30px !important; padding:0 4px !important; }
    .ql-color-picker .ql-picker-options { width:176px !important; padding:6px !important; }
    .ql-color-picker .ql-picker-item {
      width:22px !important; height:22px !important; border-radius:5px !important;
      padding:0 !important; margin:2px !important; border:1.5px solid rgba(255,255,255,0.06) !important;
      transition:transform .12s, border-color .12s !important;
    }
    .ql-color-picker .ql-picker-item:hover { transform:scale(1.2) !important; border-color:#818cf8 !important; }

    /* Editor container */
    .ql-container.ql-snow { border:none !important; flex:1 !important; overflow-y:auto !important; background:#0d1117 !important; }
    .ql-editor {
      min-height:200px !important; padding:16px 22px !important;
      font-size:15px !important; line-height:1.7 !important;
      color:#e2e8f0 !important; font-family:system-ui,-apple-system,sans-serif !important;
      caret-color:#818cf8 !important;
    }
    .ql-editor.ql-blank::before { color:rgba(100,116,139,0.45) !important; font-style:normal !important; font-size:14px !important; }
    .ql-editor h1 { font-size:2em !important; font-weight:700 !important; color:#e0e7ff !important; }
    .ql-editor h2 { font-size:1.6em !important; font-weight:700 !important; color:#e0e7ff !important; }
    .ql-editor h3 { font-size:1.3em !important; font-weight:600 !important; color:#c7d2fe !important; }
    .ql-editor blockquote {
      border-left:3px solid #4f46e5 !important; padding-left:14px !important;
      color:rgba(148,163,184,0.75) !important; font-style:italic !important;
      background:rgba(99,102,241,0.06) !important; border-radius:0 6px 6px 0 !important;
    }
    .ql-editor pre.ql-syntax {
      background:#020409 !important; color:#a5b4fc !important;
      border:1px solid rgba(99,102,241,0.25) !important;
      border-radius:8px !important; padding:12px 16px !important; font-size:13px !important;
    }
    .ql-editor a { color:#818cf8 !important; text-decoration:underline !important; }
    .ql-editor strong { color:#f1f5f9 !important; }
    .ql-editor em { color:#c7d2fe !important; }
    .ql-editor code { background:rgba(99,102,241,0.12) !important; color:#a5b4fc !important; padding:1px 5px !important; border-radius:4px !important; }

    /* Scrollbar */
    .ql-editor::-webkit-scrollbar { width:6px !important; }
    .ql-editor::-webkit-scrollbar-track { background:transparent !important; }
    .ql-editor::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3) !important; border-radius:3px !important; }

    /* Tooltip (link) */
    .ql-tooltip {
      border-radius:10px !important; background:#0d1117 !important;
      border:1px solid rgba(99,102,241,0.25) !important;
      box-shadow:0 8px 24px rgba(0,0,0,0.6) !important; z-index:999999 !important;
      color:#e2e8f0 !important;
    }
    .ql-tooltip input[type=text] {
      border-radius:6px !important; background:rgba(255,255,255,0.05) !important;
      border:1px solid rgba(99,102,241,0.3) !important; color:#e2e8f0 !important; outline:none !important;
    }
    .ql-tooltip a.ql-action,.ql-tooltip a.ql-remove { color:#818cf8 !important; }
  `
    : `
    /* ── LIGHT toolbar shell ── */
    .ql-toolbar.ql-snow {
      border:none !important;
      border-bottom:1px solid rgba(226,232,240,0.9) !important;
      background:rgba(248,250,252,0.97) !important;
      padding:6px 12px !important;
      display:flex !important; flex-wrap:wrap !important;
      gap:2px !important; align-items:center !important; flex-shrink:0 !important;
    }
    .ql-toolbar .ql-formats { display:inline-flex !important; align-items:center !important; margin-right:4px !important; gap:1px !important; }
    .ql-toolbar .ql-formats+.ql-formats { border-left:1px solid rgba(203,213,225,0.5) !important; padding-left:6px !important; margin-left:2px !important; }

    /* Buttons */
    .ql-toolbar button {
      width:28px !important; height:28px !important; border-radius:6px !important;
      border:none !important; background:transparent !important; padding:3px !important;
      display:inline-flex !important; align-items:center !important; justify-content:center !important;
      cursor:pointer !important; transition:background .12s, color .12s !important; color:#64748b !important;
    }
    .ql-toolbar button:hover           { background:rgba(139,92,246,0.1) !important; color:#7c3aed !important; }
    .ql-toolbar button.ql-active       { background:rgba(139,92,246,0.14) !important; color:#7c3aed !important; }
    .ql-toolbar button .ql-stroke      { stroke:currentColor !important; }
    .ql-toolbar button .ql-fill        { fill:currentColor !important; }
    .ql-toolbar button.ql-active .ql-stroke { stroke:#7c3aed !important; }
    .ql-toolbar button.ql-active .ql-fill   { fill:#7c3aed !important; }

    /* Tooltip bubbles */
    .ql-toolbar button[title] { position:relative !important; overflow:visible !important; }
    .ql-toolbar button[title]:hover::after {
      content:attr(title); position:absolute; top:calc(100% + 8px); left:50%;
      transform:translateX(-50%); background:#1e1b4b; color:#fff;
      font-size:11px; font-weight:500; white-space:nowrap; padding:5px 10px;
      border-radius:6px; pointer-events:none; z-index:999999;
      font-family:system-ui,sans-serif; box-shadow:0 3px 12px rgba(0,0,0,0.15);
      line-height:normal;
    }
    .ql-toolbar button[title]:hover::before {
      content:""; position:absolute; top:calc(100% + 2px); left:50%;
      transform:translateX(-50%); border:5px solid transparent;
      border-bottom-color:#1e1b4b; pointer-events:none; z-index:999999;
    }

    /* Picker labels */
    .ql-toolbar .ql-picker          { position:relative !important; height:28px !important; }
    .ql-toolbar .ql-picker-label {
      border:1px solid rgba(203,213,225,0.6) !important; border-radius:6px !important;
      background:rgba(255,255,255,0.9) !important; padding:0 22px 0 8px !important;
      height:28px !important; font-size:11px !important; font-weight:600 !important;
      color:#64748b !important; display:inline-flex !important; align-items:center !important;
      cursor:pointer !important; transition:all .12s !important; white-space:nowrap !important;
    }
    .ql-toolbar .ql-picker-label:hover { border-color:#a78bfa !important; color:#7c3aed !important; background:rgba(237,233,254,0.4) !important; }
    .ql-toolbar .ql-picker.ql-expanded .ql-picker-label { border-color:#7c3aed !important; color:#7c3aed !important; background:rgba(237,233,254,0.5) !important; }
    .ql-toolbar .ql-picker-label svg .ql-stroke { stroke:currentColor !important; }

    /* Dropdown */
    .ql-toolbar .ql-picker-options {
      border-radius:10px !important; border:1px solid rgba(226,232,240,0.9) !important;
      box-shadow:0 8px 28px rgba(0,0,0,0.11),0 2px 6px rgba(0,0,0,0.06) !important;
      background:#fff !important; padding:4px !important; margin-top:4px !important;
      z-index:999999 !important; max-height:220px !important; overflow-y:auto !important;
    }
    .ql-toolbar .ql-picker-item {
      border-radius:6px !important; padding:5px 10px !important;
      font-size:12px !important; color:#475569 !important; cursor:pointer !important; transition:all .1s !important;
    }
    .ql-toolbar .ql-picker-item:hover,
    .ql-toolbar .ql-picker-item.ql-selected { background:rgba(139,92,246,0.08) !important; color:#7c3aed !important; }

    /* Color pickers */
    .ql-toolbar .ql-color .ql-picker-label,
    .ql-toolbar .ql-background .ql-picker-label { width:30px !important; padding:0 4px !important; }
    .ql-color-picker .ql-picker-options { width:176px !important; padding:6px !important; }
    .ql-color-picker .ql-picker-item {
      width:22px !important; height:22px !important; border-radius:5px !important;
      padding:0 !important; margin:2px !important; border:1.5px solid rgba(0,0,0,0.07) !important;
      transition:transform .12s, border-color .12s !important;
    }
    .ql-color-picker .ql-picker-item:hover { transform:scale(1.2) !important; border-color:#7c3aed !important; }

    /* Editor container */
    .ql-container.ql-snow { border:none !important; flex:1 !important; overflow-y:auto !important; }
    .ql-editor {
      min-height:200px !important; padding:16px 22px !important;
      font-size:15px !important; line-height:1.7 !important;
      color:#1e293b !important; font-family:system-ui,-apple-system,sans-serif !important;
    }
    .ql-editor.ql-blank::before { color:#cbd5e1 !important; font-style:normal !important; font-size:14px !important; }
    .ql-editor h1 { font-size:2em !important; font-weight:700 !important; color:#1e1b4b !important; }
    .ql-editor h2 { font-size:1.6em !important; font-weight:700 !important; color:#1e1b4b !important; }
    .ql-editor h3 { font-size:1.3em !important; font-weight:600 !important; color:#312e81 !important; }
    .ql-editor blockquote { border-left:3px solid #a5b4fc !important; padding-left:14px !important; color:#64748b !important; font-style:italic !important; }
    .ql-editor pre.ql-syntax { background:#1e1b4b !important; color:#a5b4fc !important; border-radius:8px !important; padding:12px 16px !important; font-size:13px !important; }
    .ql-editor a { color:#7c3aed !important; text-decoration:underline !important; }
    .ql-tooltip { border-radius:10px !important; border:1px solid rgba(226,232,240,0.9) !important; box-shadow:0 8px 24px rgba(0,0,0,0.1) !important; z-index:999999 !important; }
    .ql-tooltip input[type=text] { border-radius:6px !important; border:1px solid #ddd6fe !important; outline:none !important; }
    .ql-tooltip a.ql-action,.ql-tooltip a.ql-remove { color:#7c3aed !important; }
  `;

  const fontCSS = FONTS.map(
    ({ value, label, family }) => `
    .ql-font-${value}, .ql-font-${value} * { font-family: ${family} !important; }
    .ql-toolbar .ql-font .ql-picker-item[data-value="${value}"]::before {
      content: "${label}" !important; font-family: ${family} !important;
    }
    .ql-toolbar .ql-font .ql-picker-label[data-value="${value}"]::before {
      content: "${label}" !important;
    }
  `,
  ).join("");

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
        background: backdropBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "qbdrop .18s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: "96vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: modalBg,
          borderRadius: 20,
          boxShadow: modalShadow,
          overflow: "hidden",
          animation: "qmodal .22s cubic-bezier(0.34,1.4,0.64,1)",
          transition: "background 0.3s",
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
            background: isDark ? "rgba(10,13,26,0.5)" : "transparent",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: headerIconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: headerIconShadow,
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDark ? "#818cf8" : "#7c3aed"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
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
                Add your text here
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: subtitleColor,
                  marginTop: 1,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Format, style, and express your ideas
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${closeBtnBorder}`,
              background: closeBtnBg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: closeBtnColor,
              fontSize: 14,
              transition: "all .15s",
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
              e.currentTarget.style.background = closeBtnBg;
              e.currentTarget.style.borderColor = closeBtnBorder;
              e.currentTarget.style.color = closeBtnColor;
            }}
          >
            ✕
          </button>
        </div>

        {/* Quill editor area */}
        <div
          ref={wrapperRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            background: isDark ? "#0d1117" : "#ffffff",
          }}
        />

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
              color: charCountColor,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {charCount} character{charCount !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Cancel */}
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: `1.5px solid ${cancelBtnBorder}`,
                background: cancelBtnBg,
                color: cancelBtnColor,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
                fontFamily: "system-ui,sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                  ? "rgba(255,255,255,0.08)"
                  : "#f8fafc";
                e.currentTarget.style.borderColor = isDark
                  ? "rgba(255,255,255,0.16)"
                  : "#94a3b8";
                e.currentTarget.style.color = isDark ? "#e2e8f0" : "#475569";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = cancelBtnBg;
                e.currentTarget.style.borderColor = cancelBtnBorder;
                e.currentTarget.style.color = cancelBtnColor;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Cancel
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "9px 24px",
                borderRadius: 10,
                border: "none",
                background: isSaving
                  ? isDark
                    ? "linear-gradient(135deg,#312e81,#1e1b4b)"
                    : "linear-gradient(135deg,#c4b5fd,#a78bfa)"
                  : isDark
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed 55%,#a855f7)"
                    : "linear-gradient(135deg,#8b5cf6,#7c3aed 55%,#6d28d9)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                transition: "all .18s",
                boxShadow: isSaving
                  ? "none"
                  : isDark
                    ? "0 2px 12px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.2)"
                    : "0 2px 8px rgba(124,58,237,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "system-ui,sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 8px 24px rgba(99,102,241,0.6), 0 0 32px rgba(99,102,241,0.25)"
                    : "0 6px 18px rgba(124,58,237,0.42)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isSaving
                  ? "none"
                  : isDark
                    ? "0 2px 12px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.2)"
                    : "0 2px 8px rgba(124,58,237,0.35)";
              }}
            >
              {isSaving ? (
                <>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "qspin .7s linear infinite",
                    }}
                  />
                  Saving…
                </>
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes qmodal { from{opacity:0;transform:scale(0.93) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes qbdrop { from{opacity:0} to{opacity:1} }
        @keyframes qspin  { to{transform:rotate(360deg)} }

        ${fontCSS}

        /* Default font label */
        .ql-toolbar .ql-font .ql-picker-label:not([data-value])::before,
        .ql-toolbar .ql-font .ql-picker-label[data-value=""]::before { content:"Font" !important; }
        .ql-toolbar .ql-font .ql-picker-item:not([data-value])::before,
        .ql-toolbar .ql-font .ql-picker-item[data-value=""]::before  { content:"Default" !important; }

        /* Size labels */
        .ql-toolbar .ql-size .ql-picker-label:not([data-value])::before,
        .ql-toolbar .ql-size .ql-picker-label[data-value=""]::before { content:"Size" !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="10px"]::before { content:"10px"; font-size:10px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="12px"]::before { content:"12px"; font-size:12px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="14px"]::before { content:"14px"; font-size:14px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="16px"]::before { content:"16px"; font-size:16px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="18px"]::before { content:"18px"; font-size:18px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="24px"]::before { content:"24px"; font-size:24px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="32px"]::before { content:"32px"; font-size:28px !important; }
        .ql-toolbar .ql-size .ql-picker-item[data-value="48px"]::before { content:"48px"; font-size:32px !important; }

        /* Heading labels */
        .ql-toolbar .ql-header .ql-picker-label:not([data-value])::before,
        .ql-toolbar .ql-header .ql-picker-label[data-value=""]::before { content:"Style" !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="1"]::before { content:"Heading 1"; font-size:20px !important; font-weight:700 !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="2"]::before { content:"Heading 2"; font-size:17px !important; font-weight:700 !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="3"]::before { content:"Heading 3"; font-size:15px !important; font-weight:600 !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="4"]::before { content:"Heading 4"; font-size:13px !important; font-weight:600 !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="5"]::before { content:"Heading 5"; font-size:12px !important; }
        .ql-toolbar .ql-header .ql-picker-item[data-value="6"]::before { content:"Heading 6"; font-size:11px !important; }
        .ql-toolbar .ql-header .ql-picker-item:not([data-value])::before,
        .ql-toolbar .ql-header .ql-picker-item[data-value=""]::before  { content:"Normal"; }

        ${quillCSS}
      `}</style>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modal, document.body);
};

export default QuillEditorModal;
