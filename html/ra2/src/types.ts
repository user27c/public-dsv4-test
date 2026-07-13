export enum Owner {
  Neutral = 0,
  Allies = 1,
  Soviets = 2,
  Special = 3,
}

export enum Country {
  America = 0,
  Korea = 1,
  France = 2,
  Germany = 3,
  Britain = 4,
  Russia = 5,
  Iraq = 6,
  Cuba = 7,
  Libya = 8,
}

export function getFaction(country: Country): Owner {
  if (country <= Country.Britain) return Owner.Allies;
  return Owner.Soviets;
}

export function isAllies(country: Country): boolean {
  return country <= Country.Britain;
}

export function owningFaction(owner: Owner): 'allies' | 'soviet' | 'neutral' | 'special' {
  switch (owner) {
    case Owner.Allies: return 'allies';
    case Owner.Soviets: return 'soviet';
    case Owner.Special: return 'special';
    default: return 'neutral';
  }
}

export enum InfantryStance {
  Stand = 0,
  Crouch = 1,
  Prone = 2,
}

export enum VeterancyLevel {
  Rookie = 0,
  Veteran = 1,
  Elite = 2,
}

export enum TargetType {
  None = 0,
  Ground = 1,
  Air = 2,
  Both = 3,
}

export enum ArmorType {
  None = 0,
  Flesh = 1,
  Wood = 2,
  Steel = 3,
  Concrete = 4,
  Special1 = 5,
  Special2 = 6,
}

export enum WeaponType {
  Instant = 0,
  Projectile = 1,
  Beam = 2,
}

export enum TileTerrain {
  Clear = 0,
  Rough = 1,
  Road = 2,
  Water = 3,
  Beach = 4,
  Rock = 5,
  Cliff = 6,
  Ore = 7,
  Gems = 8,
  Pavement = 9,
  Railroad = 10,
  Bridge = 11,
  Tunnel = 12,
  Rubble = 13,
}

export interface TileData {
  terrain: TileTerrain;
  variant: number;
  oreAmount: number;
  occupied: boolean;
  shroudState: number; // 0=hidden, 1=explored, 2=visible
}

export interface IsoPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export enum EntityKind {
  Infantry = 'infantry',
  Vehicle = 'vehicle',
  Aircraft = 'aircraft',
  Naval = 'naval',
  Building = 'building',
  Projectile = 'projectile',
  Effect = 'effect',
}

export enum CommandType {
  Move = 'move',
  AttackMove = 'attack_move',
  Attack = 'attack',
  Stop = 'stop',
  Guard = 'guard',
  Deploy = 'deploy',
  Enter = 'enter',
  Repair = 'repair',
  Sell = 'sell',
}

export interface Command {
  type: CommandType;
  targetX?: number;
  targetY?: number;
  targetId?: number;
  queued: boolean;
}

export interface EntityState {
  id: number;
  kind: EntityKind;
  owner: Owner;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  selected: boolean;
  alive: boolean;
  visible: boolean;
  speed: number;
  facing: number; // 0-7, 8-direction
  typeId: string;
}
