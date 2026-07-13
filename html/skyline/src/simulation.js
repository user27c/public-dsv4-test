import { Grid } from './grid.js';
import { EventBus } from './engine.js';
import { MILESTONES, SIM_TICK_MS, TAX_PERIOD_DAYS, BUILDING_DEFS, BUILDING_MAX_LEVEL, WATER_LEVEL, GRID_SIZE } from './config.js';
import * as Buildings from './buildings.js';

let money = 70000;
let day = 1;
let population = 0;
let taxRate = { residential: 9, commercial: 9, industrial: 9 };
let budgetSliders = {
  power: 100, water: 100, healthcare: 100,
  police: 100, fire: 100, education: 100, roads: 100,
};
let currentMilestone = 0;
let demand = { r: 50, c: 50, i: 50 };
let income = 0;
let expenses = 0;
let tickTimer = 0;
let taxTimer = 0;
let lastTaxDay = 0;

export function initSimulation(startMoney = 70000) {
  money = startMoney;
  day = 1;
  population = 0;
  currentMilestone = 0;
  demand = { r: 50, c: 50, i: 50 };
  income = 0;
  expenses = 0;
  tickTimer = 0;
  taxTimer = 0;
  lastTaxDay = 0;
}

export function tick(deltaMs) {
  tickTimer += deltaMs;
  if (tickTimer < SIM_TICK_MS) return;
  tickTimer -= SIM_TICK_MS;

  day++;
  EventBus.emit('day-changed', { day });

  const prevPop = population;

  updatePower();
  updateWater();

  updateDemand();
  growBuildings();

  updatePopulation();
  updatePollution();
  updateServices();

  taxTimer += 1;
  if (taxTimer >= TAX_PERIOD_DAYS) {
    taxTimer = 0;
    calculateEconomy();
  }

  checkMilestones();

  EventBus.emit('stats-updated', {
    day, money: Math.floor(money), population,
    demand: { ...demand },
    income: Math.floor(income), expenses: Math.floor(expenses),
    milestone: MILESTONES[currentMilestone]?.name || '',
  });

  if (population !== prevPop) {
    EventBus.emit('population-changed', { population });
  }
}

function updatePower() {
  const cells = Grid.getAllCells();
  for (const cell of cells) cell.hasPower = false;

  const plants = Buildings.getPowerPlants();
  const roadMap = Grid.getRoadMap();

  const visited = new Set();
  const queue = [];

  for (const plant of plants) {
    const key = `${plant.x},${plant.y}`;
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ x: plant.x, y: plant.y });
    }
  }

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!Grid.inBounds(nx, ny)) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      const cell = Grid.get(nx, ny);
      if (cell.hasRoad || cell.buildingId || roadMap.has(`${nx},${ny}`)) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
        cell.hasPower = true;
      }
    }
  }

  for (const plant of plants) {
    for (let dx = 0; dx < (plant.w || 1); dx++) {
      for (let dy = 0; dy < (plant.h || 1); dy++) {
        const cell = Grid.get(plant.x + dx, plant.y + dy);
        if (cell) cell.hasPower = true;
      }
    }
  }

  const dirs2 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = Grid.get(x, y);
      if (cell.hasPower || cell.hasRoad || cell.isWater) continue;
      for (const [dx, dy] of dirs2) {
        const neighbor = Grid.get(x + dx, y + dy);
        if (neighbor && neighbor.hasRoad && neighbor.hasPower) {
          cell.hasPower = true;
          break;
        }
      }
    }
  }
}

function updateWater() {
  const cells = Grid.getAllCells();
  for (const cell of cells) cell.hasWater = false;

  const facilities = Buildings.getWaterFacilities();
  const roadMap = Grid.getRoadMap();

  const visited = new Set();
  const queue = [];

  for (const f of facilities) {
    const key = `${f.x},${f.y}`;
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ x: f.x, y: f.y });
    }
  }

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!Grid.inBounds(nx, ny)) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      const cell = Grid.get(nx, ny);
      if (cell.hasRoad || cell.buildingId) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
        cell.hasWater = true;
      }
    }
  }
}

function updateDemand() {
  const residents = Buildings.getTotalResidents();
  const jobs = Buildings.getTotalJobs();
  const rciBlds = Buildings.getRCIBuildings();

  const resBlds = rciBlds.filter(b => b.type === 'residential');
  const comBlds = rciBlds.filter(b => b.type === 'commercial');
  const indBlds = rciBlds.filter(b => b.type === 'industrial');

  const resCap = resBlds.reduce((s, b) => s + (b.residents || 0), 0) || 1;
  const comCap = comBlds.reduce((s, b) => s + (b.jobs || 0), 0) || 1;
  const indCap = indBlds.reduce((s, b) => s + (b.jobs || 0), 0) || 1;

  demand.r = Math.max(0, Math.min(100,
    30 + (residents < jobs ? 30 : 0) + (residents < comCap * 0.8 ? 20 : 0)
  ));
  demand.c = Math.max(0, Math.min(100,
    25 + (residents > 0 ? 20 : 0) + (comCap < residents * 0.5 ? 15 : 0)
  ));
  demand.i = Math.max(0, Math.min(100,
    20 + (comCap > 0 ? 25 : 0) + (indCap < comCap * 0.4 ? 20 : 0) + (residents > 50 ? 15 : 0)
  ));
}

function growBuildings() {
  const zoneMap = Grid.getZoneMap();
  const rciBlds = Buildings.getRCIBuildings();
  const hasPowerPlants = Buildings.getPowerPlants().length > 0;
  const hasWaterF = Buildings.getWaterFacilities().length > 0;

  const unemployed = Buildings.getUnemployed();
  const jobs = Buildings.getTotalJobs();

  for (const rci of rciBlds) {
    const cell = Grid.get(rci.x, rci.y);
    const canPower = cell && cell.hasPower;
    const canWater = cell && cell.hasWater;
    rci.hasPower = canPower;
    rci.hasWater = canWater;

    let happy = 1;
    if (canPower) happy += 1;
    if (canWater) happy += 0.5;
    if (rci.type === 'residential' && jobs > 0) happy += 1;

    if (happy >= 2 && rci.level < BUILDING_MAX_LEVEL) {
      const areaPower = cell.hasPower;
      const areaWater = cell.hasWater;
      if (areaPower && areaWater) {
        Buildings.removeBuildingById(rci.id, true);
        const newId = Buildings.spawnRCIBuilding(rci.x, rci.y, rci.type);
        if (newId) {
          const nb = Buildings.getBuilding(newId);
          if (nb) nb.level = Math.min(BUILDING_MAX_LEVEL, rci.level + 1);
        }
      }
    }
  }

  const candidates = [];
  for (const [key, type] of zoneMap) {
    const [gx, gy] = key.split(',').map(Number);
    const cell = Grid.get(gx, gy);
    if (!cell || cell.hasRoad || cell.buildingId) continue;
    if (!Grid.isAdjacentToRoad(gx, gy)) continue;
    if (!cell.hasPower && hasPowerPlants) continue;
    if (!cell.hasWater && hasWaterF) continue;
    if (type === 'residential' && demand.r < 20) continue;
    if (type === 'commercial' && demand.c < 20) continue;
    if (type === 'industrial' && demand.i < 20) continue;
    candidates.push({ x: gx, y: gy, type, zone: type });
  }

  if (candidates.length) {
    const picks = Math.min(3, candidates.length);
    for (let i = 0; i < picks; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      const { x, y, type } = candidates[idx];
      Buildings.spawnRCIBuilding(x, y, type);
      candidates.splice(idx, 1);
      if (!candidates.length) break;
    }
  }
}

function updatePopulation() {
  const residents = Buildings.getTotalResidents();
  const jobs = Buildings.getTotalJobs();
  const hasPower = Buildings.getPowerPlants().length > 0;
  const hasWater = Buildings.getWaterFacilities().length > 0;

  let growth = 0;
  if (hasPower && hasWater && demand.r > 15) {
    growth = Math.floor(residents * 0.02) + (demand.r > 50 ? 2 : 0);
  }

  if (residents > jobs * 2) {
    growth = Math.max(0, growth - Math.floor(residents * 0.01));
  }

  population = Math.max(0, residents + growth);
}

function updatePollution() {
  const cells = Grid.getAllCells();

  for (const cell of cells) {
    cell.pollution = Math.max(0, cell.pollution - 0.02);
    cell.noise = Math.max(0, cell.noise - 0.03);
  }

  const indBuildings = Buildings.getRCIBuildings().filter(b => b.type === 'industrial');
  for (const b of indBuildings) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const nx = b.x + dx, ny = b.y + dy;
        if (!Grid.inBounds(nx, ny)) continue;
        const cell = Grid.get(nx, ny);
        const dist = Math.abs(dx) + Math.abs(dy);
        cell.pollution = Math.min(1, cell.pollution + 0.15 / (dist + 1));
      }
    }
  }

  const coalPlants = Buildings.getPowerPlants().filter(p => p.type === 'coal_plant');
  for (const p of coalPlants) {
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 5; dy++) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!Grid.inBounds(nx, ny)) continue;
        const cell = Grid.get(nx, ny);
        const dist = Math.abs(dx) + Math.abs(dy);
        cell.pollution = Math.min(1, cell.pollution + 0.25 / (dist + 1));
      }
    }
  }

  const cells2 = Grid.getAllCells();
  for (const cell of cells2) {
    if (cell.hasRoad) cell.noise = Math.min(1, cell.noise + 0.1);
  }

  for (const cell of cells2) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = cell.x + dx, ny = cell.y + dy;
      if (!Grid.inBounds(nx, ny)) continue;
      const neighbor = Grid.get(nx, ny);
      if (neighbor.noise > cell.noise) {
        cell.noise = Math.min(1, cell.noise + (neighbor.noise - cell.noise) * 0.2);
      }
    }
  }
}

function updateServices() {
  const services = Buildings.getServiceBuildings();
  const rciBlds = Buildings.getRCIBuildings();

  for (const b of rciBlds) {
    b.fireCoverage = 0;
    b.policeCoverage = 0;
    b.healthCoverage = 0;
    b.eduCoverage = 0;
  }

  for (const s of services) {
    for (const b of rciBlds) {
      const dist = Math.abs(b.x - s.x) + Math.abs(b.y - s.y);
      const cov = s.coverage || 10;
      if (dist <= cov) {
        const factor = 1 - dist / cov;
        if (s.type === 'fire_station') b.fireCoverage = Math.max(b.fireCoverage || 0, factor);
        if (s.type === 'police_station') b.policeCoverage = Math.max(b.policeCoverage || 0, factor);
        if (s.type === 'hospital') b.healthCoverage = Math.max(b.healthCoverage || 0, factor);
        if (s.type === 'elementary_school') b.eduCoverage = Math.max(b.eduCoverage || 0, factor);
      }
    }
  }
}

function calculateEconomy() {
  const rciBlds = Buildings.getRCIBuildings();
  income = 0;
  expenses = 0;

  for (const b of rciBlds) {
    const baseVal = b.level * 50;
    const rate = taxRate[b.type] / 100;
    income += baseVal * rate;
  }

  for (const b of Buildings.getAllBuildings()) {
    const upkeep = (b.upkeep || 0) * (budgetSliders.roads / 100 || 1);
    expenses += upkeep;
  }

  const sliderAvg = Object.values(budgetSliders).reduce((a, b) => a + b, 0) / 7;
  expenses *= sliderAvg / 100;

  if (money < -500) {
    population = Math.max(0, population - Math.floor(population * 0.05));
  }

  money += income - expenses;
  if (money < -1000) {
    EventBus.emit('notification', '⚠ 资金严重不足！市民正在离开...');
  }
}

function checkMilestones() {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (population >= MILESTONES[i].pop) {
      if (i > currentMilestone) {
        currentMilestone = i;
        EventBus.emit('milestone-reached', MILESTONES[i]);
      }
      break;
    }
  }
}

export function getMoney() { return money; }
export function spendMoney(amount) {
  if (money >= amount) {
    money -= amount;
    EventBus.emit('stats-updated', { money: Math.floor(money) });
    return true;
  }
  EventBus.emit('notification', '💸 资金不足！');
  return false;
}
export function addMoney(amount) { money += amount; }
export function getDay() { return day; }
export function getPopulation() { return population; }
export function getDemand() { return { ...demand }; }
export function getTaxRate(type) { return taxRate[type] || 9; }
export function setTaxRate(type, val) { taxRate[type] = Math.max(1, Math.min(29, val)); }
export function getBudgetSlider(key) { return budgetSliders[key] || 100; }
export function setBudgetSlider(key, val) { budgetSliders[key] = Math.max(50, Math.min(150, val)); }
export function getCurrentMilestone() { return currentMilestone; }
export function isUnlocked(defKey) {
  for (let i = 0; i <= currentMilestone; i++) {
    if (MILESTONES[i].unlocks.includes(defKey)) return true;
  }
  return true;
}
