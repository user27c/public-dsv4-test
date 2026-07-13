export interface UnitDef {
  id: string;
  name: string;
  faction: 'allies' | 'soviet' | 'both';
  kind: 'infantry' | 'vehicle' | 'aircraft' | 'naval';
  cost: number;
  hp: number;
  speed: number;
  damage: number;
  attackRange: number;
  rof: number;
  sight: number;
  armor: string;
  warhead: string;
  requires: string[];
  techLevel: number;
}

export const UNIT_DEFS: Record<string, UnitDef> = {
  // ===== ALLIES UNITS =====
  gi: {
    id: 'gi', name: 'GI', faction: 'allies', kind: 'infantry',
    cost: 200, hp: 125, speed: 40, damage: 15, attackRange: 4, rof: 20,
    sight: 5, armor: 'flesh', warhead: 'sa',
    requires: ['gabar'], techLevel: 1,
  },
  gg: {
    id: 'gg', name: 'Guardian GI', faction: 'allies', kind: 'infantry',
    cost: 400, hp: 150, speed: 35, damage: 25, attackRange: 6, rof: 25,
    sight: 6, armor: 'flesh', warhead: 'sa',
    requires: ['gabar'], techLevel: 2,
  },
  e1: {
    id: 'e1', name: 'Engineer', faction: 'both', kind: 'infantry',
    cost: 500, hp: 75, speed: 40, damage: 0, attackRange: 1, rof: 60,
    sight: 4, armor: 'flesh', warhead: 'none',
    requires: ['gabar', 'nahand'], techLevel: 1,
  },
  adog: {
    id: 'adog', name: 'Attack Dog', faction: 'allies', kind: 'infantry',
    cost: 200, hp: 100, speed: 70, damage: 25, attackRange: 1, rof: 15,
    sight: 7, armor: 'flesh', warhead: 'claw',
    requires: ['gabar'], techLevel: 1,
  },
  tany: {
    id: 'tany', name: 'Tanya', faction: 'allies', kind: 'infantry',
    cost: 1500, hp: 200, speed: 50, damage: 100, attackRange: 5, rof: 10,
    sight: 7, armor: 'flesh', warhead: 'sa',
    requires: ['gabar', 'gapsyc'], techLevel: 3,
  },
  rock: {
    id: 'rock', name: 'Rocketeer', faction: 'allies', kind: 'aircraft',
    cost: 600, hp: 125, speed: 80, damage: 30, attackRange: 5, rof: 15,
    sight: 7, armor: 'flesh', warhead: 'explosive',
    requires: ['gabar', 'gaairc'], techLevel: 2,
  },
  spyg: {
    id: 'spyg', name: 'Spy', faction: 'allies', kind: 'infantry',
    cost: 1000, hp: 100, speed: 45, damage: 0, attackRange: 1, rof: 60,
    sight: 9, armor: 'flesh', warhead: 'none',
    requires: ['gabar', 'gapsyc'], techLevel: 3,
  },
  clg: {
    id: 'clg', name: 'Chrono Legionnaire', faction: 'allies', kind: 'infantry',
    cost: 1500, hp: 150, speed: 45, damage: 80, attackRange: 5, rof: 25,
    sight: 6, armor: 'flesh', warhead: 'explosive',
    requires: ['gabar', 'gatech'], techLevel: 3,
  },

  griz: {
    id: 'griz', name: 'Grizzly Tank', faction: 'allies', kind: 'vehicle',
    cost: 700, hp: 300, speed: 60, damage: 35, attackRange: 5, rof: 25,
    sight: 6, armor: 'steel', warhead: 'ap',
    requires: ['gaweap'], techLevel: 1,
  },
  ifv: {
    id: 'ifv', name: 'IFV', faction: 'allies', kind: 'vehicle',
    cost: 600, hp: 200, speed: 80, damage: 25, attackRange: 5, rof: 15,
    sight: 8, armor: 'steel', warhead: 'ap',
    requires: ['gaweap'], techLevel: 2,
  },
  mtnk: {
    id: 'mtnk', name: 'Mirage Tank', faction: 'allies', kind: 'vehicle',
    cost: 1000, hp: 250, speed: 55, damage: 70, attackRange: 7, rof: 40,
    sight: 5, armor: 'steel', warhead: 'ap',
    requires: ['gaweap', 'gapsyc'], techLevel: 3,
  },
  prsm: {
    id: 'prsm', name: 'Prism Tank', faction: 'allies', kind: 'vehicle',
    cost: 1200, hp: 200, speed: 50, damage: 90, attackRange: 8, rof: 35,
    sight: 7, armor: 'steel', warhead: 'explosive',
    requires: ['gaweap', 'gapsyc'], techLevel: 3,
  },
  cmn: {
    id: 'cmn', name: 'Chrono Miner', faction: 'allies', kind: 'vehicle',
    cost: 1400, hp: 800, speed: 80, damage: 0, attackRange: 0, rof: 0,
    sight: 4, armor: 'steel', warhead: 'none',
    requires: ['gaweap', 'gatech'], techLevel: 2,
  },
  harv: {
    id: 'harv', name: 'War Miner', faction: 'soviet', kind: 'vehicle',
    cost: 1400, hp: 1000, speed: 55, damage: 15, attackRange: 4, rof: 30,
    sight: 4, armor: 'steel', warhead: 'ap',
    requires: ['naweap'], techLevel: 1,
  },
  mcv: {
    id: 'mcv', name: 'MCV', faction: 'both', kind: 'vehicle',
    cost: 3000, hp: 1000, speed: 40, damage: 0, attackRange: 0, rof: 0,
    sight: 6, armor: 'steel', warhead: 'none',
    requires: ['gaweap', 'naweap'], techLevel: 3,
  },

  harvA: {
    id: 'harvA', name: 'Chrono Miner', faction: 'allies', kind: 'vehicle',
    cost: 1400, hp: 700, speed: 80, damage: 0, attackRange: 0, rof: 0,
    sight: 4, armor: 'steel', warhead: 'none',
    requires: ['gaweap'], techLevel: 1,
  },

  // ===== SOVIET UNITS =====
  cons: {
    id: 'cons', name: 'Conscript', faction: 'soviet', kind: 'infantry',
    cost: 100, hp: 125, speed: 35, damage: 15, attackRange: 4, rof: 25,
    sight: 5, armor: 'flesh', warhead: 'sa',
    requires: ['nahand'], techLevel: 1,
  },
  flak: {
    id: 'flak', name: 'Flak Trooper', faction: 'soviet', kind: 'infantry',
    cost: 300, hp: 150, speed: 35, damage: 30, attackRange: 5, rof: 20,
    sight: 5, armor: 'flesh', warhead: 'explosive',
    requires: ['nahand'], techLevel: 2,
  },
  tesl: {
    id: 'tesl', name: 'Tesla Trooper', faction: 'soviet', kind: 'infantry',
    cost: 500, hp: 180, speed: 35, damage: 50, attackRange: 5, rof: 30,
    sight: 6, armor: 'flesh', warhead: 'tesla',
    requires: ['nahand', 'napsyc'], techLevel: 2,
  },
  deso: {
    id: 'deso', name: 'Desolator', faction: 'soviet', kind: 'infantry',
    cost: 600, hp: 150, speed: 35, damage: 40, attackRange: 4, rof: 20,
    sight: 5, armor: 'flesh', warhead: 'radiation',
    requires: ['nahand', 'napsyc'], techLevel: 3,
  },
  civa: {
    id: 'civa', name: 'Crazy Ivan', faction: 'soviet', kind: 'infantry',
    cost: 800, hp: 150, speed: 45, damage: 200, attackRange: 1, rof: 60,
    sight: 6, armor: 'flesh', warhead: 'explosive',
    requires: ['nahand', 'napsyc'], techLevel: 3,
  },
  bori: {
    id: 'bori', name: 'Boris', faction: 'soviet', kind: 'infantry',
    cost: 1500, hp: 200, speed: 45, damage: 90, attackRange: 6, rof: 12,
    sight: 7, armor: 'flesh', warhead: 'ap',
    requires: ['nahand', 'natech', 'napsyc'], techLevel: 3,
  },

  htk: {
    id: 'htk', name: 'Rhino Tank', faction: 'soviet', kind: 'vehicle',
    cost: 900, hp: 400, speed: 55, damage: 40, attackRange: 5, rof: 25,
    sight: 6, armor: 'steel', warhead: 'ap',
    requires: ['naweap'], techLevel: 1,
  },
  ftrk: {
    id: 'ftrk', name: 'Flak Track', faction: 'soviet', kind: 'vehicle',
    cost: 500, hp: 180, speed: 80, damage: 20, attackRange: 5, rof: 15,
    sight: 7, armor: 'steel', warhead: 'explosive',
    requires: ['naweap'], techLevel: 2,
  },
  apoc: {
    id: 'apoc', name: 'Apocalypse Tank', faction: 'soviet', kind: 'vehicle',
    cost: 1750, hp: 800, speed: 40, damage: 80, attackRange: 5, rof: 30,
    sight: 5, armor: 'steel', warhead: 'ap',
    requires: ['naweap', 'natech'], techLevel: 3,
  },
  v3: {
    id: 'v3', name: 'V3 Launcher', faction: 'soviet', kind: 'vehicle',
    cost: 800, hp: 175, speed: 45, damage: 120, attackRange: 12, rof: 50,
    sight: 4, armor: 'steel', warhead: 'explosive',
    requires: ['naweap', 'napsyc'], techLevel: 2,
  },
  terr: {
    id: 'terr', name: 'Terror Drone', faction: 'soviet', kind: 'vehicle',
    cost: 500, hp: 100, speed: 120, damage: 40, attackRange: 1, rof: 20,
    sight: 8, armor: 'special', warhead: 'ap',
    requires: ['naweap', 'napsyc'], techLevel: 2,
  },

  // ===== AIRCRAFT =====
  jump: {
    id: 'jump', name: 'Harrier', faction: 'allies', kind: 'aircraft',
    cost: 1200, hp: 175, speed: 120, damage: 60, attackRange: 6, rof: 10,
    sight: 8, armor: 'steel', warhead: 'explosive',
    requires: ['gaairc'], techLevel: 2,
  },
  shad: {
    id: 'shad', name: 'Blackhawk', faction: 'allies', kind: 'aircraft',
    cost: 1500, hp: 200, speed: 100, damage: 80, attackRange: 6, rof: 8,
    sight: 8, armor: 'steel', warhead: 'explosive',
    requires: ['gaairc', 'gapsyc'], techLevel: 3,
  },
  zep: {
    id: 'zep', name: 'Kirov Airship', faction: 'soviet', kind: 'aircraft',
    cost: 2000, hp: 600, speed: 30, damage: 300, attackRange: 5, rof: 40,
    sight: 5, armor: 'steel', warhead: 'explosive',
    requires: ['naairc', 'natech'], techLevel: 3,
  },
  schp: {
    id: 'schp', name: 'Siege Chopper', faction: 'soviet', kind: 'aircraft',
    cost: 1200, hp: 300, speed: 70, damage: 50, attackRange: 5, rof: 20,
    sight: 6, armor: 'steel', warhead: 'explosive',
    requires: ['naairc'], techLevel: 2,
  },

  // ===== NAVAL =====
  dest: {
    id: 'dest', name: 'Destroyer', faction: 'allies', kind: 'naval',
    cost: 1000, hp: 600, speed: 40, damage: 45, attackRange: 6, rof: 20,
    sight: 7, armor: 'steel', warhead: 'explosive',
    requires: ['gaspy'], techLevel: 2,
  },
  aegis: {
    id: 'aegis', name: 'Aegis Cruiser', faction: 'allies', kind: 'naval',
    cost: 1500, hp: 400, speed: 35, damage: 30, attackRange: 8, rof: 5,
    sight: 9, armor: 'steel', warhead: 'explosive',
    requires: ['gapsyc', 'gaspy'], techLevel: 3,
  },
  typh: {
    id: 'typh', name: 'Typhoon Sub', faction: 'soviet', kind: 'naval',
    cost: 1000, hp: 500, speed: 45, damage: 60, attackRange: 6, rof: 25,
    sight: 6, armor: 'steel', warhead: 'explosive',
    requires: ['napsyc', 'naspy'], techLevel: 2,
  },
  dred: {
    id: 'dred', name: 'Dreadnought', faction: 'soviet', kind: 'naval',
    cost: 1800, hp: 700, speed: 30, damage: 150, attackRange: 14, rof: 55,
    sight: 5, armor: 'steel', warhead: 'explosive',
    requires: ['natech', 'naspy'], techLevel: 3,
  },
};
