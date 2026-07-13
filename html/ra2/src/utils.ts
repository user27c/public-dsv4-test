import { TILE_W, TILE_H, TILE_HALF_W, TILE_HALF_H, MAP_W, MAP_H } from './constants.ts';
import { IsoPoint, ScreenPoint } from './types.ts';

export function isoToScreen(iso: IsoPoint): ScreenPoint {
  return {
    x: (iso.x - iso.y) * TILE_HALF_W,
    y: (iso.x + iso.y) * TILE_HALF_H,
  };
}

export function screenToIso(screen: ScreenPoint): IsoPoint {
  return {
    x: (screen.x / TILE_HALF_W + screen.y / TILE_HALF_H) / 2,
    y: (screen.y / TILE_HALF_H - screen.x / TILE_HALF_W) / 2,
  };
}

export function clampIso(point: IsoPoint): IsoPoint {
  return {
    x: Math.max(0, Math.min(MAP_W - 1, Math.floor(point.x))),
    y: Math.max(0, Math.min(MAP_H - 1, Math.floor(point.y))),
  };
}

export function cellKey(x: number, y: number): string {
  return `${Math.floor(x)},${Math.floor(y)}`;
}

export function distance(a: IsoPoint, b: IsoPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function manhattan(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

let _nextId = 1;
export function nextEntityId(): number {
  return _nextId++;
}

export function facingToAngle(facing: number): number {
  return (facing / 8) * Math.PI * 2 - Math.PI / 2;
}

export function angleToFacing(angle: number): number {
  let f = Math.round(((angle + Math.PI / 2) / (Math.PI * 2)) * 8) % 8;
  if (f < 0) f += 8;
  return f;
}

export function directionToFacing(dx: number, dy: number): number {
  return angleToFacing(Math.atan2(dy, dx));
}
