import { gameState } from '../gameState.js';
import { BUILDING_TYPES, POP_GROWTH_BASE, POP_GROWTH_SCALE } from '../constants.js';
import { rand } from '../helpers.js';

export function colonizePlanet(empireId, planetId) {
  const empire = gameState.empires[empireId];
  if (!empire) return false;

  let planet = null;
  for (const sys of Object.values(gameState.systems)) {
    for (const p of (sys.planets || [])) {
      if (p.id === planetId) { planet = p; break; }
    }
    if (planet) break;
  }
  if (!planet || !planet.isHabitable || planet.colonized) return false;

  const cost = { alloys: 200, food: 200, consumer_goods: 200 };
  if (empire.resources.alloys < cost.alloys ||
      empire.resources.food < cost.food ||
      empire.resources.consumer_goods < cost.consumer_goods) {
    return false;
  }

  empire.resources.alloys -= cost.alloys;
  empire.resources.food -= cost.food;
  empire.resources.consumer_goods -= cost.consumer_goods;

  planet.owner = empireId;
  planet.colonized = true;
  planet.population = 1;
  planet.housing = 5;
  planet.amenities = 3;
  planet.stability = 50;

  // Initialize districts
  planet.districts = {
    city: { built: 0, max: Math.floor(planet.size / 4) },
    industrial: { built: 0, max: Math.floor(planet.size / 5) },
    generator: { built: 0, max: Math.floor(planet.size / 5) },
    mining: { built: 0, max: Math.floor(planet.size / 5) },
    agriculture: { built: 0, max: Math.floor(planet.size / 5) },
  };

  planet.buildings = [];
  planet.usedBuildingSlots = 0;
  planet.buildingSlots = Math.max(1, Math.floor(planet.population / 5));

  return true;
}

export function buildDistrict(empireId, planetId, districtType) {
  const planet = findPlanet(planetId);
  if (!planet || planet.owner !== empireId) return false;

  const empire = gameState.empires[empireId];
  if (!empire) return false;

  const dData = planet.districts[districtType];
  if (!dData || dData.built >= dData.max) return false;

  const cost = { minerals: 300 + dData.built * 50 };
  if (empire.resources.minerals < cost.minerals) return false;

  empire.resources.minerals -= cost.minerals;
  dData.built++;
  return true;
}

export function buildBuilding(empireId, planetId, buildingType) {
  const planet = findPlanet(planetId);
  if (!planet || planet.owner !== empireId) return false;

  const empire = gameState.empires[empireId];
  if (!empire) return false;

  const bType = BUILDING_TYPES[buildingType];
  if (!bType) return false;

  if ((planet.usedBuildingSlots || 0) >= (planet.buildingSlots || 0)) return false;

  const cost = bType.cost || {};
  if (cost.minerals && empire.resources.minerals < cost.minerals) return false;

  if (cost.minerals) empire.resources.minerals -= cost.minerals;
  planet.buildings.push(buildingType);
  planet.usedBuildingSlots = (planet.usedBuildingSlots || 0) + 1;
  return true;
}

export function tickPopulation(empireId) {
  const empire = gameState.empires[empireId];
  if (!empire) return;

  const planets = gameState.getEmpirePlanets(empireId);
  for (const planet of planets) {
    if (planet.population >= planet.maxPopulation) continue;

    const growthProgress = planet.growthProgress || 0;
    const growthNeeded = POP_GROWTH_BASE + planet.population * POP_GROWTH_SCALE;
    const growthPerTick = getGrowthRate(empire, planet);

    planet.growthProgress = growthProgress + growthPerTick;

    if (planet.growthProgress >= growthNeeded) {
      planet.growthProgress = 0;
      planet.population++;
      planet.buildingSlots = Math.max(1, Math.floor(planet.population / 5));
      planet.housing = (planet.housing || 0);
      planet.amenities = (planet.amenities || 0);

      // Auto build city district every 5 pops if possible
      if (planet.population % 5 === 0 && planet.districts.city.built < planet.districts.city.max) {
        planet.districts.city.built++;
      }
    }
  }
}

function getGrowthRate(empire, planet) {
  let rate = 0.05;
  if (planet.housing > planet.population) rate *= 1.2;
  if (planet.amenities > planet.population * 0.5) rate *= 1.1;
  if (planet.housing < planet.population) rate *= 0.5;
  if (planet.population === 0) rate = 0.2;

  const TRAITS_DATA = {};
  return rate;
}

export function getPlanetSummary(planet) {
  if (!planet) return '';

  let summary = `${planet.name} (${planet.type})\n`;
  summary += `Population: ${planet.population || 0}/${planet.maxPopulation}\n`;
  summary += `Housing: ${(planet.housing || 0).toFixed(1)} | Amenities: ${(planet.amenities || 0).toFixed(1)}\n`;
  summary += `Stability: ${planet.stability || 50}\n`;

  if (planet.districts) {
    for (const [dType, dData] of Object.entries(planet.districts)) {
      summary += `  ${dType}: ${dData.built}/${dData.max}\n`;
    }
  }

  summary += `Buildings: ${(planet.buildings || []).length}/${planet.buildingSlots}`;
  return summary;
}

function findPlanet(planetId) {
  for (const sys of Object.values(gameState.systems)) {
    for (const p of (sys.planets || [])) {
      if (p.id === planetId) return p;
    }
  }
  return null;
}
