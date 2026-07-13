import { create } from 'zustand';
import { EditorTool } from '../types';

interface EditorState {
  tool: EditorTool;
  brushSize: number;
  teleportDir: 'one_way' | 'two_way';
  pendingTeleportIn: { x: number; y: number } | null;

  zoom: number;
  panX: number;
  panY: number;

  setTool: (tool: EditorTool) => void;
  setBrushSize: (size: number) => void;
  setTeleportDir: (dir: 'one_way' | 'two_way') => void;
  setPendingTeleportIn: (pos: { x: number; y: number } | null) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;
const ZOOM_STEP = 1.2;

export const useEditorStore = create<EditorState>((set, get) => ({
  tool: 'solid_wall',
  brushSize: 1,
  teleportDir: 'two_way',
  pendingTeleportIn: null,

  zoom: 1,
  panX: 0,
  panY: 0,

  setTool: (tool) => set({ tool, pendingTeleportIn: null }),
  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(10, size)) }),
  setTeleportDir: (dir) => set({ teleportDir: dir }),
  setPendingTeleportIn: (pos) => set({ pendingTeleportIn: pos }),

  setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),

  zoomIn: () =>
    set((s) => ({
      zoom: Math.min(ZOOM_MAX, s.zoom * ZOOM_STEP),
    })),
  zoomOut: () =>
    set((s) => ({
      zoom: Math.max(ZOOM_MIN, s.zoom / ZOOM_STEP),
    })),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
}));
