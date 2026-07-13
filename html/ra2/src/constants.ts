export const TILE_W = 128;
export const TILE_H = 64;
export const TILE_HALF_W = TILE_W / 2;
export const TILE_HALF_H = TILE_H / 2;

export const MAP_W = 128;
export const MAP_H = 128;

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const CAMERA_SPEED = 600;
export const CAMERA_EDGE_SCROLL = 30;
export const CAMERA_ZOOM_MIN = 0.5;
export const CAMERA_ZOOM_MAX = 2.0;

export const STARTING_CREDITS = 10000;
export const ORE_PER_HARVEST = 500;
export const GEM_PER_HARVEST = 1000;

export const VETERANCY_DMG_MULT = [1.0, 1.25, 1.5];
export const VETERANCY_HP_MULT = [1.0, 1.3, 1.6];
export const VETERANCY_SPEED_MULT = [1.0, 1.1, 1.2];
export const VETERANCY_ROF_MULT = [1.0, 0.85, 0.7];
export const VETERANCY_KILLS = [0, 3, 6];

export const FOG_VISIBLE = 2;
export const FOG_EXPLORED = 1;
export const FOG_HIDDEN = 0;

export const BUILDING_FOOTPRINTS: Record<string, [number, number]> = {
  bar: [2, 2],
  war: [2, 2],
  ref: [3, 3],
  pow: [2, 2],
  rad: [2, 2],
  weap: [3, 3],
  gapi: [2, 2],
  atek: [2, 2],
  stek: [2, 2],
  dome: [2, 2],
  air: [3, 3],
  fix: [3, 3],
  spen: [3, 3],
  syrd: [3, 3],
  eye: [2, 2],
  grnd: [3, 3],
  nail: [4, 4],
  iron: [3, 3],
  pill: [1, 1],
  cami: [1, 1],
  gtwr: [1, 1],
  atwr: [1, 1],
  fenc: [1, 1],
};

export const TERRAIN_COLORS: Record<number, string> = {
  0: '#4a7a2e',   // Clear - green grass
  1: '#5a6a3e',   // Rough - darker grass
  2: '#6a6a5e',   // Road - grey
  3: '#1a3a8a',   // Water - blue
  4: '#caba7a',   // Beach - sand
  5: '#7a7a7a',   // Rock - stone
  6: '#5a4a3a',   // Cliff - brown
  7: '#ba9a2a',   // Ore - gold
  8: '#fa3a3a',   // Gems - red
  9: '#8a8a7a',   // Pavement - light grey
  10: '#5a5a3a',  // Railroad - dark brown
  11: '#4a4a4a',  // Bridge - dark grey
  12: '#2a2a2a',  // Tunnel - black
  13: '#6a5a4a',  // Rubble - dark brown
};

export const COUNTRY_COLORS: Record<number, string> = {
  0: '#4488ff', // America - blue
  1: '#44aaff', // Korea - light blue
  2: '#2266dd', // France - dark blue
  3: '#886644', // Germany - brown
  4: '#226644', // Britain - dark green
  5: '#ff4444', // Russia - red
  6: '#44aa44', // Iraq - green
  7: '#ffaa44', // Cuba - orange
  8: '#664422', // Libya - dark brown
};
