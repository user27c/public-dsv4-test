import {
  GAME_WIDTH, GAME_HEIGHT, STARTING_CREDITS, MAP_W, MAP_H,
  TILE_HALF_W, TILE_HALF_H, CAMERA_SPEED, CAMERA_EDGE_SCROLL,
  FOG_VISIBLE, VETERANCY_DMG_MULT, VETERANCY_HP_MULT,
  VETERANCY_SPEED_MULT, VETERANCY_ROF_MULT, COUNTRY_COLORS,
} from '../constants.ts';
import { Owner, Country, EntityKind, TileData, CommandType, Command, TileTerrain, EntityState } from '../types.ts';
import { Camera } from './Camera.ts';
import { Input } from './Input.ts';
import { Renderer, Effect } from './Renderer.ts';
import { Entity, EntityManager } from '../entity/Entity.ts';
import { createMapData, isPassable } from '../map/MapData.ts';
import { findPath } from '../pathing/AStar.ts';
import { isoToScreen, screenToIso, directionToFacing, lerp, randomInt, randomFloat, nextEntityId, clamp, manhattan } from '../utils.ts';
import { UNIT_DEFS } from '../tech/UnitDefs.ts';
import { BUILDING_DEFS, BUILDING_CATEGORIES } from '../tech/BldgDefs.ts';
import { updateAI, createAIState, AIState, canPlaceBuilding, markBuildingTiles } from '../ai/AICtrl.ts';
import { renderTile, renderShroud, renderExploredOverlay } from '../map/TileRender.ts';
import {
  drawTank, drawInfantry, drawBuilding, drawHarvester, drawAircraft,
  drawHealthBar, drawSelectionCircle, drawSelectionBox,
  drawConstructionYard, drawPowerPlant, drawBarracks,
  drawRefinery, drawWarFactory, drawOreMine, drawAirField, drawDefenseStructure,
  drawExplosion, drawOreParticle,
} from '../draw/Primitives.ts';

const TICK_RATE = 30;
const TICK_DURATION = 1 / TICK_RATE;

export class Game {
  canvas: HTMLCanvasElement;
  camera: Camera;
  input: Input;
  renderer: Renderer;
  entityMgr: EntityManager;
  tiles: TileData[][];

  playerCredits = STARTING_CREDITS;
  playerPowerGenerated = 0;
  playerPowerUsed = 0;
  playerCountry: Country = Country.America;
  playerOwner = Owner.Allies;

  enemyCountry: Country = Country.Russia;
  enemyOwner = Owner.Soviets;

  effects: Effect[] = [];
  accumulator = 0;
  lastTime = 0;
  running = false;

  playerAI: AIState;
  enemyAI: AIState;

  sidebarTab = 0;
  placingBuilding: string | null = null;
  placingBuildingDef: any = null;

  messages: string[] = [];
  messageTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new Camera();
    this.input = new Input(canvas);
    this.entityMgr = new EntityManager();
    this.renderer = new Renderer(canvas, this.camera);
    this.tiles = createMapData();

    this.playerAI = createAIState(MAP_W / 2 - 15, MAP_H / 2 - 5, 1);
    this.enemyAI = createAIState(MAP_W / 2 + 15, MAP_H / 2 + 5, 0.6);

    this.resize();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.setupGame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private setupGame(): void {
    const px = Math.floor(MAP_W / 2 - 15);
    const py = Math.floor(MAP_H / 2 - 5);
    this.placeBaseStructure(this.playerOwner, 'gacnst', px, py);
    this.playerCredits = STARTING_CREDITS;

    const ex = Math.floor(MAP_W / 2 + 15);
    const ey = Math.floor(MAP_H / 2 + 5);
    this.placeBaseStructure(this.enemyOwner, 'nacnst', ex, ey);
    this.enemyAI.credits = STARTING_CREDITS;

    this.spawnUnitForAI(this.playerOwner, 'harvA', px + 3, py + 2);
    this.spawnUnitForAI(this.enemyOwner, 'harv', ex + 3, ey + 2);

    this.camera.centerOn({ x: MAP_W / 2, y: MAP_H / 2 });
  }

  private placeBaseStructure(owner: Owner, typeId: string, x: number, y: number): void {
    const def = BUILDING_DEFS[typeId];
    if (!def) return;

    const e = new Entity(nextEntityId(), EntityKind.Building, owner, typeId, def.hp, 0);
    e.cellX = x;
    e.cellY = y;
    e.x = x + def.width / 2;
    e.y = y + def.height / 2;
    e.width = def.width;
    e.height = def.height;
    e.sightRange = def.sight;
    e.armorType = def.armor;
    if (def.isDefense) {
      e.damage = def.defenseDamage || 0;
      e.attackRange = def.defenseRange || 5;
      e.rof = def.defenseRof || 30;
    }
    markBuildingTiles(this.tiles, x, y, def.width, def.height);
    this.entityMgr.add(e);
    this.revealAround(owner, e);
  }

  private spawnUnitForAI(owner: Owner, typeId: string, cx: number, cy: number): void {
    const def = UNIT_DEFS[typeId];
    if (!def) return;
    const kind = def.kind === 'infantry' ? EntityKind.Infantry
      : def.kind === 'vehicle' ? EntityKind.Vehicle
      : def.kind === 'aircraft' ? EntityKind.Aircraft
      : EntityKind.Naval;
    const e = new Entity(nextEntityId(), kind, owner, typeId, def.hp, def.speed);
    e.setPosition(cx, cy);
    e.sightRange = def.sight;
    e.damage = def.damage;
    e.attackRange = def.attackRange;
    e.rof = def.rof;
    e.armorType = def.armor;
    this.revealAround(owner, e);
    this.entityMgr.add(e);
  }

  private revealAround(owner: Owner, entity: Entity): void {
    if (entity.kind === EntityKind.Projectile || entity.kind === EntityKind.Effect) return;
    const range = entity.sightRange || 4;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const tx = entity.cellX + dx;
        const ty = entity.cellY + dy;
        if (tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H) {
          if (dx * dx + dy * dy <= range * range) {
            this.tiles[ty][tx].shroudState = FOG_VISIBLE;
          }
        }
      }
    }
  }

  resize(w?: number, h?: number): void {
    const nw = w || window.innerWidth;
    const nh = h || window.innerHeight;
    this.camera.resize(nw, nh);
    this.canvas.width = nw;
    this.canvas.height = nh;
  }

  private loop(time: number): void {
    if (!this.running) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.accumulator += Math.min(dt, 0.1);
    while (this.accumulator >= TICK_DURATION) {
      this.fixedUpdate(TICK_DURATION);
      this.accumulator -= TICK_DURATION;
    }
    this.render();
    this.input.clearFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private fixedUpdate(dt: number): void {
    this.updateCamera(dt);
    this.handleInput();
    this.updateEntities(dt);
    this.updateHarvesters(dt);
    this.updateEffects(dt);
    this.recalcPower();
    this.updateAI(dt);
    this.checkWinCondition();
    this.messageTimer -= dt * 30;
  }

  private updateCamera(dt: number): void {
    const speed = CAMERA_SPEED * dt;
    const m = this.input.state.mouse;
    const k = this.input.state.keys;

    if (m.y < CAMERA_EDGE_SCROLL) this.camera.pan(0, -speed);
    if (m.y > this.camera.height - CAMERA_EDGE_SCROLL) this.camera.pan(0, speed);
    if (m.x < CAMERA_EDGE_SCROLL) this.camera.pan(-speed, 0);
    if (m.x > this.camera.width - CAMERA_EDGE_SCROLL) this.camera.pan(speed, 0);

    if (k.has('arrowleft') || k.has('a')) this.camera.pan(-speed * 3, 0);
    if (k.has('arrowright') || k.has('d')) this.camera.pan(speed * 3, 0);
    if (k.has('arrowup') || k.has('w')) this.camera.pan(0, -speed * 3);
    if (k.has('arrowdown') || k.has('s')) this.camera.pan(0, speed * 3);

    const scroll = this.input.getScrollDelta();
    if (Math.abs(scroll) > 0.0001) {
      this.camera.zoomAt(m.x, m.y, scroll);
    }

    this.camera.update(dt);

    const iso = this.camera.screenToWorld(m.x, m.y);
    this.input.state.mouse.worldX = iso.x;
    this.input.state.mouse.worldY = iso.y;
    this.input.state.mouse.cellX = Math.floor(iso.x);
    this.input.state.mouse.cellY = Math.floor(iso.y);
  }

  private handleInput(): void {
    const m = this.input.state.mouse;
    const k = this.input.state.keysPressed;

    if (m.leftClicked && m.x > this.camera.width - 180) {
      this.handleSidebarClick(m.x, m.y);
      return;
    }

    if (this.placingBuilding) {
      this.handleBuildingPlacement();
      return;
    }

    if (m.leftClicked) {
      if (!m.shift) this.entityMgr.clearSelection();
      const entities = this.entityMgr.getInRect(
        Math.floor(m.cellX - 0.5), Math.floor(m.cellY - 0.5),
        Math.floor(m.cellX + 0.5), Math.floor(m.cellY + 0.5),
        this.playerOwner,
      );
      if (entities.length > 0) {
        entities[0].selected = true;
      }
    }

    if (m.rightClicked) {
      this.issueCommandToSelected(CommandType.Move, m.worldX, m.worldY, m.shift);
    }

    if (m.leftDown && m.dragging) {
      const dx = Math.abs(m.dragEndX - m.dragStartX);
      const dy = Math.abs(m.dragEndY - m.dragStartY);
      if (dx > 5 || dy > 5) {
        this.doBoxSelect();
      }
    }

    if (k.has('escape')) {
      this.placingBuilding = null;
      this.placingBuildingDef = null;
      this.entityMgr.clearSelection();
    }
    if (k.has('b') && !this.placingBuilding) {
      this.startPlacingBuilding('gapowr');
    }
    if (k.has('r') && !this.placingBuilding) {
      this.startPlacingBuilding('garef');
    }

    if (k.has('1')) this.sidebarTab = 0;
    if (k.has('2')) this.sidebarTab = 1;
    if (k.has('3')) this.sidebarTab = 2;
    if (k.has('4')) this.sidebarTab = 3;
  }

  private handleSidebarClick(mx: number, my: number): void {
    const sidebarX = this.camera.width - 180;
    const sidebarW = 180;
    const tabW = sidebarW / 4;

    // Tab buttons at top
    if (my >= 32 && my <= 56) {
      const tabIdx = Math.floor((mx - sidebarX) / tabW);
      if (tabIdx >= 0 && tabIdx < 4) {
        this.sidebarTab = tabIdx;
      }
      return;
    }

    // Item buttons
    const faction = this.playerOwner === Owner.Allies ? 'allies' : 'soviet';
    const categories = BUILDING_CATEGORIES;
    let items: string[] = [];

    if (this.sidebarTab === 0) {
      const cat = categories[0];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
    } else if (this.sidebarTab === 1) {
      const cat = categories[1];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
    } else if (this.sidebarTab === 2) {
      const cat = categories[2];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
    } else if (this.sidebarTab === 3) {
      const cat = categories[3];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
    }

    const itemH = 25;
    const startY = 76;
    const itemIdx = Math.floor((my - startY) / itemH);
    if (itemIdx >= 0 && itemIdx < items.length) {
      const itemId = items[itemIdx];
      const def = BUILDING_DEFS[itemId] || UNIT_DEFS[itemId];
      if (!def) return;

      if (this.sidebarTab >= 2) {
        // Unit production
        this.produceUnit(itemId);
      } else {
        // Building placement
        this.startPlacingBuilding(itemId);
      }
    }
  }

  private produceUnit(unitId: string): void {
    const def = UNIT_DEFS[unitId];
    if (!def) return;
    if (this.playerCredits < def.cost) {
      this.addMessage('Insufficient funds');
      return;
    }

    const factionId = this.getPlayerUnitId(unitId);
    const factionDef = UNIT_DEFS[factionId];
    if (!factionDef) return;

    if (this.playerCredits < factionDef.cost) {
      this.addMessage('Insufficient funds');
      return;
    }

    const requiresBarracks = ['infantry'].includes(factionDef.kind);
    const requiresWar = ['vehicle'].includes(factionDef.kind);
    const requiresAir = ['aircraft'].includes(factionDef.kind);

    let spawnBuilding: Entity | undefined;
    if (requiresBarracks) {
      spawnBuilding = this.entityMgr.findByType(this.playerOwner,
        this.playerOwner === Owner.Allies ? 'gabar' : 'nahand')[0];
    } else if (requiresWar) {
      spawnBuilding = this.entityMgr.findByType(this.playerOwner,
        this.playerOwner === Owner.Allies ? 'gaweap' : 'naweap')[0];
    } else if (requiresAir) {
      spawnBuilding = this.entityMgr.findByType(this.playerOwner,
        this.playerOwner === Owner.Allies ? 'gaairc' : 'naaric')[0];
    }

    if (!spawnBuilding) {
      this.addMessage('Missing production building');
      return;
    }

    this.playerCredits -= factionDef.cost;

    const kind = factionDef.kind === 'infantry' ? EntityKind.Infantry
      : factionDef.kind === 'vehicle' ? EntityKind.Vehicle
      : factionDef.kind === 'aircraft' ? EntityKind.Aircraft
      : EntityKind.Naval;

    const e = new Entity(nextEntityId(), kind, this.playerOwner, factionId, factionDef.hp, factionDef.speed);
    e.setPosition(spawnBuilding.cellX + spawnBuilding.width + 1, spawnBuilding.cellY + 2);
    e.sightRange = factionDef.sight;
    e.damage = factionDef.damage;
    e.attackRange = factionDef.attackRange;
    e.rof = factionDef.rof;
    e.armorType = factionDef.armor;
    this.revealAround(this.playerOwner, e);
    this.entityMgr.add(e);
    this.addMessage(`${factionDef.name} trained`);
  }

  private getPlayerUnitId(id: string): string {
    if (this.playerOwner === Owner.Allies) return id;
    const sovietMap: Record<string, string> = {
      'gi': 'cons', 'gg': 'flak', 'e1': 'e1', 'tany': 'bori',
      'griz': 'htk', 'ifv': 'ftrk', 'prsm': 'apoc', 'harvA': 'harv',
      'mcv': 'mcv', 'jump': 'schp',
    };
    return sovietMap[id] || id;
  }

  private startPlacingBuilding(buildingId: string): void {
    const owner = this.playerOwner;
    const faction = owner === Owner.Allies ? 'allies' : 'soviet';
    const def = BUILDING_DEFS[buildingId];
    if (!def) {
      for (const [key, d] of Object.entries(BUILDING_DEFS)) {
        if (d.name.toLowerCase().includes(buildingId.toLowerCase())) {
          this.placingBuilding = key;
          this.placingBuildingDef = d;
          return;
        }
      }
      return;
    }
    this.placingBuilding = buildingId;
    this.placingBuildingDef = def;
  }

  private handleBuildingPlacement(): void {
    if (!this.placingBuilding || !this.placingBuildingDef) return;
    const m = this.input.state.mouse;
    const def = this.placingBuildingDef;

    if (m.leftClicked) {
      this.tryPlaceBuilding(this.placingBuilding, m.cellX, m.cellY);
      this.placingBuilding = null;
      this.placingBuildingDef = null;
    }
    if (this.input.state.keysPressed.has('escape')) {
      this.placingBuilding = null;
      this.placingBuildingDef = null;
    }
  }

  tryPlaceBuilding(buildingId: string, x: number, y: number): boolean {
    const def = BUILDING_DEFS[buildingId];
    if (!def) return false;
    if (this.playerCredits < def.cost) {
      this.addMessage('Insufficient funds');
      return false;
    }

    const factionId = this.getPlayerBuildingId(buildingId);
    const factionDef = BUILDING_DEFS[factionId];
    if (!factionDef) return false;

    if (!canPlaceBuilding(this.tiles, x, y, factionDef.width, factionDef.height)) {
      this.addMessage('Cannot place here');
      return false;
    }

    this.playerCredits -= factionDef.cost;
    this.placeBaseStructure(this.playerOwner, factionId, x, y);
    this.addMessage(`${factionDef.name} constructed`);
    return true;
  }

  private getPlayerBuildingId(id: string): string {
    if (this.playerOwner === Owner.Allies) return id;
    const sovietMap: Record<string, string> = {
      'gapowr': 'napowr', 'gabar': 'nahand', 'garef': 'naref',
      'gaweap': 'naweap', 'gaairc': 'naaric', 'gapill': 'napill',
      'gatsla': 'natesl', 'naflak': 'naflak', 'gawall': 'nawall',
    };
    return sovietMap[id] || id;
  }

  private issueCommandToSelected(type: CommandType, worldX: number, worldY: number, queued: boolean): void {
    const selected = this.entityMgr.getSelected();
    if (selected.length === 0) return;

    const tc = { x: Math.floor(worldX), y: Math.floor(worldY) };

    // Check for attack target at click location
    const building = this.entityMgr.getAtCell(tc.x, tc.y);
    const enemyAtCell = building && building.owner !== this.playerOwner && building.alive;

    if (enemyAtCell) {
      for (const e of selected) {
        if (e.damage <= 0 && e.kind !== EntityKind.Infantry) continue;
        const cmd: Command = { type: CommandType.Attack, targetId: building.id, queued };
        e.issueCommand(cmd);
        e.attackTarget = building;
        e.isMoving = true;
        const path = findPath(this.tiles, e.cellX, e.cellY, building.cellX, building.cellY, false, false);
        if (path) e.movePath = path;
        else e.moveTarget = { x: building.x, y: building.y };
      }
      return;
    }

    // Check if clicking on own refinery — send harvesters
    const ownBuilding = building && building.owner === this.playerOwner && building.alive;
    if (ownBuilding && (building.typeId === 'garef' || building.typeId === 'naref')) {
      for (const e of selected) {
        if (e.typeId === 'harv' || e.typeId === 'harvA') {
          e.moveTarget = { x: building.x, y: building.y };
          e.isMoving = true;
          const path = findPath(this.tiles, e.cellX, e.cellY,
            building.cellX + Math.floor(building.width / 2),
            building.cellY + Math.floor(building.height / 2), false, false);
          if (path) e.movePath = path;
        }
      }
      return;
    }

    // Movement command
    const formation = this.getFormation(selected, tc.x, tc.y);

    for (let i = 0; i < selected.length; i++) {
      const e = selected[i];
      const pos = formation[i];
      if (!pos) continue;

      const cmd: Command = { type, targetX: pos.x + 0.5, targetY: pos.y + 0.5, queued };
      e.issueCommand(cmd);
      const path = findPath(this.tiles, e.cellX, e.cellY, pos.x, pos.y, false, false);
      if (path) e.movePath = path;
      e.moveTarget = { x: pos.x + 0.5, y: pos.y + 0.5 };
      e.isMoving = true;
    }
  }

  private getFormation(entities: Entity[], targetX: number, targetY: number): { x: number; y: number }[] {
    const n = entities.length;
    const result: { x: number; y: number }[] = [];
    if (n === 1) {
      result.push({ x: targetX, y: targetY });
      return result;
    }
    const cols = Math.ceil(Math.sqrt(n));
    const offset = Math.floor(cols / 2);
    for (let i = 0; i < n; i++) {
      const col = i % cols - offset;
      const row = -Math.floor(i / cols);
      result.push({
        x: clamp(targetX + col, 0, MAP_W - 1),
        y: clamp(targetY + row, 0, MAP_H - 1),
      });
    }
    return result;
  }

  private doBoxSelect(): void {
    const m = this.input.state.mouse;
    const start = this.camera.screenToWorld(m.dragStartX, m.dragStartY);
    const end = this.camera.screenToWorld(m.dragEndX, m.dragEndY);
    if (!m.shift) this.entityMgr.clearSelection();
    const selected = this.entityMgr.getInRect(start.x, start.y, end.x, end.y, this.playerOwner);
    for (const e of selected) e.selected = true;
  }

  private updateEntities(dt: number): void {
    for (const entity of this.entityMgr.entities.values()) {
      if (!entity.alive) continue;
      this.updateEntityMovement(entity, dt);
      this.updateEntityCombat(entity, dt);
    }
  }

  private updateEntityMovement(entity: Entity, dt: number): void {
    if (entity.kind === EntityKind.Building) {
      if (entity.damage > 0 && entity.rofTimer <= 0) {
        const enemies = this.entityMgr.getEnemiesInRange(entity, entity.attackRange || 5);
        if (enemies.length > 0) {
          const target = enemies[0];
          const dmg = (entity.damage || 0) * VETERANCY_DMG_MULT[entity.vetLevel];
          target.takeDamage(dmg);
          entity.rofTimer = entity.rof || 30;
          this.effects.push({
            type: 'explosion', x: target.x, y: target.y,
            cellX: target.cellX, cellY: target.cellY,
            size: 8 + Math.random() * 6, life: 10, maxLife: 10,
          });
          if (!target.alive) {
            entity.addKill();
            this.effects.push({
              type: 'explosion', x: target.x, y: target.y,
              cellX: target.cellX, cellY: target.cellY,
              size: 25 + Math.random() * 15, life: 25, maxLife: 25,
            });
          }
        }
      }
      if (entity.rofTimer > 0) entity.rofTimer -= dt * 30;
      return;
    }

    if (!entity.isMoving || entity.movePath.length === 0) {
      if (entity.moveTarget && entity.movePath.length === 0) {
        entity.isMoving = false;
        entity.moveTarget = null;
      }
      return;
    }

    const speed = entity.speed * VETERANCY_SPEED_MULT[entity.vetLevel];
    let remaining = speed * dt;

    while (remaining > 0 && entity.movePath.length > 0) {
      const target = entity.movePath[0];
      const dx = target.x + 0.5 - entity.x;
      const dy = target.y + 0.5 - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 0.01) {
        entity.x = target.x + 0.5;
        entity.y = target.y + 0.5;
        entity.cellX = target.x;
        entity.cellY = target.y;
        entity.movePath.shift();
        continue;
      }
      if (dist <= remaining) {
        entity.x = target.x + 0.5;
        entity.y = target.y + 0.5;
        entity.cellX = target.x;
        entity.cellY = target.y;
        remaining -= dist;
        entity.movePath.shift();
      } else {
        const ratio = remaining / dist;
        entity.x += dx * ratio;
        entity.y += dy * ratio;
        entity.cellX = Math.floor(entity.x);
        entity.cellY = Math.floor(entity.y);
        remaining = 0;
      }
    }

    if (entity.movePath.length > 0) {
      const next = entity.movePath[0];
      entity.facing = directionToFacing(next.x + 0.5 - entity.x, next.y + 0.5 - entity.y);
    }

    if (entity.movePath.length === 0) {
      entity.isMoving = false;
      entity.moveTarget = null;
      entity.currentCommand = null;
    }

    if (entity.damage > 0 && entity.movePath.length <= 1) {
      this.autoAttackNearby(entity);
    }

    this.revealAround(entity.owner, entity);
  }

  private autoAttackNearby(entity: Entity): void {
    const enemies = this.entityMgr.getEnemiesInRange(entity, entity.attackRange || 5);
    if (enemies.length === 0) return;
    entity.attackTarget = enemies[0];
    entity.movePath = [];
    entity.isMoving = false;
  }

  private updateEntityCombat(entity: Entity, dt: number): void {
    if (entity.kind === EntityKind.Building) return;

    if (entity.rofTimer > 0) {
      entity.rofTimer -= dt * 30;
    }
    if (!entity.attackTarget || !entity.attackTarget.alive) {
      entity.attackTarget = null;
      const enemies = this.entityMgr.getEnemiesInRange(entity, entity.attackRange || 5);
      if (enemies.length > 0) entity.attackTarget = enemies[0];
    }
    if (!entity.attackTarget || !entity.attackTarget.alive || entity.rofTimer > 0) return;

    const target = entity.attackTarget;
    const dx = target.cellX - entity.cellX;
    const dy = target.cellY - entity.cellY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const range = entity.attackRange || 5;

    if (dist <= range + 0.5) {
      entity.facing = directionToFacing(dx, dy);
      const dmg = (entity.damage || 0) * VETERANCY_DMG_MULT[entity.vetLevel];
      target.takeDamage(dmg);
      this.effects.push({
        type: 'explosion', x: target.x, y: target.y,
        cellX: target.cellX, cellY: target.cellY,
        size: 10 + Math.random() * 8, life: 15, maxLife: 15,
      });
      if (!target.alive) {
        entity.addKill();
        entity.attackTarget = null;
        this.effects.push({
          type: 'explosion', x: target.x, y: target.y,
          cellX: target.cellX, cellY: target.cellY,
          size: 30 + Math.random() * 20, life: 30, maxLife: 30,
        });
      }
      entity.rofTimer = entity.rof * VETERANCY_ROF_MULT[entity.vetLevel];
    } else {
      if (entity.damage > 0) {
        entity.moveTarget = { x: target.cellX, y: target.cellY };
        entity.isMoving = true;
        const path = findPath(this.tiles, entity.cellX, entity.cellY, target.cellX, target.cellY, false, false);
        if (path) entity.movePath = path;
      }
    }
  }

  private updateHarvesters(dt: number): void {
    for (const entity of this.entityMgr.entities.values()) {
      if (!entity.alive) continue;
      if (entity.typeId !== 'harv' && entity.typeId !== 'harvA') continue;
      if (entity.owner !== this.playerOwner) continue; // AI handles its own
      if (entity.isMoving || entity.movePath.length > 0) continue;

      const owner = entity.owner;

      const refineries = this.entityMgr.getByOwner(owner)
        .filter(e => e.kind === EntityKind.Building && e.alive &&
          (e.typeId === 'garef' || e.typeId === 'naref'));
      if (refineries.length === 0) continue;

      const refinery = this.findNearest(entity, refineries);
      if (!refinery) continue;

      const nearRefinery = manhattan(
        { x: entity.cellX, y: entity.cellY },
        { x: refinery.cellX, y: refinery.cellY },
      ) <= 3;

      if (nearRefinery) {
        if (owner === this.playerOwner) {
          this.playerCredits += 500;
        } else {
          this.enemyAI.credits += 500;
        }
        this.addMessage(`Harvester deposited $500 (${owner === this.playerOwner ? 'you' : 'enemy'})`);

        const oreTile = this.findNearestOre(
          this.tiles, entity.cellX, entity.cellY, 30,
        );
        if (oreTile) {
          if (this.tiles[oreTile.y][oreTile.x].oreAmount > 0) {
            this.tiles[oreTile.y][oreTile.x].oreAmount--;
            if (this.tiles[oreTile.y][oreTile.x].oreAmount <= 0) {
              this.tiles[oreTile.y][oreTile.x].terrain = TileTerrain.Clear;
            }
          }
          entity.moveTarget = { x: oreTile.x, y: oreTile.y };
          entity.isMoving = true;
          const path = findPath(this.tiles, entity.cellX, entity.cellY, oreTile.x, oreTile.y, false, false);
          if (path) entity.movePath = path;
        }
      } else {
        entity.moveTarget = {
          x: refinery.cellX + Math.floor(refinery.width / 2),
          y: refinery.cellY + Math.floor(refinery.height / 2),
        };
        entity.isMoving = true;
        const path = findPath(this.tiles, entity.cellX, entity.cellY,
          refinery.cellX + Math.floor(refinery.width / 2),
          refinery.cellY + Math.floor(refinery.height / 2), false, false);
        if (path) entity.movePath = path;
      }
    }
  }

  private findNearest(entity: Entity, targets: Entity[]): Entity | undefined {
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

  private findNearestOre(
    tiles: TileData[][],
    cx: number, cy: number, radius: number,
  ): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let minDist = Infinity;
    for (let y = Math.max(0, cy - radius); y < Math.min(MAP_H, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x < Math.min(MAP_W, cx + radius); x++) {
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

  private updateEffects(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].life -= dt * 30;
      if (this.effects[i].life <= 0) this.effects.splice(i, 1);
    }
  }

  private recalcPower(): void {
    const player = this.entityMgr.getByOwner(this.playerOwner)
      .filter(e => e.kind === EntityKind.Building && e.alive);
    this.playerPowerGenerated = player.reduce((s, b) => {
      const def = BUILDING_DEFS[b.typeId];
      return s + (def ? Math.max(0, def.power) : 0);
    }, 0);
    this.playerPowerUsed = player.reduce((s, b) => {
      const def = BUILDING_DEFS[b.typeId];
      return s + (def ? Math.max(0, -def.power) : 0);
    }, 0);

    const enemy = this.entityMgr.getByOwner(this.enemyOwner)
      .filter(e => e.kind === EntityKind.Building && e.alive);
    const eg = enemy.reduce((s, b) => {
      const def = BUILDING_DEFS[b.typeId];
      return s + (def ? Math.max(0, def.power) : 0);
    }, 0);
    const eu = enemy.reduce((s, b) => {
      const def = BUILDING_DEFS[b.typeId];
      return s + (def ? Math.max(0, -def.power) : 0);
    }, 0);
    this.enemyAI.powerGenerated = eg;
    this.enemyAI.powerUsed = eu;
  }

  private updateAI(dt: number): void {
    updateAI(this.enemyAI, this.enemyOwner, this.entityMgr, this.tiles, dt, this.playerOwner);
  }

  private checkWinCondition(): void {
    const playerCY = this.entityMgr.getByOwner(this.playerOwner)
      .filter(e => e.kind === EntityKind.Building && e.alive &&
        (e.typeId === 'gacnst' || e.typeId === 'nacnst'));
    const enemyCY = this.entityMgr.getByOwner(this.enemyOwner)
      .filter(e => e.kind === EntityKind.Building && e.alive &&
        (e.typeId === 'gacnst' || e.typeId === 'nacnst'));

    if (playerCY.length === 0) {
      this.addMessage('DEFEAT! Your Construction Yard has been destroyed.');
    }
    if (enemyCY.length === 0) {
      this.addMessage('VICTORY! Enemy Construction Yard destroyed.');
    }
  }

  private addMessage(msg: string): void {
    this.messages.unshift(msg);
    if (this.messages.length > 5) this.messages.pop();
    this.messageTimer = 180;
  }

  private ctx(): CanvasRenderingContext2D {
    return (this.canvas.getContext('2d') as CanvasRenderingContext2D);
  }

  renderHUD(): void {
    const ctx = this.ctx();
    const w = this.camera.width;
    const h = this.camera.height;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, 32);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 32);

    // Credits
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`$ ${this.playerCredits}`, 10, 22);

    // Power
    const powerRatio = this.playerPowerUsed > 0
      ? Math.min(1, this.playerPowerGenerated / this.playerPowerUsed)
      : 1;
    ctx.fillStyle = powerRatio < 1 ? '#ff4444' : '#44ff44';
    ctx.fillText(`PWR: ${this.playerPowerGenerated}/${this.playerPowerUsed}`, w * 0.25, 22);

    // Unit count
    const unitCount = this.entityMgr.getByOwner(this.playerOwner)
      .filter(e => e.kind !== EntityKind.Building && e.alive).length;
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Units: ${unitCount}`, w * 0.45, 22);

    // Speed controls
    ctx.fillText('WASD: move cam | B: build power | R: refinery | 1-4: tabs', w * 0.6, 22);

    // Messages
    if (this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(w * 0.35, 36, w * 0.3, 20 * this.messages.length);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < this.messages.length; i++) {
        ctx.fillText(this.messages[i], w / 2, 52 + i * 18);
      }
    }

    // Right sidebar
    const sidebarW = 180;
    const sidebarX = w - sidebarW;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(sidebarX, 32, sidebarW, h - 32);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(sidebarX, 32, sidebarW, h - 32);

    // Tab buttons
    const tabNames = ['Build', 'Defense', 'Inf', 'Vehicle'];
    const tabW = sidebarW / 4;
    for (let i = 0; i < 4; i++) {
      const tx = sidebarX + i * tabW;
      ctx.fillStyle = i === this.sidebarTab ? '#447744' : '#333';
      ctx.fillRect(tx, 32, tabW, 24);
      ctx.strokeStyle = '#666';
      ctx.strokeRect(tx, 32, tabW, 24);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tabNames[i], tx + tabW / 2, 48);
    }

    this.renderSidebarContent(ctx, sidebarX, sidebarW);
  }

  private renderSidebarContent(ctx: CanvasRenderingContext2D, sidebarX: number, sidebarW: number): void {
    const faction = this.playerOwner === Owner.Allies ? 'allies' : 'soviet';
    const categories = BUILDING_CATEGORIES;

    let items: string[] = [];
    let yOffset = 60;

    if (this.sidebarTab === 0) {
      const cat = categories[0];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('=== STRUCTURES ===', sidebarX + sidebarW / 2, yOffset - 4);
      yOffset += 16;
    } else if (this.sidebarTab === 1) {
      const cat = categories[1];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
      ctx.fillText('=== DEFENSE ===', sidebarX + sidebarW / 2, yOffset - 4);
    } else if (this.sidebarTab === 2) {
      const cat = categories[2];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
      ctx.fillText('=== INFANTRY ===', sidebarX + sidebarW / 2, yOffset - 4);
    } else if (this.sidebarTab === 3) {
      const cat = categories[3];
      items = faction === 'allies' ? cat.ids : cat.idsSoviet;
      ctx.fillText('=== VEHICLES ===', sidebarX + sidebarW / 2, yOffset - 4);
    }

    for (const itemId of items) {
      let def = BUILDING_DEFS[itemId] || UNIT_DEFS[itemId];
      if (!def) continue;

      const canAfford = this.playerCredits >= def.cost;
      const btnY = yOffset;
      const btnH = 22;

      ctx.fillStyle = canAfford ? '#333' : '#222';
      ctx.fillRect(sidebarX + 4, btnY, sidebarW - 8, btnH);
      ctx.strokeStyle = canAfford ? '#5a5' : '#444';
      ctx.strokeRect(sidebarX + 4, btnY, sidebarW - 8, btnH);

      ctx.fillStyle = canAfford ? '#fff' : '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, sidebarX + 10, btnY + 15);

      ctx.fillStyle = canAfford ? '#ffd700' : '#664';
      ctx.textAlign = 'right';
      ctx.fillText(`$${def.cost}`, sidebarX + sidebarW - 10, btnY + 15);

      yOffset += btnH + 3;
    }
  }

  private render(): void {
    if (!this.running) return;

    const ctx = this.ctx();
    ctx.clearRect(0, 0, this.camera.width, this.camera.height);
    ctx.save();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.camera.width, this.camera.height);

    const range = this.camera.getVisibleTileRange();
    const extra = 2;
    const sX = Math.max(0, range.start.x - extra);
    const sY = Math.max(0, range.start.y - extra);
    const eX = Math.min(MAP_W, range.end.x + extra);
    const eY = Math.min(MAP_H, range.end.y + extra);

    interface Drawable {
      type: 'tile' | 'entity' | 'effect' | 'placement';
      x?: number; y?: number;
      tile?: TileData;
      entity?: Entity;
      depth: number;
    }

    const drawables: Drawable[] = [];

    for (let y = sY; y < eY; y++) {
      for (let x = sX; x < eX; x++) {
        const tile = this.tiles[y]?.[x];
        if (!tile || tile.shroudState < 1) continue;
        drawables.push({ type: 'tile', x, y, tile, depth: x + y });
      }
    }

    for (const entity of this.entityMgr.entities.values()) {
      if (!entity.alive) continue;
      drawables.push({
        type: 'entity', x: entity.cellX, y: entity.cellY,
        entity, depth: entity.cellX + entity.cellY + (entity.height || 1),
      });
    }

    for (const effect of this.effects) {
      drawables.push({ type: 'effect', x: effect.cellX, y: effect.cellY, depth: effect.cellX + effect.cellY + 10 });
    }

    drawables.sort((a, b) => a.depth - b.depth);

    for (const d of drawables) {
      if (d.type === 'tile') {
        renderTile(ctx, d.tile!, d.x!, d.y!, this.camera);
      } else if (d.type === 'entity') {
        this.renderEntity(ctx, d.entity!);
      } else if (d.type === 'effect') {
        const eff = this.effects.find(e => e.cellX === d.x && e.cellY === d.y);
        if (eff) this.renderEffect(ctx, eff);
      }
    }

    // Shroud overlay
    renderShroud(ctx, this.tiles, this.camera, range);
    renderExploredOverlay(ctx, this.tiles, this.camera, range);

    // Building placement ghost
    if (this.placingBuilding && this.placingBuildingDef) {
      this.renderPlacementGhost(ctx);
    }

    // Selection box
    this.renderSelectionBox(ctx);

    ctx.restore();

    this.renderHUD();
  }

  private renderEntity(ctx: CanvasRenderingContext2D, entity: Entity): void {
    const screen = this.camera.worldToScreen({ x: entity.x, y: entity.y });
    const sx = screen.x;
    const sy = screen.y;
    if (sx < -100 || sx > this.camera.width + 100 || sy < -100 || sy > this.camera.height + 100) return;

    const faction = entity.owner === Owner.Allies ? 0 : 5;
    const primary = COUNTRY_COLORS[faction];
    const secondary = entity.owner === Owner.Allies ? '#88aaff' : '#ffaa44';
    const size = 20;

    if (entity.selected) {
      drawSelectionCircle(ctx, sx, sy, 22);
    }
    if (entity.hp < entity.maxHp) {
      drawHealthBar(ctx, sx, sy, 28, entity.hp, entity.maxHp);
    }

    switch (entity.kind) {
      case EntityKind.Infantry:
        drawInfantry(ctx, sx, sy, size, primary, secondary, entity.facing);
        break;
      case EntityKind.Vehicle:
        if (entity.typeId === 'harv' || entity.typeId === 'harvA') {
          drawHarvester(ctx, sx, sy, size, primary, '#888', entity.facing);
        } else {
          drawTank(ctx, sx, sy, size, primary, secondary, entity.facing);
        }
        break;
      case EntityKind.Aircraft:
        drawAircraft(ctx, sx, sy, size, primary, secondary, entity.facing, true);
        break;
      case EntityKind.Naval:
        drawTank(ctx, sx, sy, size * 1.3, primary, secondary, entity.facing);
        break;
      case EntityKind.Building:
        this.renderBuilding(ctx, entity, sx, sy, size, primary, secondary);
        break;
    }
  }

  private renderBuilding(
    ctx: CanvasRenderingContext2D, entity: Entity,
    sx: number, sy: number, size: number, primary: string, secondary: string,
  ): void {
    const bsize = size * entity.width * 0.8;

    switch (entity.typeId) {
      case 'gacnst': case 'nacnst':
        drawConstructionYard(ctx, sx, sy, bsize, primary, secondary, 0);
        break;
      case 'gapowr': case 'napowr': case 'nanucl':
        drawPowerPlant(ctx, sx, sy, bsize, primary, secondary);
        break;
      case 'gabar': case 'nahand':
        drawBarracks(ctx, sx, sy, bsize, primary, secondary);
        break;
      case 'garef': case 'naref':
        drawRefinery(ctx, sx, sy, bsize, primary, secondary);
        break;
      case 'gaweap': case 'naweap':
        drawWarFactory(ctx, sx, sy, bsize, primary, secondary);
        break;
      case 'gaairc': case 'naaric':
        drawAirField(ctx, sx, sy, bsize, primary, secondary);
        break;
      case 'gapill': case 'napill': case 'gatsla': case 'natesl':
      case 'naflak':
        drawDefenseStructure(ctx, sx, sy, bsize * 0.6, primary, secondary);
        break;
      default:
        drawBuilding(ctx, sx, sy, bsize, bsize * 0.7, primary, secondary, entity.owner);
        break;
    }
  }

  private renderPlacementGhost(ctx: CanvasRenderingContext2D): void {
    if (!this.placingBuilding || !this.placingBuildingDef) return;
    const m = this.input.state.mouse;
    const def = this.placingBuildingDef;
    const screen = this.camera.worldToScreen({ x: m.cellX + def.width / 2, y: m.cellY + def.height / 2 });
    const canPlace = canPlaceBuilding(this.tiles, m.cellX, m.cellY, def.width, def.height);

    const w = def.width * 20 * this.camera.zoom;
    const h = def.height * 20 * this.camera.zoom;

    ctx.fillStyle = canPlace ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
    ctx.fillRect(screen.x - w / 2, screen.y - h / 2, w, h);
    ctx.strokeStyle = canPlace ? '#0f0' : '#f00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(screen.x - w / 2, screen.y - h / 2, w, h);
    ctx.setLineDash([]);
  }

  private renderSelectionBox(ctx: CanvasRenderingContext2D): void {
    const m = this.input.state.mouse;
    if (!m.dragging || !m.leftDown) return;
    drawSelectionBox(ctx, m.dragStartX, m.dragStartY, m.dragEndX, m.dragEndY);
  }

  private renderEffect(ctx: CanvasRenderingContext2D, effect: Effect): void {
    const screen = this.camera.worldToScreen({ x: effect.x, y: effect.y });
    const sx = screen.x;
    const sy = screen.y;
    if (effect.type === 'explosion') {
      drawExplosion(ctx, sx, sy, effect.size * this.camera.zoom, effect.life / effect.maxLife);
    } else if (effect.type === 'ore') {
      drawOreParticle(ctx, sx, sy, effect.size * this.camera.zoom, effect.isGem ?? false);
    }
  }
}
