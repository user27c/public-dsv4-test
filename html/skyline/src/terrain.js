import { GRID_SIZE, CELL_SIZE, WATER_LEVEL, MAX_HEIGHT, MAP_HALF } from './config.js';
import { Grid } from './grid.js';

function noise2D(x, y, seed = 1) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y) {
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const v00 = noise2D(ix, iy);
  const v10 = noise2D(ix + 1, iy);
  const v01 = noise2D(ix, iy + 1);
  const v11 = noise2D(ix + 1, iy + 1);
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = v00 + (v10 - v00) * sx;
  const b = v01 + (v11 - v01) * sx;
  return a + (b - a) * sy;
}

function fbm(x, y, octaves = 4) {
  let value = 0, amplitude = 1, frequency = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / max;
}

export function generateHeightmap() {
  const heights = new Float32Array(GRID_SIZE * GRID_SIZE);
  const center = GRID_SIZE / 2;
  const half = Math.floor(GRID_SIZE * 0.45);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const i = y * GRID_SIZE + x;
      const dx = (x - center) / half;
      const dy = (y - center) / half;
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      const terrain = fbm(x * 0.08, y * 0.08, 4);
      const ridge = Math.abs(Math.sin(x * 0.015 - y * 0.015));
      const riverVal = Math.sin(x * 0.02 + y * 0.015) * Math.cos(y * 0.018);

      const plateau = Math.max(0, 1 - centerDist * 0.7);
      let h = terrain * 0.25 + ridge * 0.2 + plateau * 0.3 + 0.18;

      const riverDist1 = Math.abs(dx - 0.3) + Math.abs(dy + 0.2) * 0.5;
      const riverDist2 = Math.abs(dx + 0.4) + Math.abs(dy - 0.3) * 0.5;
      const riverFactor = Math.min(1, Math.min(riverDist1, riverDist2));
      h = h * (0.6 + riverFactor * 0.4);

      if (centerDist > 1.0) h *= 0.7;
      if (centerDist > 1.2) h *= 0.5;

      h = Math.max(0, Math.min(MAX_HEIGHT, h));

      h = Math.max(0, Math.min(MAX_HEIGHT, h));
      heights[i] = h;
    }
  }
  return heights;
}

export function gridToWorld(x, y) {
  return {
    wx: (x - GRID_SIZE / 2) * CELL_SIZE,
    wz: (y - GRID_SIZE / 2) * CELL_SIZE,
  };
}

export function worldToGrid(wx, wz) {
  const gx = Math.floor(wx / CELL_SIZE + GRID_SIZE / 2);
  const gy = Math.floor(wz / CELL_SIZE + GRID_SIZE / 2);
  return {
    x: gx >= 0 && gx < GRID_SIZE ? gx : -1,
    y: gy >= 0 && gy < GRID_SIZE ? gy : -1,
  };
}

export function getCellHeight(x, y) {
  const cell = Grid.get(x, y);
  return cell ? cell.height * MAX_HEIGHT * 5 : 0;
}
