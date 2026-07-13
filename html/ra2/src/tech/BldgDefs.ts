export interface BuildingDef {
  id: string;
  name: string;
  faction: 'allies' | 'soviet' | 'both';
  kind: 'production' | 'defense' | 'tech' | 'power' | 'superweapon' | 'resource';
  cost: number;
  hp: number;
  power: number; // negative = consumes, positive = produces
  width: number;
  height: number;
  sight: number;
  armor: string;
  requires: string[];
  techLevel: number;
  builds?: string[]; // unit types this building can produce
  isDefense?: boolean;
  defenseDamage?: number;
  defenseRange?: number;
  defenseRof?: number;
  defenseWarhead?: string;
}

export const BUILDING_DEFS: Record<string, BuildingDef> = {
  // ===== ALLIES BUILDINGS =====
  gacnst: {
    id: 'gacnst', name: 'Construction Yard', faction: 'allies', kind: 'production',
    cost: 3000, hp: 2000, power: 0, width: 4, height: 4,
    sight: 6, armor: 'concrete', requires: [], techLevel: 1,
  },
  gapowr: {
    id: 'gapowr', name: 'Power Plant', faction: 'allies', kind: 'power',
    cost: 300, hp: 400, power: 200, width: 2, height: 2,
    sight: 3, armor: 'concrete', requires: ['gacnst'], techLevel: 1,
  },
  gapowr2: {
    id: 'gapowr2', name: 'Advanced Power Plant', faction: 'allies', kind: 'power',
    cost: 800, hp: 600, power: 500, width: 2, height: 2,
    sight: 3, armor: 'concrete', requires: ['gacnst', 'gatech'], techLevel: 3,
  },
  gabar: {
    id: 'gabar', name: 'Barracks', faction: 'allies', kind: 'production',
    cost: 500, hp: 500, power: -10, width: 2, height: 2,
    sight: 4, armor: 'concrete',
    requires: ['gacnst', 'gapowr'], techLevel: 1,
    builds: ['gi', 'e1', 'adog', 'gg', 'tany', 'spyg', 'clg'],
  },
  garef: {
    id: 'garef', name: 'Ore Refinery', faction: 'allies', kind: 'resource',
    cost: 2000, hp: 800, power: -50, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['gacnst', 'gapowr'], techLevel: 1,
  },
  gaweap: {
    id: 'gaweap', name: 'War Factory', faction: 'allies', kind: 'production',
    cost: 2000, hp: 1000, power: -25, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['gacnst', 'garef'], techLevel: 1,
    builds: ['griz', 'ifv', 'mtnk', 'prsm', 'harvA', 'mcv'],
  },
  gaairc: {
    id: 'gaairc', name: 'Airforce Command', faction: 'allies', kind: 'production',
    cost: 1500, hp: 600, power: -30, width: 3, height: 3,
    sight: 5, armor: 'concrete',
    requires: ['gacnst', 'garef'], techLevel: 2,
    builds: ['jump', 'shad', 'rock'],
  },
  gaspysat: {
    id: 'gaspysat', name: 'SpySat Uplink', faction: 'allies', kind: 'tech',
    cost: 1500, hp: 500, power: -20, width: 2, height: 2,
    sight: 4, armor: 'concrete',
    requires: ['gacnst', 'garef'], techLevel: 2,
  },
  gapill: {
    id: 'gapill', name: 'Pillbox', faction: 'allies', kind: 'defense',
    cost: 500, hp: 300, power: 0, width: 1, height: 1,
    sight: 6, armor: 'concrete',
    requires: ['gabar'], techLevel: 1,
    isDefense: true, defenseDamage: 40, defenseRange: 6, defenseRof: 12, defenseWarhead: 'sa',
  },
  gatsla: {
    id: 'gatsla', name: 'Prism Tower', faction: 'allies', kind: 'defense',
    cost: 1500, hp: 500, power: -75, width: 1, height: 1,
    sight: 8, armor: 'concrete',
    requires: ['gaweap', 'gapsyc'], techLevel: 3,
    isDefense: true, defenseDamage: 100, defenseRange: 8, defenseRof: 35, defenseWarhead: 'explosive',
  },
  gawall: {
    id: 'gawall', name: 'Concrete Wall', faction: 'allies', kind: 'defense',
    cost: 100, hp: 300, power: 0, width: 1, height: 1,
    sight: 1, armor: 'concrete',
    requires: ['gabar'], techLevel: 1,
  },
  gaweat: {
    id: 'gaweat', name: 'Weather Storm', faction: 'allies', kind: 'superweapon',
    cost: 5000, hp: 1000, power: -200, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['gaweap'], techLevel: 3,
  },
  gachro: {
    id: 'gachro', name: 'Chronosphere', faction: 'allies', kind: 'superweapon',
    cost: 5000, hp: 800, power: -200, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['gatech'], techLevel: 3,
  },

  // ===== SOVIET BUILDINGS =====
  nacnst: {
    id: 'nacnst', name: 'Construction Yard', faction: 'soviet', kind: 'production',
    cost: 3000, hp: 2000, power: 0, width: 4, height: 4,
    sight: 6, armor: 'concrete', requires: [], techLevel: 1,
  },
  napowr: {
    id: 'napowr', name: 'Tesla Reactor', faction: 'soviet', kind: 'power',
    cost: 600, hp: 450, power: 150, width: 2, height: 2,
    sight: 3, armor: 'concrete', requires: ['nacnst'], techLevel: 1,
  },
  nanucl: {
    id: 'nanucl', name: 'Nuclear Reactor', faction: 'soviet', kind: 'power',
    cost: 1000, hp: 1000, power: 1000, width: 3, height: 3,
    sight: 3, armor: 'concrete',
    requires: ['nacnst', 'natech'], techLevel: 3,
  },
  nahand: {
    id: 'nahand', name: 'Barracks', faction: 'soviet', kind: 'production',
    cost: 500, hp: 500, power: -10, width: 2, height: 2,
    sight: 4, armor: 'concrete',
    requires: ['nacnst', 'napowr'], techLevel: 1,
    builds: ['cons', 'e1', 'flak', 'tesl', 'civa', 'deso', 'bori'],
  },
  naref: {
    id: 'naref', name: 'Ore Refinery', faction: 'soviet', kind: 'resource',
    cost: 2000, hp: 800, power: -50, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['nacnst', 'napowr'], techLevel: 1,
  },
  naweap: {
    id: 'naweap', name: 'War Factory', faction: 'soviet', kind: 'production',
    cost: 2000, hp: 1000, power: -25, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['nacnst', 'naref'], techLevel: 1,
    builds: ['htk', 'ftrk', 'apoc', 'v3', 'terr', 'harv', 'mcv'],
  },
  naaric: {
    id: 'naaric', name: 'Airfield', faction: 'soviet', kind: 'production',
    cost: 1500, hp: 600, power: -30, width: 3, height: 3,
    sight: 5, armor: 'concrete',
    requires: ['nacnst', 'naref'], techLevel: 2,
    builds: ['zep', 'schp'],
  },
  napsyc: {
    id: 'napsyc', name: 'Radar', faction: 'soviet', kind: 'tech',
    cost: 1500, hp: 600, power: -20, width: 2, height: 2,
    sight: 4, armor: 'concrete',
    requires: ['nacnst', 'naref'], techLevel: 2,
  },
  napill: {
    id: 'napill', name: 'Sentry Gun', faction: 'soviet', kind: 'defense',
    cost: 500, hp: 400, power: 0, width: 1, height: 1,
    sight: 6, armor: 'concrete',
    requires: ['nahand'], techLevel: 1,
    isDefense: true, defenseDamage: 30, defenseRange: 6, defenseRof: 10, defenseWarhead: 'ap',
  },
  natesl: {
    id: 'natesl', name: 'Tesla Coil', faction: 'soviet', kind: 'defense',
    cost: 1500, hp: 600, power: -100, width: 1, height: 1,
    sight: 8, armor: 'concrete',
    requires: ['napsyc', 'naweap'], techLevel: 3,
    isDefense: true, defenseDamage: 150, defenseRange: 7, defenseRof: 30, defenseWarhead: 'tesla',
  },
  naflak: {
    id: 'naflak', name: 'Flak Cannon', faction: 'soviet', kind: 'defense',
    cost: 800, hp: 400, power: -25, width: 1, height: 1,
    sight: 7, armor: 'concrete',
    requires: ['nahand', 'naweap'], techLevel: 2,
    isDefense: true, defenseDamage: 25, defenseRange: 6, defenseRof: 12, defenseWarhead: 'explosive',
  },
  nawall: {
    id: 'nawall', name: 'Fortress Wall', faction: 'soviet', kind: 'defense',
    cost: 100, hp: 400, power: 0, width: 1, height: 1,
    sight: 1, armor: 'concrete',
    requires: ['nahand'], techLevel: 1,
  },
  nanuke: {
    id: 'nanuke', name: 'Nuclear Missile Silo', faction: 'soviet', kind: 'superweapon',
    cost: 5000, hp: 1000, power: -200, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['naweap'], techLevel: 3,
  },
  nairon: {
    id: 'nairon', name: 'Iron Curtain', faction: 'soviet', kind: 'superweapon',
    cost: 5000, hp: 800, power: -200, width: 3, height: 3,
    sight: 4, armor: 'concrete',
    requires: ['natech'], techLevel: 3,
  },
};

export const BUILDING_CATEGORIES = [
  {
    name: 'Structures',
    ids: ['gapowr', 'gabar', 'garef', 'gaweap', 'gaairc', 'gaspysat'],
    idsSoviet: ['napowr', 'nahand', 'naref', 'naweap', 'naaric', 'napsyc'],
  },
  {
    name: 'Defense',
    ids: ['gapill', 'gatsla', 'gawall'],
    idsSoviet: ['napill', 'naflak', 'natesl', 'nawall'],
  },
  {
    name: 'Infantry',
    ids: ['gi', 'gg', 'e1', 'adog', 'tany', 'rock', 'spyg', 'clg'],
    idsSoviet: ['cons', 'flak', 'e1', 'tesl', 'civa', 'deso', 'bori'],
  },
  {
    name: 'Vehicles',
    ids: ['griz', 'ifv', 'mtnk', 'prsm', 'harvA', 'mcv'],
    idsSoviet: ['htk', 'ftrk', 'apoc', 'v3', 'terr', 'harv', 'mcv'],
  },
];
