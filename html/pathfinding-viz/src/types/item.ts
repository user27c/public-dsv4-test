export type ItemType = 'speed_potion' | 'wall_breaker' | 'slow_trap' | 'chaos_teleport';

export interface ItemDef {
  type: ItemType;
  name: string;
  active: boolean;
  duration: number;
  description: string;
}

export const ITEMS: Record<ItemType, ItemDef> = {
  speed_potion: {
    type: 'speed_potion',
    name: '加速药水',
    active: true,
    duration: 3000,
    description: '移动速度×2，持续3秒',
  },
  wall_breaker: {
    type: 'wall_breaker',
    name: '拆墙器',
    active: true,
    duration: 0,
    description: '拆除相邻实体墙',
  },
  slow_trap: {
    type: 'slow_trap',
    name: '减速陷阱',
    active: false,
    duration: 5000,
    description: '速度×0.5，持续5秒',
  },
  chaos_teleport: {
    type: 'chaos_teleport',
    name: '混乱传送',
    active: false,
    duration: 0,
    description: '随机传送至空地',
  },
};

export interface PlayerInventory {
  items: ItemType[];
  maxSize: number;
}
