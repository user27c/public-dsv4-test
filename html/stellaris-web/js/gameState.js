import { START_DATE, RESOURCES } from './constants.js';
import { generateId, deepClone } from './helpers.js';

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.date = deepClone(START_DATE);
    this.speed = 0;
    this.tick = 0;
    this.paused = true;
    this.empires = {};
    this.playerEmpireId = null;
    this.systems = {};
    this.hyperlanes = [];
    this.fleets = {};
    this.scienceShips = {};
    this.constructionShips = {};
    this.colonyShips = {};
    this.events = [];
    this.notifications = [];
    this.selectedSystemId = null;
    this.selectedFleetId = null;
    this.selectedPlanetId = null;
    this.currentPanel = null;
    this.viewCenter = { x: 0, y: 0 };
    this.viewZoom = 1;
    this.tickAccumulator = 0;
    this.lastFrameTime = 0;
    this.gameStarted = false;
  }

  get playerEmpire() {
    return this.empires[this.playerEmpireId];
  }

  getEmpireSystems(empireId) {
    return Object.values(this.systems).filter(s => s.owner === empireId);
  }

  getEmpirePlanets(empireId) {
    const planets = [];
    for (const sys of Object.values(this.systems)) {
      if (sys.owner === empireId) {
        for (const p of (sys.planets || [])) {
          if (p.colonized && p.owner === empireId) planets.push(p);
        }
      }
    }
    return planets;
  }

  getSystemById(id) {
    return this.systems[id];
  }

  getSystemsInRange(centerId, maxDist) {
    const center = this.systems[centerId];
    if (!center) return [];
    const visited = new Set([centerId]);
    const queue = [[centerId, 0]];
    const result = [];
    while (queue.length > 0) {
      const [currentId, d] = queue.shift();
      if (d <= maxDist && currentId !== centerId) result.push(currentId);
      if (d >= maxDist) continue;
      const neighbors = this.getNeighborSystems(currentId);
      for (const nid of neighbors) {
        if (!visited.has(nid)) {
          visited.add(nid);
          queue.push([nid, d + 1]);
        }
      }
    }
    return result;
  }

  getNeighborSystems(systemId) {
    const neighbors = [];
    for (const hl of this.hyperlanes) {
      if (hl.a === systemId) neighbors.push(hl.b);
      else if (hl.b === systemId) neighbors.push(hl.a);
    }
    return neighbors;
  }

  getPathBetween(fromId, toId) {
    if (fromId === toId) return [fromId];
    const visited = new Set();
    const queue = [[fromId, [fromId]]];
    visited.add(fromId);
    while (queue.length > 0) {
      const [current, path] = queue.shift();
      const neighbors = this.getNeighborSystems(current);
      for (const nid of neighbors) {
        if (nid === toId) return [...path, nid];
        if (!visited.has(nid)) {
          visited.add(nid);
          queue.push([nid, [...path, nid]]);
        }
      }
    }
    return null;
  }

  getSystemHyperlaneDist(fromId, toId) {
    const path = this.getPathBetween(fromId, toId);
    return path ? path.length - 1 : Infinity;
  }

  getStarveHabitability(systemId) {
    const sys = this.systems[systemId];
    if (!sys || !sys.planets) return 0;
    const habitable = sys.planets.filter(p => p.isHabitable);
    return habitable.length;
  }

  getFleetsInSystem(systemId) {
    return Object.values(this.fleets).filter(f => f.systemId === systemId);
  }

  getScienceShipsInSystem(systemId) {
    return Object.values(this.scienceShips).filter(s => s.systemId === systemId);
  }

  addNotification(msg, type = 'info') {
    this.notifications.push({
      id: generateId(),
      msg,
      type,
      tick: this.tick,
    });
    if (this.notifications.length > 10) this.notifications.shift();
  }

  findClosestOwnedSystem(x, y) {
    let closest = null;
    let minDist = Infinity;
    for (const sys of Object.values(this.systems)) {
      if (sys.owner === this.playerEmpireId) {
        const d = Math.sqrt((sys.x - x) ** 2 + (sys.y - y) ** 2);
        if (d < minDist) { minDist = d; closest = sys; }
      }
    }
    return closest;
  }

  empiresInContact() {
    const player = this.playerEmpire;
    if (!player) return [];
    return Object.values(this.empires).filter(e =>
      e.id !== this.playerEmpireId && player.contacts[e.id]
    );
  }

  exportSave() {
    return JSON.stringify({
      date: this.date, speed: this.speed, tick: this.tick,
      empires: this.empires, playerEmpireId: this.playerEmpireId,
      systems: this.systems, hyperlanes: this.hyperlanes,
      fleets: this.fleets, scienceShips: this.scienceShips,
      constructionShips: this.constructionShips, colonyShips: this.colonyShips,
      events: this.events,
    });
  }

  importSave(json) {
    const data = JSON.parse(json);
    Object.assign(this, data);
    this.gameStarted = true;
    this.paused = false;
  }
}

export const gameState = new GameState();
