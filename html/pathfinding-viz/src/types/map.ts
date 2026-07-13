export type CellType =
  | 'empty'
  | 'solid'
  | 'probabilistic'
  | 'teleport_in'
  | 'teleport_out'
  | 'start'
  | 'end'
  | 'chest';

export type TeleportDir = 'one_way' | 'two_way';

export interface TeleportLink {
  id: string;
  dir: TeleportDir;
  in: Position;
  out: Position;
}

export interface Position {
  x: number;
  y: number;
}

export interface CellData {
  type: CellType;
  teleportId?: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

export function posEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
