export enum TerrainType {
  GRASSLAND = 'grassland',
  PLAINS = 'plains',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  SNOW = 'snow',
  COAST = 'coast',
  OCEAN = 'ocean',
}

export enum FeatureType {
  NONE = 'none',
  FOREST = 'forest',
  RAINFOREST = 'rainforest',
  MARSH = 'marsh',
  FLOODPLAINS = 'floodplains',
  MOUNTAINS = 'mountains',
  HILLS = 'hills',
  OASIS = 'oasis',
}

export enum ResourceType {
  NONE = 'none',
  WHEAT = 'wheat',
  CATTLE = 'cattle',
  RICE = 'rice',
  MAIZE = 'maize',
  STONE = 'stone',
  FISH = 'fish',
  BANANAS = 'bananas',
  DEER = 'deer',
  HORSES = 'horses',
  IRON = 'iron',
  NITER = 'niter',
  COAL = 'coal',
  OIL = 'oil',
  URANIUM = 'uranium',
  WINE = 'wine',
  SPICES = 'spices',
  IVORY = 'ivory',
  SILK = 'silk',
  SILVER = 'silver',
  FURS = 'furs',
  DYES = 'dyes',
  INCENSE = 'incense',
  PEARLS = 'pearls',
  WHALES = 'whales',
}

export enum ResourceCategory {
  BONUS = 'bonus',
  STRATEGIC = 'strategic',
  LUXURY = 'luxury',
}

export enum UnitType {
  SETTLER = 'settler',
  BUILDER = 'builder',
  SCOUT = 'scout',
  WARRIOR = 'warrior',
  SLINGER = 'slinger',
  ARCHER = 'archer',
  SPEARMAN = 'spearman',
  SWORDSMAN = 'swordsman',
  HORSEMAN = 'horseman',
  CHARIOT = 'chariot',
  CATAPULT = 'catapult',
  GALLEY = 'galley',
  TRADER = 'trader',
}

export enum UnitDomain {
  LAND = 'land',
  NAVAL = 'naval',
}

export enum UnitClass {
  MELEE = 'melee',
  RANGED = 'ranged',
  HEAVY_CAVALRY = 'heavy_cavalry',
  LIGHT_CAVALRY = 'light_cavalry',
  ANTI_CAVALRY = 'anti_cavalry',
  SIEGE = 'siege',
  RECON = 'recon',
  CIVILIAN = 'civilian',
  NAVAL_MELEE = 'naval_melee',
}

export enum DistrictType {
  CITY_CENTER = 'city_center',
  CAMPUS = 'campus',
  HOLY_SITE = 'holy_site',
  COMMERCIAL_HUB = 'commercial_hub',
  INDUSTRIAL_ZONE = 'industrial_zone',
  THEATER_SQUARE = 'theater_square',
  ENCAMPMENT = 'encampment',
  HARBOR = 'harbor',
}

export enum BuildingType {
  MONUMENT = 'monument',
  GRANARY = 'granary',
  WATER_MILL = 'water_mill',
  WALLS = 'walls',
  LIBRARY = 'library',
  SHRINE = 'shrine',
  MARKET = 'market',
  WORKSHOP = 'workshop',
  AMPHITHEATER = 'amphitheater',
  BARRACKS = 'barracks',
  LIGHTHOUSE = 'lighthouse',
  TEMPLE = 'temple',
  UNIVERSITY = 'university',
}

export enum TechType {
  POTTERY = 'pottery',
  ANIMAL_HUSBANDRY = 'animal_husbandry',
  MINING = 'mining',
  SAILING = 'sailing',
  ASTROLOGY = 'astrology',
  IRRIGATION = 'irrigation',
  WRITING = 'writing',
  ARCHERY = 'archery',
  MASONRY = 'masonry',
  BRONZE_WORKING = 'bronze_working',
  WHEEL = 'wheel',
  CELESTIAL_NAVIGATION = 'celestial_navigation',
  CURRENCY = 'currency',
  HORSEBACK_RIDING = 'horseback_riding',
  IRON_WORKING = 'iron_working',
  MATHEMATICS = 'mathematics',
  CONSTRUCTION = 'construction',
  ENGINEERING = 'engineering',
}

export enum CivicType {
  CODE_OF_LAWS = 'code_of_laws',
  CRAFTMANSHIP = 'craftmanship',
  FOREIGN_TRADE = 'foreign_trade',
  MILITARY_TRADITION = 'military_tradition',
  STATE_WORKFORCE = 'state_workforce',
  EARLY_EMPIRE = 'early_empire',
  MYSTICISM = 'mysticism',
  GAMES_AND_RECREATION = 'games_and_recreation',
  POLITICAL_PHILOSOPHY = 'political_philosophy',
  DRAMA_AND_POETRY = 'drama_and_poetry',
  MILITARY_TRAINING = 'military_training',
  DEFENSIVE_TACTICS = 'defensive_tactics',
  RECORDED_HISTORY = 'recorded_history',
  THEOLOGY = 'theology',
}

export enum GovernmentType {
  CHIEFDOM = 'chiefdom',
  AUTOCRACY = 'autocracy',
  OLIGARCHY = 'oligarchy',
  CLASSICAL_REPUBLIC = 'classical_republic',
}

export enum CivilizationType {
  ROME = 'rome',
  CHINA = 'china',
  EGYPT = 'egypt',
  GREECE = 'greece',
  JAPAN = 'japan',
}

export interface YieldData {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
}

export interface TileData {
  q: number;
  r: number;
  terrain: TerrainType;
  feature: FeatureType;
  isRiver: boolean;
  riverEdges: number[];
  resource: ResourceType;
  yields: YieldData;
  owner: number;
  explored: boolean;
  visible: boolean;
  improvement: string | null;
  district: DistrictType | null;
}

export interface UnitData {
  id: number;
  type: UnitType;
  owner: number;
  q: number;
  r: number;
  health: number;
  maxHealth: number;
  moves: number;
  maxMoves: number;
  level: number;
  exp: number;
  actionTaken: boolean;
  fortified: boolean;
  asleep: boolean;
  domain: UnitDomain;
}

export interface UnitDef {
  type: UnitType;
  name: string;
  domain: UnitDomain;
  unitClass: UnitClass;
  cost: number;
  maintenance: number;
  moves: number;
  combat: number;
  rangedCombat: number;
  range: number;
  sight: number;
  requiresTech: TechType | null;
  upgradesTo: UnitType | null;
  replaces: UnitType | null;
  uniqueCiv: CivilizationType | null;
}

export interface CityData {
  id: number;
  name: string;
  owner: number;
  q: number;
  r: number;
  population: number;
  foodStored: number;
  foodNeeded: number;
  productionStored: number;
  productionNeeded: number;
  currentlyBuilding: { type: 'unit' | 'building' | 'district' | 'project'; key: string } | null;
  buildings: BuildingType[];
  districts: DistrictType[];
  workedTiles: { q: number; r: number }[];
  borderTiles: { q: number; r: number }[];
  health: number;
  maxHealth: number;
  defense: number;
  garrison: number | null;
  turnsUntilGrowth: number;
  hints: string[];
}

export interface PlayerData {
  index: number;
  civilization: CivilizationType;
  leader: string;
  color: string;
  secondaryColor: string;
  gold: number;
  sciencePerTurn: number;
  culturePerTurn: number;
  faithPerTurn: number;
  goldPerTurn: number;
  currentTech: TechType | null;
  techProgress: number;
  unlockedTechs: Set<TechType>;
  currentCivic: CivicType | null;
  civicProgress: number;
  unlockedCivics: Set<CivicType>;
  government: GovernmentType;
  cities: number[];
  units: number[];
  isHuman: boolean;
  alive: boolean;
  hasMet: Set<number>;
  atWar: Set<number>;
  envoys: Map<number, number>;
}

export interface CivilizationDef {
  type: CivilizationType;
  name: string;
  leader: string;
  color: string;
  secondaryColor: string;
  ability: string;
  abilityDesc: string;
  uniqueUnit: UnitType;
  uniqueInfrastructure: string;
  startBias: { terrain?: TerrainType; feature?: FeatureType }[];
}

export interface TechDef {
  type: TechType;
  name: string;
  cost: number;
  era: string;
  prerequisites: TechType[];
  unlocks: string[];
  unlocksUnits: UnitType[];
  unlocksBuildings: BuildingType[];
  unlocksDistricts: DistrictType[];
  quote: string;
}

export interface CivicDef {
  type: CivicType;
  name: string;
  cost: number;
  era: string;
  prerequisites: CivicType[];
  unlocks: string[];
  unlocksBuildings?: BuildingType[];
  unlocksDistricts?: DistrictType[];
  unlocksGovernments: GovernmentType[];
  quote: string;
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  cost: number;
  maintenance: number;
  requiresDistrict: DistrictType | null;
  requiresTech: TechType | null;
  yields: Partial<YieldData>;
  description: string;
}

export interface DistrictDef {
  type: DistrictType;
  name: string;
  cost: number;
  yields: Partial<YieldData>;
  requiresTech: TechType | null;
  requiresCivic?: CivicType | null;
  maxPerCity: number;
  description: string;
}

export interface ResourceDef {
  type: ResourceType;
  name: string;
  category: ResourceCategory;
  yields: Partial<YieldData>;
  requiredTech?: TechType;
  terrains: TerrainType[];
  features: FeatureType[];
  description: string;
}

export interface TerrainDef {
  type: TerrainType;
  name: string;
  yields: YieldData;
  isWater: boolean;
  impassable: boolean;
  movementCost: number;
  defense: number;
}

export interface FeatureDef {
  type: FeatureType;
  name: string;
  yields: YieldData;
  removesTerrainYields: boolean;
  movementCost: number;
  defense: number;
  impassable?: boolean;
}
