export const GALAXY = {
  SYSTEMS: 200,
  RADIUS: 400,
  HYPERLANE_MIN: 2,
  HYPERLANE_MAX: 4,
  MAX_HYPERLANE_DIST: 120,
  CLUSTER_ATTEMPTS: 5,
  ELLIPTIC_FACTOR: 0.6,
  CORE_RADIUS: 50,
  STAR_TYPES: ['blue_giant', 'yellow', 'red_dwarf', 'white_dwarf', 'neutron', 'black_hole', 'pulsar'],
  STAR_COLORS: {
    blue_giant: '#7ec8e3',
    yellow: '#ffdd57',
    red_dwarf: '#f06262',
    white_dwarf: '#e8e8e8',
    neutron: '#00d2ff',
    black_hole: '#1a1a2e',
    pulsar: '#a855f7',
  },
  STAR_SIZES: {
    blue_giant: 4.5,
    yellow: 3.0,
    red_dwarf: 1.8,
    white_dwarf: 1.5,
    neutron: 2.0,
    black_hole: 2.5,
    pulsar: 2.2,
  },
};

export const START_DATE = { year: 2200, month: 1, day: 1 };

export const GAME_SPEEDS = {
  0: { name: 'Pause', ticksPerSec: 0 },
  1: { name: 'Slow', ticksPerSec: 0.5 },
  2: { name: 'Normal', ticksPerSec: 1 },
  3: { name: 'Fast', ticksPerSec: 5 },
  4: { name: 'Fastest', ticksPerSec: 15 },
};

export const PLANET_TYPES = {
  continental: { climate: 'wet', habitabilityBase: 80 },
  ocean: { climate: 'wet', habitabilityBase: 80 },
  tropical: { climate: 'wet', habitabilityBase: 80 },
  arid: { climate: 'dry', habitabilityBase: 80 },
  desert: { climate: 'dry', habitabilityBase: 80 },
  savannah: { climate: 'dry', habitabilityBase: 80 },
  arctic: { climate: 'frozen', habitabilityBase: 80 },
  alpine: { climate: 'frozen', habitabilityBase: 80 },
  tundra: { climate: 'frozen', habitabilityBase: 80 },
  gaia: { climate: 'gaia', habitabilityBase: 100 },
  tomb: { climate: 'tomb', habitabilityBase: 60 },
  barren: { climate: 'barren', habitabilityBase: 0 },
  frozen: { climate: 'frozen', habitabilityBase: 0 },
  gas_giant: { climate: 'gas', habitabilityBase: 0 },
  molten: { climate: 'molten', habitabilityBase: 0 },
  toxic: { climate: 'toxic', habitabilityBase: 0 },
};

export const PLANET_CLIMATES_ALL = ['wet', 'dry', 'frozen'];
export const HABITABLE_PLANET_TYPES = ['continental', 'ocean', 'tropical', 'arid', 'desert', 'savannah', 'arctic', 'alpine', 'tundra'];
export const HABITABLE_OR_SPECIAL = [...HABITABLE_PLANET_TYPES, 'gaia', 'tomb'];

export const RESOURCES = {
  energy: { name: 'Energy Credits', icon: '⚡', color: 'var(--resource-energy)' },
  minerals: { name: 'Minerals', icon: '⛏️', color: 'var(--resource-minerals)' },
  food: { name: 'Food', icon: '🍎', color: 'var(--resource-food)' },
  alloys: { name: 'Alloys', icon: '⚙️', color: 'var(--resource-alloys)' },
  consumer_goods: { name: 'Consumer Goods', icon: '📦', color: 'var(--resource-consumer)' },
  influence: { name: 'Influence', icon: '⭐', color: 'var(--resource-influence)' },
  unity: { name: 'Unity', icon: '🔮', color: 'var(--resource-unity)' },
  physics: { name: 'Physics Research', icon: '🔬', color: 'var(--resource-physics)' },
  society: { name: 'Society Research', icon: '🧬', color: 'var(--resource-society)' },
  engineering: { name: 'Engineering Research', icon: '🔧', color: 'var(--resource-engineering)' },
};

export const DISTRICT_TYPES = {
  city: { name: 'City District', provides: { housing: 5, clerkJobs: 1 } },
  industrial: { name: 'Industrial District', provides: { housing: 2, artisanJobs: 1, metallurgistJobs: 1 } },
  generator: { name: 'Generator District', provides: { housing: 2, technicianJobs: 2 } },
  mining: { name: 'Mining District', provides: { housing: 2, minerJobs: 2 } },
  agriculture: { name: 'Agriculture District', provides: { housing: 2, farmerJobs: 2 } },
};

export const BUILDING_TYPES = {
  research_lab: { name: 'Research Lab', cost: { minerals: 400 }, upkeep: { energy: 2 }, jobs: { researcher: 2 }, tiers: 3 },
  alloy_foundry: { name: 'Alloy Foundry', cost: { minerals: 400 }, upkeep: { energy: 2 }, jobs: { metallurgist: 2 }, tiers: 3 },
  civilian_factory: { name: 'Civilian Industries', cost: { minerals: 400 }, upkeep: { energy: 2 }, jobs: { artisan: 2 }, tiers: 3 },
  unity_building: { name: 'Temple', cost: { minerals: 400 }, upkeep: { energy: 2 }, jobs: { priest: 2 }, tiers: 3 },
  energy_grid: { name: 'Energy Grid', cost: { minerals: 400 }, upkeep: { energy: 1 }, bonuses: { energyMult: 0.15 }, tiers: 2 },
  mineral_plant: { name: 'Mineral Purification Plant', cost: { minerals: 400 }, upkeep: { energy: 1 }, bonuses: { mineralMult: 0.15 }, tiers: 2 },
  food_plant: { name: 'Food Processing', cost: { minerals: 400 }, upkeep: { energy: 1 }, bonuses: { foodMult: 0.15 }, tiers: 2 },
  stronghold: { name: 'Stronghold', cost: { minerals: 300 }, upkeep: { energy: 1 }, jobs: { soldier: 2 }, defense: 3 },
  luxury_residence: { name: 'Luxury Residence', cost: { minerals: 300 }, upkeep: { energy: 1, consumer_goods: 1 }, amenityBonus: 5 },
  commerce_building: { name: 'Commercial Zone', cost: { minerals: 300 }, upkeep: { energy: 1 }, jobs: { clerk: 2 } },
};

export const JOB_OUTPUTS = {
  ruler: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0, unity: 5, amenities: 3 },
  administrator: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0, unity: 4, amenities: 3 },
  clerk: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0, unity: 0, amenities: 2, trade: 2 },
  technician: { energy: 6, minerals: 0, food: 0, alloys: 0, consumer_goods: 0, unity: 0, amenities: 0 },
  miner: { energy: 0, minerals: 6, food: 0, alloys: 0, consumer_goods: 0, unity: 0, amenities: 0 },
  farmer: { energy: 0, minerals: 0, food: 6, alloys: 0, consumer_goods: 0, unity: 0, amenities: 0 },
  artisan: { energy: 0, minerals: -6, food: 0, alloys: 0, consumer_goods: 6, unity: 0, amenities: 0 },
  metallurgist: { energy: 0, minerals: -6, food: 0, alloys: 3, consumer_goods: 0, unity: 0, amenities: 0 },
  researcher: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: -2, unity: 0, amenities: 0,
    physics: 4, society: 4, engineering: 4 },
  priest: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: -2, unity: 4, amenities: 2 },
  soldier: { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0, unity: 0, amenities: 0, defense: 3, navalCap: 4 },
  unemployed: { energy: 0, minerals: 0, food: -1, alloys: 0, consumer_goods: -1, unity: 0, amenities: 0 },
};

export const POP_UPKEEP = {
  ruler: { consumer_goods: 1, food: 1, amenities: -1 },
  specialist: { consumer_goods: 0.5, food: 1, amenities: -0.5 },
  worker: { consumer_goods: 0.25, food: 1, amenities: -0.25 },
  slave: { consumer_goods: 0.1, food: 0.75, amenities: -0.1 },
  drone: { energy: 1, amenities: -0.25 },
};

export const SHIP_SIZES = {
  corvette: { name: 'Corvette', size: 1, hull: 300, speed: 1.6, evasion: 0.6, weapons: { small: 3 }, sections: 1,
    cost: { alloys: 100 }, upkeep: { energy: 0.5, alloys: 0.2 }, buildTime: 60 },
  destroyer: { name: 'Destroyer', size: 2, hull: 800, speed: 1.4, evasion: 0.35, weapons: { small: 2, medium: 2 }, sections: 2,
    cost: { alloys: 300 }, upkeep: { energy: 1, alloys: 0.5 }, buildTime: 120, techReq: 'destroyers' },
  cruiser: { name: 'Cruiser', size: 4, hull: 1800, speed: 1.2, evasion: 0.15, weapons: { medium: 3, large: 1 }, sections: 3,
    cost: { alloys: 600 }, upkeep: { energy: 2, alloys: 1 }, buildTime: 240, techReq: 'cruisers' },
  battleship: { name: 'Battleship', size: 8, hull: 3000, speed: 1, evasion: 0.05, weapons: { large: 4, medium: 2 }, sections: 4,
    cost: { alloys: 1200 }, upkeep: { energy: 4, alloys: 2 }, buildTime: 480, techReq: 'battleships' },
};

export const WEAPON_TYPES = {
  mass_driver_1: { name: 'Mass Driver I', slot: 'small', damage: 8, cooldown: 4, range: 50, type: 'kinetic', cost: { alloys: 10 } },
  mass_driver_2: { name: 'Mass Driver II', slot: 'small', damage: 11, cooldown: 4, range: 50, type: 'kinetic', cost: { alloys: 15 } },
  red_laser_1: { name: 'Red Laser I', slot: 'small', damage: 7, cooldown: 3.5, range: 45, type: 'energy', cost: { alloys: 10 } },
  nuclear_missile_1: { name: 'Nuclear Missiles I', slot: 'medium', damage: 20, cooldown: 7, range: 70, type: 'explosive', cost: { alloys: 20 } },
};

export const UTILITY_TYPES = {
  small_armor_1: { name: 'Armor I', slot: 'small', armor: 50, cost: { alloys: 5 } },
  small_shield_1: { name: 'Shield I', slot: 'small', shield: 60, cost: { alloys: 8 }, upkeep: { energy: 0.1 } },
};

export const EMPIRE_COLORS = [
  '#4a9eff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8',
  '#20c997', '#ff922b', '#74c0fc', '#f06595', '#63e6be',
];

export const STELLARIS_NAMES = [
  'United Nations of Earth', 'Commonwealth of Man', 'Tzynn Empire',
  'Kingdom of Yondarim', 'IxIdar Star Collective', 'Chinorr Combine',
  'Maweer Caretakers', 'Lokken Mechanists', 'Scyldari Confederacy',
  'Kel-Azaan Republic', 'Blorg Commonality', 'Jehetma Dominion',
];

export const SYSTEM_NAME_POOLS = {
  prefix: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
    'Lambda', 'Sigma', 'Omega', 'Proxima', 'Nova', 'Ultima', 'Prima', 'Hyperion', 'Zenith', 'Nexus'],
  suffix: ['Centauri', 'Draconis', 'Cygni', 'Lyrae', 'Aquilae', 'Eridani', 'Orionis', 'Pegasi', 'Hydrae', 'Scorpii',
    'Tauri', 'Leonis', 'Canis', 'Corvi', 'Phoenicis', 'Lupi', 'Pavonis', 'Grusis', 'Tucanae', 'Velorum'],
  unique: ['Sol', 'Deneb', 'Polaris', 'Sirius', 'Vega', 'Rigel', 'Arcturus', 'Aldebaran', 'Betelgeuse', 'Capella'],
};

export const EMPIRE_NAMELISTS = {
  human: { prefixes: ['UNS', 'ISS', 'HMS', 'ESS', 'USV'], shipNames: ['Enterprise', 'Dauntless', 'Relentless', 'Endeavour', 'Discovery', 'Challenger'] },
  arthropoid: { prefixes: ['SHE', 'CAR', 'HIVE', 'SWM'], shipNames: ['Swarmling', 'Carapace', 'Stinger', 'Hive Drone'] },
  avian: { prefixes: ['WING', 'TALN', 'FLGT'], shipNames: ['Eagle', 'Falcon', 'Hawk', 'Phoenix', 'Raven'] },
  reptilian: { prefixes: ['SCL', 'FANG', 'CRST'], shipNames: ['Predator', 'Hunter', 'Stalker', 'Ambush'] },
};

export const SHIP_PREFIXES = { military: 'ISS', science: 'SCV', construction: 'CNV', colony: 'CLY', transport: 'TRN' };

export const TECH_COST_BASE = 2000;
export const TRADITION_COST_BASE = 500;
export const STARBASE_INFLUENCE_COST = 75;
export const INFLUENCE_GAIN = 3;
export const POP_GROWTH_BASE = 3;
export const POP_GROWTH_SCALE = 0.25;
export const MAX_STARBASE_LEVEL = 5;
export const STARTING_FLEET_SIZE = 3;
export const STARTING_NAVAL_CAP = 20;
export const LEADER_CAP_BASE = 4;
export const LEADER_LIFESPAN_BASE = 80;
export const DIPLO_DISTANCE_BASE = 150;
export const FEDERATION_COHESION_MAX = 100;
