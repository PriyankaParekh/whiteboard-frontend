"use client";

import { create } from "zustand";

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

export interface WhiteboardElement {
  fontSize: number;
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: { x: number; y: number }[];
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  angle?: number;
  groupId?: string;
}

interface CanvasStore {
  elements: WhiteboardElement[];
  selectedTool: ToolType;
  selectedElementId: string | null;
  selectedElementIds: string[];
  history: WhiteboardElement[][];
  historyIndex: number;
  stickyNoteColor: string;
  elementStrokeColor: string;
  elementFillColor: string;
  addElement: (el: WhiteboardElement) => void;
  updateElement: (id: string, el: Partial<WhiteboardElement>) => void;
  updateElements: (ids: string[], delta: { dx: number; dy: number }) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  selectElements: (ids: string[]) => void;
  setTool: (tool: ToolType) => void;
  setStickyNoteColor: (color: string) => void;
  setElementStrokeColor: (color: string) => void;
  setElementFillColor: (color: string) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
}

export const useStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedTool: "select",
  selectedElementId: null,
  selectedElementIds: [],
  history: [[]],
  historyIndex: 0,
  stickyNoteColor: "#fef3c7",
  elementStrokeColor: "#94a3b8",
  elementFillColor: "transparent",

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

  updateElements: (ids, { dx, dy }) =>
    set((state) => ({
      elements: state.elements.map((el) => {
        if (!ids.includes(el.id)) return el;
        if (el.points)
          return {
            ...el,
            points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          };
        return { ...el, x: el.x + dx, y: el.y + dy };
      }),
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
      if (id === null)
        return { selectedElementId: null, selectedElementIds: [] };
      const clickedEl = state.elements.find((el) => el.id === id);
      const groupId = clickedEl?.groupId;
      if (!additive) {
        if (groupId) {
          const groupIds = state.elements
            .filter((el) => el.groupId === groupId)
            .map((el) => el.id);
          return { selectedElementIds: groupIds, selectedElementId: id };
        }
        return { selectedElementId: id, selectedElementIds: [id] };
      }
      if (groupId) {
        const groupIds = state.elements
          .filter((el) => el.groupId === groupId)
          .map((el) => el.id);
        const allSelected = groupIds.every((gid) =>
          state.selectedElementIds.includes(gid),
        );
        const newSelected = allSelected
          ? state.selectedElementIds.filter((s) => !groupIds.includes(s))
          : [
              ...state.selectedElementIds.filter((s) => !groupIds.includes(s)),
              ...groupIds,
            ];
        return {
          selectedElementIds: newSelected,
          selectedElementId:
            newSelected.length > 0 ? newSelected[newSelected.length - 1] : null,
        };
      }
      const exists = state.selectedElementIds.includes(id);
      const selected = exists
        ? state.selectedElementIds.filter((s) => s !== id)
        : [...state.selectedElementIds, id];
      return {
        selectedElementIds: selected,
        selectedElementId:
          selected.length > 0 ? selected[selected.length - 1] : null,
      };
    }),

  selectElements: (ids) =>
    set((state) => {
      if (ids.length === 0)
        return { selectedElementId: null, selectedElementIds: [] };
      const expandedIds = new Set<string>(ids);
      ids.forEach((id) => {
        const el = state.elements.find((e) => e.id === id);
        if (el?.groupId)
          state.elements
            .filter((e) => e.groupId === el.groupId)
            .forEach((e) => expandedIds.add(e.id));
      });
      const finalIds = Array.from(expandedIds);
      return {
        selectedElementIds: finalIds,
        selectedElementId: finalIds[finalIds.length - 1],
      };
    }),

  setTool: (tool) => set(() => ({ selectedTool: tool })),
  setStickyNoteColor: (color) => set(() => ({ stickyNoteColor: color })),
  setElementStrokeColor: (color) => set(() => ({ elementStrokeColor: color })),
  setElementFillColor: (color) => set(() => ({ elementFillColor: color })),
  clearCanvas: () =>
    set(() => ({
      elements: [],
      selectedElementId: null,
      selectedElementIds: [],
    })),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        return {
          elements: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
          selectedElementId: null,
          selectedElementIds: [],
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
          selectedElementIds: [],
        };
      }
      return state;
    }),

  groupSelected: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2) return state;
      const newGroupId = `group-${Date.now()}`;
      const newElements = state.elements.map((el) =>
        state.selectedElementIds.includes(el.id)
          ? { ...el, groupId: newGroupId }
          : el,
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  ungroupSelected: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0) return state;
      const groupIds = new Set(
        state.elements
          .filter(
            (el) => state.selectedElementIds.includes(el.id) && el.groupId,
          )
          .map((el) => el.groupId as string),
      );
      if (groupIds.size === 0) return state;
      const newElements = state.elements.map((el) =>
        el.groupId && groupIds.has(el.groupId)
          ? { ...el, groupId: undefined }
          : el,
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newElements);
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),
}));
