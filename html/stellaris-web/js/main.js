import { gameState } from './gameState.js';
import { GAME_SPEEDS, START_DATE, EMPIRE_COLORS, RESOURCES, SHIP_SIZES } from './constants.js';
import { generateGalaxy, setHomeSystem, findNearbySystem } from './galaxy/generator.js';
import { initRenderer, render, selectSystem } from './galaxy/renderer.js';
import { createDefaultEmpire, createAIEmpire } from './empire/creator.js';
import { calculateEmpireIncome, tickResources, canAfford, deductCost } from './economy/resources.js';
import { colonizePlanet, buildDistrict, buildBuilding } from './planets/planet.js';
import { buildStarbase, buildScienceShip, buildConstructionShip, moveScienceShip, surveySystem } from './exploration/exploration.js';
import { buildFleet, buildShipsToFleet, moveFleet, tickFleets, resolveCombat } from './military/ships.js';
import { startResearch, tickResearch, pickResearchOptionsForEmpire } from './technology/research.js';
import { TECHNOLOGIES } from './data/technologies.js';
import { ETHICS_DATA } from './data/ethics.js';
import { tickAI } from './ai/aiEmpire.js';
import { tickDiplomacy, declareWar } from './diplomacy/diplomacy.js';
import { canAdoptTradition, adoptTradition, canBuyTradition, buyTradition, canTakeAscensionPerk, takeAscensionPerk } from './traditions/traditions.js';
import { TRADITION_TREES } from './data/traditions.js';
import { tickEvents } from './events/events.js';
import {
  initUI, updateTopBar, updateBottomBar,
  openPlanetView, openResearchPanel, openDiplomacyPanel, openTraditionsPanel,
  renderSidebarPanel,
} from './ui/uiManager.js';
import { formatDate, addDays, rand, pick, generateId, clamp } from './helpers.js';

function tickPopulationGrowth(empireId) {
  const empire = gameState.empires[empireId];
  if (!empire) return;
  const planets = gameState.getEmpirePlanets(empireId);
  for (const planet of planets) {
    if (planet.population >= planet.maxPopulation) continue;
    const gp = planet.growthProgress || 0;
    const needed = 3 + planet.population * 0.25;
    let rate = 0.05;
    if ((planet.housing || 0) > planet.population) rate *= 1.2;
    if ((planet.amenities || 0) > planet.population * 0.5) rate *= 1.1;
    if ((planet.housing || 0) < planet.population) rate *= 0.5;
    planet.growthProgress = gp + rate;
    if (planet.growthProgress >= needed) {
      planet.growthProgress = 0;
      planet.population++;
      planet.buildingSlots = Math.max(1, Math.floor(planet.population / 5));
    }
  }
}let loadingProgress = 0;
let animationId;

const loadingScreen = document.getElementById('loading-screen');
const loadingFill = document.querySelector('.loading-fill');
const empireCreator = document.getElementById('empire-creator');
const gameContainer = document.getElementById('game-container');

window.addEventListener('DOMContentLoaded', () => {
  initRenderer();
  initUI();
  showEmpireCreator();

  // Set up keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Start render loop immediately
  requestAnimationFrame(renderLoop);
});

function handleKeyboard(e) {
  if (!gameState.gameStarted) return;
  switch (e.key) {
    case ' ': gameState.paused = !gameState.paused; break;
    case '1': setSpeed(0); break;
    case '2': setSpeed(1); break;
    case '3': setSpeed(2); break;
    case '4': setSpeed(3); break;
    case '5': setSpeed(4); break;
    case 'r': case 'R': openResearchPanel(); break;
    case 't': case 'T': openTraditionsPanel(); break;
    case 'd': case 'D': openDiplomacyPanel(); break;
  }
}

function setSpeed(s) {
  gameState.speed = s;
  gameState.paused = s === 0;
  document.querySelectorAll('.speed-btn').forEach((b, i) => {
    b.classList.toggle('active', parseInt(b.dataset.speed) === s);
  });
}

function showEmpireCreator() {
  loadingScreen.style.display = 'none';
  empireCreator.style.display = 'flex';
  gameContainer.style.display = 'none';

  const tabs = [
    { id: 'species', name: 'Species' },
    { id: 'ethics', name: 'Ethics' },
    { id: 'origin', name: 'Origin' },
    { id: 'civics', name: 'Civics' },
  ];

  document.getElementById('ec-tabs').innerHTML = tabs.map((t, i) =>
    `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${t.id}">${t.name}</button>`
  ).join('');

  document.querySelectorAll('#ec-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ec-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCreatorTab(btn.dataset.tab);
    });
  });

  document.getElementById('ec-random').addEventListener('click', randomEmpire);
  document.getElementById('ec-start').addEventListener('click', startGame);

  // Build a temp empire for editing
  gameState.empires.player = createDefaultEmpire();
  renderCreatorTab('species');
}

function renderCreatorTab(tabId) {
  const body = document.getElementById('ec-body');
  const emp = gameState.empires.player;
  if (!emp) return;

  let html = '';

  switch (tabId) {
    case 'species':
      html = renderSpeciesTab(emp);
      break;
    case 'ethics':
      html = renderEthicsTab(emp);
      break;
    case 'origin':
      html = renderOriginTab(emp);
      break;
    case 'civics':
      html = renderCivicsTab(emp);
      break;
  }

  body.innerHTML = html;
  attachCreatorEvents(tabId, emp);
}

function renderSpeciesTab(emp) {
  let html = '<div class="ec-option-group"><h3>Species Name</h3>';
  html += `<input class="ec-text-input" id="ec-species-name" value="${emp.species.name}" placeholder="Species name">
    <input class="ec-text-input" id="ec-species-plural" value="${emp.species.plural}" placeholder="Plural" style="margin-left:8px">`;
  html += '</div>';

  html += '<div class="ec-option-group"><h3>Homeworld Climate</h3><div class="ec-options">';
  for (const [cl, info] of Object.entries({ continental: '🌍 Continental', ocean: '🌊 Ocean', desert: '🏜️ Desert', arctic: '❄️ Arctic', tropical: '🌴 Tropical' })) {
    html += `<div class="ec-option ${emp.species.homeworldClass === cl ? 'selected' : ''}" data-key="homeworld" data-val="${cl}">
      <div class="opt-name">${info}</div></div>`;
  }
  html += '</div></div>';

  html += '<div class="ec-option-group"><h3>Species Traits</h3>';
  html += `<p style="font-size:10px;color:var(--text-dim)">Trait Points: <span id="ec-trait-points">2</span></p>`;
  html += '<div class="ec-options" id="ec-traits">';

  return html;
}

function renderEthicsTab(emp) {
  let html = '<div class="ec-option-group"><h3>Ethics (3 points)</h3>';
  html += `<p style="font-size:10px;color:var(--text-dim)">Spend all 3 points. Fanatic versions cost 2 points.</p>`;

  const pairs = [
    { axis: 'militarist-pacifist', left: { id: 'militarist', name: '⚔️ Militarist' }, leftF: { id: 'fanatic_militarist', name: '⚔️ Fanatic Militarist' }, right: { id: 'pacifist', name: '☮️ Pacifist' }, rightF: { id: 'fanatic_pacifist', name: '☮️ Fanatic Pacifist' } },
    { axis: 'xenophile-xenophobe', left: { id: 'xenophile', name: '🤝 Xenophile' }, leftF: { id: 'fanatic_xenophile', name: '🤝 Fanatic Xenophile' }, right: { id: 'xenophobe', name: '👽 Xenophobe' }, rightF: { id: 'fanatic_xenophobe', name: '👽 Fanatic Xenophobe' } },
    { axis: 'egalitarian-authoritarian', left: { id: 'egalitarian', name: '🕊️ Egalitarian' }, leftF: { id: 'fanatic_egalitarian', name: '🕊️ Fanatic Egalitarian' }, right: { id: 'authoritarian', name: '👑 Authoritarian' }, rightF: { id: 'fanatic_authoritarian', name: '👑 Fanatic Authoritarian' } },
    { axis: 'materialist-spiritualist', left: { id: 'materialist', name: '🔬 Materialist' }, leftF: { id: 'fanatic_materialist', name: '🔬 Fanatic Materialist' }, right: { id: 'spiritualist', name: '🙏 Spiritualist' }, rightF: { id: 'fanatic_spiritualist', name: '🙏 Fanatic Spiritualist' } },
  ];

  for (const pair of pairs) {
    html += '<div class="ec-option-group"><h4 style="color:var(--text-secondary);font-size:11px;">' + pair.axis + '</h4><div class="ec-options">';
    for (const opt of [pair.leftF, pair.left, pair.rightF, pair.right]) {
      const sel = emp.ethics.includes(opt.id);
      html += `<div class="ec-option ${sel ? 'selected' : ''}" data-key="ethic" data-val="${opt.id}">
        <div class="opt-name">${opt.name}</div>
        <div class="opt-cost">Cost: ${opt.id.includes('fanatic') ? 2 : 1}</div>
      </div>`;
    }
    html += '</div></div>';
  }

  html += `<p style="font-size:10px;color:var(--text-dim)">Current ethics: ${emp.ethics.join(', ')} (Points used: ${getEthicsPointCost(emp.ethics)})</p>`;
  return html;
}

function renderOriginTab(emp) {
  const ORIGINS = {
    prosperous_unification: { name: 'Prosperous Unification', desc: 'Golden age of prosperity. +4 starting pops, +10% resources for 10 years.' },
    lost_colony: { name: 'Lost Colony', desc: 'Descended from a lost colony ship.' },
    remnants: { name: 'Remnants', desc: 'Arose from ruins of an ancient precursor empire.' },
    mechanist: { name: 'Mechanist', desc: 'Robot workers from the beginning. Materialist only.' },
    void_dwellers: { name: 'Void Dwellers', desc: 'Evolved on space habitats.' },
  };

  let html = '<div class="ec-option-group"><h3>Origin</h3><div class="ec-options">';
  for (const [oId, oData] of Object.entries(ORIGINS)) {
    const sel = emp.origin === oId;
    html += `<div class="ec-option ${sel ? 'selected' : ''}" data-key="origin" data-val="${oId}">
      <div class="opt-name">${oData.name}</div>
      <div class="opt-desc">${oData.desc}</div>
    </div>`;
  }
  html += '</div></div>';
  return html;
}

function renderCivicsTab(emp) {
  const CIVICS = {
    beacon_of_liberty: { name: 'Beacon of Liberty', desc: '+15% unity, +15% immigration pull.' },
    meritocracy: { name: 'Meritocracy', desc: '+1 leader pool, +1 leader cap.' },
    mining_guilds: { name: 'Mining Guilds', desc: '+10% minerals output.' },
    technocracy: { name: 'Technocracy', desc: '+1 research alternative. Materialist.' },
    warrior_culture: { name: 'Warrior Culture', desc: '+20% army damage, +10% naval cap. Militarist.' },
    efficient_bureaucracy: { name: 'Efficient Bureaucracy', desc: '+10 admin capacity.' },
  };

  let html = '<div class="ec-option-group"><h3>Civics (max 2)</h3><div class="ec-options">';
  for (const [cId, cData] of Object.entries(CIVICS)) {
    const sel = emp.civics.includes(cId);
    html += `<div class="ec-option ${sel ? 'selected' : ''}" data-key="civic" data-val="${cId}">
      <div class="opt-name">${cData.name}</div>
      <div class="opt-desc">${cData.desc}</div>
    </div>`;
  }
  html += '</div></div>';
  html += `<p style="font-size:10px;color:var(--text-dim)">Civics: ${emp.civics.join(', ') || 'none'}</p>`;
  return html;
}

function attachCreatorEvents(tabId, emp) {
  document.querySelectorAll('.ec-option[data-key="homeworld"]').forEach(el => {
    el.addEventListener('click', () => {
      emp.species.homeworldClass = el.dataset.val;
      renderCreatorTab(tabId);
    });
  });
  document.querySelectorAll('.ec-option[data-key="ethic"]').forEach(el => {
    el.addEventListener('click', () => {
      const eid = el.dataset.val;
      const cost = eid.includes('fanatic') ? 2 : 1;
      const currentCost = getEthicsPointCost(emp.ethics);

      if (emp.ethics.includes(eid)) {
        emp.ethics = emp.ethics.filter(e => e !== eid);
      } else {
        // Check axis conflict
        for (const axis of Object.values({ militarist_pacifist: ['militarist','fanatic_militarist','pacifist','fanatic_pacifist'], xenophile_xenophobe: ['xenophile','fanatic_xenophile','xenophobe','fanatic_xenophobe'], egalitarian_authoritarian: ['egalitarian','fanatic_egalitarian','authoritarian','fanatic_authoritarian'], materialist_spiritualist: ['materialist','fanatic_materialist','spiritualist','fanatic_spiritualist'] })) {
          if (axis.includes(eid)) {
            emp.ethics = emp.ethics.filter(e => !axis.includes(e));
            break;
          }
        }
        if (currentCost + cost <= 3) {
          emp.ethics.push(eid);
        }
      }
      renderCreatorTab(tabId);
    });
  });
  document.querySelectorAll('.ec-option[data-key="origin"]').forEach(el => {
    el.addEventListener('click', () => {
      emp.origin = el.dataset.val;
      renderCreatorTab(tabId);
    });
  });
  document.querySelectorAll('.ec-option[data-key="civic"]').forEach(el => {
    el.addEventListener('click', () => {
      const cid = el.dataset.val;
      if (emp.civics.includes(cid)) {
        emp.civics = emp.civics.filter(c => c !== cid);
      } else if (emp.civics.length < 2) {
        emp.civics.push(cid);
      }
      renderCreatorTab(tabId);
    });
  });

  const nameInput = document.getElementById('ec-species-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => { emp.species.name = nameInput.value; });
  }
  const pluralInput = document.getElementById('ec-species-plural');
  if (pluralInput) {
    pluralInput.addEventListener('input', () => { emp.species.plural = pluralInput.value; });
  }
}

function getEthicsPointCost(ethics) {
  return ethics.reduce((sum, e) => sum + (e.includes('fanatic') ? 2 : 1), 0);
}

function randomEmpire() {
  const emp = createAIEmpire(0);
  emp.id = 'player';
  gameState.empires.player = emp;
  document.querySelector('.ec-tabs .tab-btn.active')?.click();
}

function startGame() {
  const emp = gameState.empires.player;
  if (!emp) return;

  emp.id = 'player';
  emp.techResearched = new Set();
  emp.exploredSystems = new Set();
  emp.surveyedSystems = new Set();
  emp.traditions = { adopted: {}, unlockedTraditions: new Set(), unitySpent: 0 };
  emp.ascensionPerks = { available: 0, taken: [] };
  emp.contacts = {};
  emp.opinions = {};
  emp.trustLevels = {};
  emp.unlockedShips = ['corvette'];
  emp.unlockedWeapons = ['mass_driver_1'];

  gameState.playerEmpireId = 'player';
  gameState.empires = { player: emp };

  empireCreator.style.display = 'none';
  gameContainer.style.display = 'flex';

  generateGalaxy();

  // Place player home system
  const centerSys = Object.values(gameState.systems).sort((a, b) =>
    (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y))[0];
  if (centerSys) {
    centerSys.name = 'Sol';
    centerSys.starType = 'yellow';
    setHomeSystem('player', centerSys.id);
    emp.exploredSystems.add(centerSys.id);
    emp.surveyedSystems.add(centerSys.id);
    gameState.selectedSystemId = centerSys.id;
  }

  // Place AI empires
  const otherSystems = Object.values(gameState.systems).filter(s =>
    s.id !== centerSys?.id && Math.sqrt(s.x * s.x + s.y * s.y) > 100
  );
  const aiSystems = otherSystems.sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(7, aiSystems.length); i++) {
    const aiEmp = createAIEmpire(i);
    const aiSysId = aiSystems[i].id;
    gameState.empires[aiEmp.id] = aiEmp;
    setHomeSystem(aiEmp.id, aiSysId);
    aiEmp.exploredSystems.add(aiSysId);
    aiEmp.surveyedSystems.add(aiSysId);
    aiEmp.techResearched = new Set();
    aiEmp.unlockedShips = ['corvette'];
    aiEmp.unlockedWeapons = ['mass_driver_1'];
  }

  // Initial income calculation
  for (const eid of Object.keys(gameState.empires)) {
    calculateEmpireIncome(eid);
  }

  gameState.gameStarted = true;
  setSpeed(2); // Normal speed
  gameState.paused = false;

  updateTopBar();
  updateBottomBar();

  const sidebar = document.getElementById('sidebar-content');
  renderSidebarPanel('outliner', sidebar);
  document.getElementById('sidebar-left').classList.add('expanded');
  document.querySelector('.st-btn[data-panel="outliner"]')?.classList.add('active');

  gameState.addNotification('Welcome to Stellaris Web! Explore the galaxy. 🚀', 'info');

  // Expose global functions for onclick handlers
  exposeGlobalFunctions();
}

function exposeGlobalFunctions() {
  window.openPlanetView = (planetId) => {
    openPlanetView(planetId);
    updateBottomBar();
  };
  window.openResearchPanel = () => {
    openResearchPanel();
  };
  window.openDiplomacyPanel = () => {
    openDiplomacyPanel();
  };
  window.openTraditionsPanel = () => {
    openTraditionsPanel();
  };
  window.buildStarbaseUI = (sysId) => {
    if (buildStarbase(gameState.playerEmpireId, sysId)) {
      gameState.addNotification('Starbase constructed!', 'info');
    }
  };
  window.colonizePlanetUI = (planetId) => {
    if (colonizePlanet(gameState.playerEmpireId, planetId)) {
      gameState.addNotification('Colony established!', 'info');
    }
    updateBottomBar();
  };
  window.buildDistrictUI = (planetId, districtType) => {
    if (buildDistrict(gameState.playerEmpireId, planetId, districtType)) {
      openPlanetView(planetId);
    }
  };
  window.buildBuildingUI = (planetId, buildingType) => {
    if (buildBuilding(gameState.playerEmpireId, planetId, buildingType)) {
      openPlanetView(planetId);
    }
  };
  window.buildScienceShipUI = (sysId) => {
    const ship = buildScienceShip(gameState.playerEmpireId, sysId);
    if (ship) {
      gameState.addNotification(`Science ship ${ship.name} built!`, 'info');
    }
  };
  window.buildFleetUI = (sysId) => {
    const fleet = buildFleet(gameState.playerEmpireId, sysId);
    if (fleet) {
      gameState.addNotification(`Fleet ${fleet.name} assembled!`, 'info');
    }
  };
  window.startResearchUI = (category, techId) => {
    if (startResearch(gameState.playerEmpireId, category, techId)) {
      const tech = TECHNOLOGIES[techId];
      gameState.addNotification(`Researching: ${tech?.name || techId}`, 'info');
      openResearchPanel();
    }
  };
  window.declareWarUI = (targetId) => {
    if (declareWar(gameState.playerEmpireId, targetId)) {
      openDiplomacyPanel();
    }
  };
  window.adoptTraditionUI = (treeId) => {
    if (adoptTradition(gameState.playerEmpireId, treeId)) {
      gameState.addNotification(`Adopted ${treeId} tradition!`, 'info');
      openTraditionsPanel();
    }
  };
  window.buyTraditionUI = (treeId) => {
    if (buyTradition(gameState.playerEmpireId, treeId)) {
      gameState.addNotification(`Tradition unlocked!`, 'info');
      openTraditionsPanel();
    }
  };
  window.takeAscensionPerkUI = (perkId) => {
    if (takeAscensionPerk(gameState.playerEmpireId, perkId)) {
      gameState.addNotification(`Ascension Perk taken!`, 'info');
      openTraditionsPanel();
    }
  };

  // Make selectSystem globally available
  window.selectSystem = selectSystem;
}

function gameTick() {
  if (!gameState.gameStarted || gameState.paused) return;

  const speed = GAME_SPEEDS[gameState.speed];
  if (!speed || speed.ticksPerSec <= 0) return;

  gameState.tickAccumulator += speed.ticksPerSec / 60;

  while (gameState.tickAccumulator >= 1) {
    gameState.tickAccumulator--;

    // Advance date
    gameState.date = addDays(gameState.date, 1);
    gameState.tick++;

    const player = gameState.playerEmpire;

    // Economy
    if (gameState.tick % 30 === 0) {
      for (const eid of Object.keys(gameState.empires)) {
        calculateEmpireIncome(eid);
      }
    }
    for (const eid of Object.keys(gameState.empires)) {
      tickResources(eid);
    }

    // Research
    for (const eid of Object.keys(gameState.empires)) {
      tickResearch(eid);
    }

    // Population growth
    if (gameState.tick % 10 === 0) {
      for (const eid of Object.keys(gameState.empires)) {
        tickPopulationGrowth(eid);
      }
    }

    // Explore
    for (const ship of Object.values(gameState.scienceShips)) {
      if (ship.owner === gameState.playerEmpireId) {
        surveySystem(ship.id, ship.systemId);
      }
    }

    // Military
    tickFleets();
    if (gameState.tick % 10 === 0) {
      for (const sys of Object.values(gameState.systems)) {
        const fleetsHere = Object.values(gameState.fleets).filter(f => f.systemId === sys.id);
        if (fleetsHere.length >= 2) {
          const owners = new Set(fleetsHere.map(f => f.owner));
          if (owners.size >= 2) resolveCombat(sys.id);
        }
      }
    }

    // AI
    if (gameState.tick % 5 === 0) {
      for (const eid of Object.keys(gameState.empires)) {
        if (eid !== gameState.playerEmpireId) tickAI(eid);
      }
    }

    // Diplomacy
    tickDiplomacy();

    // Events
    tickEvents();
  }
}

function renderLoop(timestamp) {
  animationId = requestAnimationFrame(renderLoop);

  gameTick();

  const vc = gameState.viewCenter;

  // Override renderer camera if we have viewCenter
  const container = document.getElementById('galaxy-container');
  if (container) {
    render(vc.x, vc.y, gameState.viewZoom);
  }

  // Update UI every 10 frames
  if (gameState.tick % 10 === 0 && gameState.gameStarted) {
    updateTopBar();
    updateBottomBar();
  }

  if (gameState.tick % 30 === 0 && gameState.gameStarted) {
    const sidebar = document.getElementById('sidebar-content');
    const activeTab = document.querySelector('.st-btn.active');
    if (activeTab && sidebar) {
      renderSidebarPanel(activeTab.dataset.panel, sidebar);
    }
  }

  // Notifications
  renderNotifications();
}

function renderNotifications() {
  const area = document.getElementById('notification-area');
  if (!area) return;

  let html = '';
  const recent = gameState.notifications.slice(-5);
  for (const notif of recent) {
    html += `<div class="notification ${notif.type}" onclick="this.remove()">${notif.msg}</div>`;
  }
  area.innerHTML = html;
}
