import { gameState } from '../gameState.js';
import { rand, pick, generateId } from '../helpers.js';

export function buildScienceShip(empireId, systemId) {
  const empire = gameState.empires[empireId];
  const sys = gameState.systems[systemId];
  if (!empire || !sys || sys.owner !== empireId) return null;
  if (!sys.starbase || sys.starbase.level < 1) return null;

  const cost = { alloys: 100 };
  if (empire.resources.alloys < cost.alloys) return null;

  empire.resources.alloys -= cost.alloys;
  const shipId = 'sciship_' + generateId();
  const ship = {
    id: shipId,
    owner: empireId,
    systemId: systemId,
    name: 'SCV ' + (Object.values(gameState.scienceShips).filter(s => s.owner === empireId).length + 1),
    scientistLevel: 1,
    surveyingProgress: 0,
    automation: false,
  };
  gameState.scienceShips[shipId] = ship;
  return ship;
}

export function surveySystem(scienceShipId, systemId) {
  const ship = gameState.scienceShips[scienceShipId];
  const sys = gameState.systems[systemId];
  if (!ship || !sys) return false;

  const empire = gameState.empires[ship.owner];
  if (!empire) return false;

  if (ship.systemId !== systemId) return false;
  if (sys.surveyed) return false;

  ship.surveyingProgress += (2 + ship.scientistLevel * 0.5);

  if (ship.surveyingProgress >= 20) {
    ship.surveyingProgress = 0;
    sys.surveyed = true;
    empire.surveyedSystems.add(systemId);
    gameState.addNotification(`Surveyed: ${sys.name}`, 'info');

    const anomalyChance = 0.05 + Object.values(gameState.systems).filter(
      s => s.surveyed && s.anomalies && s.anomalies.length === 0
    ).length * 0.005;

    if (Math.random() < anomalyChance) {
      sys.anomalies = sys.anomalies || [];
      sys.anomalies.push({
        id: 'anom_' + generateId(),
        level: rand(1, 3),
        type: pick(['alien_mural', 'crystal_formations', 'ancient_wreck', 'subspace_echo']),
        researched: false,
      });
      gameState.addNotification(`Anomaly detected in ${sys.name}!`, 'alert');
    }

    // Survey research bonus from discovery tradition
    const discoveryFine = empire.traditions && empire.traditions.unlockedTraditions &&
      empire.traditions.unlockedTraditions.has('disc_planetary');
    if (discoveryFine) {
      empire.resources.physics += 10;
      empire.resources.society += 10;
      empire.resources.engineering += 10;
    }

    return true;
  }
  return false;
}

export function moveScienceShip(shipId, targetSystemId) {
  const ship = gameState.scienceShips[shipId];
  if (!ship) return false;

  const path = gameState.getPathBetween(ship.systemId, targetSystemId);
  if (!path || path.length < 2) return false;

  const nextSystemId = path[1];
  ship.systemId = nextSystemId;
  gameState.systems[nextSystemId].explored = true;

  const empire = gameState.empires[ship.owner];
  if (empire) empire.exploredSystems.add(nextSystemId);

  return true;
}

export function buildConstructionShip(empireId, systemId) {
  const empire = gameState.empires[empireId];
  const sys = gameState.systems[systemId];
  if (!empire || !sys || sys.owner !== empireId) return null;
  if (!sys.starbase || sys.starbase.level < 1) return null;

  const cost = { alloys: 100 };
  if (empire.resources.alloys < cost.alloys) return null;

  empire.resources.alloys -= cost.alloys;
  const shipId = 'conship_' + generateId();
  const ship = {
    id: shipId,
    owner: empireId,
    systemId: systemId,
    name: 'CNV ' + (Object.values(gameState.constructionShips).filter(s => s.owner === empireId).length + 1),
  };
  gameState.constructionShips[shipId] = ship;
  return ship;
}

export function buildStarbase(empireId, systemId) {
  const empire = gameState.empires[empireId];
  const sys = gameState.systems[systemId];
  if (!empire || !sys) return false;
  if (sys.owner) return false;
  if (!sys.surveyed) return false;

  const dist = gameState.getSystemHyperlaneDist(systemId,
    Object.values(gameState.systems).find(s => s.owner === empireId && s.starbase)?.id || systemId);

  const influenceCost = 75 * (dist + 1);
  const alloyCost = 100;

  if (empire.resources.influence < influenceCost) return false;
  if (empire.resources.alloys < alloyCost) return false;

  empire.resources.influence -= influenceCost;
  empire.resources.alloys -= alloyCost;

  sys.owner = empireId;
  sys.starbase = { level: 1, owner: empireId, modules: [], buildings: [] };
  sys.explored = true;
  sys.surveyed = true;

  gameState.addNotification(`Starbase built in ${sys.name}`, 'info');
  return true;
}
