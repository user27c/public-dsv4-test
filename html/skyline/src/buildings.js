import { Grid } from './grid.js';
import { EventBus } from './engine.js';
import { BUILDING_DEFS, BUILDING_MAX_LEVEL, GRID_SIZE } from './config.js';

let nextId = 1;
const buildings = {};

const RCI_NAMES = {
  residential: ['小平房', '公寓楼', '联排住宅', '独栋别墅', '高层公寓'],
  commercial: ['便利店', '餐厅', '书店', '商场', '购物中心'],
  industrial: ['小作坊', '仓库', '工厂', '制造厂', '工业园'],
};

export function spawnRCIBuilding(x, y, type) {
  if (!Grid.inBounds(x, y) || !Grid.inUnlocked(x, y)) return null;
  const cell = Grid.get(x, y);
  if (cell.isWater || cell.hasRoad) return null;
  if (cell.buildingId) {
    const existing = buildings[cell.buildingId];
    if (existing && existing.category === 'rci' && existing.type === type) {
      upgradeBuilding(cell.buildingId);
      return cell.buildingId;
    }
    return null;
  }
  const nameList = RCI_NAMES[type] || ['建筑'];
  const id = `b${nextId++}`;
  const w = type === 'industrial' ? 2 : 1;
  const h = type === 'industrial' ? 2 : 1;
  if (w > 1 && !Grid.canPlaceBuilding(x, y, w, h)) {
    return null;
  }
  buildings[id] = {
    id,
    category: 'rci',
    type,
    name: nameList[0],
    x, y, w, h,
    level: 1,
    residents: type === 'residential' ? 4 : 0,
    jobs: type === 'commercial' ? 6 : type === 'industrial' ? 10 : 0,
    education: 0,
    hasPower: false,
    hasWater: false,
  };
  Grid.placeBuilding(id, x, y, w, h);
  EventBus.emit('building-placed', { id, ...buildings[id] });
  EventBus.emit('grid-changed');
  return id;
}

export function placeServiceBuilding(defKey, x, y) {
  const def = BUILDING_DEFS[defKey];
  if (!def) return null;
  const w = defKey === 'coal_plant' ? 3 : 2;
  const h = defKey === 'coal_plant' ? 3 : 2;
  if (!Grid.canPlaceBuilding(x, y, w, h)) return null;
  const id = `b${nextId++}`;
  buildings[id] = {
    id,
    category: def.category,
    type: defKey,
    name: def.name,
    x, y, w, h,
    level: 1,
    ...def,
  };
  Grid.placeBuilding(id, x, y, w, h);
  EventBus.emit('building-placed', { id, ...buildings[id] });
  EventBus.emit('grid-changed');
  return id;
}

export function removeBuildingById(id, ded = false) {
  const b = buildings[id];
  if (!b) return;
  Grid.removeBuilding(b.x, b.y, b.w, b.h);
  if (!ded) {
    const cell = Grid.get(b.x, b.y);
    if (cell) cell.zone = 0;
  }
  delete buildings[id];
  EventBus.emit('grid-changed');
}

function upgradeBuilding(id) {
  const b = buildings[id];
  if (!b || b.level >= BUILDING_MAX_LEVEL) return;
  b.level++;
  b.residents = Math.floor((b.residents || 4) * 1.3);
  b.jobs = Math.floor((b.jobs || 6) * 1.2);
  const nameList = RCI_NAMES[b.type];
  if (nameList && b.level <= nameList.length) b.name = nameList[b.level - 1];
  EventBus.emit('grid-changed');
}

export function getBuilding(id) { return buildings[id]; }
export function getAllBuildings() { return Object.values(buildings); }
export function getRCIBuildings() { return Object.values(buildings).filter(b => b.category === 'rci'); }
export function getServiceBuildings() { return Object.values(buildings).filter(b => b.category === 'service'); }
export function getPowerPlants() { return Object.values(buildings).filter(b => b.category === 'power'); }
export function getWaterFacilities() { return Object.values(buildings).filter(b => b.category === 'water'); }

export function getTotalResidents() {
  let total = 0;
  for (const b of Object.values(buildings)) {
    if (b.residents) total += b.residents;
  }
  return total;
}

export function getTotalJobs() {
  let total = 0;
  for (const b of Object.values(buildings)) {
    if (b.jobs) total += b.jobs;
  }
  return total;
}

export function getUnemployed() {
  const residents = getTotalResidents();
  const jobs = getTotalJobs();
  return Math.max(0, residents - jobs);
}
