import { Entity, EntityManager } from '../entity/Entity.ts';
import { Owner, EntityKind, TileData, CommandType, TileTerrain } from '../types.ts';
import { MAP_W, MAP_H, STARTING_CREDITS } from '../constants.ts';
import { findPath } from '../pathing/AStar.ts';
import { isPassable } from '../map/MapData.ts';
import { UNIT_DEFS } from '../tech/UnitDefs.ts';
import { BUILDING_DEFS } from '../tech/BldgDefs.ts';
import { randomInt, nextEntityId, manhattan } from '../utils.ts';

export interface AIState {
  credits: number;
  powerGenerated: number;
  powerUsed: number;
  baseCenterX: number;
  baseCenterY: number;
  attackWaveSize: number;
  attackTimer: number;
  buildTimer: number;
  nextUnitType: string;
  nextBuildingId: string;
  buildingQueue: string[];
  unitQueue: string[];
  difficulty: number;
  attackCooldown: number;
}

export function createAIState(cx: number, cy: number, diff: number): AIState {
  return {
    credits: STARTING_CREDITS,
    powerGenerated: 0,
    powerUsed: 0,
    baseCenterX: cx,
    baseCenterY: cy,
    attackWaveSize: 3 + diff,
    attackTimer: 0,
    buildTimer: 0,
    nextUnitType: '',
    nextBuildingId: '',
    buildingQueue: [],
    unitQueue: [],
    difficulty: diff,
    attackCooldown: 300 + (1 - diff) * 200,
  };
}

export function updateAI(
  state: AIState,
  owner: Owner,
  entityMgr: EntityManager,
  tiles: TileData[][],
  dt: number,
  playerOwner: Owner,
): void {
  const buildings = entityMgr.getByOwner(owner).filter(e => e.kind === EntityKind.Building && e.alive);
  const units = entityMgr.getByOwner(owner).filter(e =>
    e.kind !== EntityKind.Building && e.kind !== EntityKind.Projectile && e.alive);
  const harvesters = units.filter(e => e.typeId === 'harv' || e.typeId === 'harvA');
  const combat = units.filter(e =>
    e.kind !== EntityKind.Building && e.damage > 0 && e.alive &&
    (e.typeId !== 'harv' && e.typeId !== 'harvA'));

  state.powerGenerated = buildings.reduce((s, b) => {
    const def = BUILDING_DEFS[b.typeId];
    return s + (def ? Math.max(0, def.power) : 0);
  }, 0);
  state.powerUsed = buildings.reduce((s, b) => {
    const def = BUILDING_DEFS[b.typeId];
    return s + (def ? Math.max(0, -def.power) : 0);
  }, 0);

  updateHarvesters(harvesters, entityMgr, tiles, state);

  const hasCY = buildings.some(b => b.typeId === 'gacnst' || b.typeId === 'nacnst');
    const hasPower = buildings.some(b => b.typeId === 'gapowr' || b.typeId === 'napowr' ||
      b.typeId === 'gapowr2' || b.typeId === 'nanucl');
  const hasRef = buildings.some(b => b.typeId === 'garef' || b.typeId === 'naref');
  const hasBarracks = buildings.some(b => b.typeId === 'gabar' || b.typeId === 'nahand');
  const hasWar = buildings.some(b => b.typeId === 'gaweap' || b.typeId === 'naweap');
  const hasRadar = buildings.some(b => b.typeId === 'gaspysat' || b.typeId === 'napsyc');
  const hasTech = buildings.some(b => b.typeId === 'gatech' || b.typeId === 'natech');
  const hasAir = buildings.some(b => b.typeId === 'gaairc' || b.typeId === 'naaric');

  state.buildTimer -= dt * 30;
  if (state.buildTimer <= 0) {
    state.buildTimer = 60 + Math.random() * 120;

    if (!hasCY) return;
    if (!hasPower) {
      tryBuildAI(owner, 'gapowr', entityMgr, tiles, state);
      return;
    }
    if (!hasRef && state.credits >= 2000) {
      tryBuildAI(owner, 'garef', entityMgr, tiles, state);
      return;
    }
    if (!hasBarracks && state.credits >= 500) {
      tryBuildAI(owner, 'gabar', entityMgr, tiles, state);
      return;
    }
    if (!hasWar && state.credits >= 2000) {
      tryBuildAI(owner, 'gaweap', entityMgr, tiles, state);
      return;
    }
    if (!hasRadar && state.credits >= 1500) {
      tryBuildAI(owner, 'gaspysat', entityMgr, tiles, state);
      return;
    }
    if (!hasAir && state.credits >= 1500 && hasRadar) {
      tryBuildAI(owner, 'gaairc', entityMgr, tiles, state);
      return;
    }

    if (hasPower && state.powerGenerated < state.powerUsed + 50 && state.credits >= 600) {
      const pwrId = owner === Owner.Allies ? 'gapowr2' : 'nanucl';
      tryBuildAI(owner, pwrId, entityMgr, tiles, state);
      if (owner !== Owner.Allies && hasTech) return;
    }

    if (hasBarracks && state.credits >= 200) {
      const faction = owner === Owner.Allies ? 'allies' : 'soviet';
      const ids = faction === 'allies'
        ? ['gi', 'gi', 'gg', 'e1']
        : ['cons', 'cons', 'flak', 'e1'];
      const uid = ids[Math.floor(Math.random() * ids.length)];
      const def = UNIT_DEFS[uid];
      if (def && state.credits >= def.cost) {
        const building = entityMgr.findByType(owner, faction === 'allies' ? 'gabar' : 'nahand')[0];
        if (building) {
          spawnUnitAI(owner, uid, building.cellX + 2, building.cellY + 2, entityMgr, tiles, state);
        }
      }
    }

    if (hasWar && state.credits >= 700) {
      const faction = owner === Owner.Allies ? 'allies' : 'soviet';
      const ids = faction === 'allies'
        ? ['griz', 'griz', 'ifv', 'prsm', 'harvA']
        : ['htk', 'htk', 'ftrk', 'apoc', 'v3'];
      const uid = ids[Math.floor(Math.random() * ids.length)];
      const def = UNIT_DEFS[uid];
      if (def && state.credits >= def.cost) {
        const building = entityMgr.findByType(owner, faction === 'allies' ? 'gaweap' : 'naweap')[0];
        if (building) {
          spawnUnitAI(owner, uid, building.cellX + 3, building.cellY + 2, entityMgr, tiles, state);
        }
      }
    }
  }

  // Attack logic
  state.attackTimer -= dt * 30;
  if (combat.length >= state.attackWaveSize && state.attackTimer <= 0) {
    state.attackTimer = state.attackCooldown;
    launchAIAtack(combat, entityMgr, tiles, playerOwner);
  }
}

function tryBuildAI(
  owner: Owner,
  buildingId: string,
  entityMgr: EntityManager,
  tiles: TileData[][],
  state: AIState,
): void {
  const def = BUILDING_DEFS[buildingId];
  if (!def) return;

  const factionBuildingId = getFactionBuildingId(buildingId, owner);
  const factionDef = BUILDING_DEFS[factionBuildingId];
  if (!factionDef) return;

  if (state.credits < factionDef.cost) return;

  const bx = state.baseCenterX + randomInt(-5, 5);
  const by = state.baseCenterY + randomInt(-5, 5);

  if (!canPlaceBuilding(tiles, bx, by, factionDef.width, factionDef.height)) {
    return;
  }

  state.credits -= factionDef.cost;

  const building = new Entity(nextEntityId(), EntityKind.Building, owner, factionBuildingId, factionDef.hp, 0);
  building.setPosition(bx + factionDef.width / 2, by + factionDef.height / 2);
  building.cellX = Math.floor(bx);
  building.cellY = Math.floor(by);
  building.width = factionDef.width;
  building.height = factionDef.height;
  building.sightRange = factionDef.sight;
  building.armorType = factionDef.armor;
  if (factionDef.isDefense) {
    building.damage = factionDef.defenseDamage || 0;
    building.attackRange = factionDef.defenseRange || 5;
    building.rof = factionDef.defenseRof || 30;
  }

  markBuildingTiles(tiles, bx, by, factionDef.width, factionDef.height);
  entityMgr.add(building);
}

function getFactionBuildingId(id: string, owner: Owner): string {
  if (id === 'gacnst') return owner === Owner.Allies ? 'gacnst' : 'nacnst';
  if (id === 'gapowr') return owner === Owner.Allies ? 'gapowr' : 'napowr';
  if (id === 'gapowr2') return owner === Owner.Allies ? 'gapowr2' : 'nanucl';
  if (id === 'gabar') return owner === Owner.Allies ? 'gabar' : 'nahand';
  if (id === 'garef') return owner === Owner.Allies ? 'garef' : 'naref';
  if (id === 'gaweap') return owner === Owner.Allies ? 'gaweap' : 'naweap';
  if (id === 'gaairc') return owner === Owner.Allies ? 'gaairc' : 'naaric';
  if (id === 'gaspysat') return owner === Owner.Allies ? 'gaspysat' : 'napsyc';
  if (id === 'nanucl') return 'nanucl';
  return id;
}

function spawnUnitAI(
  owner: Owner,
  unitId: string,
  spawnX: number, spawnY: number,
  entityMgr: EntityManager,
  tiles: TileData[][],
  state: AIState,
): void {
  const def = UNIT_DEFS[unitId];
  if (!def) return;
  if (state.credits < def.cost) return;

  const factionUnitId = getFactionUnitId(unitId, owner);
  const factionDef = UNIT_DEFS[factionUnitId];
  if (!factionDef) return;

  if (state.credits < factionDef.cost) return;

  state.credits -= factionDef.cost;

  const kind = def.kind === 'infantry' ? EntityKind.Infantry
    : def.kind === 'vehicle' ? EntityKind.Vehicle
    : def.kind === 'aircraft' ? EntityKind.Aircraft
    : EntityKind.Naval;

  const entity = new Entity(nextEntityId(), kind, owner, factionUnitId, factionDef.hp, factionDef.speed);
  entity.setPosition(spawnX, spawnY);
  entity.sightRange = factionDef.sight;
  entity.damage = factionDef.damage;
  entity.attackRange = factionDef.attackRange;
  entity.rof = factionDef.rof;
  entity.armorType = factionDef.armor;
  entityMgr.add(entity);

  // Send scouting/attack waypoint
  const playerBuildings = entityMgr.getByOwner(owner === Owner.Allies ? Owner.Soviets : Owner.Allies)
    .filter(e => e.kind === EntityKind.Building && e.alive);
  if (playerBuildings.length > 0) {
    const target = playerBuildings[Math.floor(Math.random() * playerBuildings.length)];
    entity.moveTarget = { x: target.cellX, y: target.cellY };
    entity.isMoving = true;
    const path = findPath(tiles, entity.cellX, entity.cellY, target.cellX, target.cellY, false,
      kind === EntityKind.Aircraft);
    if (path) entity.movePath = path;
  }
}

function getFactionUnitId(id: string, owner: Owner): string {
  if (owner === Owner.Soviets) {
    const map: Record<string, string> = {
      'gi': 'cons', 'gg': 'flak', 'e1': 'e1', 'adog': 'e1', 'tany': 'bori',
      'rock': 'schp', 'griz': 'htk', 'ifv': 'ftrk', 'mtnk': 'ftrk',
      'prsm': 'apoc', 'cmn': 'harv', 'harv': 'harv', 'mcv': 'mcv',
      'jump': 'schp', 'harvA': 'harv',
    };
    return map[id] || id;
  }
  const map: Record<string, string> = {
    'cons': 'gi', 'flak': 'gi', 'tesl': 'tany', 'deso': 'tany', 'bori': 'tany',
    'civa': 'gg', 'htk': 'griz', 'ftrk': 'ifv', 'apoc': 'prsm', 'v3': 'ifv',
    'terr': 'griz', 'zep': 'jump', 'schp': 'jump',
  };
  return map[id] || id;
}

function launchAIAtack(
  combat: Entity[],
  entityMgr: EntityManager,
  tiles: TileData[][],
  playerOwner: Owner,
): void {
  const attackerUnits = combat.slice(0, Math.min(combat.length, 8));
  const playerBuildings = entityMgr.getByOwner(playerOwner)
    .filter(e => e.kind === EntityKind.Building && e.alive &&
      e.typeId !== 'gawall' && e.typeId !== 'nawall');

  if (playerBuildings.length === 0) return;

  const target = playerBuildings[Math.floor(Math.random() * playerBuildings.length)];

  for (const unit of attackerUnits) {
    unit.moveTarget = { x: target.cellX, y: target.cellY };
    unit.isMoving = true;
    const path = findPath(tiles, unit.cellX, unit.cellY, target.cellX, target.cellY,
      unit.kind === EntityKind.Naval, unit.kind === EntityKind.Aircraft);
    if (path) unit.movePath = path;
  }
}

function updateHarvesters(
  harvesters: Entity[],
  entityMgr: EntityManager,
  tiles: TileData[][],
  state: AIState,
): void {
  for (const harv of harvesters) {
    if (!harv.alive) continue;

    if (harv.isMoving || harv.movePath.length > 0) continue;

    const refineries = entityMgr.getByOwner(harv.owner)
      .filter(e => e.kind === EntityKind.Building && e.alive &&
        (e.typeId === 'garef' || e.typeId === 'naref'));

    if (refineries.length === 0) continue;

    const refinery = findNearest(harv, refineries);
    if (!refinery) continue;

    const nearRefinery = manhattan(
      { x: harv.cellX, y: harv.cellY },
      { x: refinery.cellX, y: refinery.cellY },
    ) <= 3;

    if (nearRefinery) {
      // Deposit and get next ore target
      state.credits += 500;
      const oreTile = findNearestOre(tiles, harv.cellX, harv.cellY, 30);
      if (oreTile) {
        if (tiles[oreTile.y][oreTile.x].oreAmount > 0) {
          tiles[oreTile.y][oreTile.x].oreAmount--;
          if (tiles[oreTile.y][oreTile.x].oreAmount <= 0) {
            tiles[oreTile.y][oreTile.x].terrain = TileTerrain.Clear;
          }
        }
        harv.moveTarget = { x: oreTile.x, y: oreTile.y };
        harv.isMoving = true;
        const path = findPath(tiles, harv.cellX, harv.cellY, oreTile.x, oreTile.y, false, false);
        if (path) harv.movePath = path;
      }
    } else {
      // Go to refinery
      harv.moveTarget = { x: refinery.cellX + refinery.width / 2, y: refinery.cellY + refinery.height / 2 };
      harv.isMoving = true;
      const path = findPath(tiles, harv.cellX, harv.cellY,
        refinery.cellX + Math.floor(refinery.width / 2),
        refinery.cellY + Math.floor(refinery.height / 2), false, false);
      if (path) harv.movePath = path;
    }
  }
}

function findNearest(entity: Entity, targets: Entity[]): Entity | undefined {
  let best: Entity | undefined;
  let minDist = Infinity;
  for (const t of targets) {
    const d = manhattan(
      { x: entity.cellX, y: entity.cellY },
      { x: t.cellX, y: t.cellY },
    );
    if (d < minDist) { minDist = d; best = t; }
  }
  return best;
}

function findNearestOre(
  tiles: TileData[][],
  cx: number, cy: number, searchRadius: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let minDist = Infinity;
  for (let y = Math.max(0, cy - searchRadius); y < Math.min(MAP_H, cy + searchRadius); y++) {
    for (let x = Math.max(0, cx - searchRadius); x < Math.min(MAP_W, cx + searchRadius); x++) {
      const tile = tiles[y]?.[x];
      if (!tile) continue;
      if ((tile.terrain === TileTerrain.Ore || tile.terrain === TileTerrain.Gems) && tile.oreAmount > 0) {
        const d = Math.abs(x - cx) + Math.abs(y - cy);
        if (d < minDist) { minDist = d; best = { x, y }; }
      }
    }
  }
  return best;
}

export function canPlaceBuilding(
  tiles: TileData[][],
  x: number, y: number,
  w: number, h: number,
): boolean {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
      const tile = tiles[ty][tx];
      if (!tile || tile.occupied) return false;
      if (tile.terrain === TileTerrain.Water || tile.terrain === TileTerrain.Cliff ||
          tile.terrain === TileTerrain.Rock) return false;
    }
  }
  return true;
}

export function markBuildingTiles(
  tiles: TileData[][],
  x: number, y: number,
  w: number, h: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H) {
        tiles[ty][tx].occupied = true;
      }
    }
  }
}
