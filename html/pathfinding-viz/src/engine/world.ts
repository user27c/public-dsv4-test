import { CellData, CellType, TeleportLink, Position } from '../types';

interface ChestItemMap {
  [key: string]: import('../types/item').ItemType;
}

const CHEST_ITEMS: import('../types/item').ItemType[] = [
  'speed_potion',
  'speed_potion',
  'wall_breaker',
  'wall_breaker',
  'slow_trap',
  'slow_trap',
  'chaos_teleport',
  'chaos_teleport',
];

export function randomChestItem(): import('../types/item').ItemType {
  return CHEST_ITEMS[Math.floor(Math.random() * CHEST_ITEMS.length)];
}

export function tryMove(
  nx: number,
  ny: number,
  cells: CellData[][],
  mapW: number,
  mapH: number,
  probStates: Map<string, boolean>
): { success: boolean; solidHit: boolean; probAttempt: boolean; probFail: boolean; teleport?: Position } {
  if (nx < 0 || nx >= mapW || ny < 0 || ny >= mapH) {
    return { success: false, solidHit: true, probAttempt: false, probFail: false };
  }

  const cell = cells[ny][nx];
  switch (cell.type) {
    case 'empty':
    case 'start':
    case 'end':
    case 'chest':
      return { success: true, solidHit: false, probAttempt: false, probFail: false };

    case 'solid':
      return { success: false, solidHit: true, probAttempt: false, probFail: false };

    case 'probabilistic': {
      const key = `${nx},${ny}`;
      const passable = Math.random() < 0.5;
      probStates.set(key, passable);
      return {
        success: passable,
        solidHit: false,
        probAttempt: true,
        probFail: !passable,
      };
    }

    case 'teleport_in':
    case 'teleport_out':
      return { success: true, solidHit: false, probAttempt: false, probFail: false };

    default:
      return { success: false, solidHit: true, probAttempt: false, probFail: false };
  }
}

export function getTeleportTarget(
  x: number,
  y: number,
  teleports: TeleportLink[]
): Position | null {
  for (const tp of teleports) {
    if (tp.in.x === x && tp.in.y === y) {
      return { x: tp.out.x, y: tp.out.y };
    }
    if (tp.dir === 'two_way' && tp.out.x === x && tp.out.y === y) {
      return { x: tp.in.x, y: tp.in.y };
    }
  }
  return null;
}

export function breakWall(
  x: number,
  y: number,
  cells: CellData[][],
  mapW: number,
  mapH: number
): boolean {
  const neighbors = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];
  for (const [dx, dy] of neighbors) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < mapW && ny >= 0 && ny < mapH && cells[ny][nx].type === 'solid') {
      cells[ny][nx] = { type: 'empty' };
      return true;
    }
  }
  return false;
}
