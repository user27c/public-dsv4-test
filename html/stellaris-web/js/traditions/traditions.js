import { gameState } from '../gameState.js';
import { TRADITION_TREES, ASCENSION_PERKS } from '../data/traditions.js';

export function canAdoptTradition(empireId, treeId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;

  const tree = TRADITION_TREES[treeId];
  if (!tree) return false;

  if (empire.traditions.adopted[treeId]) return false;

  const traditionsAdopted = Object.keys(empire.traditions.adopted || {}).length;
  const cost = 500 + traditionsAdopted * 250;

  return empire.treasury.unity >= cost;
}

export function adoptTradition(empireId, treeId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;
  if (!canAdoptTradition(empireId, treeId)) return false;

  const traditionsAdopted = Object.keys(empire.traditions.adopted || {}).length;
  const cost = 500 + traditionsAdopted * 250;

  empire.treasury.unity -= cost;
  empire.traditions.adopted[treeId] = { traditions: [], completed: false };
  empire.traditions.unitySpent = (empire.traditions.unitySpent || 0) + cost;

  const tree = TRADITION_TREES[treeId];
  // Auto-unlock first tradition
  if (tree.traditions.length > 0) {
    empire.traditions.adopted[treeId].traditions.push(tree.traditions[0].id);
    empire.traditions.unlockedTraditions.add(tree.traditions[0].id);
  }

  return true;
}

export function canBuyTradition(empireId, treeId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;

  const tree = TRADITION_TREES[treeId];
  if (!tree) return false;

  const adopted = empire.traditions.adopted[treeId];
  if (!adopted || adopted.completed) return false;

  const idx = adopted.traditions.length;
  if (idx >= tree.traditions.length) return false;

  const cost = tree.traditionCosts[idx] || 500;
  return empire.treasury.unity >= cost;
}

export function buyTradition(empireId, treeId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;
  if (!canBuyTradition(empireId, treeId)) return false;

  const tree = TRADITION_TREES[treeId];
  const adopted = empire.traditions.adopted[treeId];
  const idx = adopted.traditions.length;
  const cost = tree.traditionCosts[idx] || 500;

  empire.treasury.unity -= cost;
  empire.traditions.unitySpent = (empire.traditions.unitySpent || 0) + cost;

  const tradition = tree.traditions[idx];
  adopted.traditions.push(tradition.id);
  empire.traditions.unlockedTraditions.add(tradition.id);

  // Apply tradition effects
  if (tradition.effects) {
    for (const [key, val] of Object.entries(tradition.effects)) {
      empire.modifiers[key] = (empire.modifiers[key] || 0) + val;
    }
  }

  // Check completion
  if (adopted.traditions.length >= tree.traditions.length) {
    adopted.completed = true;
    if (tree.finisher && tree.finisher.effects) {
      for (const [key, val] of Object.entries(tree.finisher.effects)) {
        empire.modifiers[key] = (empire.modifiers[key] || 0) + val;
      }
    }
    // Grant ascension perk slot
    empire.ascensionPerks.available = (empire.ascensionPerks.available || 0) + 1;
  }

  return true;
}

export function canTakeAscensionPerk(empireId, perkId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;
  if (empire.ascensionPerks.available <= 0) return false;
  if (empire.ascensionPerks.taken.includes(perkId)) return false;

  const perk = ASCENSION_PERKS[perkId];
  if (!perk) return false;

  if (perk.requires) {
    for (const reqId of perk.requires) {
      if (!empire.techResearched.has(reqId)) return false;
    }
  }

  return true;
}

export function takeAscensionPerk(empireId, perkId) {
  if (!canTakeAscensionPerk(empireId, perkId)) return false;

  const empire = gameState.empires[empireId];
  empire.ascensionPerks.available--;
  empire.ascensionPerks.taken.push(perkId);

  const perk = ASCENSION_PERKS[perkId];
  if (perk.effects) {
    for (const [key, val] of Object.entries(perk.effects)) {
      empire.modifiers[key] = (empire.modifiers[key] || 0) + val;
    }
  }

  return true;
}
