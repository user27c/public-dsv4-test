import { gameState } from '../gameState.js';
import { RESOURCES, BUILDING_TYPES } from '../constants.js';
import { formatNumber, formatDate, createEl } from '../helpers.js';
import { TECHNOLOGIES } from '../data/technologies.js';
import { pickResearchOptionsForEmpire } from '../technology/research.js';
import { startResearch } from '../technology/research.js';
import { TRADITION_TREES, ASCENSION_PERKS } from '../data/traditions.js';
import { canAdoptTradition, adoptTradition, canBuyTradition, buyTradition, canTakeAscensionPerk, takeAscensionPerk } from '../traditions/traditions.js';
import { buildDistrict, buildBuilding, colonizePlanet } from '../planets/planet.js';
import { buildStarbase, buildScienceShip, buildConstructionShip, moveScienceShip } from '../exploration/exploration.js';
import { buildFleet, buildShipsToFleet, moveFleet } from '../military/ships.js';
import { declareWar, getOpinion, getRelationStatus } from '../diplomacy/diplomacy.js';


export function initUI() {
  setupSpeedButtons();
  setupSidebarTabs();
  setupPanelClosers();
}

function setupSpeedButtons() {
  const btns = document.querySelectorAll('.speed-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      gameState.speed = speed;
      gameState.paused = speed === 0;
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function setupSidebarTabs() {
  const tabBtns = document.querySelectorAll('.st-btn');
  const sidebar = document.getElementById('sidebar-left');
  const content = document.getElementById('sidebar-content');
  let activePanel = 'outliner';

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (activePanel === panel && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        activePanel = null;
        return;
      }

      sidebar.classList.add('expanded');
      activePanel = panel;
      renderSidebarPanel(panel, content);
    });
  });
}

function setupPanelClosers() {
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.slide-panel').style.display = 'none';
    });
  });
}

export function updateTopBar() {
  const empire = gameState.playerEmpire;
  if (!empire) return;

  document.getElementById('tb-empire-name').textContent = empire.name;
  document.getElementById('tb-empire-flag').textContent = empire.flag || '🌍';

  const dateStr = formatDate(gameState.date.year, gameState.date.month, gameState.date.day);
  document.getElementById('tb-date').textContent = dateStr;

  const resourcesDiv = document.getElementById('tb-resources');
  if (!resourcesDiv) return;

  const resOrder = ['energy', 'minerals', 'food', 'alloys', 'consumer_goods', 'influence', 'unity', 'physics', 'society', 'engineering'];
  let html = '';

  for (const key of resOrder) {
    const res = RESOURCES[key];
    if (!res) continue;

    let val;
    if (key === 'unity') {
      val = Math.floor(empire.treasury?.unity || 0);
    } else if (key === 'physics' || key === 'society' || key === 'engineering') {
      val = formatNumber(empire.resources[key] || 0);
    } else {
      val = formatNumber(empire.resources[key] || 0);
    }

    const inc = empire.income?.[key] || 0;
    let deltaHtml = '';
    if (inc > 0) deltaHtml = `<span class="r-delta positive">+${formatNumber(inc)}</span>`;
    else if (inc < 0) deltaHtml = `<span class="r-delta negative">${formatNumber(inc)}</span>`;

    html += `<div class="tb-res" title="${res.name}">
      <span class="r-icon">${res.icon}</span>
      <span class="r-val">${val}</span>
      ${deltaHtml}
    </div>`;
  }

  resourcesDiv.innerHTML = html;

  // Make research resources clickable
  const researchDivs = resourcesDiv.querySelectorAll('.tb-res');
  let resIdx = 0;
  for (const key of resOrder) {
    if (resIdx < researchDivs.length) {
      if (key === 'physics' || key === 'society' || key === 'engineering') {
        researchDivs[resIdx].addEventListener('click', () => openResearchPanel());
      }
      if (key === 'unity') {
        researchDivs[resIdx].addEventListener('click', () => openTraditionsPanel());
      }
    }
    resIdx++;
  }
}

export function renderSidebarPanel(panel, container) {
  const empire = gameState.playerEmpire;
  if (!empire) return;

  let html = '';

  switch (panel) {
    case 'outliner':
      html = renderOutliner(empire);
      break;
    case 'situation-log':
      html = renderSituationLog();
      break;
    case 'planets':
      html = renderPlanetList(empire);
      break;
    case 'fleets':
      html = renderFleetList(empire);
      break;
  }

  container.innerHTML = html;

  // Attach event listeners
  attachOutlinerEvents(container, empire);
}

function renderOutliner(empire) {
  let html = '<div class="outliner-section"><b>Empire</b></div>';
  html += `<div class="outliner-item">🏛️ ${empire.name}</div>`;
  html += `<div class="outliner-item">📊 Empire Size: ${Object.keys(gameState.getEmpireSystems(empire.id)).length}</div>`;

  html += '<div class="outliner-section" style="margin-top:8px"><b>Colonies</b></div>';
  const planets = gameState.getEmpirePlanets(empire.id);
  if (planets.length === 0) html += '<div class="outliner-item system-unexplored">No colonies</div>';
  for (const p of planets) {
    html += `<div class="outliner-item colony" data-planet="${p.id}">🌍 ${p.name} (${p.population}/${p.maxPopulation})</div>`;
  }

  html += '<div class="outliner-section" style="margin-top:8px"><b>Fleets</b></div>';
  const fleets = Object.values(gameState.fleets).filter(f => f.owner === empire.id);
  if (fleets.length === 0) html += '<div class="outliner-item system-unexplored">No fleets</div>';
  for (const f of fleets) {
    const sys = gameState.systems[f.systemId];
    html += `<div class="outliner-item fleet" data-fleet="${f.id}">🚀 ${f.name} (${f.ships.length} ships) — ${sys?.name || '?'}</div>`;
  }

  html += '<div class="outliner-section" style="margin-top:8px"><b>Science Ships</b></div>';
  const scShips = Object.values(gameState.scienceShips).filter(s => s.owner === empire.id);
  if (scShips.length === 0) html += '<div class="outliner-item system-unexplored">None</div>';
  for (const s of scShips) {
    html += `<div class="outliner-item" data-sciship="${s.id}">🔬 ${s.name}</div>`;
  }

  return html;
}

function renderSituationLog() {
  let html = '<div style="padding:8px">';
  html += '<h4 style="color:var(--accent-orange);margin-bottom:8px">Situation Log</h4>';

  const empire = gameState.playerEmpire;
  if (!empire) return html + '</div>';

  for (const sys of Object.values(gameState.systems)) {
    if (!sys.anomalies || sys.anomalies.length === 0) continue;
    for (let i = 0; i < sys.anomalies.length; i++) {
      const a = sys.anomalies[i];
      if (!a.researched) {
        html += `<div class="outliner-item" data-anomaly="${sys.id}:${i}">
          ❓ Anomaly in ${sys.name} (Lvl ${a.level})
        </div>`;
      }
    }
  }

  if (html.indexOf('data-anomaly') === -1) {
    html += '<div class="outliner-item system-unexplored">No active anomalies</div>';
  }

  html += '</div>';
  return html;
}

function renderPlanetList(empire) {
  let html = '<div style="padding:8px">';
  html += '<h4 style="color:var(--accent-cyan);margin-bottom:8px">Colonies</h4>';
  const planets = gameState.getEmpirePlanets(empire.id);
  for (const p of planets) {
    html += `<div class="outliner-item colony" data-planet="${p.id}">
      <span>🌍</span> <span>${p.name}</span>
      <span style="margin-left:auto;font-size:10px;color:var(--text-dim)">${p.population}/${p.maxPopulation}</span>
    </div>`;
  }
  html += '</div>';
  return html;
}

function renderFleetList(empire) {
  let html = '<div style="padding:8px">';
  html += '<h4 style="color:var(--accent-orange);margin-bottom:8px">Fleets</h4>';
  const fleets = Object.values(gameState.fleets).filter(f => f.owner === empire.id);
  for (const f of fleets) {
    html += `<div class="outliner-item fleet" data-fleet="${f.id}">
      🚀 ${f.name} | ${f.ships.length} ships
    </div>`;
  }
  html += '</div>';
  return html;
}

function attachOutlinerEvents(container, empire) {
  container.querySelectorAll('[data-planet]').forEach(el => {
    el.addEventListener('click', () => openPlanetView(el.dataset.planet));
  });
  container.querySelectorAll('[data-fleet]').forEach(el => {
    el.addEventListener('click', () => selectFleet(el.dataset.fleet));
  });
  container.querySelectorAll('[data-anomaly]').forEach(el => {
    el.addEventListener('click', () => {
      const [sysId, idx] = el.dataset.anomaly.split(':');
      researchAnomaly(sysId, parseInt(idx));
    });
  });
}

export function openPlanetView(planetId) {
  let planet = null;
  let system = null;
  for (const sys of Object.values(gameState.systems)) {
    for (const p of (sys.planets || [])) {
      if (p.id === planetId) { planet = p; system = sys; break; }
    }
    if (planet) break;
  }
  if (!planet) return;

  const panel = document.getElementById('planet-panel');
  panel.style.display = 'block';

  let html = `<div class="panel-header">
    <h3>${planet.name}</h3>
    <button class="panel-close" onclick="this.closest('.slide-panel').style.display='none'">✕</button>
  </div>`;
  html += '<div class="panel-body">';
  html += `<p>Type: <b>${planet.type.replace(/_/g, ' ')}</b> | Size: <b>${planet.size}</b></p>`;
  html += `<p>Population: <b>${planet.population || 0}/${planet.maxPopulation}</b> | Housing: ${(planet.housing || 0).toFixed(0)} | Amenities: ${(planet.amenities || 0).toFixed(0)}</p>`;
  html += `<p>Stability: ${planet.stability || 50}%</p>`;
  html += `<p>Growth: ${((planet.growthProgress || 0) / (3 + (planet.population || 0) * 0.25) * 100).toFixed(0)}%</p>`;

  html += '<h4 style="margin-top:12px;color:var(--accent-cyan)">Districts</h4>';
  html += '<div class="planet-grid">';

  const districtTypes = { city: 'City', industrial: 'Industrial', generator: 'Generator', mining: 'Mining', agriculture: 'Agriculture' };
  for (const [dk, name] of Object.entries(districtTypes)) {
    const dd = planet.districts?.[dk] || { built: 0, max: 0 };
    html += `<div class="planet-district" onclick="window.buildDistrictUI('${planet.id}','${dk}')">
      <div class="pd-name">${name}</div>
      <div class="pd-count">${dd.built} / ${dd.max}</div>
    </div>`;
  }
  html += '</div>';

  html += '<h4 style="margin-top:12px;color:var(--accent-cyan)">Buildings</h4>';
  html += `<p style="font-size:10px;color:var(--text-dim)">Slots: ${planet.buildings?.length || 0}/${planet.buildingSlots || 0}</p>`;
  for (const bId of (planet.buildings || [])) {
    if (bId) {
      html += `<div class="planet-building occupied">🏢 ${bId.replace(/_/g, ' ')}</div>`;
    }
  }

  html += '<h4 style="margin-top:12px;color:var(--accent-green)">Build New</h4>';
  const buildOptions = ['research_lab', 'alloy_foundry', 'civilian_factory', 'unity_building', 'stronghold', 'luxury_residence', 'commerce_building'];
  for (const bId of buildOptions) {
    html += `<div class="planet-building" onclick="window.buildBuildingUI('${planet.id}','${bId}')">
      🏗️ Build ${bId.replace(/_/g, ' ')}
    </div>`;
  }

  html += '</div>';

  panel.innerHTML = html;
  gameState.selectedPlanetId = planetId;
}

export function openResearchPanel() {
  const empire = gameState.playerEmpire;
  if (!empire) return;

  const panel = document.getElementById('research-panel');
  panel.style.display = 'block';

  let html = `<div class="panel-header">
    <h3>Research</h3>
    <button class="panel-close" onclick="this.closest('.slide-panel').style.display='none'">✕</button>
  </div>`;
  html += '<div class="panel-body">';

  const categories = [
    { key: 'physics', name: 'Physics', icon: '🔬', color: 'var(--resource-physics)' },
    { key: 'society', name: 'Society', icon: '🧬', color: 'var(--resource-society)' },
    { key: 'engineering', name: 'Engineering', icon: '🔧', color: 'var(--resource-engineering)' },
  ];

  for (const cat of categories) {
    const researchingId = empire[`techResearching${cat.name}`];
    const progress = empire[`techProgress${cat.name}`] || 0;

    html += `<h4 style="color:${cat.color};margin-top:12px">${cat.icon} ${cat.name} Research</h4>`;

    if (researchingId && TECHNOLOGIES[researchingId]) {
      const tech = TECHNOLOGIES[researchingId];
      const pct = Math.min(100, (progress / tech.cost * 100)).toFixed(0);
      html += `<div class="research-card researching">
        <div class="rc-name">${tech.name} (Researching)</div>
        <div class="rc-cost">${tech.cost} research needed</div>
        <div class="rc-desc">${tech.description}</div>
        <div class="rc-progress">Progress: ${pct}%</div>
      </div>`;
    } else {
      html += '<p style="font-size:10px;color:var(--text-dim)">No research selected. Pick a technology:</p>';
      const options = pickResearchOptionsForEmpire(empire, cat.key);
      for (const opt of options.slice(0, 3)) {
        html += `<div class="research-card" onclick="window.startResearchUI('${cat.key}','${opt.id}')">
          <div class="rc-name">${opt.name}</div>
          <div class="rc-cost">${opt.cost} research</div>
          <div class="rc-desc">${opt.description}</div>
        </div>`;
      }
    }
  }

  html += '</div>';
  panel.innerHTML = html;
}

export function openDiplomacyPanel() {
  const empire = gameState.playerEmpire;
  if (!empire) return;

  const panel = document.getElementById('diplomacy-panel');
  panel.style.display = 'block';

  let html = `<div class="panel-header">
    <h3>Diplomacy</h3>
    <button class="panel-close" onclick="this.closest('.slide-panel').style.display='none'">✕</button>
  </div>`;
  html += '<div class="panel-body">';

  const contacts = gameState.empiresInContact();
  if (contacts.length === 0) {
    html += '<p style="color:var(--text-dim)">No known empires. Explore to make contact.</p>';
  }

  for (const other of contacts) {
    const opinion = getOpinion(empire.id, other.id);
    const relation = getRelationStatus(empire.id, other.id);
    const relColor = relation === 'friendly' ? 'var(--accent-green)' : relation === 'hostile' ? 'var(--accent-red)' : 'var(--accent-yellow)';

    html += `<div class="diplo-item">
      <div class="di-name">${other.flag || ''} ${other.name}</div>
      <div class="di-rel" style="color:${relColor}">${relation.toUpperCase()} (Opinion: ${opinion})</div>
      <div style="margin-top:4px;font-size:10px">
        <button class="btn" onclick="window.declareWarUI('${other.id}')" style="font-size:10px;padding:3px 8px">⚔️ Declare War (50⚡)</button>
      </div>
    </div>`;
  }

  html += '</div>';
  panel.innerHTML = html;
}

export function openTraditionsPanel() {
  const empire = gameState.playerEmpire;
  if (!empire) return;

  const panel = document.getElementById('traditions-panel');
  panel.style.display = 'block';

  let html = `<div class="panel-header">
    <h3>Traditions & Ascension</h3>
    <button class="panel-close" onclick="this.closest('.slide-panel').style.display='none'">✕</button>
  </div>`;
  html += `<div class="panel-body">`;
  html += `<p>Unity: <b>${Math.floor(empire.treasury?.unity || 0)}</b></p>`;

  html += '<h4 style="margin-top:12px;color:var(--accent-cyan)">Traditions</h4>';
  for (const [treeId, tree] of Object.entries(TRADITION_TREES)) {
    const adopted = empire.traditions?.adopted?.[treeId];
    const status = adopted?.completed ? 'Completed' : adopted ? `Adopted (${adopted.traditions.length}/${tree.traditions.length})` : 'Not Adopted';

    html += `<div class="tradition-category ${adopted ? 'adopted' : ''} ${adopted?.completed ? 'completed' : ''}">
      <div class="tc-name">${tree.icon} ${tree.name}</div>
      <div class="tc-status">${status}</div>`;

    if (adopted && !adopted.completed) {
      const idx = adopted.traditions.length;
      const cost = tree.traditionCosts[idx] || 500;
      html += `<button class="btn" onclick="window.buyTraditionUI('${treeId}')" style="font-size:10px;margin-top:4px">Buy (${cost} 🔮)</button>`;
    } else if (!adopted) {
      html += `<button class="btn" onclick="window.adoptTraditionUI('${treeId}')" style="font-size:10px;margin-top:4px">Adopt</button>`;
    }

    html += '</div>';
  }

  html += '<h4 style="margin-top:12px;color:var(--accent-purple)">Ascension Perks</h4>';
  html += `<p style="font-size:10px;color:var(--text-dim)">Available slots: ${empire.ascensionPerks?.available || 0}</p>`;
  for (const [perkId, perk] of Object.entries(ASCENSION_PERKS)) {
    const taken = empire.ascensionPerks?.taken?.includes(perkId);
    html += `<div class="ap-card ${taken ? 'taken' : ''} ${empire.ascensionPerks?.available > 0 && !taken ? 'available' : ''}">
      <div>${perk.icon} ${perk.name} ${taken ? '(Taken)' : ''}</div>
      <div style="font-size:10px;color:var(--text-dim)">${perk.description}</div>`;
    if (!taken && empire.ascensionPerks?.available > 0) {
      html += `<button class="btn" onclick="window.takeAscensionPerkUI('${perkId}')" style="font-size:10px;margin-top:4px">Take</button>`;
    }
    html += '</div>';
  }

  html += '</div>';
  panel.innerHTML = html;
}

export function updateBottomBar() {
  const selectedId = gameState.selectedSystemId;
  if (!selectedId) {
    document.getElementById('bb-info').innerHTML = 'Select a system or fleet';
    document.getElementById('bb-actions').innerHTML = '';
    return;
  }

  const sys = gameState.systems[selectedId];
  if (!sys) return;

  let info = `<b>${sys.name}</b> [${sys.starType.replace(/_/g, ' ')}]`;

  if (sys.owner && gameState.empires[sys.owner]) {
    info += ` — ${gameState.empires[sys.owner].name}`;
  }

  const hab = (sys.planets || []).filter(p => p.isHabitable);
  const col = (sys.planets || []).filter(p => p.colonized);
  if (col.length > 0) info += ` | ${col.length} colonies`;
  else if (hab.length > 0) info += ` | ${hab.length} habitable worlds`;

  document.getElementById('bb-info').innerHTML = info;

  let actions = '';
  const empire = gameState.playerEmpire;

  if (!sys.owner && sys.surveyed && empire && empire.resources.influence >= 75) {
    const dist = getStarbaseCost(sys.id);
    actions += `<button class="btn" onclick="window.buildStarbaseUI('${sys.id}')">🏗️ Build Starbase (${dist}⭐ + 100⚙️)</button>`;
  }

  if (sys.owner === gameState.playerEmpireId && sys.starbase?.level >= 1) {
    const habPlanets = (sys.planets || []).filter(p => p.isHabitable && !p.colonized);
    for (const p of habPlanets) {
      if (empire && empire.resources.alloys >= 200) {
        actions += `<button class="btn" onclick="window.colonizePlanetUI('${p.id}')">🚀 Colonize ${p.name}</button>`;
      }
    }

    const colonies = (sys.planets || []).filter(p => p.colonized && p.owner === gameState.playerEmpireId);
    for (const p of colonies) {
      actions += `<button class="btn btn-primary" onclick="window.openPlanetView('${p.id}')">🏙️ ${p.name}</button>`;
    }

    if (empire && empire.resources.alloys >= 100) {
      actions += `<button class="btn" onclick="window.buildScienceShipUI('${sys.id}')">🔬 Build Science Ship</button>`;
    }
    if (empire && empire.resources.alloys >= 100) {
      actions += `<button class="btn" onclick="window.buildFleetUI('${sys.id}')">🚀 Build Fleet</button>`;
    }

    actions += `<button class="btn" onclick="window.openResearchPanel()">🔬 Research</button>`;
    actions += `<button class="btn" onclick="window.openDiplomacyPanel()">🤝 Diplomacy</button>`;
    actions += `<button class="btn" onclick="window.openTraditionsPanel()">🔮 Traditions</button>`;
  }

  const enemyFleets = Object.values(gameState.fleets).filter(
    f => f.systemId === selectedId && f.owner !== gameState.playerEmpireId
  );
  if (enemyFleets.length > 0 && empire && empire.resources.influence >= 50) {
    for (const f of enemyFleets) {
      actions += `<button class="btn" style="border-color:var(--accent-red);color:var(--accent-red)" onclick="window.declareWarUI('${f.owner}')">⚔️ Declare War</button>`;
    }
  }

  document.getElementById('bb-actions').innerHTML = actions;
}

function getStarbaseCost(systemId) {
  const empire = gameState.playerEmpire;
  if (!empire) return 75;
  const ownedSys = gameState.getEmpireSystems(empire.id).find(s => s.starbase);
  if (!ownedSys) return 75;
  const dist = gameState.getSystemHyperlaneDist(systemId, ownedSys.id);
  return 75 * (dist + 1);
}

function researchAnomaly(systemId, anomalyIndex) {
  const empire = gameState.playerEmpire;
  if (!empire) return;
  const sys = gameState.systems[systemId];
  if (!sys || !sys.anomalies) return;
  const anomaly = sys.anomalies[anomalyIndex];
  if (!anomaly || anomaly.researched) return;

  anomaly.researched = true;
  empire.resources.society += rand(200, 600);
  gameState.addNotification(`Anomaly resolved in ${sys.name}`, 'info');
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectFleet(fleetId) {
  const fleet = gameState.fleets[fleetId];
  if (!fleet) return;
  gameState.selectedFleetId = fleetId;
  gameState.selectedSystemId = fleet.systemId;
  const sys = gameState.systems[fleet.systemId];
  if (sys) {
    document.getElementById('bb-info').innerHTML = `<b>Fleet: ${fleet.name}</b> — ${sys.name} | ${fleet.ships.length} ships`;
  }
}
