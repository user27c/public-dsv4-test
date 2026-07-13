import { gameState } from '../gameState.js';
import { TECHNOLOGIES, pickResearchOptions } from '../data/technologies.js';
import { TECH_COST_BASE } from '../constants.js';

export function pickResearchOptionsForEmpire(empire, category) {
  return pickResearchOptions(empire, category);
}

export function startResearch(empireId, category, techId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;

  const tech = TECHNOLOGIES[techId];
  if (!tech || tech.category !== category) return false;

  if (empire[`techResearching${capitalize(category)}`]) return false;

  empire[`techResearching${capitalize(category)}`] = techId;
  empire[`techProgress${capitalize(category)}`] = 0;
  return true;
}

export function tickResearch(empireId) {
  const empire = gameState.empires[empireId];
  if (!empire) return;

  const categories = ['Physics', 'Society', 'Engineering'];
  for (const cat of categories) {
    const techId = empire[`techResearching${cat}`];
    if (!techId) continue;

    const tech = TECHNOLOGIES[techId];
    if (!tech) continue;

    const storedKey = cat.toLowerCase();
    const researchPerTick = empire.income[storedKey] || 0;
    const totalResearch = empire.resources[storedKey] || 0;

    const progressPerTick = (researchPerTick / 30);

    empire[`techProgress${cat}`] = (empire[`techProgress${cat}`] || 0) + progressPerTick;

    const scaledCost = tech.cost; // simplified, no scaling

    if (empire[`techProgress${cat}`] >= scaledCost) {
      completeTechnology(empire, tech);
      empire[`techResearching${cat}`] = null;
      empire[`techProgress${cat}`] = 0;
      empire.resources[storedKey] -= scaledCost;

      if (empireId === gameState.playerEmpireId) {
        gameState.addNotification(`Research complete: ${tech.name}`, 'info');
      }
    }
  }
}

function completeTechnology(empire, tech) {
  empire.techResearched.add(tech.id);

  if (tech.unlocksShips) {
    empire.unlockedShips = empire.unlockedShips || [];
    for (const shipType of tech.unlocksShips) {
      if (!empire.unlockedShips.includes(shipType)) {
        empire.unlockedShips.push(shipType);
      }
    }
  }

  if (tech.unlocksWeapons) {
    empire.unlockedWeapons = empire.unlockedWeapons || [];
    for (const w of tech.unlocksWeapons) {
      if (!empire.unlockedWeapons.includes(w)) empire.unlockedWeapons.push(w);
    }
  }

  // Apply effects
  const effects = tech.effects || {};
  for (const [key, val] of Object.entries(effects)) {
    empire.modifiers[key] = (empire.modifiers[key] || 0) + val;
  }
}

export function getTechCost(tech) {
  if (!tech) return TECH_COST_BASE;
  return tech.cost || TECH_COST_BASE;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
