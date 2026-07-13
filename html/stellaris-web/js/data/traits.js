export const TRAITS = {
  // Positive (cost trait points)
  adaptive: {
    id: 'adaptive', name: 'Adaptive', cost: 2, category: 'biological',
    description: 'This species can thrive in most environments.',
    effects: { habitability: 10 },
  },
  extremely_adaptive: {
    id: 'extremely_adaptive', name: 'Extremely Adaptive', cost: 4, category: 'biological',
    description: 'This species can survive almost anywhere.',
    effects: { habitability: 20 },
  },
  rapid_breeders: {
    id: 'rapid_breeders', name: 'Rapid Breeders', cost: 2, category: 'biological',
    description: 'This species multiplies at an accelerated rate.',
    effects: { popGrowth: 0.1 },
  },
  intelligent: {
    id: 'intelligent', name: 'Intelligent', cost: 2, category: 'biological',
    description: 'Natural aptitude for science.',
    effects: { researchOutput: 0.1 },
  },
  natural_engineers: {
    id: 'natural_engineers', name: 'Natural Engineers', cost: 1, category: 'biological',
    description: 'Innate talent for engineering.',
    effects: { engineeringOutput: 0.15 },
  },
  natural_physicists: {
    id: 'natural_physicists', name: 'Natural Physicists', cost: 1, category: 'biological',
    description: 'Innate talent for physics.',
    effects: { physicsOutput: 0.15 },
  },
  natural_sociologists: {
    id: 'natural_sociologists', name: 'Natural Sociologists', cost: 1, category: 'biological',
    description: 'Innate talent for sociology.',
    effects: { societyOutput: 0.15 },
  },
  thrifty: {
    id: 'thrifty', name: 'Thrifty', cost: 2, category: 'biological',
    description: 'Keen instinct for commerce.',
    effects: { tradeValue: 0.25 },
  },
  industrious: {
    id: 'industrious', name: 'Industrious', cost: 2, category: 'biological',
    description: 'Natural strength and work ethic.',
    effects: { mineralsOutput: 0.15 },
  },
  agrarian: {
    id: 'agrarian', name: 'Agrarian', cost: 2, category: 'biological',
    description: 'Innate talent for agriculture.',
    effects: { foodOutput: 0.15 },
  },
  enduring: {
    id: 'enduring', name: 'Enduring', cost: 1, category: 'biological',
    description: 'This species lives longer than average.',
    effects: { leaderLifespan: 20 },
  },
  venerable: {
    id: 'venerable', name: 'Venerable', cost: 4, category: 'biological',
    description: 'Extremely long-lived.',
    effects: { leaderLifespan: 40 },
  },
  talented: {
    id: 'talented', name: 'Talented', cost: 1, category: 'biological',
    description: 'Natural leaders.',
    effects: { leaderCap: 1 },
  },
  quick_learners: {
    id: 'quick_learners', name: 'Quick Learners', cost: 1, category: 'biological',
    description: 'Learn faster than most.',
    effects: { leaderXp: 0.25 },
  },
  strong: {
    id: 'strong', name: 'Strong', cost: 1, category: 'biological',
    description: 'Physical strength above average.',
    effects: { armyDamage: 0.2, workerOutput: 0.025 },
  },
  very_strong: {
    id: 'very_strong', name: 'Very Strong', cost: 3, category: 'biological',
    description: 'Immense physical strength.',
    effects: { armyDamage: 0.4, workerOutput: 0.05 },
  },
  traditional: {
    id: 'traditional', name: 'Traditional', cost: 1, category: 'biological',
    description: 'Deeply spiritual and conservative.',
    effects: { unityOutput: 0.1 },
  },
  conservationist: {
    id: 'conservationist', name: 'Conservationist', cost: 1, category: 'biological',
    description: 'Uses fewer consumer goods.',
    effects: { consumerGoodsUpkeep: -0.1 },
  },
  communal: {
    id: 'communal', name: 'Communal', cost: 1, category: 'biological',
    description: 'Prefers to live in close communities.',
    effects: { housingUsage: -0.1 },
  },
  conformists: {
    id: 'conformists', name: 'Conformists', cost: 2, category: 'biological',
    description: 'Readily accepts governing ethics.',
    effects: { ethicsAttraction: 0.3 },
  },

  // Negative (give trait points)
  nonadaptive: {
    id: 'nonadaptive', name: 'Nonadaptive', cost: -2, category: 'biological',
    description: 'Poorly suited to foreign environments.',
    effects: { habitability: -10 },
  },
  repugnant: {
    id: 'repugnant', name: 'Repugnant', cost: -2, category: 'biological',
    description: 'Physically unpleasant to other species.',
    effects: { amenities: -0.1, opinionPenalty: 25 },
  },
  fleeting: {
    id: 'fleeting', name: 'Fleeting', cost: -2, category: 'biological',
    description: 'Short-lived.',
    effects: { leaderLifespan: -20 },
  },
  slow_learners: {
    id: 'slow_learners', name: 'Slow Learners', cost: -1, category: 'biological',
    description: 'Struggles with new concepts.',
    effects: { leaderXp: -0.25 },
  },
  weak: {
    id: 'weak', name: 'Weak', cost: -1, category: 'biological',
    description: 'Below average physical strength.',
    effects: { armyDamage: -0.2, workerOutput: -0.025 },
  },
  wasteful: {
    id: 'wasteful', name: 'Wasteful', cost: -1, category: 'biological',
    description: 'Consumes more consumer goods.',
    effects: { consumerGoodsUpkeep: 0.1 },
  },
  solitary: {
    id: 'solitary', name: 'Solitary', cost: -1, category: 'biological',
    description: 'Prefers isolation.',
    effects: { housingUsage: 0.1 },
  },
  deviants: {
    id: 'deviants', name: 'Deviants', cost: -1, category: 'biological',
    description: 'Questions authority.',
    effects: { ethicsAttraction: -0.15 },
  },
  unruly: {
    id: 'unruly', name: 'Unruly', cost: -2, category: 'biological',
    description: 'Difficult to govern.',
    effects: { empireSize: 0.1 },
  },
  decadent: {
    id: 'decadent', name: 'Decadent', cost: -1, category: 'biological',
    description: 'Requires slaves or servants.',
    effects: { workerOutput: -0.1, slaveHappiness: -0.1 },
  },
};

export const ORIGINS = {
  prosperous_unification: {
    id: 'prosperous_unification', name: 'Prosperous Unification',
    description: 'Your homeworld was united peacefully, bringing a golden age of prosperity.',
    effects: { startingPops: 4, homeworldBonus: 10, bonusYears: 10 },
    default: true,
  },
  lost_colony: {
    id: 'lost_colony', name: 'Lost Colony',
    description: 'Your species originated from a long-lost colony ship.',
    effects: { startingPops: 3, parentEmpire: true },
  },
  remnants: {
    id: 'remnants', name: 'Remnants',
    description: 'Your civilization arose from the ruins of an ancient precursor empire.',
    effects: { startingPops: 3, relicWorld: true, techBoost: 5 },
  },
  mechanist: {
    id: 'mechanist', name: 'Mechanist',
    description: 'Robot workers are central to your society from the very beginning.',
    effects: { startingPops: 3, startingRobots: 2, robotTech: true },
    allowedEthics: ['materialist', 'fanatic_materialist'],
  },
  syncretic_evolution: {
    id: 'syncretic_evolution', name: 'Syncretic Evolution',
    description: 'A second species evolved alongside your main species on the homeworld.',
    effects: { startingPops: 4, secondarySpecies: 4 },
  },
  scion: {
    id: 'scion', name: 'Scion',
    description: 'Your empire is a vassal of a powerful Fallen Empire.',
    effects: { startingPops: 4, fallenEmpireOverlord: true },
  },
  void_dwellers: {
    id: 'void_dwellers', name: 'Void Dwellers',
    description: 'Your species evolved on space habitats rather than planets.',
    effects: { startingPops: 4, habitatPreference: true, planetPenalty: 0.15 },
  },
  shattered_ring: {
    id: 'shattered_ring', name: 'Shattered Ring',
    description: 'Your civilization inhabits a shattered ringworld.',
    effects: { startingPops: 4, ringworldStart: true },
  },
  tree_of_life: {
    id: 'tree_of_life', name: 'Tree of Life',
    description: 'Your hive is bound to a great tree.',
    effects: { startingPops: 4, treeOfLife: true },
    allowedAuthorities: ['hive_mind'],
  },
  resource_consolidation: {
    id: 'resource_consolidation', name: 'Resource Consolidation',
    description: 'Your machine intelligence converted the homeworld into a machine world.',
    effects: { startingPops: 4, machineWorld: true },
    allowedAuthorities: ['machine_intelligence'],
  },
  galactic_doorstep: {
    id: 'galactic_doorstep', name: 'Galactic Doorstep',
    description: 'A dormant gateway exists in your home system.',
    effects: { startingPops: 3, dormantGateway: true },
  },
};

export const PLANET_CLASSES = {
  continental: { name: 'Continental', climate: 'wet', color: '#4fc3f7' },
  ocean: { name: 'Ocean', climate: 'wet', color: '#0288d1' },
  tropical: { name: 'Tropical', climate: 'wet', color: '#66bb6a' },
  arid: { name: 'Arid', climate: 'dry', color: '#ffb74d' },
  desert: { name: 'Desert', climate: 'dry', color: '#ff8a65' },
  savannah: { name: 'Savannah', climate: 'dry', color: '#aed581' },
  arctic: { name: 'Arctic', climate: 'frozen', color: '#e0e0e0' },
  alpine: { name: 'Alpine', climate: 'frozen', color: '#b0bec5' },
  tundra: { name: 'Tundra', climate: 'frozen', color: '#90a4ae' },
  gaia: { name: 'Gaia', climate: 'gaia', color: '#81c784' },
  tomb: { name: 'Tomb', climate: 'tomb', color: '#8d6e63' },
  relic: { name: 'Relic', climate: 'gaia', color: '#ce93d8' },
  ecumenopolis: { name: 'Ecumenopolis', climate: 'gaia', color: '#ffdd59' },
  ring_world: { name: 'Ring World', climate: 'gaia', color: '#00d2ff' },
  habitat: { name: 'Habitat', climate: 'gaia', color: '#78909c' },
  machine_world: { name: 'Machine World', climate: 'gaia', color: '#666666' },
  hive_world: { name: 'Hive World', climate: 'gaia', color: '#d4a574' },
  barren: { name: 'Barren World', climate: 'barren', color: '#8d6e63' },
  frozen: { name: 'Frozen World', climate: 'frozen', color: '#b3e5fc' },
  gas_giant: { name: 'Gas Giant', climate: 'gas', color: '#e8cfa0' },
  molten: { name: 'Molten World', climate: 'molten', color: '#ff5252' },
  toxic: { name: 'Toxic World', climate: 'toxic', color: '#76ff03' },
};

export const SPECIES_APPEARANCES = [
  { id: 'human', name: 'Human', icon: '👤', category: 'humanoid' },
  { id: 'humanoid_2', name: 'Humanoid 2', icon: '👥', category: 'humanoid' },
  { id: 'reptilian', name: 'Reptilian', icon: '🦎', category: 'reptilian' },
  { id: 'avian', name: 'Avian', icon: '🦅', category: 'avian' },
  { id: 'arthropoid', name: 'Arthropoid', icon: '🦋', category: 'arthropoid' },
  { id: 'molluscoid', name: 'Molluscoid', icon: '🐙', category: 'molluscoid' },
  { id: 'fungoid', name: 'Fungoid', icon: '🍄', category: 'fungoid' },
  { id: 'plantoid', name: 'Plantoid', icon: '🌿', category: 'plantoid' },
  { id: 'lithoid', name: 'Lithoid', icon: '💎', category: 'lithoid' },
  { id: 'machine', name: 'Machine', icon: '🤖', category: 'machine' },
  { id: 'necroid', name: 'Necroid', icon: '💀', category: 'necroid' },
  { id: 'aquatic', name: 'Aquatic', icon: '🐠', category: 'aquatic' },
  { id: 'toxoid', name: 'Toxoid', icon: '🧪', category: 'toxoid' },
];
