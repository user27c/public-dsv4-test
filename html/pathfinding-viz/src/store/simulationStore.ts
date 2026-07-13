import { create } from 'zustand';
import { AlgorithmResult, AlgorithmDef } from '../types';

export type SimStatus = 'idle' | 'running' | 'paused' | 'finished';

interface SimulationState {
  status: SimStatus;
  algorithms: AlgorithmDef[];
  results: AlgorithmResult[];
  logs: string[];
  currentStep: number;
  elapsed: number;
  timeLimit: number;
  showBaselinePath: boolean;

  setStatus: (status: SimStatus) => void;
  addAlgorithm: (algo: AlgorithmDef) => void;
  removeAlgorithm: (id: string) => void;
  updateAlgorithm: (id: string, code: string) => void;
  setAlgorithms: (algos: AlgorithmDef[]) => void;
  setResults: (results: AlgorithmResult[]) => void;
  addResult: (result: AlgorithmResult) => void;
  addLog: (msg: string) => void;
  clearLogs: () => void;
  setCurrentStep: (step: number) => void;
  setElapsed: (ms: number) => void;
  setTimeLimit: (sec: number) => void;
  setShowBaselinePath: (show: boolean) => void;
  reset: () => void;

  getActiveAlgorithms: () => AlgorithmDef[];
}

const BFS_TEMPLATE = (name: string, avoidProb: boolean) => `
// Stores the precomputed path as an array of directions
var __path = null;

function main(api) {
  var goal = api.getGoal();
  var player = api.getPlayer();
  var size = api.getMapSize();

  // Recompute path if we don't have one yet or we got lost
  if (__path === null || __path.length === 0) {
    __path = [];
    var startKey = player.x+','+player.y;
    var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    var dirNames = ['up','down','left','right'];
    var parent = {};
    parent[startKey] = null;
    var queue = [startKey];
    var head = 0;

    while (head < queue.length) {
      var key = queue[head++];
      var parts = key.split(',');
      var cx = +parts[0];
      var cy = +parts[1];
      if (cx === goal.x && cy === goal.y) break;

      for (var i = 0; i < 4; i++) {
        var d = dirs[i];
        var nx = cx + d[0];
        var ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= size.width || ny >= size.height) continue;
        var nk = nx+','+ny;
        if (parent.hasOwnProperty(nk)) continue;
        var cell = api.getCell(nx, ny);
        if (cell.type === 'solid') continue;
        ${avoidProb ? `if (cell.type === 'probabilistic') continue;` : ''}
        parent[nk] = {x:cx, y:cy, dir:dirNames[i]};
        queue.push(nk);
      }
    }

    // Backtrack from goal to start
    var cx = goal.x, cy = goal.y;
    while (true) {
      var key = cx+','+cy;
      if (!parent.hasOwnProperty(key)) break;
      var p = parent[key];
      if (p === null) break;
      __path.unshift(p.dir);
      cx = p.x; cy = p.y;
    }
  }

  // Follow precomputed path
  if (__path.length > 0) {
    api.move(__path.shift());
  } else {
    api.move('right');
  }
}`;

const BASELINE_OPTIMIST = `// 乐观派：将概率墙视为空地
${BFS_TEMPLATE('optimist', false)}`;

const BASELINE_PESSIMIST = `// 悲观派：将概率墙视为实体墙
${BFS_TEMPLATE('pessimist', true)}`;

const defaultAlgos: AlgorithmDef[] = [
  { id: 'baseline-optimist', name: '乐观派（无视概率墙）', code: BASELINE_OPTIMIST, isBaseline: true },
  { id: 'baseline-pessimist', name: '悲观派（避开概率墙）', code: BASELINE_PESSIMIST, isBaseline: true },
];

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  algorithms: [...defaultAlgos],
  results: [],
  logs: [],
  currentStep: 0,
  elapsed: 0,
  timeLimit: 300,
  showBaselinePath: true,

  setStatus: (status) => set({ status }),
  addAlgorithm: (algo) =>
    set((s) => ({ algorithms: [...s.algorithms, algo] })),
  removeAlgorithm: (id) =>
    set((s) => ({ algorithms: s.algorithms.filter((a) => a.id !== id) })),
  updateAlgorithm: (id, code) =>
    set((s) => ({
      algorithms: s.algorithms.map((a) => (a.id === id ? { ...a, code } : a)),
    })),
  setAlgorithms: (algos) => set({ algorithms: algos }),
  setResults: (results) => set({ results }),
  addResult: (result) =>
    set((s) => ({ results: [...s.results, result] })),
  addLog: (msg) =>
    set((s) => ({ logs: [...s.logs.slice(-500), `[${(s.elapsed / 1000).toFixed(1)}s] ${msg}`] })),
  clearLogs: () => set({ logs: [] }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setElapsed: (ms) => set({ elapsed: ms }),
  setTimeLimit: (sec) => set({ timeLimit: sec }),
  setShowBaselinePath: (show) => set({ showBaselinePath: show }),
  reset: () =>
    set({
      status: 'idle',
      results: [],
      logs: [],
      currentStep: 0,
      elapsed: 0,
    }),

  getActiveAlgorithms: () => get().algorithms,
}));
