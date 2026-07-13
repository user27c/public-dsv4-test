import { create } from 'zustand';
import { produce } from 'immer';
import { CellData, CellType, Position, TeleportLink, TeleportDir, posKey } from '../types';

interface MapSnapshot {
  cells: CellData[][];
  width: number;
  height: number;
  start: Position | null;
  end: Position | null;
  teleports: TeleportLink[];
}

interface MapState extends MapSnapshot {
  undoStack: MapSnapshot[];
  redoStack: MapSnapshot[];

  setCell: (x: number, y: number, cell: CellData) => void;
  setStart: (pos: Position) => void;
  setEnd: (pos: Position) => void;
  addTeleportLink: (from: Position, to: Position, dir: TeleportDir) => void;
  removeTeleportLink: (id: string) => void;
  fillArea: (x: number, y: number, cell: CellData) => void;
  setCells: (updates: { x: number; y: number; cell: CellData }[]) => void;

  resize: (width: number, height: number) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  getCell: (x: number, y: number) => CellData | null;
  findEmptyPositions: () => Position[];
  findTeleportById: (id: string) => TeleportLink | undefined;
  getTeleportPair: (x: number, y: number) => TeleportLink | undefined;
}

function createEmptyCells(w: number, h: number): CellData[][] {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ type: 'empty' as CellType }))
  );
}

function snapshot(s: MapSnapshot): MapSnapshot {
  return {
    cells: s.cells.map((row) => row.map((c) => ({ ...c }))),
    width: s.width,
    height: s.height,
    start: s.start ? { ...s.start } : null,
    end: s.end ? { ...s.end } : null,
    teleports: s.teleports.map((t) => ({
      ...t,
      in: { ...t.in },
      out: { ...t.out },
    })),
  };
}

const DEFAULT_SIZE = 200;

export const useMapStore = create<MapState>((set, get) => ({
  cells: createEmptyCells(DEFAULT_SIZE, DEFAULT_SIZE),
  width: DEFAULT_SIZE,
  height: DEFAULT_SIZE,
  start: null,
  end: null,
  teleports: [],
  undoStack: [],
  redoStack: [],

  setCell: (x, y, cell) =>
    set(
      produce((s: MapState) => {
        if (x >= 0 && x < s.width && y >= 0 && y < s.height) {
          s.cells[y][x] = { ...cell };
        }
      })
    ),

  setStart: (pos) =>
    set(
      produce((s: MapState) => {
        if (s.start) {
          s.cells[s.start.y][s.start.x].type = 'empty';
        }
        s.start = pos;
        s.cells[pos.y][pos.x].type = 'start';
      })
    ),

  setEnd: (pos) =>
    set(
      produce((s: MapState) => {
        if (s.end) {
          s.cells[s.end.y][s.end.x].type = 'empty';
        }
        s.end = pos;
        s.cells[pos.y][pos.x].type = 'end';
      })
    ),

  addTeleportLink: (from, to, dir) =>
    set(
      produce((s: MapState) => {
        const id = `tp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        s.teleports.push({ id, dir, in: from, out: to });
        s.cells[from.y][from.x] = { type: 'teleport_in', teleportId: id };
        s.cells[to.y][to.x] = { type: 'teleport_out', teleportId: id };
      })
    ),

  removeTeleportLink: (id) =>
    set(
      produce((s: MapState) => {
        const tp = s.teleports.find((t) => t.id === id);
        if (tp) {
          s.cells[tp.in.y][tp.in.x] = { type: 'empty' };
          s.cells[tp.out.y][tp.out.x] = { type: 'empty' };
          s.teleports = s.teleports.filter((t) => t.id !== id);
        }
      })
    ),

  fillArea: (x, y, cell) =>
    set(
      produce((s: MapState) => {
        if (x < 0 || x >= s.width || y < 0 || y >= s.height) return;
        const target = s.cells[y][x].type;
        if (target === cell.type && (cell.teleportId ?? '') === (s.cells[y][x].teleportId ?? ''))
          return;
        const stack = [[x, y]];
        const visited = new Set<string>();
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          const key = posKey({ x: cx, y: cy });
          if (visited.has(key)) continue;
          visited.add(key);
          if (cx < 0 || cx >= s.width || cy < 0 || cy >= s.height) continue;
          if (s.cells[cy][cx].type !== target) continue;
          s.cells[cy][cx] = { ...cell };
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
      })
    ),

  setCells: (updates) =>
    set(
      produce((s: MapState) => {
        for (const u of updates) {
          if (u.x >= 0 && u.x < s.width && u.y >= 0 && u.y < s.height) {
            s.cells[u.y][u.x] = { ...u.cell };
          }
        }
      })
    ),

  resize: (width, height) => {
    const s = get();
    const newCells = createEmptyCells(width, height);
    for (let y = 0; y < Math.min(s.height, height); y++) {
      for (let x = 0; x < Math.min(s.width, width); x++) {
        newCells[y][x] = { ...s.cells[y][x] };
      }
    }
    set({
      cells: newCells,
      width,
      height,
      start: s.start && s.start.x < width && s.start.y < height ? s.start : null,
      end: s.end && s.end.x < width && s.end.y < height ? s.end : null,
      teleports: s.teleports.filter(
        (t) =>
          t.in.x < width && t.in.y < height && t.out.x < width && t.out.y < height
      ),
      undoStack: [],
      redoStack: [],
    });
  },

  pushUndo: () =>
    set(
      produce((s: MapState) => {
        s.undoStack.push(snapshot(s));
        s.redoStack = [];
      })
    ),

  undo: () =>
    set(
      produce((s: MapState) => {
        const prev = s.undoStack.pop();
        if (prev) {
          s.redoStack.push(snapshot(s));
          Object.assign(s, prev);
        }
      })
    ),

  redo: () =>
    set(
      produce((s: MapState) => {
        const next = s.redoStack.pop();
        if (next) {
          s.undoStack.push(snapshot(s));
          Object.assign(s, next);
        }
      })
    ),

  getCell: (x, y) => {
    const s = get();
    if (x < 0 || x >= s.width || y < 0 || y >= s.height) return null;
    return s.cells[y][x];
  },

  findEmptyPositions: () => {
    const s = get();
    const positions: Position[] = [];
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (s.cells[y][x].type === 'empty') {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  },

  findTeleportById: (id) => {
    return get().teleports.find((t) => t.id === id);
  },

  getTeleportPair: (x, y) => {
    const cell = get().getCell(x, y);
    if (cell?.teleportId) {
      return get().teleports.find((t) => t.id === cell.teleportId);
    }
    return undefined;
  },
}));
