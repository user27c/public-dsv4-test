import { ETHICS_DATA, ETHICS_AXES } from '../data/ethics.js';
import { AUTHORITIES, CIVICS } from '../data/civics.js';
import { TRAITS, ORIGINS, SPECIES_APPEARANCES, PLANET_CLASSES } from '../data/traits.js';
import { EMPIRE_COLORS, EMPIRE_NAMELISTS } from '../constants.js';
import { generateId, pick, rand } from '../helpers.js';
import { gameState } from '../gameState.js';

export function createDefaultEmpire() {
  return {
    id: 'emp_' + generateId(),
    name: 'United Nations of Earth',
    flag: '🌍',
    color: EMPIRE_COLORS[0],
    ethics: ['xenophile', 'egalitarian', 'militarist'],
    authority: 'democratic',
    civics: ['beacon_of_liberty', 'meritocracy'],
    origin: 'prosperous_unification',
    species: {
      id: 'species_' + generateId(),
      name: 'Human',
      plural: 'Humans',
      adjective: 'Human',
      appearance: 'human',
      traits: ['adaptive', 'nomadic', 'wasteful'],
      homeworldClass: 'continental',
    },
    namelist: 'human',
    techResearched: new Set(),
    techResearchingPhysics: null,
    techResearchingSociety: null,
    techResearchingEngineering: null,
    techProgressPhysics: 0,
    techProgressSociety: 0,
    techProgressEngineering: 0,
    resources: {
      energy: 500,
      minerals: 500,
      food: 500,
      alloys: 200,
      consumer_goods: 200,
      influence: 100,
      unity: 0,
      physics: 0,
      society: 0,
      engineering: 0,
    },
    income: {
      energy: 0,
      minerals: 0,
      food: 0,
      alloys: 0,
      consumer_goods: 0,
      influence: 3,
      unity: 0,
      physics: 0,
      society: 0,
      engineering: 0,
    },
    treasury: {
      unity: 0,
    },
    navalCap: 20,
    fleetCommandLimit: 20,
    adminCap: 50,
    starbaseCap: 3,
    leaderCap: 4,
    leaders: [],
    edicts: [],
    policies: {
      warPolicy: 'defenseOnly',
      firstContactProtocol: 'proactive',
    },
    contacts: {},
    opinions: {},
    attitude: {},
    trustLevels: {},
    diplomaticPacts: {},
    spyNetworks: {},
    researchAlt: 3,
    traditions: {
      adopted: {},
      unlockedTraditions: new Set(),
      unitySpent: 0,
    },
    ascensionPerks: {
      available: 0,
      taken: [],
    },
    modifiers: {},
    exploredSystems: new Set(),
    surveyedSystems: new Set(),
  };
}

export function createAIEmpire(idx) {
  const ethicChoices = getAIEthics();
  const authority = pickAuthority(ethicChoices);
  const civics = pickCivicsAI(ethicChoices, authority);
  const speciesTraits = pickAISpeciesTraits();
  const origin = pickAIOrigin(ethicChoices, authority);
  const appearance = pick(SPECIES_APPEARANCES.filter(a => a.id !== 'human'));

  const name = generateAIName();

  return {
    id: 'emp_ai_' + generateId(),
    name: name,
    flag: appearance.icon,
    color: EMPIRE_COLORS[(idx + 1) % EMPIRE_COLORS.length],
    ethics: ethicChoices,
    authority: authority,
    civics: civics,
    origin: origin,
    species: {
      id: 'species_ai_' + generateId(),
      name: appearance.name,
      plural: appearance.name + 's',
      adjective: appearance.name,
      appearance: appearance.id,
      traits: speciesTraits,
      homeworldClass: pick(['continental', 'ocean', 'desert', 'arid', 'arctic', 'tundra']),
    },
    namelist: appearance.category || 'human',
    techResearched: new Set(),
    techResearchingPhysics: null,
    techResearchingSociety: null,
    techResearchingEngineering: null,
    techProgressPhysics: 0,
    techProgressSociety: 0,
    techProgressEngineering: 0,
    resources: {
      energy: 500 + rand(0, 300),
      minerals: 500 + rand(0, 300),
      food: 500 + rand(0, 300),
      alloys: 200 + rand(0, 100),
      consumer_goods: 200 + rand(0, 100),
      influence: 100,
      unity: 0,
      physics: 0,
      society: 0,
      engineering: 0,
    },
    income: {
      energy: 0, minerals: 0, food: 0, alloys: 0, consumer_goods: 0,
      influence: 3, unity: 0, physics: 0, society: 0, engineering: 0,
    },
    treasury: { unity: 0 },
    navalCap: 20,
    fleetCommandLimit: 20,
    adminCap: 50,
    starbaseCap: 3,
    leaderCap: 4,
    leaders: [],
    edicts: [],
    policies: {
      warPolicy: 'defenseOnly',
      firstContactProtocol: Math.random() > 0.5 ? 'proactive' : 'cautious',
    },
    contacts: {},
    opinions: {},
    attitude: {},
    trustLevels: {},
    diplomaticPacts: {},
    spyNetworks: {},
    researchAlt: 3,
    traditions: {
      adopted: {},
      unlockedTraditions: new Set(),
      unitySpent: 0,
    },
    ascensionPerks: {
      available: 0,
      taken: [],
    },
    modifiers: {},
    exploredSystems: new Set(),
    surveyedSystems: new Set(),
  };
}

function getAIEthics() {
  const axes = ['militarist-pacifist', 'xenophile-xenophobe', 'egalitarian-authoritarian', 'materialist-spiritualist'];
  const picked = [];
  let points = 3;

  const shuffled = [...axes].sort(() => Math.random() - 0.5);

  while (points > 0 && shuffled.length > 0) {
    const axis = shuffled.shift();
    if (points >= 2 && Math.random() > 0.6) {
      const fanaticSide = Math.random() > 0.5 ? 'fa' : 'fb';
      picked.push(ETHICS_AXES[axis][fanaticSide]);
      points -= 2;
    } else if (points >= 1) {
      const side = Math.random() > 0.5 ? 'a' : 'b';
      picked.push(ETHICS_AXES[axis][side]);
      points -= 1;
      if (points >= 1 && Math.random() > 0.5 && shuffled.length > 0) continue;
      points = 0;
    }
  }

  while (points > 0 && shuffled.length >= 0) {
    for (const axis of axes) {
      if (points <= 0) break;
      const data = ETHICS_AXES[axis];
      if (!picked.includes(data.a) && !picked.includes(data.fa) && !picked.includes(data.b) && !picked.includes(data.fb)) {
        picked.push(data.a);
        points--;
      }
    }
  }

  return picked;
}

function pickAuthority(ethics) {
  if (ethics.includes('gestalt')) {
    return Math.random() > 0.5 ? 'hive_mind' : 'machine_intelligence';
  }
  if (ethics.includes('fanatic_egalitarian')) return 'democratic';
  if (ethics.includes('fanatic_authoritarian')) return Math.random() > 0.5 ? 'dictatorial' : 'imperial';
  if (ethics.includes('egalitarian')) return Math.random() > 0.3 ? 'democratic' : 'oligarchic';
  if (ethics.includes('authoritarian')) return Math.random() > 0.5 ? 'dictatorial' : 'imperial';
  return pick(['democratic', 'oligarchic', 'dictatorial', 'imperial']);
}

function pickCivicsAI(ethics, authority) {
  const available = Object.values(CIVICS).filter(c => {
    if (c.allowedAuthorities && !c.allowedAuthorities.includes(authority)) return false;
    if (c.allowedEthics && !c.allowedEthics.some(e => ethics.includes(e))) return false;
    if (c.restrictions) return false;
    return true;
  });
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2).map(c => c.id);
}

function pickAISpeciesTraits() {
  const positiveTraits = Object.values(TRAITS).filter(t => t.cost > 0);
  const negativeTraits = Object.values(TRAITS).filter(t => t.cost < 0);
  const picked = [];
  let points = 2;

  // Add 1-2 negative traits for more points
  const negCount = rand(0, 2);
  for (let i = 0; i < negCount; i++) {
    const neg = pick(negativeTraits);
    if (!picked.some(t => t.id === neg.id)) {
      picked.push(neg.id);
      points -= neg.cost;
    }
  }

  // Add positive traits
  const posShuffled = [...positiveTraits].sort(() => Math.random() - 0.5);
  for (const t of posShuffled) {
    if (points >= t.cost && picked.length < 5) {
      picked.push(t.id);
      points -= t.cost;
    }
  }

  return picked;
}

function pickAIOrigin(ethics, authority) {
  const options = Object.values(ORIGINS).filter(o => {
    if (o.allowedEthics && !o.allowedEthics.some(e => ethics.includes(e))) return false;
    if (o.allowedAuthorities && !o.allowedAuthorities.includes(authority)) return false;
    return true;
  });
  return pick(options).id;
}

function generateAIName() {
  const prefixes = ['Grand', 'United', 'Celestial', 'Stellar', 'Imperial', 'Eternal', 'Radiant', 'Void', 'Nova', 'Astral',
    'Zenith', 'Supreme', 'Ancient', 'Crimson', 'Iron', 'Crystal', 'Shadow', 'Golden', 'Silver', 'Azure'];
  const suffixes = ['Empire', 'Commonwealth', 'Dominion', 'Republic', 'Confederacy', 'Hegemony', 'Assembly',
    'Concordance', 'Ascendancy', 'Collective', 'Alliance', 'Mandate', 'Imperium', 'Protectorate', 'Union'];
  return `${pick(prefixes)} ${pick(suffixes)}`;
}
