export const AUTHORITIES = {
  democratic: {
    id: 'democratic', name: 'Democratic',
    description: 'Rulers are elected by the people for fixed terms.',
    effects: { resettlementCost: -0.25, factionUnity: 0.25 },
    electionCycle: 10,
  },
  oligarchic: {
    id: 'oligarchic', name: 'Oligarchic',
    description: 'A council of the most influential citizens governs.',
    effects: { leaderPool: 1, councilAgendaSpeed: 0.1 },
    electionCycle: 20,
  },
  dictatorial: {
    id: 'dictatorial', name: 'Dictatorial',
    description: 'A single dictator holds absolute power.',
    effects: { rulerOutput: 0.1, edictFund: 25 },
    electionCycle: 999, // for life
  },
  imperial: {
    id: 'imperial', name: 'Imperial',
    description: 'Rule by hereditary monarchy.',
    effects: { rulerOutput: 0.1, edictFund: 25 },
    electionCycle: 999,
  },
  corporate: {
    id: 'corporate', name: 'Corporate',
    description: 'A business enterprise that has expanded to govern an entire civilization.',
    effects: { tradeValue: 0.1, branchOffices: true, adminCap: 10 },
    electionCycle: 20,
  },
  hive_mind: {
    id: 'hive_mind', name: 'Hive Mind',
    description: 'A single consciousness controls all drones.',
    effects: { popGrowth: 0.15, adminCap: 10 },
    electionCycle: 999,
    restrictions: { gestaltOnly: true },
  },
  machine_intelligence: {
    id: 'machine_intelligence', name: 'Machine Intelligence',
    description: 'A centralized AI network governs all units.',
    effects: { popAssembly: 0.15, adminCap: 10, leaderLifespan: 999 },
    electionCycle: 999,
    restrictions: { gestaltOnly: true, machineOnly: true },
  },
};

export const CIVICS = {
  // Standard civics
  mining_guilds: {
    id: 'mining_guilds', name: 'Mining Guilds',
    description: 'The state controls all mineral extraction, maximizing efficiency.',
    effects: { mineralsOutput: 0.1 },
    allowedEthics: null, // anyone
  },
  technocracy: {
    id: 'technocracy', name: 'Technocracy',
    description: 'Scientists are elevated to positions of power.',
    effects: { researchAlt: 1, researcherUnity: 1 },
    allowedEthics: ['materialist', 'fanatic_materialist'],
  },
  warrior_culture: {
    id: 'warrior_culture', name: 'Warrior Culture',
    description: 'Combat is celebrated as the highest calling.',
    effects: { armyDamage: 0.2, navalCap: 0.1, duelists: true },
    allowedEthics: ['militarist', 'fanatic_militarist'],
  },
  merchant_guilds: {
    id: 'merchant_guilds', name: 'Merchant Guilds',
    description: 'Merchants form the backbone of the economy.',
    effects: { tradeValue: 0.1, merchantJob: 1 },
  },
  environmentalist: {
    id: 'environmentalist', name: 'Environmentalist',
    description: 'Nature must be preserved even as we expand to the stars.',
    effects: { consumerGoodsUpkeep: -0.15, blockersClear: -0.25 },
  },
  parliamentary_system: {
    id: 'parliamentary_system', name: 'Parliamentary System',
    description: 'All factions have a voice in government.',
    effects: { factionUnity: 0.4 },
    allowedEthics: ['egalitarian', 'fanatic_egalitarian'],
  },
  police_state: {
    id: 'police_state', name: 'Police State',
    description: 'The state maintains an extensive surveillance apparatus.',
    effects: { stability: 5, enforcerUnity: 1 },
  },
  cutthroat_politics: {
    id: 'cutthroat_politics', name: 'Cutthroat Politics',
    description: 'The ends justify the means in the political arena.',
    effects: { edictCost: -0.2 },
  },
  functional_architecture: {
    id: 'functional_architecture', name: 'Functional Architecture',
    description: 'No frills, no ornamentation. Buildings serve pure function.',
    effects: { buildCost: -0.1, buildSpeed: 0.1 },
  },
  distinguished_admiralty: {
    id: 'distinguished_admiralty', name: 'Distinguished Admiralty',
    description: 'The admiralty holds great political power.',
    effects: { fleetCap: 10, admiralLevel: 2 },
    allowedEthics: ['militarist', 'fanatic_militarist'],
  },
  meritocracy: {
    id: 'meritocracy', name: 'Meritocracy',
    description: 'Promotion based on merit, not birth.',
    effects: { leaderPool: 1, leaderCap: 1 },
    allowedEthics: ['egalitarian', 'fanatic_egalitarian'],
  },
  aristocratic_elite: {
    id: 'aristocratic_elite', name: 'Aristocratic Elite',
    description: 'The nobility forms the ruling class.',
    effects: { stability: 5, governorJobs: 0 },
    allowedEthics: ['authoritarian', 'fanatic_authoritarian'],
  },
  beacon_of_liberty: {
    id: 'beacon_of_liberty', name: 'Beacon of Liberty',
    description: 'Our free society is a shining example to the galaxy.',
    effects: { unity: 0.15, immigration: 0.15 },
    allowedEthics: ['egalitarian', 'fanatic_egalitarian'],
  },
  nationalistic_zeal: {
    id: 'nationalistic_zeal', name: 'Nationalistic Zeal',
    description: 'Our nation must be defended at all costs.',
    effects: { claimCost: -0.15, warExhaustion: -0.1 },
    allowedEthics: ['militarist', 'fanatic_militarist'],
  },
  efficient_bureaucracy: {
    id: 'efficient_bureaucracy', name: 'Efficient Bureaucracy',
    description: 'Streamlined administrative processes reduce waste.',
    effects: { adminCap: 10 },
  },
  shadow_council: {
    id: 'shadow_council', name: 'Shadow Council',
    description: 'A secret cabal really runs things.',
    effects: { influence: 0.5, electionCost: -0.5 },
  },
  feudal_society: {
    id: 'feudal_society', name: 'Feudal Society',
    description: 'Vassals owe their loyalty directly to the crown.',
    effects: { subjectLoyalty: 0.2 },
    allowedAuthorities: ['imperial'],
  },
  inward_perfection: {
    id: 'inward_perfection', name: 'Inward Perfection',
    description: 'We seek only harmony within our borders.',
    effects: { unity: 0.2, happiness: 0.05, popGrowth: 0.1 },
    restrictions: { noDiplomacy: true, noWars: true },
    allowedEthics: ['pacifist', 'fanatic_pacifist', 'xenophobe', 'fanatic_xenophobe'],
  },
  // Corporate civics
  private_prospectors: {
    id: 'private_prospectors', name: 'Private Prospectors',
    description: 'Private enterprise leads colonization.',
    effects: { colonyCost: -0.25 },
    allowedAuthorities: ['corporate'],
  },
  gospel_of_the_masses: {
    id: 'gospel_of_the_masses', name: 'Gospel of the Masses',
    description: 'Faith is good business.',
    effects: { tradeValue: 0.15, spiritualistAttraction: 0.25 },
    allowedAuthorities: ['corporate'],
    allowedEthics: ['spiritualist', 'fanatic_spiritualist'],
  },
  // Hive civics
  one_mind: {
    id: 'one_mind', name: 'One Mind',
    description: 'The drones work in perfect harmony.',
    effects: { unity: 0.1, amenities: 0.05 },
    allowedAuthorities: ['hive_mind'],
  },
  devouring_swarm: {
    id: 'devouring_swarm', name: 'Devouring Swarm',
    description: 'The hive consumes all.',
    effects: { armyDamage: 0.25, shipHull: 0.15, popGrowth: 0.15 },
    restrictions: { noDiplomacy: true, totalWar: true },
    allowedAuthorities: ['hive_mind'],
  },
  // Machine civics
  determined_exterminator: {
    id: 'determined_exterminator', name: 'Determined Exterminator',
    description: 'All organic life must be eliminated.',
    effects: { weaponsDamage: 0.25, navalCap: 0.25 },
    restrictions: { noDiplomacy: true, totalWar: true },
    allowedAuthorities: ['machine_intelligence'],
  },
  driven_assimilator: {
    id: 'driven_assimilator', name: 'Driven Assimilator',
    description: 'All life will be assimilated into the collective.',
    effects: { popAssembly: 0.15, societyResearch: 0.1 },
    restrictions: { noDiplomacy: true, totalWar: true },
    allowedAuthorities: ['machine_intelligence'],
  },
};
