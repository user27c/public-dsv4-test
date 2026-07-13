export const ANOMALY_POOL = [
  {
    id: 'anom_alien_mural', name: 'Alien Mural',
    description: 'A massive wall mural covers the surface of this celestial body, depicting an alien civilization\'s history.',
    category: 'society',
    level: 1,
    outcomes: [
      { text: 'Study the history', reward: { societyResearch: 500 }, chance: 0.7 },
      { text: 'Extract artistic value', reward: { unity: 200 }, chance: 0.3 },
    ],
  },
  {
    id: 'anom_crystal_planet', name: 'Crystalline Formations',
    description: 'Strange crystal formations emit a faint humming sound.',
    category: 'physics',
    level: 2,
    outcomes: [
      { text: 'Study the resonance', reward: { physicsResearch: 800, energy: 300 }, chance: 0.6 },
      { text: 'Mine the crystals', reward: { minerals: 500 }, chance: 0.4 },
    ],
  },
  {
    id: 'anom_ancient_wreck', name: 'Ancient Shipwreck',
    description: 'The wreckage of an unknown alien vessel drifts in space.',
    category: 'engineering',
    level: 1,
    outcomes: [
      { text: 'Salvage the wreck', reward: { alloys: 200, engineeringResearch: 400 }, chance: 0.5 },
      { text: 'Study the design', reward: { engineeringResearch: 800 }, chance: 0.5 },
    ],
  },
  {
    id: 'anom_subspace_echo', name: 'Subspace Echoes',
    description: 'Faint echoes from subspace permeate this system.',
    category: 'physics',
    level: 3,
    outcomes: [
      { text: 'Decode the signal', reward: { physicsResearch: 1200, influence: 50 }, chance: 0.5 },
      { text: 'Amplify the echo', reward: { physicsResearch: 600, unity: 200 }, chance: 0.5 },
    ],
  },
  {
    id: 'anom_living_metal', name: 'Living Metal',
    description: 'A strange metallic substance that appears to be... alive.',
    category: 'engineering',
    level: 3,
    outcomes: [
      { text: 'Harvest carefully', reward: { alloys: 500, engineeringResearch: 800 }, chance: 0.6 },
      { text: 'Study its biology', reward: { societyResearch: 1000 }, chance: 0.4 },
    ],
  },
  {
    id: 'anom_ancient_ruins', name: 'Ancient Ruins',
    description: 'Ruins of a long-dead civilization cover this planet.',
    category: 'society',
    level: 2,
    outcomes: [
      { text: 'Excavate the ruins', reward: { societyResearch: 600, unity: 100 }, chance: 0.5 },
      { text: 'Preserve as heritage', reward: { unity: 300 }, chance: 0.5 },
    ],
  },
  {
    id: 'anom_dimensional_pocket', name: 'Dimensional Pocket',
    description: 'A small tear in space-time reveals a pocket dimension.',
    category: 'physics',
    level: 4,
    outcomes: [
      { text: 'Explore the pocket', reward: { physicsResearch: 2000, energy: 500 }, chance: 0.4 },
      { text: 'Seal the rift', reward: { physicsResearch: 800, unity: 300 }, chance: 0.6 },
    ],
  },
  {
    id: 'anom_gas_giant_life', name: 'Gas Giant Lifeforms',
    description: 'Signs of life detected in the upper atmosphere of this gas giant.',
    category: 'society',
    level: 1,
    outcomes: [
      { text: 'Study from orbit', reward: { societyResearch: 400, food: 100 }, chance: 0.7 },
      { text: 'Send a probe', reward: { societyResearch: 600 }, chance: 0.3 },
    ],
  },
  {
    id: 'anom_asteroid_base', name: 'Derelict Station',
    description: 'An abandoned space station orbits this asteroid.',
    category: 'engineering',
    level: 2,
    outcomes: [
      { text: 'Explore the station', reward: { alloys: 300, minerals: 200 }, chance: 0.5 },
      { text: 'Scrap for parts', reward: { minerals: 500, engineeringResearch: 300 }, chance: 0.5 },
    ],
  },
  {
    id: 'anom_brain_slugs', name: 'Neural Parasites',
    description: 'Small slug-like creatures appear to have... cognitive capabilities.',
    category: 'society',
    level: 4,
    outcomes: [
      { text: 'Study the creatures', reward: { societyResearch: 1500, researchSpeed: 0.05 }, chance: 0.4 },
      { text: 'Destroy the infestation', reward: { societyResearch: 500, unity: 300 }, chance: 0.6 },
    ],
  },
];

export const EVENT_CHAINS = {
  precursor_cybrex: {
    id: 'precursor_cybrex', name: 'The Cybrex',
    description: 'Traces of an ancient machine civilization.',
    stages: [
      { id: 'cybrex_1', description: 'You have discovered evidence of an ancient AI civilization called the Cybrex.',
        reward: { engineeringResearch: 500 } },
      { id: 'cybrex_2', description: 'More clues reveal the Cybrex once controlled a massive ringworld.',
        reward: { engineeringResearch: 800, unity: 100 } },
      { id: 'cybrex_3', description: 'You have located the Cybrex home system! A ruined ringworld awaits.',
        reward: { engineeringResearch: 1500, ringworldLocation: true } },
    ],
  },
  precursor_first_league: {
    id: 'precursor_first_league', name: 'The First League',
    description: 'The greatest federation in galactic history.',
    stages: [
      { id: 'first_league_1', description: 'Records of a federation that once united dozens of species.',
        reward: { societyResearch: 500 } },
      { id: 'first_league_2', description: 'The First League\'s capital was a planet-spanning city.',
        reward: { societyResearch: 800, unity: 100 } },
      { id: 'first_league_3', description: 'You have found Fen Habbanis, the First League\'s capital!',
        reward: { societyResearch: 1500, ecumenopolisLocation: true } },
    ],
  },
};

export const RANDOM_EVENTS = [
  {
    id: 'event_comet', name: 'Passing Comet',
    description: 'A comet passes through your system.',
    choices: [
      { text: 'Observe and record', result: { physicsResearch: 200 }, weight: 1 },
      { text: 'Ignore it', result: {}, weight: 1 },
    ],
  },
  {
    id: 'event_immigrants', name: 'Wandering Refugees',
    description: 'A desperate group of refugees seeks asylum in your empire.',
    choices: [
      { text: 'Welcome them', result: { popGain: 2, opinionMod: 30 }, weight: 1 },
      { text: 'Turn them away', result: { unity: 100 }, weight: 1 },
    ],
  },
  {
    id: 'event_mineral_vein', name: 'Rich Mineral Vein',
    description: 'Miners have discovered a particularly rich mineral vein.',
    gives: { minerals: 500 },
  },
  {
    id: 'event_freighter', name: 'Derelict Freighter',
    description: 'An abandoned cargo freighter drifts near your borders.',
    choices: [
      { text: 'Salvage cargo', result: { energy: 300, alloys: 100 }, weight: 1 },
      { text: 'Tow to starbase', result: { engineeringResearch: 300 }, weight: 1 },
    ],
  },
  {
    id: 'event_plague', name: 'Genetic Plague',
    description: 'A mysterious plague spreads among your population.',
    choices: [
      { text: 'Fund medical research', result: { energy: -200, popGrowth: -0.05, duration: 60 }, weight: 1 },
      { text: 'Quarantine colonies', result: { popGrowth: -0.1, happiness: -0.05, duration: 40 }, weight: 1 },
    ],
  },
  {
    id: 'event_diplomatic_incident', name: 'Diplomatic Incident',
    description: 'A diplomatic blunder has offended a neighboring empire.',
    choices: [
      { text: 'Issue formal apology', result: { influence: -30, opinionMod: 20 }, weight: 1 },
      { text: 'Stand firm', result: { unity: 150, opinionMod: -30 }, weight: 1 },
    ],
  },
  {
    id: 'event_scientific_breakthrough', name: 'Scientific Breakthrough',
    description: 'Our scientists have made an unexpected breakthrough!',
    gives: { physicsResearch: 400, societyResearch: 400, engineeringResearch: 400 },
  },
  {
    id: 'event_pirate_raid', name: 'Pirate Raid',
    description: 'Pirates are raiding our trade routes!',
    gives: { energy: -300 },
  },
  {
    id: 'event_corruption', name: 'Political Scandal',
    description: 'A high-ranking official has been caught embezzling.',
    choices: [
      { text: 'Prosecute publicly', result: { unity: 100, influence: -20 }, weight: 1 },
      { text: 'Handle quietly', result: { influence: 50 }, weight: 1 },
    ],
  },
];

export const FIRST_CONTACT_EVENTS = [
  {
    id: 'fc_peaceful', name: 'Peaceful First Contact',
    description: 'We have made contact with an alien species. They appear to be...',
    options: [
      { text: 'Welcome them warmly', result: { opinionMod: 50, influence: 50 }, desc: '+50 opinion toward us' },
      { text: 'Maintain cautious distance', result: { opinionMod: 0, influence: 30 }, desc: 'No opinion change' },
      { text: 'Send a threat', result: { opinionMod: -50, influence: 20 }, desc: '-50 opinion, they will fear us' },
    ],
  },
];
