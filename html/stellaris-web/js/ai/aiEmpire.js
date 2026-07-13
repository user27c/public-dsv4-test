import { gameState } from '../gameState.js';
import { pick, rand, dist, clamp } from '../helpers.js';
import { TRADITION_TREES } from '../data/traditions.js';
import { TECHNOLOGIES } from '../data/technologies.js';

const aiCool = {};

export function tickAI(empireId) {
  const emp = gameState.empires[empireId];
  if (!emp || empireId === gameState.playerEmpireId) return;
  aiCool[empireId] = (aiCool[empireId] || 0) + 1;
  const c = aiCool[empireId];

  if (c % 30 === 0) aiRecalcResources(emp);
  aiExpand(emp, c);
  if (c % 60 === 0) aiBuildMilitary(emp);
  if (c % 90 === 0) aiResearch(emp);
  if (c % 120 === 0) aiColonize(emp);
  if (c % 150 === 0) aiBuildOnPlanets(emp);
  if (c % 200 === 0) aiTraditions(emp);
}

function aiRecalcResources(emp) {
  let inc = { energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0,
    influence: 3, unity: 0, physics: 0, society: 0, engineering: 0 };

  const planets = gameState.getEmpirePlanets(emp.id);
  for (const p of planets) {
    const pops = p.population || 0;
    for (const [dt, dd] of Object.entries(p.districts || {})) {
      const b = dd.built || 0;
      if (dt === 'city') { inc.unity += b * 2; }
      if (dt === 'industrial') { inc.alloys += b * 3; inc.consumer_goods += b * 3; inc.minerals -= b * 6; }
      if (dt === 'generator') inc.energy += b * 12;
      if (dt === 'mining') inc.minerals += b * 12;
      if (dt === 'agriculture') inc.food += b * 12;
    }
    for (const bId of (p.buildings || [])) {
      if (bId === 'research_lab') { inc.physics += 4; inc.society += 4; inc.engineering += 4; inc.consumer_goods -= 2; inc.energy -= 2; }
      if (bId === 'alloy_foundry') { inc.alloys += 6; inc.minerals -= 12; inc.energy -= 2; }
      if (bId === 'civilian_factory') { inc.consumer_goods += 12; inc.minerals -= 12; inc.energy -= 2; }
      if (bId === 'unity_building') { inc.unity += 8; inc.consumer_goods -= 4; inc.energy -= 2; }
      if (bId.includes('grid') || bId.includes('plant')) inc.energy -= 1;
    }
    inc.food -= pops * 1;
    inc.consumer_goods -= pops * 0.25;
  }
  for (const s of Object.values(gameState.systems)) {
    if (s.owner !== emp.id || !s.planets) continue;
    for (const p of s.planets) {
      if (!p.colonized && p.deposits) {
        inc.energy += p.deposits.energy || 0;
        inc.minerals += p.deposits.minerals || 0;
      }
    }
  }
  const owned = gameState.getEmpireSystems(emp.id);
  inc.energy -= owned.filter(s => s.starbase?.level >= 1).length * 1;
  for (const f of Object.values(gameState.fleets)) {
    if (f.owner !== emp.id) continue;
    inc.energy -= f.ships.length * 0.3;
    inc.alloys -= f.ships.length * 0.1;
  }
  for (const k of Object.keys(inc)) inc[k] = Math.round(inc[k] * 100) / 100;
  emp.income = inc;
}

function aiExpand(emp, c) {
  const owned = gameState.getEmpireSystems(emp.id);
  if (!owned.length) return;

  const sc = Object.values(gameState.scienceShips).filter(s => s.owner === emp.id);
  if (sc.length < 2 && emp.resources.alloys >= 100) {
    const home = owned[0];
    const sid = 'sciship_' + Math.random().toString(36).substr(2, 9);
    emp.resources.alloys -= 100;
    gameState.scienceShips[sid] = { id: sid, owner: emp.id, systemId: home.id, name: 'SCV-AI', scientistLevel: 1, surveyingProgress: 0, automation: false };
  }

  if (c % 10 === 0) {
    for (const ship of Object.values(gameState.scienceShips)) {
      if (ship.owner !== emp.id) continue;
      const ns = gameState.getNeighborSystems(ship.systemId);
      const tgt = ns.find(n => { const s = gameState.systems[n]; return s && !s.surveyed && !s.owner; });
      if (tgt) { ship.systemId = tgt; gameState.systems[tgt].explored = true; emp.exploredSystems.add(tgt); }
      ship.surveyingProgress += 2;
      if (ship.surveyingProgress >= 20) {
        ship.surveyingProgress = 0;
        gameState.systems[ship.systemId].surveyed = true;
        emp.surveyedSystems.add(ship.systemId);
      }
    }
  }

  if (emp.resources.influence >= 75 && emp.resources.alloys >= 100 && c % 15 === 0) {
    for (const sys of Object.values(gameState.systems).sort(() => Math.random() - 0.5)) {
      if (sys.owner || !sys.surveyed) continue;
      const n = gameState.getNeighborSystems(sys.id);
      if (n.some(nid => gameState.systems[nid]?.owner === emp.id)) {
        sys.owner = emp.id;
        sys.starbase = { level: 1, owner: emp.id, modules: [], buildings: [] };
        emp.resources.influence -= 75;
        emp.resources.alloys -= 100;
        break;
      }
    }
  }
}

function aiBuildMilitary(emp) {
  const fleets = Object.values(gameState.fleets).filter(f => f.owner === emp.id);
  const total = fleets.reduce((s, f) => s + f.ships.length, 0);
  if (total < 5 && emp.resources.alloys >= 100) {
    const owned = gameState.getEmpireSystems(emp.id);
    const s = owned.find(s => s.starbase?.level >= 1);
    if (s) {
      const fid = 'fleet_ai_' + Math.random().toString(36).substr(2, 9);
      const ships = [];
      for (let i = 0; i < 3; i++) ships.push({ id: 'ship_' + Math.random().toString(36).substr(2,9), size:'corvette', hull:300, maxHull:300, armor:0, maxArmor:0, shield:0, maxShield:0, weapons:[], evasion:0.6, speed:1.6, experience:0 });
      gameState.fleets[fid] = { id: fid, owner: emp.id, systemId: s.id, name: `FLT ${rand(1,99)}`, ships, orders: null, stance: 'passive' };
      emp.resources.alloys -= 100;
    }
  }
}

function aiResearch(emp) {
  emp.techResearched = emp.techResearched || new Set();
  const cats = ['Physics','Society','Engineering'];
  for (const cat of cats) {
    const key = `techResearching${cat}`;
    if (!emp[key]) {
      const all = Object.values(Object.values(TECHNOLOGIES))
        .filter(t => t.category === cat.toLowerCase() && !emp.techResearched.has(t.id));
      if (all.length > 0) {
        emp[key] = all[Math.floor(Math.random() * all.length)].id;
        emp[`techProgress${cat}`] = 0;
      }
    }
  }
  for (const cat of cats) {
    const techId = emp[`techResearching${cat}`];
    if (!techId) continue;
    const tech = TECHNOLOGIES[techId];
    const pk = `techProgress${cat}`;
    const ik = cat.toLowerCase();
    emp[pk] = (emp[pk] || 0) + (emp.income[ik] || 0) / 30;
    const cost = tech ? tech.cost : 2000;
    if (emp[pk] >= cost) {
      if (tech) {
        emp.techResearched.add(tech.id);
        if (tech.unlocksShips) {
          emp.unlockedShips = emp.unlockedShips || [];
          for (const s of tech.unlocksShips) { if (!emp.unlockedShips.includes(s)) emp.unlockedShips.push(s); }
        }
        if (tech.unlocksWeapons) {
          emp.unlockedWeapons = emp.unlockedWeapons || [];
          for (const w of tech.unlocksWeapons) { if (!emp.unlockedWeapons.includes(w)) emp.unlockedWeapons.push(w); }
        }
      } else {
        emp.techResearched.add(techId);
      }
      emp[`techResearching${cat}`] = null;
      emp[pk] = 0;
    }
  }
}

function aiColonize(emp) {
  const owned = gameState.getEmpireSystems(emp.id);
  for (const sys of owned) {
    for (const p of (sys.planets || [])) {
      if (p.isHabitable && !p.colonized && emp.resources.alloys >= 200 && emp.resources.food >= 200 && emp.resources.consumer_goods >= 200) {
        emp.resources.alloys -= 200; emp.resources.food -= 200; emp.resources.consumer_goods -= 200;
        p.owner = emp.id; p.colonized = true; p.population = 1; p.housing = 5; p.amenities = 3; p.stability = 50;
        p.districts = { city:{built:0,max:Math.floor(p.size/4)}, industrial:{built:0,max:Math.floor(p.size/5)}, generator:{built:0,max:Math.floor(p.size/5)}, mining:{built:0,max:Math.floor(p.size/5)}, agriculture:{built:0,max:Math.floor(p.size/5)} };
        p.buildings = []; p.usedBuildingSlots = 0; p.buildingSlots = 1;
        return;
      }
    }
  }
}

function aiBuildOnPlanets(emp) {
  const planets = gameState.getEmpirePlanets(emp.id);
  for (const p of planets) {
    if (p.population < 5) continue;
    if (emp.resources.minerals >= 300) {
      const opts = ['generator','mining','agriculture'];
      for (const d of opts) {
        const dd = p.districts[d];
        if (dd && dd.built < dd.max && Math.random() > 0.5) { emp.resources.minerals -= 300; dd.built++; break; }
      }
    }
    if ((p.usedBuildingSlots || 0) < (p.buildingSlots || 0) && emp.resources.minerals >= 400) {
      const pool = ['research_lab','alloy_foundry','civilian_factory','unity_building'];
      emp.resources.minerals -= 400;
      p.buildings.push(pick(pool));
      p.usedBuildingSlots = (p.usedBuildingSlots || 0) + 1;
    }
  }
}

function aiTraditions(emp) {
  emp.treasury = emp.treasury || { unity: 0 };
  emp.traditions = emp.traditions || { adopted: {}, unlockedTraditions: new Set(), unitySpent: 0 };
  if (Object.keys(emp.traditions.adopted).length === 0 && emp.treasury.unity >= 500) {
    emp.treasury.unity -= 500;
    emp.traditions.adopted.expansion = { traditions: [], completed: false };
  }
  for (const [tid, ad] of Object.entries(emp.traditions.adopted)) {
    if (ad.completed) continue;
    const tree = TRADITION_TREES[tid];
    if (!tree) continue;
    const idx = ad.traditions.length;
    if (idx >= tree.traditions.length) { ad.completed = true; emp.ascensionPerks.available = (emp.ascensionPerks.available || 0) + 1; continue; }
    const cost = tree.traditionCosts[idx] || 500;
    if (emp.treasury.unity >= cost) {
      emp.treasury.unity -= cost;
      ad.traditions.push(tree.traditions[idx].id);
      emp.traditions.unlockedTraditions.add(tree.traditions[idx].id);
      emp.traditions.unitySpent = (emp.traditions.unitySpent || 0) + cost;
    }
  }
}
