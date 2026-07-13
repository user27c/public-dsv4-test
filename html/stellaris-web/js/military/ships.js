import { gameState } from '../gameState.js';
import { SHIP_SIZES, WEAPON_TYPES, UTILITY_TYPES } from '../constants.js';
import { generateId, rand } from '../helpers.js';

export function buildFleet(empireId, systemId) {
  const empire = gameState.empires[empireId];
  const sys = gameState.systems[systemId];
  if (!empire || !sys || sys.owner !== empireId) return null;
  if (!sys.starbase || sys.starbase.level < 1) return null;

  const fleetId = 'fleet_' + generateId();
  const fleet = {
    id: fleetId,
    owner: empireId,
    systemId: systemId,
    name: `${empireId === gameState.playerEmpireId ? 'ISS' : 'FLT'} ${getFleetNumber(empireId)}`,
    ships: [],
    orders: null,
    stance: 'passive',
  };

  for (let i = 0; i < 3; i++) {
    fleet.ships.push(buildBasicCorvette(empire));
  }

  gameState.fleets[fleetId] = fleet;
  return fleet;
}

function getFleetNumber(empireId) {
  return (Object.values(gameState.fleets).filter(f => f.owner === empireId).length + 1);
}

function buildBasicCorvette(empire) {
  return {
    id: 'ship_' + generateId(),
    size: 'corvette',
    hull: 300,
    maxHull: 300,
    armor: 0,
    maxArmor: 0,
    shield: 0,
    maxShield: 0,
    weapons: [{ type: 'mass_driver_1', damage: 8, cooldown: 4, cooldownRemaining: 0 }],
    evasion: 0.6,
    speed: 1.6,
    experience: 0,
  };
}

export function buildShipsToFleet(empireId, fleetId, shipSize, count = 1) {
  const empire = gameState.empires[empireId];
  const fleet = gameState.fleets[fleetId];
  if (!empire || !fleet || fleet.owner !== empireId) return false;

  const sizeInfo = SHIP_SIZES[shipSize];
  if (!sizeInfo) return false;

  if (sizeInfo.techReq && !(empire.techResearched && empire.techResearched.has(sizeInfo.techReq))) {
    return false;
  }

  const totalCost = {};
  for (const [k, v] of Object.entries(sizeInfo.cost)) {
    totalCost[k] = v * count;
  }

  for (const [k, v] of Object.entries(totalCost)) {
    if ((empire.resources[k] || 0) < v) return false;
  }

  for (const [k, v] of Object.entries(totalCost)) {
    empire.resources[k] -= v;
  }

  for (let i = 0; i < count; i++) {
    fleet.ships.push({
      id: 'ship_' + generateId(),
      size: shipSize,
      hull: sizeInfo.hull,
      maxHull: sizeInfo.hull,
      armor: 0,
      maxArmor: 0,
      shield: 0,
      maxShield: 0,
      weapons: [],
      evasion: sizeInfo.evasion,
      speed: sizeInfo.speed,
      experience: 0,
    });
  }

  return true;
}

export function moveFleet(fleetId, targetSystemId) {
  const fleet = gameState.fleets[fleetId];
  if (!fleet) return false;

  const path = gameState.getPathBetween(fleet.systemId, targetSystemId);
  if (!path || path.length < 2) return false;

  if (path.length > 2) {
    const nextSystemId = path[1];
    fleet.systemId = nextSystemId;
    fleet.orders = { path: path.slice(2), target: targetSystemId };
    return true;
  }

  fleet.systemId = targetSystemId;
  fleet.orders = null;

  const targetSys = gameState.systems[targetSystemId];
  if (targetSys) targetSys.explored = true;

  return true;
}

export function tickFleets() {
  for (const fleet of Object.values(gameState.fleets)) {
    if (fleet.orders && fleet.orders.path && fleet.orders.path.length > 0) {
      const nextId = fleet.orders.path.shift();
      fleet.systemId = nextId;
      gameState.systems[nextId].explored = true;
      if (fleet.orders.path.length === 0) fleet.orders = null;
    }
  }
}

export function resolveCombat(systemId) {
  const sys = gameState.systems[systemId];
  if (!sys) return;

  const fleets = Object.values(gameState.fleets).filter(f => f.systemId === systemId);
  const ownerIds = new Set(fleets.map(f => f.owner));

  if (ownerIds.size < 2) return;

  const ownersArr = [...ownerIds];
  const attackerFleets = fleets.filter(f => f.owner === ownersArr[0]);
  const defenderFleets = fleets.filter(f => f.owner === ownersArr[1]);

  const attackPower = attackerFleets.reduce((sum, f) => sum + f.ships.length * 10, 0);
  const defendPower = defenderFleets.reduce((sum, f) => sum + f.ships.length * 10, 0);

  const attackerWins = attackPower * (0.3 + Math.random() * 0.7) > defendPower * (0.3 + Math.random() * 0.7);

  const loserFleets = attackerWins ? defenderFleets : attackerFleets;
  const winnerFleets = attackerWins ? attackerFleets : defenderFleets;

  for (const fleet of loserFleets) {
    const losses = Math.ceil(fleet.ships.length * (0.3 + Math.random() * 0.5));
    fleet.ships = fleet.ships.slice(0, Math.max(0, fleet.ships.length - losses));
  }

  for (const fleet of winnerFleets) {
    const losses = Math.ceil(fleet.ships.length * (0.05 + Math.random() * 0.15));
    fleet.ships = fleet.ships.slice(0, Math.max(1, fleet.ships.length - losses));
  }

  const loserOwner = loserFleets[0]?.owner;
  const winnerOwner = winnerFleets[0]?.owner;

  if (loserOwner === gameState.playerEmpireId) {
    gameState.addNotification(`Fleet defeated in ${sys.name}!`, 'alert');
  }
  if (winnerOwner === gameState.playerEmpireId) {
    gameState.addNotification(`Victory in ${sys.name}!`, 'info');
  }
}
