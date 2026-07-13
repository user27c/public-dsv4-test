import { GALAXY, HABITABLE_PLANET_TYPES, PLANET_TYPES, STARTING_FLEET_SIZE } from '../constants.js';
import { rand, randFloat, pick, dist, generateId, shuffle } from '../helpers.js';
import { gameState } from '../gameState.js';

export function generateGalaxy() {
  const systems = {};
  const hyperlanes = [];

  const points = generateStarPositions();

  for (const pt of points) {
    const id = pt.id;
    const starType = pickStarType(pt.x, pt.y);
    systems[id] = {
      id,
      x: pt.x,
      y: pt.y,
      starType,
      name: generateSystemName(),
      owner: null,
      starbase: null,
      planets: [],
      surveyed: false,
      explored: false,
      anomalies: [],
      systemEffects: [],
    };
  }

  if (points.length > 0) {
    const coreId = points[0].id;
    const coreSys = systems[coreId];
    coreSys.name = 'Sol';
    coreSys.starType = 'yellow';
  }

  generateHyperlanes(systems, hyperlanes, points);
  ensureConnectivity(systems, hyperlanes, points);
  generatePlanets(systems);
  generateStarNames(systems);

  gameState.systems = systems;
  gameState.hyperlanes = hyperlanes;
}

function generateStarPositions() {
  const points = [];
  const centerX = 0, centerY = 0;
  const r = GALAXY.RADIUS;
  const ef = GALAXY.ELLIPTIC_FACTOR;

  const sectors = 4;
  const perSector = Math.floor(GALAXY.SYSTEMS / sectors);

  for (let sector = 0; sector < sectors; sector++) {
    const secAngle = (sector / sectors) * Math.PI * 2;
    for (let i = 0; i < perSector; i++) {
      const angle = secAngle + randFloat(-0.5, 0.5) * (Math.PI * 2 / sectors);
      const radius = r * Math.pow(Math.random(), 0.6);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * ef;

      let minDist = Infinity;
      for (const p of points) {
        const d = dist(x, y, p.x, p.y);
        if (d < minDist) minDist = d;
      }

      const coreDist = dist(x, y, centerX, centerY);
      const minAllowed = coreDist < GALAXY.CORE_RADIUS ? 15 : 30;

      if (minDist >= minAllowed || points.length === 0) {
        points.push({ id: `sys_${generateId()}`, x, y });
      } else {
        i--;
      }

      if (points.length >= GALAXY.SYSTEMS) break;
    }
    if (points.length >= GALAXY.SYSTEMS) break;
  }

  return points.slice(0, GALAXY.SYSTEMS);
}

function pickStarType(x, y) {
  const coreDist = Math.sqrt(x * x + y * y) / GALAXY.RADIUS;
  const r = Math.random();
  if (coreDist < 0.1) {
    if (r < 0.1) return 'black_hole';
    if (r < 0.2) return 'neutron';
    if (r < 0.3) return 'pulsar';
    return 'yellow';
  }
  if (r < 0.15) return 'blue_giant';
  if (r < 0.35) return 'red_dwarf';
  if (r < 0.55) return 'yellow';
  if (r < 0.70) return 'white_dwarf';
  if (r < 0.80) return 'pulsar';
  if (r < 0.90) return 'neutron';
  if (r < 0.95) return 'black_hole';
  return 'white_dwarf';
}

function generateHyperlanes(systems, hyperlanes, points) {
  for (const pt of points) {
    const system = systems[pt.id];
    if (!system) continue;
    const neighbors = [];
    for (const pt2 of points) {
      if (pt2.id === pt.id) continue;
      const d = dist(pt.x, pt.y, pt2.x, pt2.y);
      if (d < GALAXY.MAX_HYPERLANE_DIST) {
        neighbors.push({ id: pt2.id, dist: d });
      }
    }
    neighbors.sort((a, b) => a.dist - b.dist);

    const existingCount = hyperlanes.filter(hl => hl.a === pt.id || hl.b === pt.id).length;
    const targetMin = Math.max(GALAXY.HYPERLANE_MIN - existingCount, 0);
    const targetMax = GALAXY.HYPERLANE_MAX - existingCount;

    if (targetMin <= 0) continue;

    const candidates = neighbors.filter(n => {
      const already = hyperlanes.some(hl =>
        (hl.a === pt.id && hl.b === n.id) || (hl.b === pt.id && hl.a === n.id));
      if (already) return false;
      const nCount = hyperlanes.filter(hl => hl.a === n.id || hl.b === n.id).length;
      return nCount < GALAXY.HYPERLANE_MAX;
    });

    const connectCount = Math.min(
      rand(targetMin, Math.min(targetMax, candidates.length)),
      candidates.length
    );

    for (let i = 0; i < connectCount && i < candidates.length; i++) {
      hyperlanes.push({ a: pt.id, b: candidates[i].id });
    }

    if (existingCount + connectCount === 0 && neighbors.length > 0) {
      const conn = candidates[0] || neighbors[0];
      if (conn && !hyperlanes.some(hl =>
        (hl.a === pt.id && hl.b === conn.id) || (hl.b === pt.id && hl.a === conn.id))) {
        hyperlanes.push({ a: pt.id, b: conn.id });
      }
    }
  }
}

function ensureConnectivity(systems, hyperlanes, points) {
  const allIds = new Set(Object.keys(systems));
  const visited = new Set();
  if (points.length === 0) return;

  const startId = points[0].id;
  const queue = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = [];
    for (const hl of hyperlanes) {
      if (hl.a === current && !visited.has(hl.b)) { visited.add(hl.b); queue.push(hl.b); }
      if (hl.b === current && !visited.has(hl.a)) { visited.add(hl.a); queue.push(hl.a); }
    }
  }

  const unreached = [...allIds].filter(id => !visited.has(id));
  for (const id of unreached) {
    let closest = null, minDist = Infinity;
    for (const vId of visited) {
      const s1 = systems[id], s2 = systems[vId];
      if (!s1 || !s2) continue;
      const d = dist(s1.x, s1.y, s2.x, s2.y);
      if (d < minDist) { minDist = d; closest = vId; }
    }
    if (closest) {
      hyperlanes.push({ a: id, b: closest });
      visited.add(id);
    }
  }
}

function generatePlanets(systems) {
  for (const sys of Object.values(systems)) {
    const numPlanets = rand(2, 8);
    for (let i = 0; i < numPlanets; i++) {
      const planet = generatePlanet(sys, i);
      sys.planets.push(planet);
    }
  }
}

function generatePlanet(sys, index) {
  const r = Math.random();
  let type, isHabitable = false;

  if (r < 0.18) {
    type = pick(HABITABLE_PLANET_TYPES);
    isHabitable = true;
  } else if (r < 0.22) {
    type = Math.random() < 0.5 ? 'gaia' : 'tomb';
    isHabitable = true;
  } else if (r < 0.4) {
    type = 'barren';
  } else if (r < 0.5) {
    type = 'frozen';
  } else if (r < 0.6) {
    type = 'gas_giant';
  } else if (r < 0.7) {
    type = 'molten';
  } else {
    type = 'toxic';
  }

  const size = isHabitable ? rand(12, 25) : rand(5, 30);
  const planetInfo = PLANET_TYPES[type] || PLANET_TYPES['barren'];

  const deposits = {};
  if (type === 'gas_giant') {
    deposits.energy = rand(2, 8);
  } else if (type === 'barren' || type === 'frozen') {
    deposits.minerals = rand(1, 6);
  } else if (type === 'molten') {
    deposits.minerals = rand(1, 4);
    deposits.alloys = rand(1, 3);
  }

  return {
    id: `planet_${generateId()}`,
    name: `${sys.name} ${romanNumeral(index + 1)}`,
    type,
    size,
    climate: planetInfo.climate,
    isHabitable,
    colonized: false,
    owner: null,
    population: 0,
    maxPopulation: size,
    districts: {},
    buildings: [],
    buildingSlots: Math.min(12, Math.floor(size / 2)),
    usedBuildingSlots: 0,
    deposits,
    modifiers: [],
    blockers: [],
    habitabilityBase: planetInfo.habitabilityBase,
    stability: 50,
    crime: 0,
    devastation: 0,
    migration: 0,
    housing: 0,
    amenities: 0,
    surplus: 0,
  };
}

function romanNumeral(n) {
  const vals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return vals[n] || String(n);
}

function generateStarNames(systems) {
  const used = new Set();
  const specials = ['Sol', 'Deneb', 'Polaris', 'Sirius', 'Vega', 'Rigel'];
  const prefixPool = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
    'Lambda', 'Sigma', 'Omega', 'Proxima', 'Nova', 'Ultima', 'Prima'];
  const suffixPool = ['Centauri', 'Draconis', 'Cygni', 'Lyrae', 'Aquilae', 'Eridani', 'Orionis', 'Pegasi',
    'Hydrae', 'Scorpii', 'Tauri', 'Leonis', 'Canis'];
  const uniqueNames = ['Sol', 'Deneb', 'Polaris', 'Sirius', 'Vega', 'Rigel', 'Arcturus',
    'Aldebaran', 'Betelgeuse', 'Capella', 'Andromeda', 'Cygnus', 'Draconis', 'Lyra'];

  for (const sys of Object.values(systems)) {
    let name;
    if (sys.starType === 'black_hole') {
      name = pick(['Singularity', 'Void', 'Abyss', 'Event Horizon', 'Nyx']);
    } else if (sys.starType === 'neutron') {
      name = pick(['Neutron', 'Pulsar Prime', 'Magnetar', 'Collapstar']);
    } else {
      const prefix = pick(prefixPool);
      const suffix = pick(suffixPool);
      name = `${prefix} ${suffix}`;
      if (used.has(name)) {
        name = `${prefix} ${suffix} ${rand(2, 9)}`;
      }
    }
    used.add(name);
    sys.name = name;
  }

  // Assign some unique names to systems near center
  const sortedByCore = Object.values(systems).sort((a, b) =>
    (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y));
  for (let i = 0; i < Math.min(uniqueNames.length, sortedByCore.length); i++) {
    if (i < uniqueNames.length) {
      sortedByCore[i].name = uniqueNames[i];
    }
  }
}

function generateSystemName() {
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const suffixes = ['Centauri', 'Draconis', 'Cygni', 'Lyrae', 'Eridani', 'Orionis'];
  return `${pick(prefixes)} ${pick(suffixes)}`;
}

export function setHomeSystem(empireId, systemId) {
  const sys = gameState.systems[systemId];
  if (!sys) return;

  sys.owner = empireId;
  sys.starbase = { level: 1, owner: empireId, modules: [], buildings: [] };
  sys.explored = true;
  sys.surveyed = true;

  const habitable = sys.planets.filter(p => p.isHabitable);
  if (habitable.length === 0) {
    const newP = generatePlanet(sys, sys.planets.length);
    newP.type = pick(HABITABLE_PLANET_TYPES);
    newP.isHabitable = true;
    newP.climate = pick(['wet', 'dry', 'frozen']);
    newP.habitabilityBase = 80;
    newP.name = `${sys.name} Prime`;
    sys.planets.push(newP);
    habitable.push(newP);
  }

  const homePlanet = habitable[0];
  homePlanet.owner = empireId;
  homePlanet.colonized = true;
  homePlanet.population = 4;
  homePlanet.housing = 10;
  homePlanet.amenities = 10;
  homePlanet.stability = 50;
  homePlanet.name = sys.name + ' Prime';

  homePlanet.districts = {
    city: { built: 1, max: Math.floor(homePlanet.size / 4) },
    industrial: { built: 1, max: Math.floor(homePlanet.size / 5) },
    generator: { built: 1, max: Math.floor(homePlanet.size / 5) },
    mining: { built: 1, max: Math.floor(homePlanet.size / 5) },
    agriculture: { built: 1, max: Math.floor(homePlanet.size / 5) },
  };
  homePlanet.buildings = [];
  homePlanet.usedBuildingSlots = 0;
  homePlanet.buildingSlots = Math.max(1, Math.floor(homePlanet.population / 5));
  homePlanet.growthProgress = 0;
}

export function findNearbySystem(x, y, radius) {
  let closest = null, minDist = radius;
  for (const sys of Object.values(gameState.systems)) {
    const d = dist(x, y, sys.x, sys.y);
    if (d < minDist) { minDist = d; closest = sys; }
  }
  return closest;
}
