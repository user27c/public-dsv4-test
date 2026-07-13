import { gameState } from '../gameState.js';
import { RANDOM_EVENTS, ANOMALY_POOL } from '../data/events.js';
import { pick, rand } from '../helpers.js';

export function tickEvents() {
  if (gameState.tick % 90 === 0) {
    triggerRandomEvent();
  }
}

function triggerRandomEvent() {
  const event = pick(RANDOM_EVENTS);

  if (event.choices) {
    const choice = pick(event.choices);
    if (choice.result) {
      applyEventResult(gameState.playerEmpireId, choice.result);
    }
  } else if (event.gives) {
    applyEventResult(gameState.playerEmpireId, event.gives);
  }

  gameState.addNotification(`${event.name}: ${event.description}`, 'info');
}

function applyEventResult(empireId, result) {
  const empire = gameState.empires[empireId];
  if (!empire) return;

  if (result.energy) empire.resources.energy += result.energy;
  if (result.minerals) empire.resources.minerals += result.minerals;
  if (result.food) empire.resources.food += result.food;
  if (result.alloys) empire.resources.alloys += result.alloys;
  if (result.consumer_goods) empire.resources.consumer_goods += result.consumer_goods;
  if (result.physicsResearch) empire.resources.physics += result.physicsResearch;
  if (result.societyResearch) empire.resources.society += result.societyResearch;
  if (result.engineeringResearch) empire.resources.engineering += result.engineeringResearch;
  if (result.unity) empire.treasury.unity += result.unity;
  if (result.influence) empire.resources.influence += result.influence;
  if (result.opinionMod) {
    const contacts = Object.values(gameState.empires).filter(e => e.id !== empireId);
    for (const c of contacts.slice(0, 3)) {
      empire.opinions[c.id] = (empire.opinions[c.id] || 0) + result.opinionMod;
    }
  }
  if (result.popGrowth) {
    empire.modifiers.popGrowth = (empire.modifiers.popGrowth || 0) + result.popGrowth;
  }
  if (result.happiness) {
    empire.modifiers.happiness = (empire.modifiers.happiness || 0) + result.happiness;
  }
}

export function researchAnomaly(empireId, systemId, anomalyIndex) {
  const sys = gameState.systems[systemId];
  const empire = gameState.empires[empireId];
  if (!sys || !empire) return false;

  const anomaly = (sys.anomalies || [])[anomalyIndex];
  if (!anomaly || anomaly.researched) return false;

  const foundAnomaly = ANOMALY_POOL.find(a => a.id.includes(anomaly.type || ''));
  if (!foundAnomaly) {
    anomaly.researched = true;
    empire.resources.society += 200;
    return true;
  }

  // Pick random outcome
  const totalChance = foundAnomaly.outcomes.reduce((s, o) => s + o.chance, 0);
  let r = Math.random() * totalChance;
  let chosen = foundAnomaly.outcomes[0];
  for (const outcome of foundAnomaly.outcomes) {
    r -= outcome.chance;
    if (r <= 0) { chosen = outcome; break; }
  }

  anomaly.researched = true;
  applyEventResult(empireId, chosen.reward);
  gameState.addNotification(`Anomaly resolved: ${foundAnomaly.name}`, 'info');
  return true;
}
