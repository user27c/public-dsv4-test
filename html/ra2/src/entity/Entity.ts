import { EntityState, EntityKind, Owner, IsoPoint, Command, CommandType } from '../types.ts';
import { TILE_W, TILE_H, FOG_VISIBLE, VETERANCY_DMG_MULT, VETERANCY_HP_MULT, VETERANCY_SPEED_MULT, VETERANCY_ROF_MULT, VETERANCY_KILLS } from '../constants.ts';
import { facingToAngle, angleToFacing, directionToFacing, lerp } from '../utils.ts';

export class Entity {
  id: number;
  kind: EntityKind;
  owner: Owner;
  x = 0;
  y = 0;
  cellX = 0;
  cellY = 0;
  width = 1;
  height = 1;
  hp: number;
  maxHp: number;
  selected = false;
  alive = true;
  visible = true;
  speed: number;
  facing = 0;
  typeId: string;

  vetLevel = 0;
  kills = 0;
  currentCommand: Command | null = null;
  commandQueue: Command[] = [];
  attackCooldown = 0;
  attackRange = 0;
  damage = 0;
  warhead = 'HE';
  weaponType = 'instant';
  targetType = 'ground';
  armorType = 'none';
  sightRange = 5;
  moveTarget: { x: number; y: number } | null = null;
  movePath: { x: number; y: number }[] = [];
  attackTarget: Entity | null = null;
  isMoving = false;
  deployable = false;
  deployed = false;
  ammo = -1;
  maxAmmo = -1;
  rof = 60;
  rofTimer = 0;

  constructor(id: number, kind: EntityKind, owner: Owner, typeId: string, hp: number, speed: number) {
    this.id = id;
    this.kind = kind;
    this.owner = owner;
    this.typeId = typeId;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
  }

  getState(): EntityState {
    return {
      id: this.id,
      kind: this.kind,
      owner: this.owner,
      x: this.x,
      y: this.y,
      cellX: this.cellX,
      cellY: this.cellY,
      width: this.width,
      height: this.height,
      hp: this.hp,
      maxHp: this.maxHp,
      selected: this.selected,
      alive: this.alive,
      visible: this.visible,
      speed: this.speed * VETERANCY_SPEED_MULT[this.vetLevel],
      facing: this.facing,
      typeId: this.typeId,
    };
  }

  issueCommand(cmd: Command): void {
    if (cmd.queued) {
      this.commandQueue.push(cmd);
    } else {
      this.currentCommand = cmd;
      this.commandQueue = [];
      this.executeCommand(cmd);
    }
  }

  executeCommand(cmd: Command): void {
    switch (cmd.type) {
      case CommandType.Move:
        this.moveTarget = { x: cmd.targetX!, y: cmd.targetY! };
        this.movePath = [];
        this.attackTarget = null;
        this.isMoving = true;
        break;
      case CommandType.Attack:
        this.moveTarget = null;
        this.attackTarget = null;
        break;
      case CommandType.Stop:
        this.moveTarget = null;
        this.movePath = [];
        this.attackTarget = null;
        this.isMoving = false;
        this.currentCommand = null;
        break;
      case CommandType.AttackMove:
        this.moveTarget = { x: cmd.targetX!, y: cmd.targetY! };
        this.isMoving = true;
        break;
    }
  }

  setPosition(isoX: number, isoY: number): void {
    this.x = isoX;
    this.y = isoY;
    this.cellX = Math.floor(isoX);
    this.cellY = Math.floor(isoY);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  checkVeterancy(): void {
    const nextLevel = this.vetLevel + 1;
    if (nextLevel < VETERANCY_KILLS.length && this.kills >= VETERANCY_KILLS[nextLevel]) {
      this.vetLevel = nextLevel;
    }
  }

  addKill(): void {
    this.kills++;
    this.checkVeterancy();
  }
}

export class EntityManager {
  entities: Map<number, Entity> = new Map();
  private spatialGrid: Map<string, number[]> = new Map();

  add(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.addToSpatial(entity);
  }

  remove(id: number): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.removeFromSpatial(entity);
      this.entities.delete(id);
    }
  }

  get(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  getByOwner(owner: Owner): Entity[] {
    const result: Entity[] = [];
    for (const e of this.entities.values()) {
      if (e.owner === owner && e.alive) result.push(e);
    }
    return result;
  }

  getInRect(x1: number, y1: number, x2: number, y2: number, owner?: Owner): Entity[] {
    const result: Entity[] = [];
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (const e of this.entities.values()) {
      if (!e.alive) continue;
      if (owner !== undefined && e.owner !== owner) continue;
      if (e.kind === EntityKind.Projectile || e.kind === EntityKind.Effect) continue;
      const sx = e.cellX;
      const sy = e.cellY;
      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        result.push(e);
      }
    }
    return result;
  }

  getAtCell(cellX: number, cellY: number, owner?: Owner): Entity | undefined {
    const key = `${cellX},${cellY}`;
    const ids = this.spatialGrid.get(key);
    if (!ids) return undefined;
    for (const id of ids) {
      const e = this.entities.get(id);
      if (e && e.alive && (owner === undefined || e.owner === owner)) {
        return e;
      }
    }
    return undefined;
  }

  findByType(owner: Owner, typeId: string): Entity[] {
    const result: Entity[] = [];
    for (const e of this.entities.values()) {
      if (e.owner === owner && e.typeId === typeId && e.alive) result.push(e);
    }
    return result;
  }

  getClosestEnemy(from: Entity): Entity | undefined {
    let closest: Entity | undefined;
    let minDist = Infinity;
    for (const e of this.entities.values()) {
      if (!e.alive || e.owner === from.owner || e.owner === Owner.Neutral) continue;
      if (e.kind === EntityKind.Projectile || e.kind === EntityKind.Effect) continue;
      if (e.kind === EntityKind.Aircraft && from.kind !== EntityKind.Aircraft) continue;
      const dx = e.cellX - from.cellX;
      const dy = e.cellY - from.cellY;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closest = e;
      }
    }
    return closest;
  }

  getEnemiesInRange(from: Entity, range: number): Entity[] {
    const result: Entity[] = [];
    const rangeSq = range * range;
    for (const e of this.entities.values()) {
      if (!e.alive || e.owner === from.owner || e.owner === Owner.Neutral) continue;
      if (e.kind === EntityKind.Projectile || e.kind === EntityKind.Effect) continue;
      if (e.kind === EntityKind.Aircraft && from.kind !== EntityKind.Aircraft) continue;
      const dx = e.cellX - from.cellX;
      const dy = e.cellY - from.cellY;
      if (dx * dx + dy * dy <= rangeSq) {
        result.push(e);
      }
    }
    return result;
  }

  getSelected(): Entity[] {
    const result: Entity[] = [];
    for (const e of this.entities.values()) {
      if (e.selected && e.alive) result.push(e);
    }
    return result;
  }

  clearSelection(): void {
    for (const e of this.entities.values()) {
      e.selected = false;
    }
  }

  updateSpatial(entity: Entity): void {
    this.removeFromSpatial(entity);
    this.addToSpatial(entity);
  }

  clear(): void {
    this.entities.clear();
    this.spatialGrid.clear();
  }

  private addToSpatial(entity: Entity): void {
    for (let dy = 0; dy < entity.height; dy++) {
      for (let dx = 0; dx < entity.width; dx++) {
        const key = `${entity.cellX + dx},${entity.cellY + dy}`;
        let ids = this.spatialGrid.get(key);
        if (!ids) {
          ids = [];
          this.spatialGrid.set(key, ids);
        }
        ids.push(entity.id);
      }
    }
  }

  private removeFromSpatial(entity: Entity): void {
    for (let dy = 0; dy < entity.height; dy++) {
      for (let dx = 0; dx < entity.width; dx++) {
        const key = `${entity.cellX + dx},${entity.cellY + dy}`;
        const ids = this.spatialGrid.get(key);
        if (ids) {
          const idx = ids.indexOf(entity.id);
          if (idx >= 0) ids.splice(idx, 1);
        }
      }
    }
  }
}
