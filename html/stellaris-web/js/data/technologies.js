export const TECHNOLOGIES = {
  // === Physics ===
  t1_physics_lab: {
    id: 't1_physics_lab', name: 'Scientific Method', category: 'physics', tier: 1, cost: 2000,
    description: 'Formalizing the scientific process improves research output.',
    effects: { researchSpeed: 0.05 },
    unlocks: ['research_lab'],
  },
  t1_red_lasers: {
    id: 't1_red_lasers', name: 'Red Lasers', category: 'physics', tier: 1, cost: 2000,
    description: 'Coherent light weapons for our ships.',
    effects: {},
    unlocksWeapons: ['red_laser_1'],
  },
  t1_improved_shields: {
    id: 't1_improved_shields', name: 'Improved Deflectors', category: 'physics', tier: 1, cost: 2000,
    description: 'Enhanced energy shielding systems.',
    effects: { shieldHp: 0.1 },
  },
  t1_reactor_boost: {
    id: 't1_reactor_boost', name: 'Fusion Power', category: 'physics', tier: 1, cost: 2000,
    description: 'Improved reactor technology for better energy output.',
    effects: { energyOutput: 0.05 },
  },
  t1_administrative_ai: {
    id: 't1_administrative_ai', name: 'Administrative AI', category: 'physics', tier: 1, cost: 2000,
    description: 'Basic AI to assist with administrative tasks.',
    effects: { researchSpeed: 0.05 },
  },
  t1_blue_lasers: {
    id: 't1_blue_lasers', name: 'Blue Lasers', category: 'physics', tier: 2, cost: 4000,
    description: 'More powerful laser weaponry.',
    effects: { energyDamage: 0.15 },
    prerequisites: ['t1_red_lasers'],
  },
  t1_deflectors: {
    id: 't1_deflectors', name: 'Deflectors', category: 'physics', tier: 1, cost: 2000,
    description: 'Energy shields that absorb incoming damage.',
    effects: {},
    unlocks: ['small_shield_1'],
  },
  t1_improved_sensors: {
    id: 't1_improved_sensors', name: 'Improved Sensors', category: 'physics', tier: 1, cost: 2000,
    description: 'Enhanced sensor arrays for better detection range.',
    effects: { sensorRange: 1 },
  },
  t2_advanced_shields: {
    id: 't2_advanced_shields', name: 'Advanced Shields', category: 'physics', tier: 2, cost: 4000,
    description: 'More powerful ship shields.',
    effects: { shieldHp: 0.2 },
    prerequisites: ['t1_deflectors'],
  },
  t2_advanced_lasers: {
    id: 't2_advanced_lasers', name: 'UV Lasers', category: 'physics', tier: 2, cost: 4000,
    description: 'Ultraviolet laser technology.',
    effects: { energyDamage: 0.1 },
    prerequisites: ['t1_blue_lasers'],
  },
  t2_global_energy: {
    id: 't2_global_energy', name: 'Global Energy Management', category: 'physics', tier: 2, cost: 4000,
    description: 'Advanced power distribution networks.',
    effects: { energyOutput: 0.1 },
  },
  t3_quantum_theory: {
    id: 't3_quantum_theory', name: 'Quantum Theory', category: 'physics', tier: 3, cost: 8000,
    description: 'Unlocking the secrets of quantum mechanics.',
    effects: { researchSpeed: 0.1 },
  },
  t3_plasma: {
    id: 't3_plasma', name: 'Plasma Accelerators', category: 'physics', tier: 3, cost: 8000,
    description: 'Plasma-based weaponry.',
    effects: { energyDamage: 0.2 },
    prerequisites: ['t2_advanced_lasers'],
  },
  t4_dark_matter: {
    id: 't4_dark_matter', name: 'Dark Matter Drawing', category: 'physics', tier: 4, cost: 15000,
    description: 'Harnessing dark matter for power.',
    effects: { energyOutput: 0.2 },
  },

  // === Society ===
  t1_genome_mapping: {
    id: 't1_genome_mapping', name: 'Genome Mapping', category: 'society', tier: 1, cost: 2000,
    description: 'Detailed mapping of genetic structures.',
    effects: { foodOutput: 0.1, popGrowth: 0.1 },
  },
  t1_hydroponics: {
    id: 't1_hydroponics', name: 'Hydroponics Farming', category: 'society', tier: 1, cost: 2000,
    description: 'Efficient agricultural techniques.',
    effects: { foodOutput: 0.15 },
  },
  t1_planetary_unification: {
    id: 't1_planetary_unification', name: 'Planetary Unification', category: 'society', tier: 1, cost: 2000,
    description: 'Unified planetary governance systems.',
    effects: { unity: 0.1, adminCap: 10 },
  },
  t1_colonial_centralization: {
    id: 't1_colonial_centralization', name: 'Colonial Centralization', category: 'society', tier: 1, cost: 2000,
    description: 'Efficient colonial administration.',
    effects: { adminCap: 15 },
  },
  t1_new_worlds: {
    id: 't1_new_worlds', name: 'New Worlds Protocol', category: 'society', tier: 1, cost: 2000,
    description: 'Protocols for rapid colonization.',
    effects: { colonizationSpeed: 0.25 },
  },
  t1_xenobiology: {
    id: 't1_xenobiology', name: 'Xenobiology', category: 'society', tier: 1, cost: 2000,
    description: 'Study of alien biology.',
    effects: { societyResearch: 0.1 },
  },
  t2_galactic_markets: {
    id: 't2_galactic_markets', name: 'Galactic Markets', category: 'society', tier: 2, cost: 4000,
    description: 'Interstellar economic structures.',
    effects: { tradeValue: 0.15 },
  },
  t2_synthetic_thought: {
    id: 't2_synthetic_thought', name: 'Synthetic Thought Patterns', category: 'society', tier: 2, cost: 4000,
    description: 'Understanding synthetic intelligence.',
    effects: { researchSpeed: 0.05 },
  },
  t2_doctrine: {
    id: 't2_doctrine', name: 'Doctrine: Space Combat', category: 'society', tier: 2, cost: 4000,
    description: 'Advanced space combat doctrines.',
    effects: { navalCap: 20, shipFireRate: 0.1 },
  },
  t3_cloning: {
    id: 't3_cloning', name: 'Cloning', category: 'society', tier: 3, cost: 8000,
    description: 'Advanced cloning technology.',
    effects: { popGrowth: 0.2 },
  },
  t3_galactic_administration: {
    id: 't3_galactic_administration', name: 'Galactic Administration', category: 'society', tier: 3, cost: 8000,
    description: 'Managing a galactic empire.',
    effects: { adminCap: 20, edictCost: -0.1 },
  },
  t4_ascension_theory: {
    id: 't4_ascension_theory', name: 'Ascension Theory', category: 'society', tier: 4, cost: 15000,
    description: 'The theoretical path to transcendence.',
    effects: { ascensionSlots: 1 },
  },

  // === Engineering ===
  t1_powered_exoskeletons: {
    id: 't1_powered_exoskeletons', name: 'Powered Exoskeletons', category: 'engineering', tier: 1, cost: 2000,
    description: 'Mechanical enhancement for workers.',
    effects: { mineralsOutput: 0.05, armyDamage: 0.05 },
  },
  t1_nanocomposite: {
    id: 't1_nanocomposite', name: 'Nanocomposite Materials', category: 'engineering', tier: 1, cost: 2000,
    description: 'Advanced composite armor.',
    effects: { armorHp: 0.1 },
  },
  t1_starbase_construction: {
    id: 't1_starbase_construction', name: 'Starbase Construction', category: 'engineering', tier: 1, cost: 2000,
    description: 'Improved starbase construction methods.',
    effects: { starbaseCap: 2 },
  },
  t1_destroyers: {
    id: 't1_destroyers', name: 'Destroyers', category: 'engineering', tier: 1, cost: 2000,
    description: 'Larger military vessels with enhanced firepower.',
    effects: {},
    unlocksShips: ['destroyer'],
  },
  t1_mineral_purification: {
    id: 't1_mineral_purification', name: 'Mineral Purification', category: 'engineering', tier: 1, cost: 2000,
    description: 'Improved mineral extraction techniques.',
    effects: { mineralsOutput: 0.1 },
  },
  t1_mass_drivers_1: {
    id: 't1_mass_drivers_1', name: 'Mass Drivers', category: 'engineering', tier: 1, cost: 2000,
    description: 'Kinetic projectile weapons for ships.',
    effects: {},
    unlocksWeapons: ['mass_driver_1'],
  },
  t1_ceramo_metal: {
    id: 't1_ceramo_metal', name: 'Ceramo-Metal Materials', category: 'engineering', tier: 1, cost: 2000,
    description: 'Advanced structural materials.',
    effects: { buildCost: -0.1 },
  },
  t1_geothermal: {
    id: 't1_geothermal', name: 'Geothermal Fracking', category: 'engineering', tier: 1, cost: 2000,
    description: 'Deep-crust resource extraction.',
    effects: { mineralsOutput: 0.1 },
  },
  t2_cruisers: {
    id: 't2_cruisers', name: 'Cruisers', category: 'engineering', tier: 2, cost: 4000,
    description: 'Heavy combat cruisers.',
    effects: {},
    unlocksShips: ['cruiser'],
    prerequisites: ['t1_destroyers'],
  },
  t2_robotics: {
    id: 't2_robotics', name: 'Robotic Workers', category: 'engineering', tier: 2, cost: 4000,
    description: 'Simple robotic labor.',
    effects: { robotAssembly: true },
  },
  t2_advanced_alloys: {
    id: 't2_advanced_alloys', name: 'Advanced Alloys', category: 'engineering', tier: 2, cost: 4000,
    description: 'Superior alloy production.',
    effects: { alloysOutput: 0.1 },
  },
  t2_star_fortress: {
    id: 't2_star_fortress', name: 'Star Fortress', category: 'engineering', tier: 2, cost: 4000,
    description: 'Upgraded starbase fortifications.',
    effects: { starbaseLevel: 2 },
    prerequisites: ['t1_starbase_construction'],
  },
  t3_battleships: {
    id: 't3_battleships', name: 'Battleships', category: 'engineering', tier: 3, cost: 8000,
    description: 'Massive capital ships.',
    effects: {},
    unlocksShips: ['battleship'],
    prerequisites: ['t2_cruisers'],
  },
  t3_mega_engineering: {
    id: 't3_mega_engineering', name: 'Mega Engineering', category: 'engineering', tier: 3, cost: 8000,
    description: 'Vast construction projects in space.',
    effects: { megastructureBuild: true },
    prerequisites: ['t2_star_fortress'],
  },
  t4_dragon_armor: {
    id: 't4_dragon_armor', name: 'Dragon Scale Armor', category: 'engineering', tier: 4, cost: 15000,
    description: 'Biologically inspired armor plating.',
    effects: { armorHp: 0.3 },
  },
};

export function getTechTree() {
  const byCategory = { physics: [], society: [], engineering: [] };
  for (const tech of Object.values(TECHNOLOGIES)) {
    byCategory[tech.category].push(tech);
  }
  return byCategory;
}

export function getAvailableTechs(empire, category) {
  const researched = empire.techResearched || new Set();
  const allTechs = Object.values(TECHNOLOGIES).filter(t => t.category === category);
  return allTechs.filter(tech => {
    if (researched.has(tech.id)) return false;
    if (tech.prerequisites) {
      for (const prereq of tech.prerequisites) {
        if (!researched.has(prereq)) return false;
      }
    }
    return true;
  });
}

export function pickResearchOptions(empire, category, count = 3) {
  const available = getAvailableTechs(empire, category);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
