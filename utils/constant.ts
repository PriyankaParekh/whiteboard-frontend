// ─── Stroke colors ────────────────────────────────────────────────────────────
// Light mode strokes
export const ELEMENT_STROKE_COLORS_LIGHT = [
  { color: "#1e293b", name: "Ink" },
  { color: "#ef4444", name: "Red" },
  { color: "#f97316", name: "Orange" },
  { color: "#eab308", name: "Yellow" },
  { color: "#22c55e", name: "Green" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#8b5cf6", name: "Violet" },
  { color: "#ec4899", name: "Pink" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#64748b", name: "Slate" },
  { color: "#ffffff", name: "White" },
  { color: "transparent", name: "None" },
];

// Dark mode neon strokes
export const ELEMENT_STROKE_COLORS_DARK = [
  { color: "#f8fafc", name: "White" },
  { color: "#ff2d55", name: "Neon Red" },
  { color: "#ff9f0a", name: "Neon Amber" },
  { color: "#ffd60a", name: "Neon Yellow" },
  { color: "#30d158", name: "Neon Green" },
  { color: "#0a84ff", name: "Neon Blue" },
  { color: "#bf5af2", name: "Neon Purple" },
  { color: "#ff375f", name: "Neon Pink" },
  { color: "#5ac8fa", name: "Neon Cyan" },
  { color: "#ff6961", name: "Coral" },
  { color: "#64ffda", name: "Aqua" },
  { color: "transparent", name: "None" },
];

// ─── Fill colors ──────────────────────────────────────────────────────────────
export const ELEMENT_FILL_COLORS_LIGHT = [
  { color: "transparent", name: "None" },
  { color: "#fef9c3", name: "Yellow" },
  { color: "#fee2e2", name: "Red" },
  { color: "#ffedd5", name: "Orange" },
  { color: "#dcfce7", name: "Green" },
  { color: "#dbeafe", name: "Blue" },
  { color: "#ede9fe", name: "Violet" },
  { color: "#fce7f3", name: "Pink" },
  { color: "#cffafe", name: "Cyan" },
  { color: "#f1f5f9", name: "Slate" },
  { color: "#ffffff", name: "White" },
  { color: "#0f172a", name: "Dark" },
];

export const ELEMENT_FILL_COLORS_DARK = [
  { color: "transparent", name: "None" },
  { color: "rgba(255,214,10,0.15)", name: "Yellow" },
  { color: "rgba(255,45,85,0.15)", name: "Red" },
  { color: "rgba(255,159,10,0.15)", name: "Orange" },
  { color: "rgba(48,209,88,0.15)", name: "Green" },
  { color: "rgba(10,132,255,0.15)", name: "Blue" },
  { color: "rgba(191,90,242,0.15)", name: "Purple" },
  { color: "rgba(255,55,95,0.15)", name: "Pink" },
  { color: "rgba(90,200,250,0.15)", name: "Cyan" },
  { color: "rgba(255,101,97,0.15)", name: "Coral" },
  { color: "rgba(100,255,218,0.15)", name: "Aqua" },
  { color: "rgba(255,255,255,0.05)", name: "Glass" },
];

// ─── Canvas backgrounds ───────────────────────────────────────────────────────
export const CANVAS_BG_COLORS_LIGHT = [
  { color: "#f8fafc", dotColor: "#cbd5e1", name: "Slate" },
  { color: "#ffffff", dotColor: "#e2e8f0", name: "White" },
  { color: "#fefce8", dotColor: "#fde68a", name: "Cream" },
  { color: "#f0f9ff", dotColor: "#bae6fd", name: "Sky" },
  { color: "#faf5ff", dotColor: "#ddd6fe", name: "Lavender" },
  { color: "#f0fdf4", dotColor: "#bbf7d0", name: "Mint" },
];

export const CANVAS_BG_COLORS_DARK = [
  { color: "#0d1117", dotColor: "rgba(99,102,241,0.25)", name: "Void" },
  { color: "#0a0a1a", dotColor: "rgba(139,92,246,0.30)", name: "Deep" },
  { color: "#0d1f0d", dotColor: "rgba(48,209,88,0.22)", name: "Matrix" },
  { color: "#1a0d2e", dotColor: "rgba(191,90,242,0.28)", name: "Galaxy" },
  { color: "#0d1a2e", dotColor: "rgba(10,132,255,0.28)", name: "Ocean" },
  { color: "#1a0a0a", dotColor: "rgba(255,45,85,0.22)", name: "Ember" },
];

// ─── Convenience getters (call with isDark flag) ──────────────────────────────
export function getStrokeColors(isDark: boolean) {
  return isDark ? ELEMENT_STROKE_COLORS_DARK : ELEMENT_STROKE_COLORS_LIGHT;
}

export function getFillColors(isDark: boolean) {
  return isDark ? ELEMENT_FILL_COLORS_DARK : ELEMENT_FILL_COLORS_LIGHT;
}

export function getCanvasBgColors(isDark: boolean) {
  return isDark ? CANVAS_BG_COLORS_DARK : CANVAS_BG_COLORS_LIGHT;
}

// ─── Legacy exports (keep existing imports working) ───────────────────────────
export const ELEMENT_STROKE_COLORS = ELEMENT_STROKE_COLORS_LIGHT;
export const ELEMENT_FILL_COLORS = ELEMENT_FILL_COLORS_LIGHT;
export const CANVAS_BG_COLORS = CANVAS_BG_COLORS_LIGHT;

export const COLORS = {
  stroke: "#94a3b8",
  fill: "transparent",
  accent: "#cbd5e1",
  canvasBg: "#f1f5f9",
  selection: "#3b82f6",
  selectionFill: "rgba(59, 130, 246, 0.08)",
};

export const STICKY_NOTE_COLORS = [
  { fill: "#fef3c7", stroke: "#fcd34d", name: "Yellow" },
  { fill: "#dbeafe", stroke: "#93c5fd", name: "Blue" },
  { fill: "#fce7f3", stroke: "#f9a8d4", name: "Pink" },
  { fill: "#d1fae5", stroke: "#6ee7b7", name: "Green" },
  { fill: "#e9d5ff", stroke: "#c084fc", name: "Purple" },
];
export function getStickyNoteStrokeColor(fillColor: string): string {
  const color = STICKY_NOTE_COLORS.find((c) => c.fill === fillColor);
  return color ? color.stroke : "#fcd34d";
}
