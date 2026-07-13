import { GRID_SIZE, CELL_SIZE, WATER_LEVEL, MAX_HEIGHT, ZONE_DEPTH, ZONE_COLORS } from './config.js';

let grid = [];
const roadMap = new Map();
const zoneMap = new Map();
let tileUnlocked = false;
let unlockedSize = Math.floor(GRID_SIZE * 0.5);

function init() {
  grid = new Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => ({
    x: i % GRID_SIZE,
    y: Math.floor(i / GRID_SIZE),
    height: 0,
    isWater: false,
    zone: 0,
    hasRoad: false,
    roadType: null,
    roadDir: 0,
    buildingId: null,
    hasPower: false,
    hasWater: false,
    pollution: 0,
    noise: 0,
  }));
  tileUnlocked = false;
  unlockedSize = Math.floor(GRID_SIZE * 0.5);
}

function idx(x, y) { return y * GRID_SIZE + x; }
function inBounds(x, y) { return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE; }
function inUnlocked(x, y) {
  const c = Math.floor(GRID_SIZE / 2);
  return Math.abs(x - c) < unlockedSize && Math.abs(y - c) < unlockedSize;
}
function get(x, y) { return grid[idx(x, y)]; }
function set(x, y, data) { Object.assign(grid[idx(x, y)], data); }

function setHeightmap(heights) {
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    grid[i].height = heights[i];
    grid[i].isWater = heights[i] < WATER_LEVEL;
  }
}

function setZone(x, y, type) {
  const cell = get(x, y);
  if (!cell || cell.hasRoad || cell.buildingId) return false;
  cell.zone = type;
  if (type === 0) zoneMap.delete(`${x},${y}`);
  else zoneMap.set(`${x},${y}`, type);
  return true;
}

function getZone(x, y) {
  return zoneMap.get(`${x},${y}`) || 0;
}

function clearZone(x, y) {
  const cell = get(x, y);
  if (!cell) return;
  cell.zone = 0;
  zoneMap.delete(`${x},${y}`);
}

function setRoad(x, y, type, dir) {
  if (!inBounds(x, y)) return false;
  if (!inUnlocked(x, y)) return false;
  const cell = get(x, y);
  if (cell.isWater) return false;
  cell.hasRoad = true;
  cell.roadType = type;
  cell.roadDir = dir;
  cell.zone = 0;
  cell.buildingId = null;
  zoneMap.delete(`${x},${y}`);
  roadMap.set(`${x},${y}`, { type, dir });
  return true;
}

function removeRoad(x, y) {
  const cell = get(x, y);
  if (!cell) return;
  cell.hasRoad = false;
  cell.roadType = null;
  cell.roadDir = 0;
  roadMap.delete(`${x},${y}`);
}

function hasRoad(x, y) { return inBounds(x, y) && get(x, y).hasRoad; }

function getRoadMap() { return roadMap; }

function canPlaceBuilding(x, y, w, h) {
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(nx, ny)) return false;
      if (!inUnlocked(nx, ny)) return false;
      const cell = get(nx, ny);
      if (cell.isWater || cell.hasRoad || cell.buildingId) return false;
    }
  }
  return true;
}

function placeBuilding(id, x, y, w, h) {
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      set(x + dx, y + dy, { buildingId: id, zone: 0 });
    }
  }
}

function removeBuilding(x, y, w, h) {
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      set(x + dx, y + dy, { buildingId: null });
    }
  }
}

function isAdjacentToRoad(x, y, depth = ZONE_DEPTH) {
  for (let d = 1; d <= depth; d++) {
    for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
      if (inBounds(x + dx, y + dy) && get(x + dx, y + dy).hasRoad) return true;
    }
  }
  return false;
}

function findAdjacentRoad(x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inBounds(x + dx, y + dy) && get(x + dx, y + dy).hasRoad) {
      return { x: x + dx, y: y + dy };
    }
  }
  return null;
}

function findFreeCellNear(x, y, depth = 8) {
  for (let d = 1; d <= depth; d++) {
    for (let dx = -d; dx <= d; dx++) {
      for (let dy = -d; dy <= d; dy++) {
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny) || !inUnlocked(nx, ny)) continue;
        const cell = get(nx, ny);
        if (cell.isWater || cell.hasRoad) continue;
        if (cell.buildingId) continue;
        if (!isAdjacentToRoad(nx, ny)) continue;
        return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function getUnlockedSize() { return unlockedSize; }
function setUnlockedSize(s) { unlockedSize = Math.min(s, GRID_SIZE); }

function getAllCells() { return grid; }
function getZoneMap() { return zoneMap; }

export const Grid = {
  init, get, set, idx, inBounds, inUnlocked, getAllCells,
  setHeightmap, setZone, getZone, clearZone, getZoneMap,
  setRoad, removeRoad, hasRoad, getRoadMap,
  canPlaceBuilding, placeBuilding, removeBuilding,
  isAdjacentToRoad, findAdjacentRoad, findFreeCellNear,
  getUnlockedSize, setUnlockedSize,
};
