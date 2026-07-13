import { CellType, Direction, Position } from './map';
import { ItemType } from './item';

export interface CellInfo {
  type: CellType;
  x: number;
  y: number;
}

export interface AlgorithmAPI {
  getSurroundings(range: number): CellInfo[][];
  getPlayer(): PlayerInfo;
  getGoal(): Position;
  getMapSize(): { width: number; height: number };
  move(dir: Direction): void;
  useItem(slot: number): void;
  log(msg: string): void;
}

export interface PlayerInfo {
  x: number;
  y: number;
  inventory: ItemType[];
  speedMultiplier: number;
  steps: number;
  slowTrapRemaining: number;
  speedPotionRemaining: number;
}

export interface AlgorithmResult {
  algorithmId: string;
  algorithmName: string;
  success: boolean;
  totalTime: number;
  steps: number;
  solidWallHits: number;
  probWallAttempts: number;
  probWallFails: number;
  itemsUsed: number;
  teleportsUsed: number;
  error?: string;
}

export interface AlgorithmDef {
  id: string;
  name: string;
  code: string;
  isBaseline: boolean;
}
