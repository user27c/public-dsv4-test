import { gameState } from '../gameState.js';
import { ETHICS_OPINION_MODIFIERS } from '../data/ethics.js';

export function establishContact(empireIdA, empireIdB) {
  const empA = gameState.empires[empireIdA];
  const empB = gameState.empires[empireIdB];
  if (!empA || !empB) return;

  empA.contacts[empireIdB] = {
    established: gameState.tick,
    intel: 10,
  };
  empB.contacts[empireIdA] = {
    established: gameState.tick,
    intel: 10,
  };

  initOpinion(empireIdA, empireIdB);
  initOpinion(empireIdB, empireIdA);
}

function initOpinion(fromId, toId) {
  const from = gameState.empires[fromId];
  const to = gameState.empires[toId];
  if (!from || !to) return;

  if (!from.opinions) from.opinions = {};
  let opinion = 0;

  for (const eid of from.ethics) {
    for (const teid of to.ethics) {
      const mod = ETHICS_OPINION_MODIFIERS[eid];
      if (mod && mod[teid] !== undefined) {
        opinion += mod[teid];
      }
    }
  }

  if (from.ethics.includes('xenophile') || from.ethics.includes('fanatic_xenophile')) opinion += 25;
  if (from.ethics.includes('xenophobe') || from.ethics.includes('fanatic_xenophobe')) opinion -= 25;

  from.opinions[toId] = opinion;
}

export function getOpinion(fromId, toId) {
  const from = gameState.empires[fromId];
  if (!from || !from.opinions) return 0;
  return from.opinions[toId] || 0;
}

export function getTrust(fromId, toId) {
  const from = gameState.empires[fromId];
  if (!from || !from.trustLevels) return 0;
  return from.trustLevels[toId] || 0;
}

export function getRelationStatus(fromId, toId) {
  const opinion = getOpinion(fromId, toId);
  const trust = getTrust(fromId, toId);
  const total = opinion + trust;

  if (total >= 60) return 'friendly';
  if (total >= 20) return 'cordial';
  if (total >= -20) return 'neutral';
  if (total >= -60) return 'tense';
  return 'hostile';
}

export function declareWar(attackerId, defenderId) {
  const attacker = gameState.empires[attackerId];
  const defender = gameState.empires[defenderId];
  if (!attacker || !defender) return false;

  if (attacker.resources.influence < 50) return false;
  attacker.resources.influence -= 50;

  attacker.opinions[defenderId] = (attacker.opinions[defenderId] || 0) - 200;
  defender.opinions[attackerId] = (defender.opinions[attackerId] || 0) - 200;

  if (attackerId === gameState.playerEmpireId) {
    gameState.addNotification(`War declared on ${defender.name}!`, 'alert');
  }
  if (defenderId === gameState.playerEmpireId) {
    gameState.addNotification(`${attacker.name} has declared war on us!`, 'alert');
  }

  return true;
}

export function tickDiplomacy() {
  for (const [eidA, empA] of Object.entries(gameState.empires)) {
    for (const [eidB, empB] of Object.entries(gameState.empires)) {
      if (eidA === eidB) continue;
      if (!empA.contacts[eidB]) continue;

      // Trust growth
      empA.trustLevels = empA.trustLevels || {};
      empA.trustLevels[eidB] = (empA.trustLevels[eidB] || 0) + 0.05;
      empA.trustLevels[eidB] = Math.min(100, empA.trustLevels[eidB]);
    }
  }

  // Auto establish contact for nearby empires
  if (gameState.tick % 30 === 0) {
    for (const [eidA, empA] of Object.entries(gameState.empires)) {
      const sysA = Object.values(gameState.systems).find(s => s.owner === eidA);
      if (!sysA) continue;
      for (const [eidB, empB] of Object.entries(gameState.empires)) {
        if (eidA === eidB) continue;
        if (empA.contacts[eidB]) continue;
        const sysB = Object.values(gameState.systems).find(s => s.owner === eidB);
        if (!sysB) continue;
        const dx = sysA.x - sysB.x, dy = sysA.y - sysB.y;
        if (Math.sqrt(dx * dx + dy * dy) < 300) {
          establishContact(eidA, eidB);
        }
      }
    }
  }
}
