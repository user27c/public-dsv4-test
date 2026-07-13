import { MAP_W, MAP_H } from '../constants.ts';
import { TileData, TileTerrain } from '../types.ts';
import { isPassable } from '../map/MapData.ts';

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export function findPath(
  tiles: TileData[][],
  startX: number, startY: number,
  endX: number, endY: number,
  isNaval: boolean,
  isAir: boolean,
): { x: number; y: number }[] | null {
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  const ex = Math.floor(endX);
  const ey = Math.floor(endY);

  if (sx === ex && sy === ey) return [{ x: endX, y: endY }];

  if (ex < 0 || ey < 0 || ex >= MAP_W || ey >= MAP_H) return null;

  const targetTile = tiles[ey]?.[ex];
  if (!targetTile) return null;

  if (!isAir && !isNaval && !isPassable(targetTile)) return null;

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const h = (x: number, y: number) => Math.abs(x - ex) + Math.abs(y - ey);

  openSet.push({ x: sx, y: sy, g: 0, h: h(sx, sy), f: h(sx, sy), parent: null });

  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  const diagCost = 1.414;
  const maxIter = 2000;
  let iter = 0;

  while (openSet.length > 0 && iter++ < maxIter) {
    let bestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
    }

    const current = openSet.splice(bestIdx, 1)[0];
    const ck = key(current.x, current.y);

    if (current.x === ex && current.y === ey) {
      return reconstructPath(current);
    }

    if (closedSet.has(ck)) continue;
    closedSet.add(ck);

    for (let i = 0; i < 8; i++) {
      const nx = current.x + dirs[i][0];
      const ny = current.y + dirs[i][1];

      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;

      const nk = key(nx, ny);
      if (closedSet.has(nk)) continue;

      const tile = tiles[ny]?.[nx];
      if (!tile) continue;

      if (isAir) {
        // can go anywhere
      } else if (isNaval) {
        if (tile.terrain !== TileTerrain.Water) continue;
      } else {
        if (!isPassable(tile)) continue;
      }

      const moveCost = i >= 4 ? diagCost : 1;
      const ng = current.g + moveCost;

      const existingIdx = openSet.findIndex(n => n.x === nx && n.y === ny);
      if (existingIdx >= 0 && openSet[existingIdx].g <= ng) continue;

      const node: PathNode = {
        x: nx, y: ny,
        g: ng,
        h: h(nx, ny),
        f: ng + h(nx, ny),
        parent: current,
      };

      if (existingIdx >= 0) {
        openSet[existingIdx] = node;
      } else {
        openSet.push(node);
      }
    }
  }

  return null;
}

function reconstructPath(node: PathNode): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  let current: PathNode | null = node;
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  return simplifyPath(path);
}

function simplifyPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
  if (path.length <= 2) return path;

  const result: { x: number; y: number }[] = [path[0]];
  let prevDx = path[1].x - path[0].x;
  let prevDy = path[1].y - path[0].y;

  for (let i = 2; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    if (dx !== prevDx || dy !== prevDy) {
      result.push(path[i - 1]);
      prevDx = dx;
      prevDy = dy;
    }
  }

  result.push(path[path.length - 1]);
  return result;
}
