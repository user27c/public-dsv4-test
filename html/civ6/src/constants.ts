import type { TerrainDef, FeatureDef, UnitDef, TechDef, CivicDef, BuildingDef, DistrictDef, ResourceDef, CivilizationDef, GovernmentType } from './types';
import {
  TerrainType,
  FeatureType,
  UnitType,
  TechType,
  CivicType,
  BuildingType,
  DistrictType,
  ResourceType,
  ResourceCategory,
  CivilizationType,
  UnitClass,
  UnitDomain,
  GovernmentType as GovType,
} from './types';

export const HEX_SIZE = 40;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const MAP_SEED = Math.floor(Math.random() * 2147483647);

export const CAMERA_ZOOM_MIN = 0.4;
export const CAMERA_ZOOM_MAX = 2.5;
export const CAMERA_PAN_SPEED = 800;
export const CAMERA_EDGE_SCROLL_SPEED = 600;
export const CAMERA_EDGE_SCROLL_MARGIN = 30;

export const RIVER_EDGES: { qOffset: number; rOffset: number; fromQ: number; fromR: number; toQ: number; toR: number }[] = [
  { qOffset: 1, rOffset: 0, fromQ: 0, fromR: 1, toQ: 1, toR: 0 },   // E
  { qOffset: 1, rOffset: -1, fromQ: 1, fromR: 0, toQ: 0, toR: -1 }, // SE
  { qOffset: 0, rOffset: -1, fromQ: 0, fromR: -1, toQ: 1, toR: 0 }, // SW
  { qOffset: -1, rOffset: 0, fromQ: -1, fromR: 0, toQ: 0, toR: 0 },
];

export const HEX_NEIGHBORS: [number, number][] = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
];

export const TERRAIN_DEFS: Record<TerrainType, TerrainDef> = {
  [TerrainType.GRASSLAND]: {
    type: TerrainType.GRASSLAND,
    name: '草原',
    yields: { food: 2, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: false,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
  [TerrainType.PLAINS]: {
    type: TerrainType.PLAINS,
    name: '平原',
    yields: { food: 1, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: false,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
  [TerrainType.DESERT]: {
    type: TerrainType.DESERT,
    name: '沙漠',
    yields: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: false,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
  [TerrainType.TUNDRA]: {
    type: TerrainType.TUNDRA,
    name: '冻土',
    yields: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: false,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
  [TerrainType.SNOW]: {
    type: TerrainType.SNOW,
    name: '雪地',
    yields: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: false,
    impassable: false,
    movementCost: 2,
    defense: 0,
  },
  [TerrainType.COAST]: {
    type: TerrainType.COAST,
    name: '近海',
    yields: { food: 1, production: 0, gold: 1, science: 0, culture: 0, faith: 0 },
    isWater: true,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
  [TerrainType.OCEAN]: {
    type: TerrainType.OCEAN,
    name: '远洋',
    yields: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    isWater: true,
    impassable: false,
    movementCost: 1,
    defense: 0,
  },
};

export const FEATURE_DEFS: Record<FeatureType, FeatureDef> = {
  [FeatureType.NONE]: {
    type: FeatureType.NONE,
    name: '',
    yields: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 0,
    defense: 0,
  },
  [FeatureType.FOREST]: {
    type: FeatureType.FOREST,
    name: '森林',
    yields: { food: 0, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 2,
    defense: 3,
  },
  [FeatureType.RAINFOREST]: {
    type: FeatureType.RAINFOREST,
    name: '雨林',
    yields: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 2,
    defense: 3,
  },
  [FeatureType.MARSH]: {
    type: FeatureType.MARSH,
    name: '沼泽',
    yields: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 3,
    defense: -2,
  },
  [FeatureType.FLOODPLAINS]: {
    type: FeatureType.FLOODPLAINS,
    name: '冲积平原',
    yields: { food: 3, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: true,
    movementCost: 1,
    defense: 0,
  },
  [FeatureType.MOUNTAINS]: {
    type: FeatureType.MOUNTAINS,
    name: '山脉',
    yields: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 99,
    defense: 0,
    impassable: true,
  },
  [FeatureType.HILLS]: {
    type: FeatureType.HILLS,
    name: '丘陵',
    yields: { food: 0, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: false,
    movementCost: 2,
    defense: 3,
  },
  [FeatureType.OASIS]: {
    type: FeatureType.OASIS,
    name: '绿洲',
    yields: { food: 3, production: 0, gold: 1, science: 0, culture: 0, faith: 0 },
    removesTerrainYields: true,
    movementCost: 1,
    defense: 0,
  },
};

export const UNIT_DEFS: UnitDef[] = [
  {
    type: UnitType.SETTLER, name: '开拓者', domain: UnitDomain.LAND, unitClass: UnitClass.CIVILIAN,
    cost: 80, maintenance: 0, moves: 2, combat: 0, rangedCombat: 0, range: 0, sight: 3,
    requiresTech: null, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.BUILDER, name: '建造者', domain: UnitDomain.LAND, unitClass: UnitClass.CIVILIAN,
    cost: 50, maintenance: 0, moves: 2, combat: 0, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: null, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.SCOUT, name: '侦察兵', domain: UnitDomain.LAND, unitClass: UnitClass.RECON,
    cost: 30, maintenance: 0, moves: 3, combat: 10, rangedCombat: 0, range: 0, sight: 3,
    requiresTech: null, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.WARRIOR, name: '勇士', domain: UnitDomain.LAND, unitClass: UnitClass.MELEE,
    cost: 40, maintenance: 1, moves: 2, combat: 20, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: null, upgradesTo: UnitType.SWORDSMAN, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.SLINGER, name: '投石兵', domain: UnitDomain.LAND, unitClass: UnitClass.RANGED,
    cost: 35, maintenance: 0, moves: 2, combat: 5, rangedCombat: 15, range: 1, sight: 2,
    requiresTech: null, upgradesTo: UnitType.ARCHER, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.ARCHER, name: '弓箭手', domain: UnitDomain.LAND, unitClass: UnitClass.RANGED,
    cost: 60, maintenance: 1, moves: 2, combat: 15, rangedCombat: 25, range: 2, sight: 2,
    requiresTech: TechType.ARCHERY, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.SPEARMAN, name: '长矛兵', domain: UnitDomain.LAND, unitClass: UnitClass.ANTI_CAVALRY,
    cost: 65, maintenance: 1, moves: 2, combat: 25, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.BRONZE_WORKING, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.SWORDSMAN, name: '剑士', domain: UnitDomain.LAND, unitClass: UnitClass.MELEE,
    cost: 90, maintenance: 2, moves: 2, combat: 35, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.IRON_WORKING, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.HORSEMAN, name: '骑手', domain: UnitDomain.LAND, unitClass: UnitClass.LIGHT_CAVALRY,
    cost: 80, maintenance: 2, moves: 4, combat: 36, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.HORSEBACK_RIDING, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.CHARIOT, name: '战车', domain: UnitDomain.LAND, unitClass: UnitClass.HEAVY_CAVALRY,
    cost: 65, maintenance: 1, moves: 3, combat: 28, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.WHEEL, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.CATAPULT, name: '投石机', domain: UnitDomain.LAND, unitClass: UnitClass.SIEGE,
    cost: 120, maintenance: 3, moves: 2, combat: 23, rangedCombat: 35, range: 2, sight: 1,
    requiresTech: TechType.ENGINEERING, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.GALLEY, name: '桨帆船', domain: UnitDomain.NAVAL, unitClass: UnitClass.NAVAL_MELEE,
    cost: 65, maintenance: 1, moves: 3, combat: 25, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.SAILING, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
  {
    type: UnitType.TRADER, name: '商人', domain: UnitDomain.LAND, unitClass: UnitClass.CIVILIAN,
    cost: 40, maintenance: 0, moves: 2, combat: 0, rangedCombat: 0, range: 0, sight: 2,
    requiresTech: TechType.CURRENCY, upgradesTo: null, replaces: null, uniqueCiv: null,
  },
];

export const TECH_DEFS: TechDef[] = [
  { type: TechType.POTTERY, name: '制陶术', cost: 25, era: 'ancient', prerequisites: [], unlocks: ['城市可建造粮仓'], unlocksUnits: [], unlocksBuildings: [BuildingType.GRANARY], unlocksDistricts: [], quote: '制陶是人类最早的化学工业。' },
  { type: TechType.ANIMAL_HUSBANDRY, name: '畜牧业', cost: 33, era: 'ancient', prerequisites: [], unlocks: ['允许牧民工作'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [], quote: '驯养动物是人类文明的基石。' },
  { type: TechType.MINING, name: '采矿业', cost: 33, era: 'ancient', prerequisites: [], unlocks: ['允许移除森林', '允许建造矿井'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [], quote: '那些能掘出石头的，值得我们钦佩。' },
  { type: TechType.SAILING, name: '航海术', cost: 45, era: 'ancient', prerequisites: [], unlocks: ['允许单位登船', '建造者可移除海上资源'], unlocksUnits: [UnitType.GALLEY], unlocksBuildings: [], unlocksDistricts: [DistrictType.HARBOR], quote: '海是危险的，但无海则无生机。' },
  { type: TechType.ASTROLOGY, name: '占星术', cost: 45, era: 'ancient', prerequisites: [], unlocks: ['允许建造圣地'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [DistrictType.HOLY_SITE], quote: '仰望星空的冲动，是文明的开端。' },
  { type: TechType.IRRIGATION, name: '灌溉术', cost: 45, era: 'ancient', prerequisites: [TechType.POTTERY], unlocks: ['允许建造种植园'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [], quote: '水是万物之源，引导水流即是引导生命。' },
  { type: TechType.WRITING, name: '文字', cost: 50, era: 'ancient', prerequisites: [TechType.POTTERY], unlocks: ['允许建造学院'], unlocksUnits: [], unlocksBuildings: [BuildingType.LIBRARY], unlocksDistricts: [DistrictType.CAMPUS], quote: '有文字者，有历史。' },
  { type: TechType.ARCHERY, name: '箭术', cost: 50, era: 'ancient', prerequisites: [TechType.ANIMAL_HUSBANDRY], unlocks: ['允许训练弓箭手'], unlocksUnits: [UnitType.ARCHER], unlocksBuildings: [], unlocksDistricts: [], quote: '弓与箭使人类成为远程猎手。' },
  { type: TechType.MASONRY, name: '石工术', cost: 60, era: 'ancient', prerequisites: [TechType.MINING], unlocks: ['允许建造城墙', '允许建造采石场'], unlocksUnits: [], unlocksBuildings: [BuildingType.WALLS], unlocksDistricts: [], quote: '砖石虽重，却是文明的基石。' },
  { type: TechType.BRONZE_WORKING, name: '青铜器', cost: 75, era: 'ancient', prerequisites: [TechType.MINING], unlocks: ['允许训练长矛兵', '显示铁矿'], unlocksUnits: [UnitType.SPEARMAN], unlocksBuildings: [], unlocksDistricts: [DistrictType.ENCAMPMENT], quote: '青铜铸就了第一个帝国。' },
  { type: TechType.WHEEL, name: '轮子', cost: 75, era: 'ancient', prerequisites: [TechType.MINING], unlocks: ['允许训练战车'], unlocksUnits: [UnitType.CHARIOT], unlocksBuildings: [BuildingType.WATER_MILL], unlocksDistricts: [], quote: '轮子的发明改变了人类移动和贸易的方式。' },
  { type: TechType.CELESTIAL_NAVIGATION, name: '天文导航', cost: 80, era: 'classical', prerequisites: [TechType.SAILING, TechType.ASTROLOGY], unlocks: ['海上单位视野+1'], unlocksUnits: [], unlocksBuildings: [BuildingType.LIGHTHOUSE], unlocksDistricts: [], quote: '以星辰为指引，人类征服海洋。' },
  { type: TechType.CURRENCY, name: '货币', cost: 80, era: 'classical', prerequisites: [TechType.WRITING], unlocks: ['允许训练商人', '允许建造商业中心'], unlocksUnits: [UnitType.TRADER], unlocksBuildings: [BuildingType.MARKET], unlocksDistricts: [DistrictType.COMMERCIAL_HUB], quote: '货币是文明的血液。' },
  { type: TechType.HORSEBACK_RIDING, name: '骑术', cost: 100, era: 'classical', prerequisites: [TechType.ARCHERY, TechType.WHEEL], unlocks: ['允许训练骑手'], unlocksUnits: [UnitType.HORSEMAN], unlocksBuildings: [], unlocksDistricts: [], quote: '当人骑上马背，文明开始奔驰。' },
  { type: TechType.IRON_WORKING, name: '冶铁术', cost: 120, era: 'classical', prerequisites: [TechType.BRONZE_WORKING], unlocks: ['允许训练剑士', '显示铁资源'], unlocksUnits: [UnitType.SWORDSMAN], unlocksBuildings: [], unlocksDistricts: [], quote: '铁锤落下，旧世界粉碎。' },
  { type: TechType.MATHEMATICS, name: '数学', cost: 100, era: 'classical', prerequisites: [TechType.WRITING], unlocks: ['所有城市+1科研'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [], quote: '数是宇宙的语言。' },
  { type: TechType.CONSTRUCTION, name: '建筑学', cost: 120, era: 'classical', prerequisites: [TechType.MASONRY, TechType.HORSEBACK_RIDING], unlocks: ['所有城市防御+5'], unlocksUnits: [], unlocksBuildings: [], unlocksDistricts: [], quote: '宏伟的建筑是文明的名片。' },
  { type: TechType.ENGINEERING, name: '工程学', cost: 140, era: 'classical', prerequisites: [TechType.MATHEMATICS, TechType.CONSTRUCTION], unlocks: ['允许训练投石机', '允许建造工业区'], unlocksUnits: [UnitType.CATAPULT], unlocksBuildings: [BuildingType.WORKSHOP], unlocksDistricts: [DistrictType.INDUSTRIAL_ZONE], quote: '工程学将梦想变成现实。' },
];

export const CIVIC_DEFS: CivicDef[] = [
  { type: CivicType.CODE_OF_LAWS, name: '法典', cost: 20, era: 'ancient', prerequisites: [], unlocks: ['解锁政体：酋邦'], unlocksGovernments: [GovType.CHIEFDOM], quote: '法者，治之端也。' },
  { type: CivicType.CRAFTMANSHIP, name: '手工艺', cost: 40, era: 'ancient', prerequisites: [CivicType.CODE_OF_LAWS], unlocks: ['所有城市+1生产力'], unlocksGovernments: [], quote: '动手即是文明。' },
  { type: CivicType.FOREIGN_TRADE, name: '对外贸易', cost: 40, era: 'ancient', prerequisites: [CivicType.CODE_OF_LAWS], unlocks: ['发现新大陆获得金币'], unlocksGovernments: [], quote: '贸易使陌生人成为朋友。' },
  { type: CivicType.MILITARY_TRADITION, name: '军事传统', cost: 50, era: 'ancient', prerequisites: [CivicType.CRAFTMANSHIP], unlocks: ['夹击+2战斗力'], unlocksGovernments: [], quote: '传统即力量。' },
  { type: CivicType.STATE_WORKFORCE, name: '国家劳动力', cost: 70, era: 'ancient', prerequisites: [CivicType.CRAFTMANSHIP], unlocks: ['建造者+1次数'], unlocksGovernments: [], quote: '组织起来的人民是最大的力量。' },
  { type: CivicType.EARLY_EMPIRE, name: '早期帝国', cost: 70, era: 'ancient', prerequisites: [CivicType.FOREIGN_TRADE], unlocks: ['解锁政体：寡头/独裁'], unlocksGovernments: [GovType.AUTOCRACY, GovType.OLIGARCHY], quote: '帝国从第一个殖民地开始。' },
  { type: CivicType.MYSTICISM, name: '神秘主义', cost: 50, era: 'ancient', prerequisites: [CivicType.FOREIGN_TRADE], unlocks: ['预言家点数+1'], unlocksGovernments: [], quote: '神秘引领信仰。' },
  { type: CivicType.GAMES_AND_RECREATION, name: '游戏与娱乐', cost: 80, era: 'classical', prerequisites: [CivicType.STATE_WORKFORCE], unlocks: ['解锁娱乐区域'], unlocksGovernments: [], quote: '忙碌的文明需要放松。' },
  { type: CivicType.POLITICAL_PHILOSOPHY, name: '政治哲学', cost: 80, era: 'classical', prerequisites: [CivicType.STATE_WORKFORCE, CivicType.EARLY_EMPIRE], unlocks: ['解锁政体：古典共和'], unlocksGovernments: [GovType.CLASSICAL_REPUBLIC], quote: '由谁来统治？这是我们永远的问题。' },
  { type: CivicType.DRAMA_AND_POETRY, name: '戏剧与诗歌', cost: 80, era: 'classical', prerequisites: [CivicType.MYSTICISM], unlocks: ['解锁剧院广场'], unlocksGovernments: [], unlocksBuildings: [], unlocksDistricts: [DistrictType.THEATER_SQUARE], quote: '戏剧是社会之镜。' },
];

export const BUILDING_DEFS: BuildingDef[] = [
  { type: BuildingType.MONUMENT, name: '纪念碑', cost: 60, maintenance: 0, requiresDistrict: DistrictType.CITY_CENTER, requiresTech: null, yields: { culture: 1, faith: 0, food: 0, production: 0, gold: 0, science: 0 }, description: '铭记历史，启迪未来。' },
  { type: BuildingType.GRANARY, name: '粮仓', cost: 65, maintenance: 0, requiresDistrict: DistrictType.CITY_CENTER, requiresTech: TechType.POTTERY, yields: { food: 1, faith: 0, culture: 0, production: 0, gold: 0, science: 0 }, description: '储备粮食，养活更多人口。' },
  { type: BuildingType.WATER_MILL, name: '水车', cost: 80, maintenance: 0, requiresDistrict: DistrictType.CITY_CENTER, requiresTech: TechType.WHEEL, yields: { food: 1, production: 1, faith: 0, culture: 0, gold: 0, science: 0 }, description: '用水力驱动生产。' },
  { type: BuildingType.WALLS, name: '城墙', cost: 80, maintenance: 0, requiresDistrict: DistrictType.CITY_CENTER, requiresTech: TechType.MASONRY, yields: { faith: 0, food: 0, production: 0, gold: 0, science: 0, culture: 0 }, description: '城市+50防御力。' },
  { type: BuildingType.LIBRARY, name: '图书馆', cost: 80, maintenance: 1, requiresDistrict: DistrictType.CAMPUS, requiresTech: TechType.WRITING, yields: { science: 2, faith: 0, food: 0, production: 0, gold: 0, culture: 0 }, description: '知识的殿堂。' },
  { type: BuildingType.SHRINE, name: '神龛', cost: 60, maintenance: 1, requiresDistrict: DistrictType.HOLY_SITE, requiresTech: null, yields: { faith: 2, science: 0, food: 0, production: 0, gold: 0, culture: 0 }, description: '信仰的起点。' },
  { type: BuildingType.MARKET, name: '市场', cost: 100, maintenance: 1, requiresDistrict: DistrictType.COMMERCIAL_HUB, requiresTech: TechType.CURRENCY, yields: { gold: 3, faith: 0, science: 0, food: 0, production: 0, culture: 0 }, description: '贸易的枢纽。' },
  { type: BuildingType.WORKSHOP, name: '工坊', cost: 100, maintenance: 1, requiresDistrict: DistrictType.INDUSTRIAL_ZONE, requiresTech: TechType.ENGINEERING, yields: { production: 2, faith: 0, science: 0, food: 0, gold: 0, culture: 0 }, description: '生产的核心。' },
  { type: BuildingType.AMPHITHEATER, name: '圆形剧场', cost: 100, maintenance: 1, requiresDistrict: DistrictType.THEATER_SQUARE, requiresTech: null, yields: { culture: 2, faith: 0, science: 0, food: 0, production: 0, gold: 0 }, description: '文化传播的舞台。' },
  { type: BuildingType.BARRACKS, name: '兵营', cost: 80, maintenance: 1, requiresDistrict: DistrictType.ENCAMPMENT, requiresTech: null, yields: { production: 1, faith: 0, science: 0, food: 0, gold: 0, culture: 0 }, description: '训练士兵的基地。' },
  { type: BuildingType.LIGHTHOUSE, name: '灯塔', cost: 100, maintenance: 1, requiresDistrict: DistrictType.HARBOR, requiresTech: TechType.CELESTIAL_NAVIGATION, yields: { food: 1, gold: 1, faith: 0, science: 0, production: 0, culture: 0 }, description: '指引航海的明灯。' },
];

export const DISTRICT_DEFS: DistrictDef[] = [
  { type: DistrictType.CITY_CENTER, name: '市中心', cost: 0, yields: {}, requiresTech: null, maxPerCity: 1, description: '城市的中心。' },
  { type: DistrictType.CAMPUS, name: '学院', cost: 54, yields: { science: 2 }, requiresTech: TechType.WRITING, maxPerCity: 1, description: '科研的中心。' },
  { type: DistrictType.HOLY_SITE, name: '圣地', cost: 54, yields: { faith: 2 }, requiresTech: TechType.ASTROLOGY, maxPerCity: 1, description: '信仰的中心。' },
  { type: DistrictType.COMMERCIAL_HUB, name: '商业中心', cost: 54, yields: { gold: 2 }, requiresTech: TechType.CURRENCY, maxPerCity: 1, description: '贸易的中心。' },
  { type: DistrictType.INDUSTRIAL_ZONE, name: '工业区', cost: 54, yields: { production: 2 }, requiresTech: TechType.ENGINEERING, maxPerCity: 1, description: '生产的中心。' },
  { type: DistrictType.THEATER_SQUARE, name: '剧院广场', cost: 54, yields: { culture: 2 }, requiresTech: null, maxPerCity: 1, description: '文化的中心。', requiresCivic: CivicType.DRAMA_AND_POETRY },
  { type: DistrictType.ENCAMPMENT, name: '兵营', cost: 54, yields: { production: 1 }, requiresTech: TechType.BRONZE_WORKING, maxPerCity: 1, description: '军事的中心。' },
  { type: DistrictType.HARBOR, name: '港口', cost: 54, yields: { gold: 1, food: 1 }, requiresTech: TechType.SAILING, maxPerCity: 1, description: '海事的中心。' },
];

export const RESOURCE_DEFS: ResourceDef[] = [
  { type: ResourceType.WHEAT, name: '小麦', category: ResourceCategory.BONUS, yields: { food: 1 }, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS], features: [FeatureType.FLOODPLAINS], description: '粮食资源。' },
  { type: ResourceType.CATTLE, name: '牛', category: ResourceCategory.BONUS, yields: { food: 1 }, terrains: [TerrainType.GRASSLAND], features: [], description: '提供肉和皮革。' },
  { type: ResourceType.RICE, name: '大米', category: ResourceCategory.BONUS, yields: { food: 1 }, terrains: [TerrainType.GRASSLAND], features: [FeatureType.MARSH], description: '湿润地区的主粮。' },
  { type: ResourceType.MAIZE, name: '玉米', category: ResourceCategory.BONUS, yields: { gold: 2 }, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS], features: [], description: '高产作物。' },
  { type: ResourceType.STONE, name: '石料', category: ResourceCategory.BONUS, yields: { production: 1 }, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS, TerrainType.DESERT, TerrainType.TUNDRA], features: [], description: '建筑基础材料。' },
  { type: ResourceType.FISH, name: '鱼群', category: ResourceCategory.BONUS, yields: { food: 1 }, terrains: [TerrainType.COAST], features: [], description: '近海渔业资源。' },
  { type: ResourceType.BANANAS, name: '香蕉', category: ResourceCategory.BONUS, yields: { food: 1 }, terrains: [TerrainType.GRASSLAND], features: [FeatureType.RAINFOREST], description: '热带水果。' },
  { type: ResourceType.DEER, name: '鹿', category: ResourceCategory.BONUS, yields: { production: 1 }, terrains: [TerrainType.TUNDRA, TerrainType.GRASSLAND], features: [FeatureType.FOREST], description: '提供皮毛和肉。' },
  { type: ResourceType.HORSES, name: '马匹', category: ResourceCategory.STRATEGIC, yields: { food: 1, production: 1 }, requiredTech: TechType.ANIMAL_HUSBANDRY, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS], features: [], description: '战略资源，用于训练骑兵。' },
  { type: ResourceType.IRON, name: '铁矿', category: ResourceCategory.STRATEGIC, yields: { science: 1 }, requiredTech: TechType.BRONZE_WORKING, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS, TerrainType.DESERT, TerrainType.TUNDRA], features: [], description: '战略资源，用于训练剑士。' },
  { type: ResourceType.NITER, name: '硝石', category: ResourceCategory.STRATEGIC, yields: { production: 1 }, requiredTech: TechType.MATHEMATICS, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS, TerrainType.DESERT], features: [], description: '火药的关键成分。' },
  { type: ResourceType.WINE, name: '葡萄酒', category: ResourceCategory.LUXURY, yields: { gold: 1, food: 1 }, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS], features: [], description: '奢侈资源，提供宜居度。' },
  { type: ResourceType.SPICES, name: '香料', category: ResourceCategory.LUXURY, yields: { food: 2 }, terrains: [TerrainType.GRASSLAND, TerrainType.PLAINS], features: [FeatureType.RAINFOREST], description: '奢侈资源，古代黄金。' },
  { type: ResourceType.IVORY, name: '象牙', category: ResourceCategory.LUXURY, yields: { gold: 1, production: 1 }, terrains: [TerrainType.PLAINS], features: [], description: '奢侈资源。' },
  { type: ResourceType.SILK, name: '丝绸', category: ResourceCategory.LUXURY, yields: { culture: 1 }, terrains: [TerrainType.GRASSLAND], features: [FeatureType.FOREST], description: '奢侈资源。' },
  { type: ResourceType.SILVER, name: '白银', category: ResourceCategory.LUXURY, yields: { gold: 3 }, terrains: [TerrainType.DESERT, TerrainType.TUNDRA], features: [], description: '奢侈资源。' },
  { type: ResourceType.FURS, name: '毛皮', category: ResourceCategory.LUXURY, yields: { gold: 1, food: 1 }, terrains: [TerrainType.TUNDRA, TerrainType.GRASSLAND], features: [FeatureType.FOREST], description: '奢侈资源。' },
  { type: ResourceType.DYES, name: '染料', category: ResourceCategory.LUXURY, yields: { faith: 1 }, terrains: [TerrainType.GRASSLAND], features: [FeatureType.RAINFOREST, FeatureType.FOREST], description: '奢侈资源。' },
  { type: ResourceType.INCENSE, name: '熏香', category: ResourceCategory.LUXURY, yields: { faith: 1, culture: 1 }, terrains: [TerrainType.DESERT, TerrainType.PLAINS], features: [], description: '奢侈资源。' },
  { type: ResourceType.PEARLS, name: '珍珠', category: ResourceCategory.LUXURY, yields: { gold: 1, faith: 1 }, terrains: [TerrainType.COAST], features: [], description: '奢侈资源。' },
  { type: ResourceType.WHALES, name: '鲸鱼', category: ResourceCategory.LUXURY, yields: { gold: 1, production: 1 }, terrains: [TerrainType.COAST, TerrainType.OCEAN], features: [], description: '奢侈资源。' },
];

export const CIVILIZATION_DEFS: CivilizationDef[] = [
  {
    type: CivilizationType.ROME,
    name: '罗马',
    leader: '图拉真',
    color: '#8B1C4C',
    secondaryColor: '#FFD700',
    ability: '条条大路通罗马',
    abilityDesc: '建立或征服城市时自动获得贸易站。城市初始拥有纪念碑。',
    uniqueUnit: UnitType.SWORDSMAN,
    uniqueInfrastructure: '浴场',
    startBias: [],
  },
  {
    type: CivilizationType.CHINA,
    name: '中国',
    leader: '秦始皇',
    color: '#1A5C2A',
    secondaryColor: '#FFD700',
    ability: '始皇帝',
    abilityDesc: '建造者使用次数+1。建造者可用于加速远古和古典时代奇观（15%）。',
    uniqueUnit: UnitType.CHARIOT,
    uniqueInfrastructure: '长城',
    startBias: [],
  },
  {
    type: CivilizationType.EGYPT,
    name: '埃及',
    leader: '克里奥帕特拉',
    color: '#1C4E80',
    secondaryColor: '#DAA520',
    ability: '尼罗河的赠礼',
    abilityDesc: '沿河建造区域和奇观+15%生产力。冲积平原不会阻止区域建造。',
    uniqueUnit: UnitType.CHARIOT,
    uniqueInfrastructure: '狮身人面像',
    startBias: [{ feature: FeatureType.FLOODPLAINS }],
  },
  {
    type: CivilizationType.GREECE,
    name: '希腊',
    leader: '伯里克利',
    color: '#3C8DAD',
    secondaryColor: '#FFFFFF',
    ability: '柏拉图的理想国',
    abilityDesc: '每完成一个政体槽位额外获得一个通配符槽位。',
    uniqueUnit: UnitType.SPEARMAN,
    uniqueInfrastructure: '卫城',
    startBias: [{ terrain: TerrainType.GRASSLAND }],
  },
  {
    type: CivilizationType.JAPAN,
    name: '日本',
    leader: '北条时宗',
    color: '#8B0000',
    secondaryColor: '#FFFFFF',
    ability: '明治维新',
    abilityDesc: '区域相邻每个其他区域+1相应产出。',
    uniqueUnit: UnitType.WARRIOR,
    uniqueInfrastructure: '电子工厂',
    startBias: [{ terrain: TerrainType.COAST }],
  },
];

export const CITY_NAMES: Record<CivilizationType, string[]> = {
  [CivilizationType.ROME]: ['罗马', '奥斯提亚', '安提乌姆', '库迈', '尼波利斯', '拉文纳', '雅典', '叙拉古', '威尼斯', '米兰'],
  [CivilizationType.CHINA]: ['西安', '北京', '上海', '广州', '成都', '杭州', '南京', '洛阳', '开封', '扬州'],
  [CivilizationType.EGYPT]: ['底比斯', '孟菲斯', '赫利奥波利斯', '亚历山大', '卢克索', '阿斯旺', '阿比多斯', '丹德拉', '埃德富', '法尤姆'],
  [CivilizationType.GREECE]: ['雅典', '斯巴达', '科林斯', '底比斯', '阿尔戈斯', '迈锡尼', '德尔斐', '奥林匹亚', '埃皮达鲁斯', '马拉松'],
  [CivilizationType.JAPAN]: ['京都', '东京', '大阪', '长崎', '奈良', '仙台', '广岛', '横滨', '神户', '札幌'],
};

export const CITY_FOOD_PER_CITIZEN = 2;
export const CITY_MIN_RANGE = 3;

export const COMBAT_BONUS_FLANKING = 2;
export const COMBAT_BONUS_SUPPORT = 2;
export const COMBAT_BONUS_RIVER = 5;
export const COMBAT_BONUS_FORTIFIED = 3;
export const COMBAT_BONUS_FORTIFIED_TWO = 6;
export const COMBAT_EXP_MELEE = 5;
export const COMBAT_EXP_RANGED = 2;
export const COMBAT_EXP_LEVELS = [0, 15, 45, 90, 150];

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.GRASSLAND]: '#568A3D',
  [TerrainType.PLAINS]: '#B5A642',
  [TerrainType.DESERT]: '#D4C582',
  [TerrainType.TUNDRA]: '#8D9F80',
  [TerrainType.SNOW]: '#E0E4E8',
  [TerrainType.COAST]: '#4A90C4',
  [TerrainType.OCEAN]: '#265D85',
};

export const TERRAIN_COLORS_LIGHT: Record<TerrainType, string> = {
  [TerrainType.GRASSLAND]: '#7BA64A',
  [TerrainType.PLAINS]: '#D4BF60',
  [TerrainType.DESERT]: '#EADB9D',
  [TerrainType.TUNDRA]: '#A5B599',
  [TerrainType.SNOW]: '#F4F4F8',
  [TerrainType.COAST]: '#69AAE0',
  [TerrainType.OCEAN]: '#3A7AA5',
};

export const MOUNTAIN_COLOR = '#8B8378';
export const MOUNTAIN_PEAK_COLOR = '#C5C0B8';
export const FOREST_COLOR = '#2D5A1E';
export const RAINFOREST_COLOR = '#1B4A0F';
export const MARSH_COLOR = '#4A6741';
export const RIVER_COLOR = '#5599CC';
export const FOG_COLOR = 'rgba(0, 0, 0, 0.6)';
export const EXPLORED_FOG_COLOR = 'rgba(0, 0, 0, 0.3)';
export const GRID_COLOR = 'rgba(0, 0, 0, 0.15)';
export const SELECTED_COLOR = 'rgba(255, 255, 255, 0.8)';
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)';
export const BORDER_COLOR = 'rgba(0, 0, 0, 0.5)';
export const MOVE_RANGE_COLOR = 'rgba(100, 160, 255, 0.35)';
export const ATTACK_RANGE_COLOR = 'rgba(255, 80, 60, 0.35)';
export const CITY_BANNER_BG = 'rgba(20, 20, 20, 0.85)';
export const CITY_BANNER_TEXT = '#FFFFFF';

export const PLAYER_COLORS: string[] = [
  '#1A5C2A', '#8B1C4C', '#1C4E80', '#8B0000', '#3C8DAD',
];
export const PLAYER_NAMES: Record<number, string> = {
  1: 'AI 1',
  2: 'AI 2',
  3: 'AI 3',
};
