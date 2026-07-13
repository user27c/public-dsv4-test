import { gameState } from '../gameState.js';
import { RESOURCES } from '../constants.js';
import { clamp } from '../helpers.js';
import { ETHICS_DATA } from '../data/ethics.js';
import { CIVICS } from '../data/civics.js';
import { AUTHORITIES } from '../data/civics.js';
import { TRAITS, ORIGINS } from '../data/traits.js';

export function calculateEmpireIncome(empireId) {
  const empire = gameState.empires[empireId];
  if (!empire) return;

  const inc = {
    energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0,
    influence: 3, unity: 0, physics: 0, society: 0, engineering: 0,
  };

  inc.influence = 3 + getEthicBonus(empire, 'influence');
  inc.energy += getTraitBonus(empire, 'energy');

  const planets = gameState.getEmpirePlanets(empireId);
  for (const planet of planets) {
    const pops = planet.population || 0;
    planet.housing = 0;
    planet.amenities = 0;

    for (const [dType, dData] of Object.entries(planet.districts || {})) {
      const built = dData.built || 0;
      if (built <= 0) continue;
      switch (dType) {
        case 'city':
          planet.housing += built * 5;
          inc.unity += built * 2;
          break;
        case 'industrial':
          planet.housing += built * 2;
          inc.alloys += built * 3;
          inc.consumer_goods += built * 3;
          inc.minerals -= built * 6;
          break;
        case 'generator':
          planet.housing += built * 2;
          inc.energy += built * 12;
          break;
        case 'mining':
          planet.housing += built * 2;
          inc.minerals += built * 12;
          break;
        case 'agriculture':
          planet.housing += built * 2;
          inc.food += built * 12;
          break;
      }
    }

    for (const bId of (planet.buildings || [])) {
      switch (bId) {
        case 'research_lab':
          inc.physics += 4; inc.society += 4; inc.engineering += 4;
          inc.consumer_goods -= 2; inc.energy -= 2;
          break;
        case 'alloy_foundry':
          inc.alloys += 6; inc.minerals -= 12; inc.energy -= 2;
          break;
        case 'civilian_factory':
          inc.consumer_goods += 12; inc.minerals -= 12; inc.energy -= 2;
          break;
        case 'unity_building':
          inc.unity += 8; inc.consumer_goods -= 4; inc.energy -= 2;
          planet.amenities += 4;
          break;
        case 'energy_grid':
          inc.energy *= 1.15; inc.energy -= 1;
          break;
        case 'mineral_plant':
          inc.minerals *= 1.15; inc.energy -= 1;
          break;
        case 'food_plant':
          inc.food *= 1.15; inc.energy -= 1;
          break;
        case 'stronghold':
          inc.energy -= 1; inc.unity += 2;
          break;
        case 'luxury_residence':
          inc.energy -= 1; inc.consumer_goods -= 1;
          planet.amenities += 5; planet.housing += 3;
          break;
        case 'commerce_building':
          inc.energy -= 1; inc.energy += 4;
          break;
      }
    }

    // Pop upkeep
    inc.food -= pops * 1;
    inc.consumer_goods -= pops * 0.25;
    planet.amenities += pops * 0.5;
  }

  // Space deposits
  for (const sys of Object.values(gameState.systems)) {
    if (sys.owner !== empireId || !sys.planets) continue;
    for (const p of sys.planets) {
      if (!p.colonized && p.deposits) {
        inc.energy += (p.deposits.energy || 0);
        inc.minerals += (p.deposits.minerals || 0);
        inc.alloys += (p.deposits.alloys || 0) * 0.5;
      }
    }
  }

  // Starbase upkeep
  const owned = gameState.getEmpireSystems(empireId);
  const sc = owned.filter(s => s.starbase && s.starbase.level >= 1).length;
  inc.energy -= sc * 1;

  // Fleet upkeep
  for (const fleet of Object.values(gameState.fleets)) {
    if (fleet.owner !== empireId) continue;
    const cnt = fleet.ships.length;
    inc.energy -= cnt * 0.3;
    inc.alloys -= cnt * 0.1;
  }

  inc.unity += getEthicBonus(empire, 'unity');

  for (const key of Object.keys(inc)) {
    inc[key] = Math.round(inc[key] * 100) / 100;
  }

  empire.income = inc;
}

export function tickResources(empireId) {
  const empire = gameState.empires[empireId];
  if (!empire || !empire.income) return;

  for (const key of Object.keys(empire.income)) {
    const inc = empire.income[key];
    if (inc === 0) continue;

    if (key === 'influence') {
      empire.resources[key] = clamp((empire.resources[key] || 0) + inc, 0, 1000);
    } else if (key === 'physics' || key === 'society' || key === 'engineering') {
      empire.resources[key] = (empire.resources[key] || 0) + inc;
    } else if (key === 'unity') {
      empire.treasury.unity = (empire.treasury.unity || 0) + inc;
    } else {
      empire.resources[key] = Math.max(0, (empire.resources[key] || 0) + inc);
    }
  }
}

export function canAfford(empire, costs) {
  for (const [key, val] of Object.entries(costs)) {
    if (empire.resources[key] === undefined) continue;
    if (empire.resources[key] < val) return false;
  }
  return true;
}

export function deductCost(empire, costs) {
  for (const [key, val] of Object.entries(costs)) {
    if (empire.resources[key] !== undefined) {
      empire.resources[key] = Math.max(0, empire.resources[key] - val);
    }
  }
}

function getEthicBonus(empire, effect) {
  let total = 0;
  for (const eid of empire.ethics) {
    const data = ETHICS_DATA[eid];
    if (data && data.effects && data.effects[effect]) {
      total += data.effects[effect];
    }
  }
  return total;
}

function getTraitBonus(empire, effect) {
  if (!empire.species || !empire.species.traits) return 0;
  let total = 0;
  for (const tid of empire.species.traits) {
    const data = TRAITS[tid];
    if (data && data.effects && data.effects[effect]) {
      total += data.effects[effect];
    }
  }
  return total;
}
