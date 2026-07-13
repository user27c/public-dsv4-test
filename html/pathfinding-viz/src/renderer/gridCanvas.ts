import { CellData, Position, TeleportLink } from '../types';

const CELL_COLORS: Record<string, string> = {
  empty: '#1a1a2e',
  solid: '#555',
  probabilistic: 'rgba(180, 130, 255, 0.35)',
  teleport_in: '#00bcd4',
  teleport_out: '#0097a7',
  start: '#4caf50',
  end: '#f44336',
  chest: '#ffc107',
};

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  cells: CellData[][],
  mapW: number,
  mapH: number,
  start: Position | null,
  end: Position | null,
  teleports: TeleportLink[],
  zoom: number,
  panX: number,
  panY: number,
  cvW: number,
  cvH: number,
  cellSize: number
) {
  ctx.save();
  ctx.translate(cvW / 2 + panX, cvH / 2 + panY);
  ctx.scale(zoom, zoom);

  const scaledCell = cellSize * zoom;
  const viewW = cvW / zoom;
  const viewH = cvH / zoom;
  const startCol = Math.max(0, Math.floor((-cvW / 2 - panX) / zoom / cellSize));
  const startRow = Math.max(0, Math.floor((-cvH / 2 - panY) / zoom / cellSize));
  const endCol = Math.min(mapW - 1, Math.ceil(startCol + viewW / cellSize) + 1);
  const endRow = Math.min(mapH - 1, Math.ceil(startRow + viewH / cellSize) + 1);

  if (scaledCell < 1) {
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const cell = cells[y]?.[x];
        if (!cell || cell.type === 'empty') continue;
        ctx.fillStyle = CELL_COLORS[cell.type] || '#666';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  } else {
    ctx.fillStyle = CELL_COLORS.empty;
    ctx.fillRect(
      startCol * cellSize,
      startRow * cellSize,
      (endCol - startCol + 1) * cellSize,
      (endRow - startRow + 1) * cellSize
    );

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const cell = cells[y]?.[x];
        if (!cell || cell.type === 'empty') continue;
        ctx.fillStyle = CELL_COLORS[cell.type] || '#666';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5 / zoom;
    for (let y = startRow; y <= endRow; y++) {
      ctx.beginPath();
      ctx.moveTo(startCol * cellSize, y * cellSize);
      ctx.lineTo((endCol + 1) * cellSize, y * cellSize);
      ctx.stroke();
    }
    for (let x = startCol; x <= endCol; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, startRow * cellSize);
      ctx.lineTo(x * cellSize, (endRow + 1) * cellSize);
      ctx.stroke();
    }
  }

  for (const tp of teleports) {
    const fontSize = Math.max(6, cellSize * 0.5);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = tp.in.x * cellSize + cellSize / 2;
    const cy = tp.in.y * cellSize + cellSize / 2;
    ctx.fillStyle = '#fff';
    ctx.fillText('↓', cx, cy);

    const cx2 = tp.out.x * cellSize + cellSize / 2;
    const cy2 = tp.out.y * cellSize + cellSize / 2;
    ctx.fillStyle = '#fff';
    ctx.fillText('↑', cx2, cy2);

    const id = tp.id.slice(-4);
    ctx.font = `${Math.max(4, fontSize * 0.6)}px monospace`;
    ctx.fillStyle = '#fff';
    ctx.fillText(id, cx, cy - cellSize * 0.55);
    ctx.fillText(id, cx2, cy2 - cellSize * 0.55);
  }

  if (start) {
    const fontSize = Math.max(6, cellSize * 0.6);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(
      'S',
      start.x * cellSize + cellSize / 2,
      start.y * cellSize + cellSize / 2
    );
  }
  if (end) {
    const fontSize = Math.max(6, cellSize * 0.6);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(
      'E',
      end.x * cellSize + cellSize / 2,
      end.y * cellSize + cellSize / 2
    );
  }

  ctx.restore();
}

export function renderProbWallOverlay(
  ctx: CanvasRenderingContext2D,
  probStates: Map<string, boolean>,
  cells: CellData[][],
  mapW: number,
  mapH: number,
  zoom: number,
  panX: number,
  panY: number,
  cvW: number,
  cvH: number,
  cellSize: number
) {
  ctx.save();
  ctx.translate(cvW / 2 + panX, cvH / 2 + panY);
  ctx.scale(zoom, zoom);

  const startCol = Math.max(0, Math.floor((-cvW / 2 - panX) / zoom / cellSize));
  const startRow = Math.max(0, Math.floor((-cvH / 2 - panY) / zoom / cellSize));
  const endCol = Math.min(mapW - 1, Math.ceil(startCol + cvW / zoom / cellSize) + 2);
  const endRow = Math.min(mapH - 1, Math.ceil(startRow + cvH / zoom / cellSize) + 2);

  const borderW = Math.max(1, 2 / zoom);

  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const cell = cells[y]?.[x];
      if (cell?.type !== 'probabilistic') continue;
      const key = `${x},${y}`;
      const passable = probStates.get(key) ?? false;

      ctx.lineWidth = borderW;
      ctx.strokeStyle = passable ? '#4caf50' : '#f44336';
      ctx.strokeRect(
        x * cellSize + borderW,
        y * cellSize + borderW,
        cellSize - borderW * 2,
        cellSize - borderW * 2
      );

      ctx.fillStyle = passable ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  ctx.restore();
}
