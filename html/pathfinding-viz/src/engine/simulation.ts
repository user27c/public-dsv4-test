import { AlgorithmDef, CellData, Position, TeleportLink, Direction, ItemType } from '../types';
import { PlayerState, createPlayer, addToInventory, useItem, updatePlayerEffects, getPassiveEffectRemaining, applyPassiveEffect } from '../engine/player';
import { tryMove, getTeleportTarget, randomChestItem } from '../engine/world';

const TYPE_TO_NUM: Record<string, number> = {
  empty: 0,
  solid: 1,
  probabilistic: 2,
  teleport_in: 3,
  teleport_out: 4,
  start: 5,
  end: 6,
  chest: 7,
};

interface WorkerController {
  id: string;
  name: string;
  worker: Worker;
  ready: boolean;
  lastAction: { kind: string; dir?: string; slot?: number } | null;
  pending: boolean;
  error: string | null;
}

export interface SimStats {
  algorithmId: string;
  algorithmName: string;
  success: boolean;
  totalTime: number;
  steps: number;
  solidWallHits: number;
  probWallAttempts: number;
  probWallFails: number;
  itemsUsed: number;
  teleportsUsed: number;
  error?: string;
}

export type SimulationCallback = {
  onStep?: (step: number) => void;
  onLog?: (algoId: string, msg: string) => void;
  onResult?: (result: SimStats) => void;
  onFinish?: () => void;
  onPlayerUpdate?: (algoId: string, pos: Position) => void;
  onProbUpdate?: (states: Map<string, boolean>) => void;
};

export class SimulationRunner {
  private controllers: Map<string, WorkerController> = new Map();
  private players: Map<string, PlayerState> = new Map();
  private startTime: number = 0;
  private running: boolean = false;
  private paused: boolean = false;
  private probStates: Map<string, boolean> = new Map();
  public stepCount: number = 0;
  private cells: CellData[][] = [];
  private mapW: number = 0;
  private mapH: number = 0;
  private startPos: Position = { x: 0, y: 0 };
  private endPos: Position = { x: 0, y: 0 };
  private teleports: TeleportLink[] = [];
  private timeLimit: number = 300;
  private callback: SimulationCallback = {};
  private stepDelay: number = 50;
  private stats: Map<string, SimStats> = new Map();
  private tickRaf: number = 0;
  private finished: boolean = false;

  constructor(
    algorithms: AlgorithmDef[],
    cells: CellData[][],
    mapW: number,
    mapH: number,
    start: Position,
    end: Position,
    teleports: TeleportLink[],
    timeLimit: number,
    callback: SimulationCallback
  ) {
    this.cells = cells.map((r) => r.map((c) => ({ ...c })));
    this.mapW = mapW;
    this.mapH = mapH;
    this.startPos = start;
    this.endPos = end;
    this.teleports = teleports;
    this.timeLimit = timeLimit;
    this.callback = callback;
    this.probStates = new Map();

    const compactGrid = cells.map((row) =>
      row.map((c) => ({ type: TYPE_TO_NUM[c.type] || 0 }))
    );

    for (const algo of algorithms) {
      const player = createPlayer(start.x, start.y);
      this.players.set(algo.id, player);

      const worker = new Worker(new URL('../workers/sandbox.ts', import.meta.url), { type: 'module' });
      const ctrl: WorkerController = {
        id: algo.id,
        name: algo.name,
        worker,
        ready: false,
        lastAction: null,
        pending: false,
        error: null,
      };
      this.controllers.set(algo.id, ctrl);

      worker.onmessage = (e: MessageEvent) => {
        this.handleWorkerMessage(algo.id, e.data);
      };

      worker.onerror = (e) => {
        ctrl.error = e.message;
        ctrl.ready = false;
      };

      worker.postMessage({
        type: 'init',
        code: algo.code,
        grid: compactGrid,
        mapW,
        mapH,
        start: { x: start.x, y: start.y },
        goal: { x: end.x, y: end.y },
      });
    }
  }

  private handleWorkerMessage(algoId: string, msg: any) {
    const ctrl = this.controllers.get(algoId);
    if (!ctrl) return;

    switch (msg.type) {
      case 'ready':
        ctrl.ready = true;
        ctrl.pending = false;
        break;
      case 'action':
        ctrl.lastAction = msg.action;
        ctrl.pending = false;
        break;
      case 'error':
        ctrl.error = msg.message;
        ctrl.pending = false;
        this.callback.onLog?.(algoId, `ERR: ${msg.message}`);
        break;
      case 'log':
        this.callback.onLog?.(algoId, msg.message);
        break;
    }
  }

  private allReady(): boolean {
    for (const ctrl of this.controllers.values()) {
      if (!ctrl.ready) return false;
    }
    return true;
  }

  start() {
    this.running = true;
    this.paused = false;
    this.finished = false;
    this.startTime = performance.now();
    this.stepCount = 0;
    this.stats.clear();
    this.tick();
  }

  pause() {
    this.paused = !this.paused;
    if (!this.paused) this.tick();
  }

  stop() {
    this.running = false;
    this.paused = false;
    this.finished = true;
    cancelAnimationFrame(this.tickRaf);
  }

  private tick() {
    if (!this.running || this.paused || this.finished) return;

    const elapsed = (performance.now() - this.startTime) / 1000;

    if (elapsed >= this.timeLimit) {
      this.finish();
      return;
    }

    if (!this.allReady()) {
      this.tickRaf = requestAnimationFrame(() => this.tick());
      return;
    }

    this.stepCount++;
    this.callback.onStep?.(this.stepCount);

    let allDone = true;

    for (const [algoId, ctrl] of this.controllers) {
      if (ctrl.pending) { allDone = false; continue; }

      const player = this.players.get(algoId);
      if (!player) continue;

      if (player.x === this.endPos.x && player.y === this.endPos.y) continue;

      updatePlayerEffects(player, performance.now());
      const remaining = getPassiveEffectRemaining(player, performance.now());

      ctrl.pending = true;
      ctrl.lastAction = null;
      ctrl.worker.postMessage({
        type: 'step',
        player: {
          x: player.x,
          y: player.y,
          inventory: player.inventory,
          speed: player.speedMultiplier,
          steps: this.stepCount,
          slowRemaining: remaining.slowTrap,
          speedRemaining: remaining.speedPotion,
        },
      });

      allDone = false;
    }

    if (allDone) {
      this.finish();
      return;
    }

    const checkReady = () => {
      if (!this.running || this.finished) return;

      let allResponded = true;
      for (const [algoId, ctrl] of this.controllers) {
        if (ctrl.pending) { allResponded = false; continue; }

        const player = this.players.get(algoId);
        if (!player) continue;

        if (player.x === this.endPos.x && player.y === this.endPos.y) continue;

        if (ctrl.lastAction) {
          this.processAction(algoId, player, ctrl);
          ctrl.lastAction = null;
        }
      }

      if (allResponded) {
        this.tick();
      } else {
        setTimeout(checkReady, 0);
      }
    };
    setTimeout(checkReady, 0);
  }

  private processAction(algoId: string, player: PlayerState, ctrl: WorkerController) {
    const action = ctrl.lastAction;
    if (!action) return;

    if (action.kind === 'move' && action.dir) {
      this.doMove(algoId, player, action.dir as Direction);
    } else if (action.kind === 'useItem' && typeof action.slot === 'number') {
      useItem(
        player,
        action.slot,
        performance.now(),
        { x: player.x, y: player.y },
        () => []
      );
      this.addStats(algoId, (s) => { s.itemsUsed++; });
    }
  }

  private getStats(algoId: string): SimStats {
    if (!this.stats.has(algoId)) {
      const ctrl = this.controllers.get(algoId);
      this.stats.set(algoId, {
        algorithmId: algoId,
        algorithmName: ctrl?.name ?? algoId,
        success: false,
        totalTime: 0,
        steps: 0,
        solidWallHits: 0,
        probWallAttempts: 0,
        probWallFails: 0,
        itemsUsed: 0,
        teleportsUsed: 0,
      });
    }
    return this.stats.get(algoId)!;
  }

  private addStats(algoId: string, update: (s: SimStats) => void) {
    const s = this.getStats(algoId);
    update(s);
  }

  private doMove(algoId: string, player: PlayerState, dir: Direction) {
    const deltas: Record<Direction, [number, number]> = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    const [dx, dy] = deltas[dir];
    const nx = player.x + dx;
    const ny = player.y + dy;

    const result = tryMove(nx, ny, this.cells, this.mapW, this.mapH, this.probStates);

    this.addStats(algoId, (s) => { s.steps++; });

    if (result.solidHit) {
      this.addStats(algoId, (s) => { s.solidWallHits++; });
      return;
    }
    if (result.probAttempt && result.probFail) {
      this.addStats(algoId, (s) => { s.probWallAttempts++; s.probWallFails++; });
      return;
    }
    if (result.probAttempt && !result.probFail) {
      this.addStats(algoId, (s) => { s.probWallAttempts++; });
    }

    player.x = nx;
    player.y = ny;

    const tpTarget = getTeleportTarget(nx, ny, this.teleports);
    if (tpTarget) {
      player.x = tpTarget.x;
      player.y = tpTarget.y;
      this.addStats(algoId, (s) => { s.teleportsUsed++; });
    }

    const cell = this.cells[player.y]?.[player.x];
    if (cell?.type === 'chest') {
      const item = randomChestItem();
      const effect = applyPassiveEffect(
        player,
        item,
        performance.now(),
        { x: player.x, y: player.y },
        this.mapW,
        this.mapH,
        (x, y) => {
          if (x < 0 || x >= this.mapW || y < 0 || y >= this.mapH) return false;
          const c = this.cells[y][x];
          return c.type !== 'solid';
        }
      );
      if (effect?.teleported) {
        player.x = effect.teleported.x;
        player.y = effect.teleported.y;
      } else {
        addToInventory(player, item);
      }
      this.cells[player.y][player.x] = { type: 'empty' };
    }

    this.callback.onPlayerUpdate?.(algoId, { x: player.x, y: player.y });
    this.callback.onProbUpdate?.(new Map(this.probStates));
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    const totalTime = (performance.now() - this.startTime) / 1000;

    for (const [algoId, ctrl] of this.controllers) {
      const player = this.players.get(algoId);
      const stats = this.getStats(algoId);
      stats.totalTime = totalTime;
      stats.success = player?.x === this.endPos.x && player?.y === this.endPos.y;
      stats.error = ctrl.error || undefined;
      this.callback.onResult?.(stats);
    }
    this.callback.onFinish?.();
  }

  getPlayerPositions(): Map<string, Position> {
    const map = new Map<string, Position>();
    for (const [id, player] of this.players) {
      map.set(id, { x: player.x, y: player.y });
    }
    return map;
  }

  getProbStates(): Map<string, boolean> {
    return this.probStates;
  }

  destroy() {
    this.stop();
    for (const ctrl of this.controllers.values()) {
      ctrl.worker.terminate();
    }
    this.controllers.clear();
    this.players.clear();
  }
}
