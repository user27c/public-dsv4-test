import { Grid } from './grid.js';
import { EventBus } from './engine.js';
import { BUILDING_DEFS, GRID_SIZE } from './config.js';

let currentRoadType = 'road_basic';
const roads = {};

export const RoadTool = {
  getType() { return currentRoadType; },
  setType(t) { currentRoadType = t; },

  placeLine(x1, y1, x2, y2) {
    const cells = [];
    if (x1 === x2) {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        cells.push({ x: x1, y, dir: 0 });
      }
    } else if (y1 === y2) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        cells.push({ x, y: y1, dir: 1 });
      }
    } else if (Math.abs(x2 - x1) === Math.abs(y2 - y1)) {
      const dx = x2 > x1 ? 1 : -1;
      const dy = y2 > y1 ? 1 : -1;
      for (let i = 0; i <= Math.abs(x2 - x1); i++) {
        cells.push({ x: x1 + i * dx, y: y1 + i * dy, dir: 2 });
      }
    }
    return cells;
  },

  canPlaceCell(x, y) {
    if (!Grid.inBounds(x, y) || !Grid.inUnlocked(x, y)) return false;
    const cell = Grid.get(x, y);
    return !cell.isWater;
  },

  placeSegment(startX, startY, endX, endY) {
    const cells = this.placeLine(startX, startY, endX, endY);
    const type = currentRoadType;
    let placed = 0;
    for (const { x, y, dir } of cells) {
      if (this.canPlaceCell(x, y)) {
        Grid.setRoad(x, y, type, dir);
        placed++;
      }
    }
    if (placed > 0) {
      const def = BUILDING_DEFS[type];
      EventBus.emit('road-placed', { type, count: placed, cost: def.cost * placed });
      EventBus.emit('grid-changed');
    }
    return placed > 0;
  },

  getCostPerCell() {
    return BUILDING_DEFS[currentRoadType].cost;
  },

  getRoadDef(type) {
    return BUILDING_DEFS[type] || BUILDING_DEFS.road_basic;
  },
};
