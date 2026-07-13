import { ItemType, ITEMS } from '../types/item';
import { Position, CellData, CellType, Direction, TeleportLink, DIRECTION_DELTA } from '../types/map';

export interface PlayerState {
  x: number;
  y: number;
  inventory: (ItemType | null)[];
  speedMultiplier: number;
  speedPotionEnd: number;
  slowTrapEnd: number;
  startX: number;
  startY: number;
}

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    inventory: [null, null, null],
    speedMultiplier: 1,
    speedPotionEnd: 0,
    slowTrapEnd: 0,
    startX: x,
    startY: y,
  };
}

export function addToInventory(player: PlayerState, item: ItemType): void {
  if (ITEMS[item].active) {
    const slot = player.inventory.findIndex((s) => s === null);
    if (slot !== -1) {
      player.inventory[slot] = item;
    } else {
      player.inventory[0] = item;
    }
  }
}

export function useItem(player: PlayerState, slot: number, now: number, pos: Position, getEmptyNearby: (x: number, y: number, radius: number) => Position[]): { used: boolean; removed?: boolean; dur?: number; randomPos?: Position } {
  const item = player.inventory[slot];
  if (item === null) return { used: false };

  const def = ITEMS[item];
  player.inventory[slot] = null;

  switch (item) {
    case 'speed_potion':
      player.speedPotionEnd = Math.max(player.speedPotionEnd, now + def.duration);
      return { used: true, dur: def.duration };
    case 'wall_breaker':
      return { used: true };
    case 'slow_trap':
      return { used: true };
    case 'chaos_teleport':
      return { used: true };
    default:
      return { used: false };
  }
}

export function applyPassiveEffect(player: PlayerState, item: ItemType, now: number, pos: Position, mapW: number, mapH: number, isPassable: (x: number, y: number) => boolean): { teleported?: Position } | null {
  const def = ITEMS[item];
  switch (item) {
    case 'slow_trap':
      player.slowTrapEnd = Math.max(player.slowTrapEnd, now + def.duration);
      break;
    case 'chaos_teleport': {
      const candidates: Position[] = [];
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const nx = pos.x + dx;
          const ny = pos.y + dy;
          if (nx >= 0 && nx < mapW && ny >= 0 && ny < mapH && isPassable(nx, ny)) {
            candidates.push({ x: nx, y: ny });
          }
        }
      }
      if (candidates.length > 0) {
        const rp = candidates[Math.floor(Math.random() * candidates.length)];
        return { teleported: rp };
      }
      break;
    }
  }
  return null;
}

export function updatePlayerEffects(player: PlayerState, now: number): void {
  player.speedMultiplier = 1;
  if (now < player.speedPotionEnd) player.speedMultiplier *= 2;
  if (now < player.slowTrapEnd) player.speedMultiplier *= 0.5;
}

export function getPassiveEffectRemaining(player: PlayerState, now: number): { speedPotion: number; slowTrap: number } {
  return {
    speedPotion: Math.max(0, player.speedPotionEnd - now),
    slowTrap: Math.max(0, player.slowTrapEnd - now),
  };
}
