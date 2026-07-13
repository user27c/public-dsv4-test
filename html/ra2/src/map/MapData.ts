import { MAP_W, MAP_H } from '../constants.ts';
import { TileTerrain, TileData } from '../types.ts';
import { randomInt } from '../utils.ts';

export function createMapData(): TileData[][] {
  const tiles: TileData[][] = [];
  const rng = mulberry32(42);

  for (let y = 0; y < MAP_H; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      tiles[y][x] = generateTile(x, y, rng);
    }
  }

  addRoads(tiles, rng);
  addOreFields(tiles, rng);
  addWaterBodies(tiles, rng);
  addCliffs(tiles, rng);

  return tiles;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateTile(x: number, y: number, rng: () => number): TileData {
  const r = rng();
  let terrain: TileTerrain;
  if (r < 0.65) terrain = TileTerrain.Clear;
  else if (r < 0.75) terrain = TileTerrain.Rough;
  else if (r < 0.82) terrain = TileTerrain.Clear;
  else if (r < 0.90) terrain = TileTerrain.Rough;
  else terrain = TileTerrain.Clear;

  return {
    terrain,
    variant: randomInt(0, 3),
    oreAmount: 0,
    occupied: false,
    shroudState: 2,
  };
}

function addWaterBodies(tiles: TileData[][], rng: () => number): void {
  const numBodies = randomInt(2, 5);
  for (let i = 0; i < numBodies; i++) {
    const cx = randomInt(10, MAP_W - 10);
    const cy = randomInt(10, MAP_H - 10);
    const radius = randomInt(5, 20);
    for (let y = cy - radius; y < cy + radius; y++) {
      for (let x = cx - radius; x < cx + radius; x++) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        const dx = x - cx;
        const dy = y - cy;
        const rr = radius * (0.7 + rng() * 0.6);
        if (dx * dx + dy * dy < rr * rr) {
          tiles[y][x].terrain = TileTerrain.Water;
        }
      }
    }
  }

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (tiles[y][x].terrain === TileTerrain.Water) {
        addBeachEdges(tiles, x, y);
      }
    }
  }
}

function addBeachEdges(tiles: TileData[][], x: number, y: number): void {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H) {
      if (tiles[ny][nx].terrain !== TileTerrain.Water && tiles[ny][nx].terrain !== TileTerrain.Beach) {
        tiles[ny][nx].terrain = TileTerrain.Beach;
      }
    }
  }
}

function addRoads(tiles: TileData[][], rng: () => number): void {
  for (let i = 0; i < 4; i++) {
    let px = randomInt(5, MAP_W - 5);
    let py = randomInt(5, MAP_H - 5);
    const len = randomInt(30, 80);
    const dx = rng() > 0.5 ? 1 : 0;
    const dy = dx === 0 ? 1 : 0;
    for (let s = 0; s < len; s++) {
      if (px >= 0 && py >= 0 && px < MAP_W && py < MAP_H) {
        if (tiles[py][px].terrain !== TileTerrain.Water) {
          tiles[py][px].terrain = TileTerrain.Road;
          for (let w = -1; w <= 1; w++) {
            const wx = px + (dy === 1 ? w : 0);
            const wy = py + (dx === 1 ? w : 0);
            if (wx >= 0 && wy >= 0 && wx < MAP_W && wy < MAP_H) {
              if (tiles[wy][wx].terrain !== TileTerrain.Water) {
                tiles[wy][wx].terrain = TileTerrain.Road;
              }
            }
          }
        }
      }
      px += dx;
      py += dy;
      if (rng() < 0.15) {
        if (dx === 1) { px += rng() > 0.5 ? 1 : -1; }
        else { py += rng() > 0.5 ? 1 : -1; }
      }
    }
  }
}

function addOreFields(tiles: TileData[][], rng: () => number): void {
  for (let i = 0; i < 15; i++) {
    const cx = randomInt(5, MAP_W - 5);
    const cy = randomInt(5, MAP_H - 5);
    const radius = randomInt(3, 8);
    const isGem = rng() < 0.15;
    for (let y = cy - radius; y < cy + radius; y++) {
      for (let x = cx - radius; x < cx + radius; x++) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        if (tiles[y][x].terrain === TileTerrain.Water) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy < radius * radius * rng()) {
          if (tiles[y][x].terrain !== TileTerrain.Clear && tiles[y][x].terrain !== TileTerrain.Rough) continue;
          tiles[y][x].terrain = isGem ? TileTerrain.Gems : TileTerrain.Ore;
          tiles[y][x].oreAmount = isGem ? randomInt(5, 15) : randomInt(3, 8);
        }
      }
    }
  }
}

function addCliffs(tiles: TileData[][], rng: () => number): void {
  for (let i = 0; i < 8; i++) {
    const sx = randomInt(5, MAP_W - 20);
    const sy = randomInt(5, MAP_H - 20);
    const length = randomInt(10, 35);
    const dir = rng() > 0.5 ? 0 : 1;
    let lx = sx, ly = sy;
    for (let s = 0; s < length; s++) {
      lx += dir === 1 ? (rng() > 0.3 ? 1 : 0) : 0;
      ly += dir === 0 ? (rng() > 0.3 ? 1 : 0) : 0;
      if (lx >= MAP_W - 1 || ly >= MAP_H - 1) break;
      for (let w = -2; w <= 2; w++) {
        const wx = lx + (dir === 0 ? w : 0);
        const wy = ly + (dir === 1 ? -w : 0);
        if (wx >= 0 && wy >= 0 && wx < MAP_W && wy < MAP_H) {
          if (tiles[wy][wx].terrain !== TileTerrain.Water && tiles[wy][wx].terrain !== TileTerrain.Road) {
            tiles[wy][wx].terrain = Math.abs(w) <= 1 ? TileTerrain.Cliff : TileTerrain.Rock;
          }
        }
      }
    }
  }
}

export function isPassable(tile: TileData): boolean {
  return tile.terrain !== TileTerrain.Water &&
         tile.terrain !== TileTerrain.Rock &&
         tile.terrain !== TileTerrain.Cliff;
}

export function isBuildable(tile: TileData): boolean {
  return tile.terrain === TileTerrain.Clear ||
         tile.terrain === TileTerrain.Rough ||
         tile.terrain === TileTerrain.Pavement ||
         tile.terrain === TileTerrain.Road;
}

export function tileSpeedMultiplier(terrain: TileTerrain): number {
  switch (terrain) {
    case TileTerrain.Road:
    case TileTerrain.Pavement:
    case TileTerrain.Bridge:
      return 1.3;
    case TileTerrain.Rough:
      return 0.7;
    case TileTerrain.Beach:
      return 0.5;
    default:
      return 1.0;
  }
}
