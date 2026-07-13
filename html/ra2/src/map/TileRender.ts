import { TILE_W, TILE_H, TILE_HALF_W, TILE_HALF_H, TERRAIN_COLORS } from '../constants.ts';
import { TileData, TileTerrain } from '../types.ts';
import { Camera } from '../engine/Camera.ts';
import { IsoPoint } from '../types.ts';
import { isoToScreen } from '../utils.ts';

export function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: TileData,
  isoX: number,
  isoY: number,
  cam: Camera,
): void {
  const screen = cam.worldToScreen({ x: isoX, y: isoY });
  const sx = screen.x;
  const sy = screen.y;
  const hw = TILE_HALF_W * cam.zoom;
  const hh = TILE_HALF_H * cam.zoom;

  if (sx < -TILE_W * cam.zoom || sx > cam.width + TILE_W * cam.zoom ||
      sy < -TILE_H * cam.zoom || sy > cam.height + TILE_H * cam.zoom) {
    return;
  }

  drawDiamond(ctx, sx, sy, hw, hh, tile);
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  hw: number, hh: number,
  tile: TileData,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();

  const color = getTileColor(tile);
  ctx.fillStyle = color;
  ctx.fill();

  if (tile.oreAmount > 0 && (tile.terrain === TileTerrain.Ore || tile.terrain === TileTerrain.Gems)) {
    const shine = tile.oreAmount / 15;
    ctx.fillStyle = `rgba(255, 255, 200, ${shine * 0.4})`;
    ctx.fill();
  }

  if (tile.terrain === TileTerrain.Cliff) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function getTileColor(tile: TileData): string {
  const base = TERRAIN_COLORS[tile.terrain] || '#4a7a2e';
  if (tile.terrain === TileTerrain.Clear || tile.terrain === TileTerrain.Rough) {
    const v = (tile.variant / 3) * 0.15;
    return adjustBrightness(base, v);
  }
  return base;
}

function adjustBrightness(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.max(0, Math.floor(r + r * amount)));
  const ng = Math.min(255, Math.max(0, Math.floor(g + g * amount)));
  const nb = Math.min(255, Math.max(0, Math.floor(b + b * amount)));
  return `rgb(${nr},${ng},${nb})`;
}

export function renderShroud(
  ctx: CanvasRenderingContext2D,
  tiles: TileData[][],
  cam: Camera,
  range: { start: IsoPoint; end: IsoPoint },
): void {
  const hw = TILE_HALF_W * cam.zoom;
  const hh = TILE_HALF_H * cam.zoom;
  const extraTiles = 2;

  const sX = Math.max(0, range.start.x - extraTiles);
  const sY = Math.max(0, range.start.y - extraTiles);
  const eX = Math.min(tiles[0].length, range.end.x + extraTiles);
  const eY = Math.min(tiles.length, range.end.y + extraTiles);

  for (let y = sY; y < eY; y++) {
    for (let x = sX; x < eX; x++) {
      const tile = tiles[y]?.[x];
      if (!tile) continue;
      if (tile.shroudState >= 1) continue;

      const screen = cam.worldToScreen({ x, y });
      const cx = screen.x;
      const cy = screen.y;

      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx - hw, cy);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
    }
  }
}

export function renderExploredOverlay(
  ctx: CanvasRenderingContext2D,
  tiles: TileData[][],
  cam: Camera,
  range: { start: IsoPoint; end: IsoPoint },
): void {
  const hw = TILE_HALF_W * cam.zoom;
  const hh = TILE_HALF_H * cam.zoom;

  const sX = Math.max(0, range.start.x - 1);
  const sY = Math.max(0, range.start.y - 1);
  const eX = Math.min(tiles[0].length, range.end.x + 1);
  const eY = Math.min(tiles.length, range.end.y + 1);

  for (let y = sY; y < eY; y++) {
    for (let x = sX; x < eX; x++) {
      const tile = tiles[y]?.[x];
      if (!tile) continue;
      if (tile.shroudState !== 1) continue;

      const screen = cam.worldToScreen({ x, y });
      const cx = screen.x;
      const cy = screen.y;

      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx - hw, cy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
    }
  }
}
