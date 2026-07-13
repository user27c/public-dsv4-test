import { TerrainType, FeatureType, ResourceType } from '../types';
import type { TileData } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, MAP_SEED, TERRAIN_DEFS, FEATURE_DEFS, RESOURCE_DEFS, CITY_MIN_RANGE } from '../constants';
import { hexDistance, getNeighbors } from './HexGrid';

export class HexMap {
  tiles: TileData[][] = [];
  width: number;
  height: number;
  seed: number;

  constructor(width: number = MAP_WIDTH, height: number = MAP_HEIGHT, seed: number = MAP_SEED) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.generate();
  }

  private generate(): void {
    const rng = mulberry32(this.seed);

    for (let q = 0; q < this.width; q++) {
      this.tiles[q] = [];
      for (let r = 0; r < this.height; r++) {
        this.tiles[q][r] = {
          q, r,
          terrain: TerrainType.OCEAN,
          feature: FeatureType.NONE,
          isRiver: false,
          riverEdges: [],
          resource: ResourceType.NONE,
          yields: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
          owner: -1,
          explored: false,
          visible: false,
          improvement: null,
          district: null,
        };
      }
    }

    const heightMap = this.generateHeightMap(rng);
    const tempMap = this.generateTemperatureMap(rng);
    const moistureMap = this.generateMoistureMap(rng);

    for (let q = 0; q < this.width; q++) {
      for (let r = 0; r < this.height; r++) {
        const h = heightMap[q][r];
        const t = tempMap[q][r];
        const m = moistureMap[q][r];
        const tAdj = this.adjustTempByHeight(t, h);

        let terrain: TerrainType;
        let feature: FeatureType = FeatureType.NONE;

        if (h < 0.35) {
          terrain = TerrainType.OCEAN;
          if (h > 0.28) terrain = TerrainType.COAST;
        } else if (h > 0.85) {
          terrain = TerrainType.TUNDRA;
          if (tAdj > -0.15) terrain = TerrainType.PLAINS;
          feature = FeatureType.HILLS;
          if (h > 0.92) {
            feature = FeatureType.MOUNTAINS;
          }
        } else if (h > 0.72) {
          terrain = TerrainType.GRASSLAND;
          if (tAdj > 0.25) terrain = TerrainType.PLAINS;
          if (tAdj < -0.3) terrain = TerrainType.TUNDRA;
          feature = FeatureType.HILLS;
          if (h > 0.80 && rng() < 0.4) {
            feature = FeatureType.MOUNTAINS;
          }
        } else {
          if (tAdj > 0.35) {
            terrain = TerrainType.DESERT;
            if (h > 0.65) feature = FeatureType.HILLS;
          } else if (tAdj > 0.15) {
            terrain = TerrainType.PLAINS;
            if (h > 0.65) feature = FeatureType.HILLS;
          } else if (tAdj > -0.25) {
            terrain = TerrainType.GRASSLAND;
            if (h > 0.65) feature = FeatureType.HILLS;
          } else if (tAdj > -0.45) {
            terrain = TerrainType.PLAINS;
            if (h > 0.60) feature = FeatureType.HILLS;
          } else {
            terrain = TerrainType.TUNDRA;
            if (h > 0.60) feature = FeatureType.HILLS;
          }

          if (feature === FeatureType.NONE) {
            if (m > 0.55 && terrain !== TerrainType.DESERT) {
              feature = this.shouldBeRainforest(tAdj) ? FeatureType.RAINFOREST : FeatureType.FOREST;
              if (rng() < 0.3 && terrain === TerrainType.GRASSLAND) feature = FeatureType.NONE;
            } else if (m > 0.35 && terrain !== TerrainType.DESERT) {
              if (rng() < 0.6) feature = FeatureType.FOREST;
            }
            if (m > 0.7 && terrain === TerrainType.GRASSLAND && feature === FeatureType.NONE) {
              feature = FeatureType.MARSH;
            }
          }
        }

        this.tiles[q][r].terrain = terrain;
        this.tiles[q][r].feature = feature;
        this.tiles[q][r].yields = { ...TERRAIN_DEFS[terrain].yields };

        if (feature !== FeatureType.NONE) {
          const featYields = FEATURE_DEFS[feature].yields;
          const featDef = FEATURE_DEFS[feature];
          if (featDef.removesTerrainYields) {
            this.tiles[q][r].yields = { ...featYields };
          } else {
            this.tiles[q][r].yields.food += featYields.food;
            this.tiles[q][r].yields.production += featYields.production;
            this.tiles[q][r].yields.gold += featYields.gold;
            this.tiles[q][r].yields.science += featYields.science;
            this.tiles[q][r].yields.culture += featYields.culture;
            this.tiles[q][r].yields.faith += featYields.faith;
          }
        }
      }
    }

    this.generateRivers(heightMap, rng);
    this.generateResources(rng);
    this.ensureLandConnectivity();
  }

  private generateHeightMap(rng: () => number): number[][] {
    const coarseScale = 6;
    const fineScale = 12;
    const coarseW = Math.ceil(this.width / coarseScale) + 1;
    const coarseH = Math.ceil(this.height / coarseScale) + 1;

    const coarse: number[][] = [];
    for (let x = 0; x < coarseW; x++) {
      coarse[x] = [];
      for (let y = 0; y < coarseH; y++) {
        coarse[x][y] = rng();
      }
    }

    const hmap: number[][] = [];
    for (let q = 0; q < this.width; q++) {
      hmap[q] = [];
      for (let r = 0; r < this.height; r++) {
        let h = smoothNoise(q / coarseScale, r / coarseScale, coarse);
        h += 0.5 * smoothNoise(q / fineScale, r / fineScale, coarse);
        h += 0.25 * smoothNoise(q / (fineScale * 2), r / (fineScale * 2), coarse);
        h /= 1.75;

        const latFactor = Math.abs(r - this.height / 2) / (this.height / 2);
        h -= latFactor * 0.15;
        h += (1 - latFactor) * latFactor * 0.1;

        hmap[q][r] = Math.max(0, Math.min(1, h));
      }
    }
    return hmap;
  }

  private generateTemperatureMap(rng: () => number): number[][] {
    const tmap: number[][] = [];
    for (let q = 0; q < this.width; q++) {
      tmap[q] = [];
      for (let r = 0; r < this.height; r++) {
        const latFactor = (r / this.height - 0.5) * 2;
        const noise = (rng() - 0.5) * 0.25;
        tmap[q][r] = Math.max(-1, Math.min(1, -latFactor + noise));
      }
    }
    return tmap;
  }

  private generateMoistureMap(rng: () => number): number[][] {
    const mmap: number[][] = [];
    for (let q = 0; q < this.width; q++) {
      mmap[q] = [];
      for (let r = 0; r < this.height; r++) {
        mmap[q][r] = rng();
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      const smoothed: number[][] = [];
      for (let q = 0; q < this.width; q++) {
        smoothed[q] = [];
        for (let r = 0; r < this.height; r++) {
          let sum = mmap[q][r];
          let count = 1;
          for (const [nq, nr] of getNeighbors(q, r)) {
            if (this.inBounds(nq, nr)) {
              sum += mmap[nq][nr];
              count++;
            }
          }
          smoothed[q][r] = sum / count;
        }
      }
      for (let q = 0; q < this.width; q++) {
        for (let r = 0; r < this.height; r++) {
          mmap[q][r] = smoothed[q][r] * 0.6 + rng() * 0.4;
        }
      }
    }
    return mmap;
  }

  private adjustTempByHeight(temp: number, height: number): number {
    return temp - (height - 0.5) * 0.4;
  }

  private shouldBeRainforest(temp: number): boolean {
    return temp > 0.25;
  }

  private generateRivers(heightMap: number[][], rng: () => number): void {
    const numRivers = Math.floor(Math.sqrt(this.width * this.height) * 1.5);
    for (let i = 0; i < numRivers; i++) {
      let q = Math.floor(rng() * this.width);
      let r = Math.floor(rng() * this.height);

      if (heightMap[q][r] < 0.55) continue;
      if (!this.isLand(q, r)) continue;

      let pathLength = 0;
      const maxPath = this.height * 2;

      while (pathLength < maxPath) {
        const tile = this.tiles[q][r];
        if (!this.isLand(q, r) && pathLength > 0) break;

        let lowest: [number, number] | null = null;
        let lowestH = heightMap[q][r];
        let lowestDir = -1;

        for (let d = 0; d < 6; d++) {
          const nq = q + (d % 2 === 0 ? [1, 1, 0, -1, -1, 0][d] : [1, 0, -1, -1, 0, 1][d]);
          let nr: number;
          if (d === 0) nr = r;
          else if (d === 1) nr = r - 1;
          else if (d === 2) nr = r - 1;
          else if (d === 3) nr = r;
          else if (d === 4) nr = r + 1;
          else nr = r + 1;

          const [dq, dr] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]][d];

          if (!this.inBounds(q + dq, r + dr)) continue;
          const h = heightMap[q + dq][r + dr];
          if (h < lowestH) {
            lowestH = h;
            lowest = [q + dq, r + dr];
            lowestDir = d;
          }
        }

        if (lowest) {
          if (this.isLand(q, r) || pathLength === 0) {
            if (tile.feature !== FeatureType.MOUNTAINS) {
              tile.isRiver = true;
              tile.riverEdges.push(lowestDir);
            }
          }
          q = lowest[0];
          r = lowest[1];
        } else {
          break;
        }
        pathLength++;
      }
    }
  }

  private generateResources(rng: () => number): void {
    for (const def of RESOURCE_DEFS) {
      for (let q = 0; q < this.width; q++) {
        for (let r = 0; r < this.height; r++) {
          const tile = this.tiles[q][r];
          if (tile.resource !== ResourceType.NONE) continue;
          if (!def.terrains.includes(tile.terrain)) continue;
          if (def.features.length > 0 && !def.features.includes(tile.feature)) continue;
          if (!this.isLand(q, r)) continue;

          let prob = def.category === 'strategic' ? 0.03 : def.category === 'luxury' ? 0.04 : 0.06;
          if (rng() < prob) {
            tile.resource = def.type;
            tile.yields.food += def.yields.food || 0;
            tile.yields.production += def.yields.production || 0;
            tile.yields.gold += def.yields.gold || 0;
            tile.yields.science += def.yields.science || 0;
            tile.yields.culture += def.yields.culture || 0;
            tile.yields.faith += def.yields.faith || 0;
          }
        }
      }
    }
  }

  private ensureLandConnectivity(): void {
    const bigLandThreshold = 80;
    const visited = new Set<string>();
    const regions: string[][] = [];
    for (let q = 0; q < this.width; q++) {
      for (let r = 0; r < this.height; r++) {
        const key = `${q},${r}`;
        if (visited.has(key)) continue;
        if (!this.isLand(q, r)) continue;
        const region: string[] = [];
        const stack = [[q, r]];
        while (stack.length > 0) {
          const [cq, cr] = stack.pop()!;
          const ck = `${cq},${cr}`;
          if (visited.has(ck)) continue;
          visited.add(ck);
          region.push(ck);
          for (const [nq, nr] of getNeighbors(cq, cr)) {
            if (this.inBounds(nq, nr) && this.isLand(nq, nr) && !visited.has(`${nq},${nr}`)) {
              stack.push([nq, nr]);
            }
          }
        }
        regions.push(region);
      }
    }
    regions.sort((a, b) => b.length - a.length);
    for (let i = 1; i < regions.length; i++) {
      for (const key of regions[i]) {
        const [q, r] = key.split(',').map(Number);
        this.tiles[q][r].terrain = TerrainType.OCEAN;
        this.tiles[q][r].feature = FeatureType.NONE;
        this.tiles[q][r].yields = { ...TERRAIN_DEFS[TerrainType.OCEAN].yields };
      }
    }
  }

  inBounds(q: number, r: number): boolean {
    return q >= 0 && q < this.width && r >= 0 && r < this.height;
  }

  isLand(q: number, r: number): boolean {
    if (!this.inBounds(q, r)) return false;
    const t = this.tiles[q][r];
    return t.terrain !== TerrainType.OCEAN && t.terrain !== TerrainType.COAST;
  }

  isWater(q: number, r: number): boolean {
    if (!this.inBounds(q, r)) return true;
    return TERRAIN_DEFS[this.tiles[q][r].terrain].isWater;
  }

  isImpassable(q: number, r: number): boolean {
    if (!this.inBounds(q, r)) return true;
    const t = this.tiles[q][r];
    if (TERRAIN_DEFS[t.terrain].impassable) return true;
    if (t.feature !== FeatureType.NONE && FEATURE_DEFS[t.feature].impassable) return true;
    return false;
  }

  getMovementCost(q: number, r: number): number {
    if (!this.inBounds(q, r)) return 99;
    const t = this.tiles[q][r];
    let cost = TERRAIN_DEFS[t.terrain].movementCost;
    if (t.feature !== FeatureType.NONE) {
      cost = Math.max(cost, FEATURE_DEFS[t.feature].movementCost);
    }
    if (t.isRiver) cost += 1;
    return cost;
  }

  getDefenseModifier(q: number, r: number): number {
    if (!this.inBounds(q, r)) return 0;
    const t = this.tiles[q][r];
    let mod = TERRAIN_DEFS[t.terrain].defense;
    if (t.feature !== FeatureType.NONE) {
      mod += FEATURE_DEFS[t.feature].defense;
    }
    if (t.isRiver) mod += 3;
    return mod;
  }

  getTile(q: number, r: number): TileData | null {
    if (!this.inBounds(q, r)) return null;
    return this.tiles[q][r];
  }

  canSettle(q: number, r: number): boolean {
    if (!this.inBounds(q, r)) return false;
    const tile = this.tiles[q][r];
    if (this.isWater(q, r)) return false;
    if (this.isImpassable(q, r)) return false;

    for (let sq = 0; sq < this.width; sq++) {
      for (let sr = 0; sr < this.height; sr++) {
        if (this.tiles[sq][sr].owner >= 0 && this.tiles[sq][sr].district === 'city_center') {
          if (hexDistance(q, r, sq, sr) < CITY_MIN_RANGE) return false;
        }
      }
    }
    return true;
  }

  revealTile(q: number, r: number, owner: number): void {
    if (!this.inBounds(q, r)) return;
    this.tiles[q][r].explored = true;
    this.tiles[q][r].visible = true;
  }

  updateVisibility(playerTiles: Map<number, {q: number, r: number, sight: number}[]>): void {
    for (let q = 0; q < this.width; q++) {
      for (let r = 0; r < this.height; r++) {
        this.tiles[q][r].visible = false;
      }
    }
    for (const [pid, units] of playerTiles) {
      for (const {q, r, sight} of units) {
        for (let dq = -sight; dq <= sight; dq++) {
          for (let dr = Math.max(-sight, -dq - sight); dr <= Math.min(sight, -dq + sight); dr++) {
            const nq = q + dq;
            const nr = r + dr;
            if (this.inBounds(nq, nr) && hexDistance(q, r, nq, nr) <= sight) {
              this.tiles[nq][nr].visible = true;
              this.tiles[nq][nr].explored = true;
            }
          }
        }
      }
    }
  }
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise(x: number, y: number, grid: number[][]): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const gx = grid.length;
  const gy = grid[0]?.length ?? 1;

  const v00 = grid[((ix % gx) + gx) % gx]?.[((iy % gy) + gy) % gy] ?? 0;
  const v10 = grid[((ix + 1) % gx)][((iy % gy) + gy) % gy] ?? 0;
  const v01 = grid[((ix % gx) + gx) % gx]?.[((iy + 1) % gy)] ?? 0;
  const v11 = grid[((ix + 1) % gx)][((iy + 1) % gy)] ?? 0;

  const a = v00 + sx * (v10 - v00);
  const b = v01 + sx * (v11 - v01);
  return a + sy * (b - a);
}
