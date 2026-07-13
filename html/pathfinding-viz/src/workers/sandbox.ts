let algorithmFn: ((api: any) => void) | null = null;
let storedAction: { kind: string; dir?: string; slot?: number } | null = null;
let logMessages: string[] = [];
let stepCtx: any = null;
let gridData: { type: number }[][] = [];
let gridW = 0;
let gridH = 0;
let gridGoal: { x: number; y: number } = { x: 0, y: 0 };

const TYPE_MAP: Record<number, string> = {
  0: 'empty',
  1: 'solid',
  2: 'probabilistic',
  3: 'teleport_in',
  4: 'teleport_out',
  5: 'start',
  6: 'end',
  7: 'chest',
};

function createAPI(ctx: any) {
  return {
    getCell(x: number, y: number) {
      if (x < 0 || x >= gridW || y < 0 || y >= gridH) return { type: 'solid', x, y };
      const cell = gridData[y][x];
      return { type: TYPE_MAP[cell.type] || 'empty', x, y };
    },
    getSurroundings(range: number) {
      const result: { type: string; x: number; y: number }[][] = [];
      for (let dy = -range; dy <= range; dy++) {
        const row: { type: string; x: number; y: number }[] = [];
        for (let dx = -range; dx <= range; dx++) {
          const nx = ctx.player.x + dx;
          const ny = ctx.player.y + dy;
          if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
            const cell = gridData[ny][nx];
            row.push({ type: TYPE_MAP[cell.type] || 'empty', x: nx, y: ny });
          } else {
            row.push({ type: 'solid', x: nx, y: ny });
          }
        }
        result.push(row);
      }
      return result;
    },
    getPlayer() {
      return { ...ctx.player };
    },
    getGoal() {
      return { ...gridGoal };
    },
    getMapSize() {
      return { width: gridW, height: gridH };
    },
    move(dir: string) {
      storedAction = { kind: 'move', dir };
    },
    useItem(slot: number) {
      storedAction = { kind: 'useItem', slot };
    },
    log(msg: string) {
      logMessages.push(msg);
    },
  };
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === 'init') {
    gridData = msg.grid;
    gridW = msg.mapW;
    gridH = msg.mapH;
    gridGoal = msg.goal;

    try {
      const code = msg.code;
      const wrapped = `
        let __userFn = null;
        ${code}
        __userFn = (typeof main !== 'undefined') ? main : null;
        return __userFn;
      `;
      const fn = new Function(wrapped);
      algorithmFn = fn();
      if (typeof algorithmFn !== 'function') {
        self.postMessage({ type: 'error', message: 'Algorithm must define a main(api) function' });
        return;
      }
      self.postMessage({ type: 'ready' });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: `Init error: ${err.message}` });
    }
  } else if (msg.type === 'step') {
    if (!algorithmFn) {
      self.postMessage({ type: 'error', message: 'Algorithm not initialized' });
      return;
    }

    storedAction = null;
    logMessages = [];
    stepCtx = { player: msg.player };

    const startTime = performance.now();
    let errored = false;

    try {
      const api = createAPI(stepCtx);
      algorithmFn(api);
    } catch (err: any) {
      errored = true;
      self.postMessage({ type: 'error', message: `Runtime error: ${err.message}` });
    }

    if (errored) return;

    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      self.postMessage({ type: 'log', message: `Step took ${elapsed.toFixed(0)}ms (>50ms limit)` });
    }

    if (storedAction) {
      self.postMessage({ type: 'action', action: storedAction });
    } else {
      self.postMessage({ type: 'action', action: { kind: 'move', dir: 'right' } });
    }

    for (const log of logMessages) {
      self.postMessage({ type: 'log', message: log });
    }
  }
};
