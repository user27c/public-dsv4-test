export const GRID_SIZE = 150;
export const CELL_SIZE = 1;
export const MAP_HALF = (GRID_SIZE * CELL_SIZE) / 2;

export const STARTING_MONEY = 70000;
export const STARTING_TILES = 75;

export const WATER_LEVEL = 0.15;
export const MAX_HEIGHT = 1.8;

export const ZONE_DEPTH = 4;
export const ROAD_WIDTH_MAP = { basic: 1, highway: 2 };
export const BUILDING_MAX_LEVEL = 5;

export const TAX_RATE = { min: 1, max: 29, default: 9 };
export const BUDGET_SLIDERS = {
  power: { min: 50, max: 150, default: 100 },
  water: { min: 50, max: 150, default: 100 },
  healthcare: { min: 50, max: 150, default: 100 },
  police: { min: 50, max: 150, default: 100 },
  fire: { min: 50, max: 150, default: 100 },
  education: { min: 50, max: 150, default: 100 },
  roads: { min: 50, max: 150, default: 100 },
};

export const BUILDING_DEFS = {
  road_basic: { name: '两车道道路', cost: 10, upkeep: 0.2, category: 'road' },
  road_highway: { name: '高速公路', cost: 30, upkeep: 0.5, category: 'road' },
  wind_turbine: { name: '风力发电机', cost: 6000, upkeep: 80, powerOutput: 8, category: 'power' },
  coal_plant: { name: '燃煤发电厂', cost: 19000, upkeep: 560, powerOutput: 40, pollution: 0.5, category: 'power' },
  water_pump: { name: '抽水泵', cost: 2500, upkeep: 60, waterOutput: 50, category: 'water' },
  sewage_outlet: { name: '排污口', cost: 3500, upkeep: 70, sewageCapacity: 50, category: 'water' },
  fire_station: { name: '消防局', cost: 4000, upkeep: 200, coverage: 15, category: 'service' },
  police_station: { name: '警察局', cost: 5000, upkeep: 250, coverage: 18, category: 'service' },
  hospital: { name: '医院', cost: 8000, upkeep: 400, coverage: 25, category: 'service' },
  elementary_school: { name: '小学', cost: 3000, upkeep: 120, coverage: 14, category: 'service' },
  landfill: { name: '垃圾填埋场', cost: 4000, upkeep: 160, capacity: 20, category: 'service' },
};

export const MILESTONES = [
  { pop: 0, name: '小村庄', unlocks: [] },
  { pop: 100, name: '村庄', unlocks: ['fire_station'] },
  { pop: 500, name: '小镇', unlocks: ['police_station', 'landfill'] },
  { pop: 1000, name: '忙碌小镇', unlocks: ['hospital', 'coal_plant'] },
  { pop: 2500, name: '城市', unlocks: ['elementary_school', 'road_highway'] },
  { pop: 5000, name: '大城市', unlocks: [] },
  { pop: 10000, name: '巨型都市', unlocks: [] },
];

export const SIM_TICK_MS = 1000;
export const DAYS_PER_MONTH = 30;
export const TAX_PERIOD_DAYS = 7;

export const ROAD_COLORS = {
  basic: 0x444444,
  highway: 0x2a2a2a,
};

export const ZONE_COLORS = {
  residential: 0x4caf50,
  commercial: 0x2196f3,
  industrial: 0xff9800,
};

export const TERRAIN_COLORS = {
  grass_low: 0x7ec850,
  grass_mid: 0x6db840,
  grass_high: 0x5a9e35,
  rock_high: 0x8c8478,
  sand: 0xd4c9a0,
};
