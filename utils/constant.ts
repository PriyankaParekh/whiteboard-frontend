// Shared constants used across the app
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

export const ELEMENT_STROKE_COLORS = [
  { color: "#94a3b8", name: "Slate" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#8b5cf6", name: "Purple" },
  { color: "#ec4899", name: "Pink" },
  { color: "#10b981", name: "Emerald" },
  { color: "#f59e0b", name: "Amber" },
  { color: "#ef4444", name: "Red" },
  { color: "#1e293b", name: "Dark" },
];

export const ELEMENT_FILL_COLORS = [
  { color: "transparent", name: "None" },
  { color: "#f1f5f9", name: "Slate" },
  { color: "#dbeafe", name: "Blue" },
  { color: "#e9d5ff", name: "Purple" },
  { color: "#fce7f3", name: "Pink" },
  { color: "#d1fae5", name: "Green" },
  { color: "#fef3c7", name: "Yellow" },
  { color: "#fee2e2", name: "Red" },
];

export const CANVAS_BG_COLORS = [
  { color: "#f1f5f9", name: "Slate", dotColor: "#cbd5e1" },
  { color: "#fafafa", name: "White", dotColor: "#e4e4e7" },
  { color: "#fef9f0", name: "Cream", dotColor: "#fcd34d" },
  { color: "#f0f9ff", name: "Sky", dotColor: "#bae6fd" },
  { color: "#fdf4ff", name: "Lavender", dotColor: "#e879f9" },
  { color: "#f0fdf4", name: "Mint", dotColor: "#86efac" },
];
