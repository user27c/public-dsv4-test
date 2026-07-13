import { Camera } from './Camera';
import { Input } from './Input';
import { HexMap } from '../hex/HexMap';
import { HexRenderer } from '../hex/HexRenderer';
import { axialToPixel, hexDistance, hexesInRange, getNeighbors, getRing } from '../hex/HexGrid';
import type { TileData, PlayerData, UnitData, CityData, UnitDef } from '../types';
import { UnitType, UnitDomain, FeatureType, TerrainType, TechType, CivicType, GovernmentType, ResourceType, DistrictType, ResourceCategory } from '../types';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  MAP_SEED,
  UNIT_DEFS,
  BUILDING_DEFS,
  TECH_DEFS,
  CIVILIZATION_DEFS,
  CITY_NAMES,
  CITY_FOOD_PER_CITIZEN,
  CITY_MIN_RANGE,
  COMBAT_BONUS_FLANKING,
  COMBAT_BONUS_SUPPORT,
  COMBAT_BONUS_RIVER,
  COMBAT_BONUS_FORTIFIED,
  COMBAT_EXP_MELEE,
  COMBAT_EXP_RANGED,
  COMBAT_EXP_LEVELS,
  TERRAIN_COLORS,
  PLAYER_COLORS,
  RESOURCE_DEFS,
  FEATURE_DEFS,
  TERRAIN_DEFS,
} from '../constants';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  input: Input;
  map: HexMap;
  renderer: HexRenderer;

  players: PlayerData[] = [];
  units: UnitData[] = [];
  cities: CityData[] = [];
  currentTurn: number = 0;
  currentPlayerIndex: number = 0;
  selectedUnitId: number = -1;
  hoveredUnitId: number = -1;

  showMoveRange: [number, number][] = [];
  showAttackRange: [number, number][] = [];
  showSettleRange: [number, number][] = [];

  private lastTime: number = 0;
  private nextUnitId: number = 1;
  private nextCityId: number = 1;
  private gameStarted: boolean = false;
  private notifications: string[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = true;

    this.camera = new Camera(canvas.width, canvas.height);
    this.map = new HexMap(MAP_WIDTH, MAP_HEIGHT, MAP_SEED);

    this.renderer = new HexRenderer(this.ctx);

    this.input = new Input(
      canvas,
      (sx, sy) => this.camera.screenToWorld(sx, sy),
      (px, py) => {
        const [ax, ar] = this.screenToAxial(px, py);
        return [ax, ar];
      },
      (dx, dy) => this.camera.pan(dx, dy),
      (sx, sy, delta) => this.camera.zoomAt(sx, sy, delta),
      (mx, my, dt) => this.camera.edgeScroll(mx, my, dt),
    );

    this.input.onClickHandlers.push((q, r, button) => {
      const ex = this.canvas.width - 110;
      const ey = 46;
      const ew = 100, eh = 36;
      const mx = this.input.mouseX, my = this.input.mouseY;
      if (mx >= ex && mx <= ex + ew && my >= ey && my <= ey + eh) {
        this.endTurn();
        return;
      }
      this.handleClick(q, r, button);
    });
    this.input.onRightClickHandlers.push((q, r) => this.handleRightClick(q, r));
    this.input.onEndTurnHandlers.push(() => this.endTurn());

    this.input.onKeyHandlers.push((key) => {
      if (key === 'space') {
        const sel = this.getSelectedUnit();
        if (sel) {
          sel.actionTaken = true;
          this.selectUnit(-1);
          this.addNotification(`${this.getUnitName(sel.type)} 跳过回合`);
        }
      }
      if (key === 'f') {
        const sel = this.getSelectedUnit();
        if (sel) {
          sel.fortified = !sel.fortified;
          sel.actionTaken = true;
          this.addNotification(`${this.getUnitName(sel.type)} ${sel.fortified ? '驻防' : '解除驻防'}`);
        }
      }
      if (key === 'c' || key === 'escape') {
        this.selectUnit(-1);
      }
    });
  }

  start(): void {
    this.setupPlayers();
    this.placeStartingUnits();
    this.gameStarted = true;
    this.currentPlayerIndex = 0;
    this.currentTurn = 1;
    this.updateVisibility();
    const human = this.getCurrentPlayer();
    if (human.isHuman) {
      const firstUnit = this.getUnit(human.units[0]);
      if (firstUnit) {
        const [px, py] = axialToPixel(firstUnit.q, firstUnit.r);
        this.camera.x = this.canvas.width / 2 - px * this.camera.zoom;
        this.camera.y = this.canvas.height / 2 - py * this.camera.zoom;
        this.camera.targetX = this.camera.x;
        this.camera.targetY = this.camera.y;
      }
    }
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private setupPlayers(): void {
    const human = CIVILIZATION_DEFS[0];
    this.players.push({
      index: 0,
      civilization: human.type,
      leader: human.leader,
      color: human.color,
      secondaryColor: human.secondaryColor,
      gold: 50,
      sciencePerTurn: 3,
      culturePerTurn: 1.5,
      faithPerTurn: 0,
      goldPerTurn: 0,
      currentTech: TechType.POTTERY,
      techProgress: 0,
      unlockedTechs: new Set(),
      currentCivic: CivicType.CODE_OF_LAWS,
      civicProgress: 0,
      unlockedCivics: new Set(),
      government: GovernmentType.CHIEFDOM,
      cities: [],
      units: [],
      isHuman: true,
      alive: true,
      hasMet: new Set(),
      atWar: new Set(),
      envoys: new Map(),
    });

    const aiCivs = CIVILIZATION_DEFS.slice(1, 4);
    for (let i = 0; i < 3; i++) {
      const civ = aiCivs[i % aiCivs.length];
      this.players.push({
        index: i + 1,
        civilization: civ.type,
        leader: civ.leader,
        color: civ.color,
        secondaryColor: civ.secondaryColor,
        gold: 50,
        sciencePerTurn: 3,
        culturePerTurn: 1.5,
        faithPerTurn: 0,
        goldPerTurn: 0,
        currentTech: TechType.POTTERY,
        techProgress: 0,
        unlockedTechs: new Set(),
        currentCivic: CivicType.CODE_OF_LAWS,
        civicProgress: 0,
        unlockedCivics: new Set(),
        government: GovernmentType.CHIEFDOM,
        cities: [],
        units: [],
        isHuman: false,
        alive: true,
        hasMet: new Set(),
        atWar: new Set(),
        envoys: new Map(),
      });
    }
  }

  private placeStartingUnits(): void {
    const numPlayers = this.players.length;
    const positions = this.findFairPositions(numPlayers);

    for (let i = 0; i < numPlayers; i++) {
      const [q, r] = positions[i];
      const settler = this.createUnit(UnitType.SETTLER, i, q, r);
      const adj = getNeighbors(q, r).filter(([nq, nr]) => this.map.inBounds(nq, nr) && !this.map.isImpassable(nq, nr));
      if (adj.length > 0) {
        const [wq, wr] = adj[0];
        this.createUnit(UnitType.WARRIOR, i, wq, wr);
      }
    }
  }

  private findFairPositions(num: number): [number, number][] {
    const positions: [number, number][] = [];
    const attempts = 500;
    for (let i = 0; i < num; i++) {
      let bestQ = 0, bestR = 0, bestScore = -Infinity;
      for (let a = 0; a < attempts; a++) {
        const q = 5 + Math.floor(Math.random() * (MAP_WIDTH - 10));
        const r = 5 + Math.floor(Math.random() * (MAP_HEIGHT - 10));
        if (!this.map.canSettle(q, r)) continue;
        if (positions.some(([pq, pr]) => hexDistance(q, r, pq, pr) < 8)) continue;

        let score = 0;
        for (const [nq, nr] of hexesInRange(q, r, 2)) {
          const tile = this.map.getTile(nq, nr);
          if (!tile) continue;
          if (this.map.isWater(nq, nr)) continue;
          score += tile.yields.food * 2;
          score += tile.yields.production * 3;
          score += tile.yields.gold;
          if (tile.feature === FeatureType.FOREST || tile.feature === FeatureType.RAINFOREST) score += 1;
          if (tile.resource !== ResourceType.NONE) score += 2;
        }
        if (score > bestScore) {
          bestScore = score;
          bestQ = q;
          bestR = r;
        }
      }
      positions.push([bestQ, bestR]);
      for (const [nq, nr] of hexesInRange(bestQ, bestR, 1)) {
        this.map.revealTile(nq, nr, i);
      }
    }
    return positions;
  }

  private gameLoop(timestamp: number): void {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.input.update(dt);
    this.camera.update(dt);
    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number): void {
    const mx = this.input.hoveredQ;
    const mr = this.input.hoveredR;
    this.hoveredUnitId = this.getUnitAt(mx, mr);
  }

  private render(): void {
    const ctx = this.ctx;
    const { x, y, zoom } = this.camera.getScreenTransform();

    ctx.fillStyle = '#0A1628';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(x, y);

    const visibleTiles: TileData[] = [];
    for (let q = 0; q < this.map.width; q++) {
      for (let r = 0; r < this.map.height; r++) {
        const [px, py] = axialToPixel(q, r);
        const sx = px * zoom + x;
        const sy = py * zoom + y;
        if (sx < -100 || sx > this.canvas.width + 100 || sy < -100 || sy > this.canvas.height + 100) continue;
        visibleTiles.push(this.map.tiles[q][r]);
      }
    }

    const selUnit = this.getSelectedUnit();
    const moveSet = new Set(this.showMoveRange.map(([q, r]) => `${q},${r}`));
    const attackSet = new Set(this.showAttackRange.map(([q, r]) => `${q},${r}`));
    const settleSet = new Set(this.showSettleRange.map(([q, r]) => `${q},${r}`));

    for (const tile of visibleTiles) {
      const key = `${tile.q},${tile.r}`;
      this.renderer.drawTile(
        tile,
        x, y, zoom,
        false,
        this.input.hoveredQ === tile.q && this.input.hoveredR === tile.r,
        moveSet.has(key),
        attackSet.has(key),
      );
    }

    ctx.restore();

    ctx.save();
    ctx.translate(x, y);

    for (const city of this.cities) {
      const tile = this.map.getTile(city.q, city.r);
      if (!tile) continue;
      if (!tile.visible && tile.owner !== 0) continue;
      const [cx, cy] = axialToPixel(city.q, city.r);
      const owner = this.players[city.owner];
      this.renderer.drawCityOnTile(tile, city, owner.color, zoom);
    }

    for (const unit of this.units) {
      if (unit.id === selUnit?.id) continue;
      const tile = this.map.getTile(unit.q, unit.r);
      if (!tile) continue;
      if (!tile.visible) continue;
      if (unit.owner !== 0 && !tile.visible) continue;
      const [ux, uy] = axialToPixel(unit.q, unit.r);
      const owner = this.players[unit.owner];
      this.renderer.drawUnit(ux * zoom, uy * zoom, unit, zoom, false, owner.color);
    }

    if (selUnit) {
      const tile = this.map.getTile(selUnit.q, selUnit.r);
      if (tile?.visible) {
        const [ux, uy] = axialToPixel(selUnit.q, selUnit.r);
        const owner = this.players[selUnit.owner];
        this.renderer.drawUnit(ux * zoom, uy * zoom, selUnit, zoom, true, owner.color);
      }
    }

    ctx.restore();

    this.renderHUD();
  }

  private renderHUD(): void {
    const ctx = this.ctx;
    const player = this.getCurrentPlayer();
    const W = this.canvas.width;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(0, 0, W, 42);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 42, W, 1);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`回合 ${this.currentTurn}`, 14, 28);

    const civDef = CIVILIZATION_DEFS.find(c => c.type === player.civilization);
    ctx.fillStyle = player.color;
    ctx.fillText(`${civDef?.name || ''} (${player.leader})`, 100, 28);

    const xOff = 300;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${Math.floor(player.gold)}`, xOff, 28);
    ctx.fillStyle = '#4FC3F7';
    ctx.fillText(`🔬 +${player.sciencePerTurn.toFixed(1)}`, xOff + 100, 28);
    ctx.fillStyle = '#CE93D8';
    ctx.fillText(`🎵 +${player.culturePerTurn.toFixed(1)}`, xOff + 200, 28);
    ctx.fillStyle = '#FFF';
    ctx.fillText(`⛪ +${player.faithPerTurn.toFixed(1)}`, xOff + 300, 28);

    const techName = player.currentTech ? TECH_DEFS.find(t => t.type === player.currentTech)?.name : '';
    ctx.fillText(`📖 ${techName || '选择科技'}`, xOff + 440, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`人口 ${player.cities.reduce((s, cid) => { const c = this.getCity(cid); return s + (c?.population || 0); }, 0)}  |  城市 ${player.cities.length}`, W - 14, 28);

    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    const endTurnX = W - 110;
    ctx.fillRect(endTurnX, 46, 100, 36);
    ctx.fillStyle = this.currentPlayerIndex === 0 ? '#4CAF50' : '#666';
    ctx.fillRect(endTurnX, 46, 100, 36);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('结束回合', endTurnX + 50, 69);

    ctx.textAlign = 'left';

    if (this.notifications.length > 0) {
      const notifY = this.canvas.height - 80;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(W / 2 - 200, notifY, 400, 30);
      ctx.fillStyle = '#FFF';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.notifications[0], W / 2, notifY + 20);
      ctx.textAlign = 'left';
    }

    const selUnit = this.getSelectedUnit();
    if (selUnit) {
      this.renderUnitPanel(selUnit);
    }

    this.renderMinimap();

    const mx = this.input.mouseX, my = this.input.mouseY;
    if (mx >= endTurnX && mx <= endTurnX + 100 && my >= 46 && my <= 82) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(endTurnX, 46, 100, 36);
    }
  }

  private renderUnitPanel(unit: UnitData): void {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const pw = 200, ph = 150;
    const px = 10, py = H - ph - 10;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.92)';
    const rpx = px, rpy = py, rpw = pw, rph = ph, rr = 6;
    ctx.beginPath();
    ctx.moveTo(rpx + rr, rpy);
    ctx.lineTo(rpx + rpw - rr, rpy);
    ctx.quadraticCurveTo(rpx + rpw, rpy, rpx + rpw, rpy + rr);
    ctx.lineTo(rpx + rpw, rpy + rph - rr);
    ctx.quadraticCurveTo(rpx + rpw, rpy + rph, rpx + rpw - rr, rpy + rph);
    ctx.lineTo(rpx + rr, rpy + rph);
    ctx.quadraticCurveTo(rpx, rpy + rph, rpx, rpy + rph - rr);
    ctx.lineTo(rpx, rpy + rr);
    ctx.quadraticCurveTo(rpx, rpy, rpx + rr, rpy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.players[unit.owner].color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.getUnitName(unit.type), px + 10, py + 22);

    ctx.fillStyle = '#CCC';
    ctx.font = '12px sans-serif';
    ctx.fillText(`生命: ${unit.health}/${unit.maxHealth}`, px + 10, py + 42);
    ctx.fillText(`移动: ${unit.moves}/${unit.maxMoves}`, px + 10, py + 58);
    const def = this.getUnitDef(unit.type);
    if (def && def.combat > 0) {
      ctx.fillText(`战力: ${def.combat}`, px + 10, py + 74);
      if (def.rangedCombat > 0) ctx.fillText(`远程: ${def.rangedCombat}`, px + 120, py + 74);
    }

    const btnY = py + 95;
    const btnW = 55, btnH = 24;
    const buttons = [
      { label: '跳过', action: () => { unit.actionTaken = true; this.selectUnit(-1); } },
      { label: unit.fortified ? '解防' : '驻防', action: () => { unit.fortified = !unit.fortified; unit.actionTaken = true; } },
      { label: '删除', action: () => { this.removeUnit(unit.id); this.selectUnit(-1); } },
    ];

    for (let i = 0; i < buttons.length; i++) {
      const bx = px + 8 + i * (btnW + 6);
      ctx.fillStyle = '#334';
      ctx.fillRect(bx, btnY, btnW, btnH);
      ctx.fillStyle = '#FFF';
      ctx.font = '11px sans-serif';
      ctx.fillText(buttons[i].label, bx + btnW / 2, btnY + btnH / 2 + 4);
    }
  }

  handleClick(q: number, r: number, _button: number): void {
    if (!this.gameStarted) return;
    if (this.currentPlayerIndex !== 0) return;

    const selUnit = this.getSelectedUnit();
    if (selUnit) {
      const mx = this.input.mouseX;
      const my = this.input.mouseY;
      const ph = 150, pw = 200;
      const py = this.canvas.height - ph - 10;
      const px = 10;
      const btnY = py + 95;
      const btnW = 55, btnH = 24;

      if (my >= btnY && my <= btnY + btnH) {
        const relX = mx - px - 8;
        const btnIdx = Math.floor(relX / (btnW + 6));
        if (relX >= 0 && btnIdx >= 0 && btnIdx < 3) {
          if (btnIdx === 0) {
            selUnit.actionTaken = true; this.selectUnit(-1);
            this.addNotification(`${this.getUnitName(selUnit.type)} 跳过回合`);
          } else if (btnIdx === 1) {
            selUnit.fortified = !selUnit.fortified; selUnit.actionTaken = true;
            this.addNotification(`${this.getUnitName(selUnit.type)} ${selUnit.fortified ? '驻防' : '解除驻防'}`);
            this.selectUnit(-1);
          } else if (btnIdx === 2) {
            this.removeUnit(selUnit.id); this.selectUnit(-1);
            this.addNotification(`${this.getUnitName(selUnit.type)} 被解散`);
          }
          return;
        }
      }
    }

    const tile = this.map.getTile(q, r);
    if (!tile || !tile.visible) {
      this.selectUnit(-1);
      return;
    }

    const unit = this.units.find(u => u.q === q && u.r === r && u.owner === 0);
    if (unit && unit.id !== this.selectedUnitId) {
      this.selectUnit(unit.id);
      return;
    }

    this.selectUnit(-1);
  }

  handleRightClick(q: number, r: number): void {
    if (!this.gameStarted) return;
    if (this.currentPlayerIndex !== 0) return;

    const sel = this.getSelectedUnit();
    if (!sel || sel.actionTaken) return;

    const tile = this.map.getTile(q, r);
    if (!tile || !tile.visible) return;

    if (sel.type === UnitType.SETTLER && this.map.canSettle(q, r)) {
      this.foundCity(sel, q, r);
      return;
    }

    const targetUnit = this.units.find(u => u.q === q && u.r === r && u.owner !== sel.owner);
    if (targetUnit && this.map.inBounds(q, r)) {
      const def = this.getUnitDef(sel.type);
      if (def && def.combat > 0 && hexDistance(sel.q, sel.r, q, r) <= 1) {
        this.meleeAttack(sel, targetUnit);
        return;
      }
      if (def && def.rangedCombat > 0 && def.range > 0 && hexDistance(sel.q, sel.r, q, r) <= def.range) {
        this.rangedAttack(sel, targetUnit);
        return;
      }
    }

    if (this.map.isImpassable(q, r) && !targetUnit) return;
    if (this.map.isWater(q, r) && this.getUnitDef(sel.type)?.domain !== UnitDomain.NAVAL) return;

    this.moveUnit(sel, q, r);
  }

  selectUnit(id: number): void {
    this.selectedUnitId = id;
    this.showMoveRange = [];
    this.showAttackRange = [];
    this.showSettleRange = [];

    const sel = this.getSelectedUnit();
    if (!sel || sel.actionTaken || sel.owner !== 0 || this.currentPlayerIndex !== 0) return;

    const def = this.getUnitDef(sel.type);
    if (!def) return;

    const moveRange = Math.floor(sel.moves / 1);
    if (moveRange > 0) {
      for (const [mq, mr] of hexesInRange(sel.q, sel.r, moveRange)) {
        if (this.map.isImpassable(mq, mr) && !this.units.find(u => u.q === mq && u.r === mr && u.owner !== sel.owner)) continue;
        if (this.map.isWater(mq, mr) && def.domain !== UnitDomain.NAVAL) continue;
        this.showMoveRange.push([mq, mr]);
      }
    }

    if (def.rangedCombat > 0 && def.range > 0) {
      for (const [aq, ar] of hexesInRange(sel.q, sel.r, def.range + moveRange)) {
        if (hexDistance(sel.q, sel.r, aq, ar) <= def.range + moveRange) {
          this.showAttackRange.push([aq, ar]);
        }
      }
    }

    if (sel.type === UnitType.SETTLER && !sel.actionTaken) {
      for (const [sq, sr] of hexesInRange(sel.q, sel.r, moveRange)) {
        if (this.map.canSettle(sq, sr)) {
          this.showSettleRange.push([sq, sr]);
        }
      }
    }
  }

  moveUnit(unit: UnitData, toQ: number, toR: number): void {
    const path = this.findPath(unit.q, unit.r, toQ, toR);
    if (!path || path.length < 2) return;

    let cost = 0;
    for (let i = 1; i < path.length; i++) {
      cost += this.map.getMovementCost(path[i][0], path[i][1]);
      if (cost > unit.moves) break;
    }

    if (cost > unit.moves) return;

    unit.q = toQ;
    unit.r = toR;
    unit.moves -= cost;
    unit.fortified = false;

    if (unit.moves <= 0) {
      unit.actionTaken = true;
    }

    this.selectUnit(unit.id);
    this.updateVisibility();
  }

  meleeAttack(attacker: UnitData, defender: UnitData): void {
    const attackerDef = this.getUnitDef(attacker.type);
    const defenderDef = this.getUnitDef(defender.type);
    if (!attackerDef || !defenderDef) return;

    const defMod = this.map.getDefenseModifier(defender.q, defender.r);
    const defStrength = defenderDef.combat + defMod + (defender.fortified ? COMBAT_BONUS_FORTIFIED : 0);

    const flankers = getNeighbors(defender.q, defender.r)
      .filter(([nq, nr]) => this.units.some(u => u.q === nq && u.r === nr && u.owner === attacker.owner));
    const flankBonus = Math.max(0, flankers.length - 1) * COMBAT_BONUS_FLANKING;

    const attStr = attackerDef.combat + flankBonus;
    const ratio = attStr / Math.max(1, defStrength);

    const attDmg = Math.floor(30 * ratio * (0.8 + Math.random() * 0.4));
    const defDmg = Math.floor(30 / ratio * (0.8 + Math.random() * 0.4));

    defender.health -= attDmg;
    attacker.health -= defDmg;
    attacker.moves = 0;
    attacker.actionTaken = true;
    attacker.exp += COMBAT_EXP_MELEE;

    this.addNotification(`${this.getUnitName(attacker.type)} 攻击 ${this.getUnitName(defender.type)}! (-${attDmg} / -${defDmg})`);

    if (defender.health <= 0) {
      this.removeUnit(defender.id);
      this.addNotification(`${this.getUnitName(defender.type)} 被消灭!`);
      attacker.moves = Math.min(attacker.maxMoves, attacker.moves + 1);
    }
    if (attacker.health <= 0) {
      this.removeUnit(attacker.id);
      this.selectUnit(-1);
      this.addNotification(`${this.getUnitName(attacker.type)} 在战斗中阵亡!`);
    }

    this.selectUnit(attacker.id);
    this.updateVisibility();
  }

  rangedAttack(attacker: UnitData, defender: UnitData): void {
    const attackerDef = this.getUnitDef(attacker.type);
    const defenderDef = this.getUnitDef(defender.type);
    if (!attackerDef || !defenderDef) return;

    const defMod = this.map.getDefenseModifier(defender.q, defender.r);
    const defStrength = defenderDef.combat + defMod;
    const ratio = attackerDef.rangedCombat / Math.max(1, defStrength);

    const dmg = Math.floor(25 * ratio * (0.8 + Math.random() * 0.4));
    defender.health -= dmg;
    attacker.moves = 0;
    attacker.actionTaken = true;
    attacker.exp += COMBAT_EXP_RANGED;

    this.addNotification(`${this.getUnitName(attacker.type)} 远程攻击 ${this.getUnitName(defender.type)}! (-${dmg})`);

    if (defender.health <= 0) {
      this.removeUnit(defender.id);
      this.addNotification(`${this.getUnitName(defender.type)} 被消灭!`);
    }
    this.selectUnit(attacker.id);
    this.updateVisibility();
  }

  foundCity(settler: UnitData, q: number, r: number): void {
    if (!this.map.canSettle(q, r)) return;

    const player = this.players[settler.owner];
    const nameIdx = player.cities.length;
    const names = CITY_NAMES[player.civilization];
    const name = names[nameIdx % names.length];

    const city: CityData = {
      id: this.nextCityId++,
      name,
      owner: settler.owner,
      q, r,
      population: 1,
      foodStored: 0,
      foodNeeded: 15,
      productionStored: 0,
      productionNeeded: 0,
      currentlyBuilding: null,
      buildings: [],
      districts: [DistrictType.CITY_CENTER],
      workedTiles: [{ q, r }],
      borderTiles: [{ q, r }],
      health: 100,
      maxHealth: 100,
      defense: 5,
      garrison: null,
      turnsUntilGrowth: 10,
      hints: [],
    };

    this.expandBorders(city, 1);

    const tile = this.map.tiles[q][r];
    tile.owner = settler.owner;
    tile.district = DistrictType.CITY_CENTER;

    this.assignWorkedTiles(city);

    this.cities.push(city);
    player.cities.push(city.id);

    if (!city.currentlyBuilding) {
      const availableUnits = UNIT_DEFS.filter(u => u.requiresTech === null || player.unlockedTechs.has(u.requiresTech));
      if (availableUnits.length > 0) {
        city.currentlyBuilding = { type: 'unit', key: availableUnits[0].type };
        city.productionNeeded = availableUnits[0].cost;
      }
    }

    this.removeUnit(settler.id);
    this.selectUnit(-1);
    this.addNotification(`${name} 建城!`);
    this.updateVisibility();
  }

  endTurn(): void {
    if (this.currentPlayerIndex !== 0) return;

    const player = this.players[0];
    for (const uid of player.units) {
      const unit = this.getUnit(uid);
      if (unit) {
        unit.moves = unit.maxMoves;
        unit.actionTaken = false;
      }
    }

    this.processCityTurns(0);
    this.processResearch(0);

    for (let i = 1; i < this.players.length; i++) {
      const ai = this.players[i];
      if (!ai.alive) continue;

      for (const uid of ai.units) {
        const unit = this.getUnit(uid);
        if (unit) {
          unit.moves = unit.maxMoves;
          unit.actionTaken = false;
        }
      }

      this.processCityTurns(i);
      this.runAI(i);
    }

    this.currentTurn++;
    this.selectedUnitId = -1;
    this.showMoveRange = [];
    this.showAttackRange = [];
    this.updateVisibility();

    this.addNotification(`--- 第 ${this.currentTurn} 回合 ---`);
  }

  private processCityTurns(playerIdx: number): void {
    const player = this.players[playerIdx];
    for (const cid of player.cities) {
      const city = this.getCity(cid);
      if (!city) continue;

      let totalFood = 0, totalProduction = 0, totalGold = 0, totalScience = 0, totalCulture = 0, totalFaith = 0;
      for (const wt of [...city.workedTiles]) {
        const tile = this.map.getTile(wt.q, wt.r);
        if (!tile) continue;
        totalFood += tile.yields.food;
        totalProduction += tile.yields.production;
        totalGold += tile.yields.gold;
        totalScience += tile.yields.science;
        totalCulture += tile.yields.culture;
        totalFaith += tile.yields.faith;
      }

      totalFood += 2; // base city center
      totalProduction += 1;
      totalFood -= city.population * CITY_FOOD_PER_CITIZEN;
      city.foodStored += totalFood;

      if (city.foodStored >= city.foodNeeded) {
        city.foodStored -= city.foodNeeded;
        city.population++;
        city.foodNeeded = Math.floor(city.foodNeeded * 1.25);
        this.assignWorkedTiles(city);
        this.addNotification(`${city.name} 人口增长到 ${city.population}!`);
      } else if (city.foodStored < 0) {
        city.foodStored = 0;
        if (city.population > 1) {
          city.population--;
          this.assignWorkedTiles(city);
          this.addNotification(`${city.name} 人口减少到 ${city.population}!`);
        }
      }

      if (this.currentTurn % 8 === 0 && city.borderTiles.length < city.population * 6 + 6) {
        this.expandBorders(city, 1);
      }

      if (city.currentlyBuilding) {
        city.productionStored += totalProduction;
        const needed = this.getProductionCost(city.currentlyBuilding.key, city.currentlyBuilding.type);
        if (city.productionStored >= needed) {
          city.productionStored -= needed;
          this.completeProduction(city);
        }
      }

      player.gold += Math.max(0, totalGold + 5);
      player.goldPerTurn = Math.max(0, totalGold);

      const tech = player.currentTech;
      if (tech) {
        player.techProgress += (player.sciencePerTurn + totalScience);
      }

      if (player.currentCivic) {
        player.civicProgress += (player.culturePerTurn + totalCulture);
      }

      player.faithPerTurn += totalFaith;

      for (const bn of city.buildings) {
        const bdef = BUILDING_DEFS.find(b => b.type === bn);
        if (bdef) {
          player.gold -= bdef.maintenance;
        }
      }
    }
  }

  private processResearch(playerIdx: number): void {
    const player = this.players[playerIdx];

    if (!player.currentTech) {
      this.pickNextTech(player);
    }

    if (!player.currentTech) return;

    player.techProgress += player.sciencePerTurn;
    const tech = TECH_DEFS.find(t => t.type === player.currentTech);
    if (tech && player.techProgress >= tech.cost) {
      player.techProgress -= tech.cost;
      player.unlockedTechs.add(player.currentTech);
      this.addNotification(`[${CIVILIZATION_DEFS.find(c => c.type === player.civilization)?.name}] 完成研究: ${tech.name}`);
      player.currentTech = null;
      this.pickNextTech(player);
    }
  }

  private pickNextTech(player: PlayerData): void {
    const available = TECH_DEFS.filter(t => {
      if (player.unlockedTechs.has(t.type)) return false;
      for (const prereq of t.prerequisites) {
        if (!player.unlockedTechs.has(prereq)) return false;
      }
      return true;
    });
    if (available.length > 0) {
      const cheapest = available.reduce((a, b) => a.cost < b.cost ? a : b);
      player.currentTech = cheapest.type;
      player.techProgress = 0;
    }
  }

  private runAI(playerIdx: number): void {
    const player = this.players[playerIdx];
    const units = player.units.map(uid => this.getUnit(uid)).filter(Boolean) as UnitData[];

    for (const unit of units) {
      if (unit.actionTaken) continue;

      const adjEnemies = getNeighbors(unit.q, unit.r)
        .filter(([nq, nr]) => this.units.some(u => u.q === nq && u.r === nr && u.owner !== playerIdx));

      if (adjEnemies.length > 0) {
        const enemy = this.units.find(u => u.q === adjEnemies[0][0] && u.r === adjEnemies[0][1]);
        if (enemy) {
          this.meleeAttack(unit, enemy);
          continue;
        }
      }

      if (unit.type === UnitType.SETTLER) {
        for (const [sq, sr] of hexesInRange(unit.q, unit.r, 2)) {
          if (this.map.canSettle(sq, sr)) {
            this.foundCity(unit, sq, sr);
            break;
          }
        }
        unit.actionTaken = true;
        continue;
      }

      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const nq = unit.q + dir[0];
      const nr = unit.r + dir[1];

      if (this.map.inBounds(nq, nr) && !this.map.isImpassable(nq, nr) && !this.map.isWater(nq, nr)) {
        const occUnit = this.units.find(u => u.q === nq && u.r === nr && u.owner !== playerIdx);
        if (occUnit && (this.getUnitDef(unit.type)?.combat ?? 0) > 0) {
          this.meleeAttack(unit, occUnit);
        } else if (!occUnit) {
          unit.q = nq;
          unit.r = nr;
          unit.moves = 0;
        }
      }
      unit.actionTaken = true;
    }

    this.updateVisibility();
  }

  private completeProduction(city: CityData): void {
    const build = city.currentlyBuilding;
    if (!build) return;
    city.currentlyBuilding = null;

    if (build.type === 'unit') {
      const def = UNIT_DEFS.find(u => u.type === build.key as UnitType);
      if (def) {
        const adj = getNeighbors(city.q, city.r).filter(([nq, nr]) =>
          this.map.inBounds(nq, nr) && !this.map.isImpassable(nq, nr) && !this.map.isWater(nq, nr),
        );
        if (adj.length > 0) {
          const [uq, ur] = adj[0];
          this.createUnit(def.type, city.owner, uq, ur);
          this.addNotification(`${city.name} 生产了 ${def.name}`);
        }
      }
    } else if (build.type === 'building') {
      const bdef = BUILDING_DEFS.find(b => b.type === build.key);
      if (bdef) {
        city.buildings.push(bdef.type);
        this.addNotification(`${city.name} 建造了 ${bdef.name}`);
      }
    }

    const player = this.players[city.owner];
    const availableUnits = UNIT_DEFS.filter(u => {
      if (u.requiresTech && !player.unlockedTechs.has(u.requiresTech)) return false;
      return true;
    });
    if (availableUnits.length > 0) {
      city.currentlyBuilding = { type: 'unit', key: availableUnits[Math.floor(Math.random() * Math.min(availableUnits.length, 3))].type };
      city.productionNeeded = UNIT_DEFS.find(u => u.type === city.currentlyBuilding!.key)!.cost;
    }
  }

  private getProductionCost(key: string, type: string): number {
    if (type === 'unit') {
      const def = UNIT_DEFS.find(u => u.type === key);
      return def ? def.cost : 40;
    }
    if (type === 'building') {
      const def = BUILDING_DEFS.find(b => b.type === key);
      return def ? def.cost : 60;
    }
    return 40;
  }

  createUnit(type: UnitType, owner: number, q: number, r: number): UnitData {
    const def = this.getUnitDef(type);
    const unit: UnitData = {
      id: this.nextUnitId++,
      type,
      owner,
      q, r,
      health: 100,
      maxHealth: 100,
      moves: def?.moves || 2,
      maxMoves: def?.moves || 2,
      level: 0,
      exp: 0,
      actionTaken: owner !== 0 && this.currentPlayerIndex !== owner,
      fortified: false,
      asleep: false,
      domain: def?.domain || UnitDomain.LAND,
    };
    this.units.push(unit);
    this.players[owner].units.push(unit.id);
    return unit;
  }

  removeUnit(id: number): void {
    const idx = this.units.findIndex(u => u.id === id);
    if (idx < 0) return;
    const unit = this.units[idx];
    const player = this.players[unit.owner];
    const pid = player.units.indexOf(id);
    if (pid >= 0) player.units.splice(pid, 1);
    this.units.splice(idx, 1);
  }

  getUnit(id: number): UnitData | undefined {
    return this.units.find(u => u.id === id);
  }

  getSelectedUnit(): UnitData | undefined {
    return this.units.find(u => u.id === this.selectedUnitId);
  }

  getUnitAt(q: number, r: number): number {
    const unit = this.units.find(u => u.q === q && u.r === r);
    return unit ? unit.id : -1;
  }

  getUnitDef(type: UnitType): UnitDef | undefined {
    return UNIT_DEFS.find(u => u.type === type);
  }

  getUnitName(type: UnitType): string {
    return this.getUnitDef(type)?.name || type;
  }

  getCity(id: number): CityData | undefined {
    return this.cities.find(c => c.id === id);
  }

  getCurrentPlayer(): PlayerData {
    return this.players[this.currentPlayerIndex];
  }

  updateVisibility(): void {
    const playerTiles = new Map<number, {q: number, r: number, sight: number}[]>();
    for (const unit of this.units) {
      const def = this.getUnitDef(unit.type);
      const sight = def?.sight || 2;
      if (!playerTiles.has(unit.owner)) playerTiles.set(unit.owner, []);
      playerTiles.get(unit.owner)!.push({ q: unit.q, r: unit.r, sight });
    }
    for (const city of this.cities) {
      if (!playerTiles.has(city.owner)) playerTiles.set(city.owner, []);
      playerTiles.get(city.owner)!.push({ q: city.q, r: city.r, sight: 2 });
    }
    this.map.updateVisibility(playerTiles);
  }

  findPath(fromQ: number, fromR: number, toQ: number, toR: number): [number, number][] | null {
    if (!this.map.inBounds(toQ, toR)) return null;
    if (fromQ === toQ && fromR === toR) return [[fromQ, fromR]];

    const startKey = `${fromQ},${fromR}`;
    const goalKey = `${toQ},${toR}`;
    const openSet = new Map<string, { q: number; r: number; g: number; f: number; parent: string | null }>();
    const closedSet = new Set<string>();

    openSet.set(startKey, { q: fromQ, r: fromR, g: 0, f: hexDistance(fromQ, fromR, toQ, toR), parent: null });

    while (openSet.size > 0) {
      let currentKey = '';
      let minF = Infinity;
      for (const [key, node] of openSet) {
        if (node.f < minF) {
          minF = node.f;
          currentKey = key;
        }
      }

      const current = openSet.get(currentKey)!;
      if (currentKey === goalKey) {
        const path: [number, number][] = [];
        let node: typeof current | undefined = current;
        while (node) {
          path.unshift([node.q, node.r]);
          node = node.parent ? openSet.get(node.parent) || undefined : undefined;
          if (node && node.parent === null) {
            path.unshift([node.q, node.r]);
            break;
          }
        }
        return path;
      }

      openSet.delete(currentKey);
      closedSet.add(currentKey);

      for (const [nq, nr] of getNeighbors(current.q, current.r)) {
        const nKey = `${nq},${nr}`;
        if (closedSet.has(nKey)) continue;
        if (!this.map.inBounds(nq, nr)) continue;

        const isTarget = nq === toQ && nr === toR;
        const unitAtTarget = this.units.find(u => u.q === nq && u.r === nr);
        if (this.map.isImpassable(nq, nr) && !isTarget) continue;
        if (unitAtTarget && !isTarget) continue;

        const moveCost = this.map.getMovementCost(nq, nr);
        const g = current.g + moveCost;
        const existing = openSet.get(nKey);
        if (existing && g >= existing.g) continue;

        const h = hexDistance(nq, nr, toQ, toR);
        openSet.set(nKey, { q: nq, r: nr, g, f: g + h, parent: currentKey });
      }
    }
    return null;
  }

  expandBorders(city: CityData, rings: number): void {
    const borderSet = new Set(city.borderTiles.map(t => `${t.q},${t.r}`));
    for (let ring = 1; ring <= rings; ring++) {
      for (const [nq, nr] of getRing(city.q, city.r, ring)) {
        const key = `${nq},${nr}`;
        if (!this.map.inBounds(nq, nr)) continue;
        if (this.map.isWater(nq, nr)) continue;
        if (borderSet.has(key)) continue;
        borderSet.add(key);
        city.borderTiles.push({ q: nq, r: nr });
        this.map.tiles[nq][nr].owner = city.owner;
      }
    }
  }

  assignWorkedTiles(city: CityData): void {
    const workedSet = new Set(city.workedTiles.map(t => `${t.q},${t.r}`));
    const available: { q: number; r: number; score: number }[] = [];

    for (const bt of city.borderTiles) {
      if (workedSet.has(`${bt.q},${bt.r}`)) continue;
      const tile = this.map.getTile(bt.q, bt.r);
      if (!tile) continue;
      if (this.map.isImpassable(bt.q, bt.r)) continue;
      if (this.map.isWater(bt.q, bt.r)) continue;

      const score = tile.yields.food * 10 + tile.yields.production * 12 + tile.yields.gold * 8 + tile.yields.science * 15 + tile.yields.culture * 8 + tile.yields.faith * 5;
      available.push({ q: bt.q, r: bt.r, score });
    }

    available.sort((a, b) => b.score - a.score);

    const tilesToWork = Math.min(city.population, available.length);
    for (let i = 0; i < tilesToWork; i++) {
      if (!workedSet.has(`${available[i].q},${available[i].r}`)) {
        city.workedTiles.push({ q: available[i].q, r: available[i].r });
      }
    }
  }

  addNotification(msg: string): void {
    this.notifications.unshift(msg);
    if (this.notifications.length > 5) this.notifications.pop();
  }

  private renderMinimap(): void {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const mmW = 160, mmH = 120;
    const mmX = W - mmW - 10, mmY = this.canvas.height - mmH - 10;
    const cellW = mmW / this.map.width;
    const cellH = mmH / this.map.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

    for (let q = 0; q < this.map.width; q++) {
      for (let r = 0; r < this.map.height; r++) {
        const tile = this.map.tiles[q][r];
        if (!tile.explored) continue;

        const tx = mmX + q * cellW;
        const ty = mmY + r * cellH;

        if (tile.owner >= 0) {
          ctx.fillStyle = this.players[tile.owner].color;
        } else if (tile.feature === 'mountains') {
          ctx.fillStyle = '#666';
        } else if (this.map.isWater(q, r)) {
          ctx.fillStyle = '#2A5F8A';
        } else {
          ctx.fillStyle = '#7BA64A';
        }
        ctx.fillRect(tx, ty, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    for (const unit of this.units) {
      const tile = this.map.getTile(unit.q, unit.r);
      if (!tile?.visible) continue;
      const tx = mmX + unit.q * cellW;
      const ty = mmY + unit.r * cellH;
      ctx.fillStyle = unit.owner === 0 ? '#FFF' : this.players[unit.owner].color;
      ctx.fillRect(tx + cellW * 0.25, ty + cellH * 0.25, Math.ceil(cellW * 0.5), Math.ceil(cellH * 0.5));
    }

    const cam = this.camera;
    const viewLeft = -cam.x / cam.zoom;
    const viewTop = -cam.y / cam.zoom;
    const viewW = this.canvas.width / cam.zoom;
    const viewH = this.canvas.height / cam.zoom;

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    const vlMM = mmX + (viewLeft / (40 * Math.sqrt(3))) * mmW;
    const vtMM = mmY + (viewTop / (40 * 3 / 2)) * mmH;
    const vwMM = (viewW / (40 * Math.sqrt(3))) * mmW;
    const vhMM = (viewH / (40 * 3 / 2)) * mmH;
    ctx.strokeRect(vlMM, vtMM, vwMM, vhMM);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmW, mmH);
  }

  private screenToAxial(px: number, py: number): [number, number] {
    const x = px, y = py;
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / 40;
    const r = (2 / 3 * y) / 40;

    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);

    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;

    return [rq, rr];
  }
}


