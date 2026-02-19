"use client";

import { create } from "zustand";

// 🔷 All supported tools
export type ToolType =
  | "select"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "polygon"
  | "triangle"
  | "diamond"
  | "pencil"
  | "text"
  | "sticky";

// 🔷 Generic Element
export interface WhiteboardElement {
  fontSize: number;
  id: string;
  type: ToolType;

  // common positions
  x: number;
  y: number;
  width?: number;
  height?: number;

  // line/arrow
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  // polygon / pencil
  points?: { x: number; y: number }[];

  // text / sticky
  text?: string;

  // styling
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;

  // rotation
  angle?: number;
}

interface CanvasStore {
  elements: WhiteboardElement[];
  selectedTool: ToolType;
  selectedElementId: string | null;
  selectedElementIds: string[];
  history: WhiteboardElement[][];
  historyIndex: number;

  addElement: (el: WhiteboardElement) => void;
  updateElement: (id: string, el: Partial<WhiteboardElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  setTool: (tool: ToolType) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

export const useStore = create<CanvasStore>((set) => ({
  elements: [],
  selectedTool: "select",
  selectedElementId: null,
  selectedElementIds: [],
  history: [[]],
  historyIndex: 0,

  addElement: (el) =>
    set((state) => {
      const newElements = [...state.elements, el];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  updateElement: (id, updated) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updated } : el,
      ),
    })),

  deleteElement: (id) =>
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);
      return {
        elements: newElements,
        selectedElementId:
          state.selectedElementId === id ? null : state.selectedElementId,
        selectedElementIds: state.selectedElementIds.filter(
          (sid) => sid !== id,
        ),
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  deleteSelected: () =>
    set((state) => {
      const toDelete = new Set(state.selectedElementIds);
      const newElements = state.elements.filter((el) => !toDelete.has(el.id));
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);
      return {
        elements: newElements,
        selectedElementId: null,
        selectedElementIds: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  selectElement: (id, additive = false) =>
    set((state) => {
      if (id === null) {
        return { selectedElementId: null, selectedElementIds: [] };
      }
      if (additive) {
        const exists = state.selectedElementIds.includes(id);
        const selected = exists
          ? state.selectedElementIds.filter((s) => s !== id)
          : [...state.selectedElementIds, id];
        return {
          selectedElementIds: selected,
          selectedElementId:
            selected.length > 0 ? selected[selected.length - 1] : null,
        };
      }
      return { selectedElementId: id, selectedElementIds: [id] };
    }),

  setTool: (tool) =>
    set(() => ({
      selectedTool: tool,
    })),

  clearCanvas: () =>
    set(() => ({
      elements: [],
      selectedElementId: null,
    })),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        return {
          elements: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
          selectedElementId: null,
        };
      }
      return state;
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        return {
          elements: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
          selectedElementId: null,
        };
      }
      return state;
    }),
}));
