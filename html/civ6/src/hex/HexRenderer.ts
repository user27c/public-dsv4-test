import type { TileData, UnitData, CityData } from '../types';
import { TerrainType, FeatureType, ResourceType, ResourceCategory, DistrictType } from '../types';
import { HexMap } from './HexMap';
import {
  HEX_SIZE,
  TERRAIN_COLORS,
  TERRAIN_COLORS_LIGHT,
  MOUNTAIN_COLOR,
  MOUNTAIN_PEAK_COLOR,
  FOREST_COLOR,
  RAINFOREST_COLOR,
  MARSH_COLOR,
  RIVER_COLOR,
  FOG_COLOR,
  EXPLORED_FOG_COLOR,
  GRID_COLOR,
  SELECTED_COLOR,
  HOVER_COLOR,
  MOVE_RANGE_COLOR,
  ATTACK_RANGE_COLOR,
  CITY_BANNER_BG,
  CITY_BANNER_TEXT,
  FEATURE_DEFS,
  RESOURCE_DEFS,
  PLAYER_COLORS,
} from '../constants';
import { getHexCorners, axialToPixel } from './HexGrid';

export class HexRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;

  constructor(ctx: CanvasRenderingContext2D, hexSize: number = HEX_SIZE) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  drawTile(
    tile: TileData,
    camX: number,
    camY: number,
    zoom: number,
    selected: boolean = false,
    hovered: boolean = false,
    inMoveRange: boolean = false,
    inAttackRange: boolean = false,
  ): void {
    const [px, py] = axialToPixel(tile.q, tile.r);
    const sx = px * zoom + camX;
    const sy = py * zoom + camY;
    const hs = this.hexSize * zoom;
    const corners = getHexCorners(sx, sy, hs);
    const ctx = this.ctx;

    if (!tile.visible && !tile.explored) return;

    const isWater = tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.COAST;
    const baseColor = TERRAIN_COLORS[tile.terrain];
    const lightColor = TERRAIN_COLORS_LIGHT[tile.terrain];
    const isMountain = tile.feature === FeatureType.MOUNTAINS;
    const isHills = tile.feature === FeatureType.HILLS;
    const isForest = tile.feature === FeatureType.FOREST;
    const isRainforest = tile.feature === FeatureType.RAINFOREST;
    const isMarsh = tile.feature === FeatureType.MARSH;

    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(corners[i][0], corners[i][1]);
    }
    ctx.closePath();

    if (isMountain) {
      const grad = ctx.createLinearGradient(sx - hs * 0.5, sy - hs * 0.5, sx + hs * 0.5, sy + hs * 0.5);
      grad.addColorStop(0, '#A09578');
      grad.addColorStop(0.5, MOUNTAIN_COLOR);
      grad.addColorStop(1, '#6B6152');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(
        sx - hs * 0.3,
        sy - hs * 0.5,
        sx + hs * 0.3,
        sy + hs * 0.5,
      );
      grad.addColorStop(0, lightColor);
      grad.addColorStop(0.5, baseColor);
      grad.addColorStop(1, darken(baseColor, 0.2));
      ctx.fillStyle = grad;
    }
    ctx.fill();

    if (tile.visible) {
      if (isMountain) {
        this.drawMountainFeature(sx, sy, hs, tile.isRiver);
      } else if (isHills) {
        this.drawHillsFeature(sx, sy, hs);
      } else if (isForest) {
        this.drawForestFeature(sx, sy, hs, false);
      } else if (isRainforest) {
        this.drawForestFeature(sx, sy, hs, true);
      } else if (isMarsh) {
        this.drawMarshFeature(sx, sy, hs);
      }

      if (tile.isRiver && !isMountain) {
        this.drawRiverEdges(ctx, sx, sy, hs, tile.riverEdges);
      }

      if (tile.resource !== ResourceType.NONE && !isMountain && !isForest && !isRainforest && !isMarsh) {
        this.drawResourceIcon(sx, sy, hs, tile.resource);
      }

      if (tile.improvement) {
        this.drawImprovement(sx, sy, hs, tile.improvement);
      }

      if (tile.owner >= 0) {
        if (tile.district) {
          this.drawDistrict(sx, sy, hs, tile.district, tile.owner);
        } else {
          this.drawBorder(sx, sy, hs, tile.owner);
        }
      }
    }

    this.drawGridCell(ctx, corners, hs);

    if (tile.visible) {
      if (selected) {
        this.drawHexOutline(ctx, corners, SELECTED_COLOR, Math.max(2, 3 * zoom));
      } else if (hovered) {
        this.drawHexOutline(ctx, corners, HOVER_COLOR, Math.max(1.5, 2.5 * zoom));
      }
      if (inMoveRange) {
        this.drawHexFill(ctx, corners, MOVE_RANGE_COLOR);
      }
      if (inAttackRange) {
        this.drawHexFill(ctx, corners, ATTACK_RANGE_COLOR);
      }
    }

    if (!tile.visible) {
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
      ctx.closePath();
      ctx.fillStyle = EXPLORED_FOG_COLOR;
      ctx.fill();
    }

    if (tile.yields && tile.visible) {
    }
  }

  drawUnit(px: number, py: number, unit: UnitData, zoom: number, selected: boolean, ownerColor: string): void {
    const ctx = this.ctx;
    const hs = this.hexSize * zoom;
    const size = hs * 0.35;

    const radius = size * 0.8;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);

    if (unit.actionTaken) {
      ctx.fillStyle = darken(ownerColor, 0.4);
    } else if (selected) {
      ctx.fillStyle = ownerColor;
    } else if (unit.owner === 0) {
      ctx.fillStyle = ownerColor;
    } else {
      ctx.fillStyle = ownerColor;
    }

    ctx.fill();
    ctx.strokeStyle = selected ? '#FFFF00' : '#333';
    ctx.lineWidth = selected ? Math.max(2, 3 * zoom) : Math.max(1, 1.5 * zoom);
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = `${Math.max(8, 11 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbol = this.unitSymbol(unit.type);
    ctx.fillText(symbol, px, py);

    if (unit.health < unit.maxHealth) {
      const barWidth = hs * 0.6;
      const barHeight = Math.max(3, 4 * zoom);
      const barY = py - radius - Math.max(4, 6 * zoom);
      ctx.fillStyle = '#333';
      ctx.fillRect(px - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
      const ratio = unit.health / unit.maxHealth;
      ctx.fillStyle = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(px - barWidth / 2, barY, barWidth * ratio, barHeight);
    }

    if (unit.fortified) {
      ctx.strokeStyle = '#CCC';
      ctx.lineWidth = Math.max(1, 2 * zoom);
      const shieldSize = hs * 0.15;
      ctx.beginPath();
      ctx.arc(px + radius * 0.7, py - radius * 0.7, shieldSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawCityBanner(sx: number, sy: number, city: CityData, ownerColor: string, cityName: string, zoom: number): void {
    const ctx = this.ctx;
    const hs = this.hexSize * zoom;
    const bannerW = Math.max(60, hs * 1.6);
    const bannerH = Math.max(20, hs * 0.5);
    const bx = sx - bannerW / 2;
    const by = sy - hs * 0.7 - bannerH;

    ctx.fillStyle = CITY_BANNER_BG;
    ctx.strokeStyle = ownerColor;
    ctx.lineWidth = Math.max(1.5, 2 * zoom);

    roundRect(ctx, bx, by, bannerW, bannerH, Math.max(3, 4 * zoom));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CITY_BANNER_TEXT;
    const fontSize = Math.max(8, 11 * zoom);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cityName, sx, by + bannerH * 0.4);

    ctx.font = `${fontSize * 0.85}px sans-serif`;
    ctx.fillText(`🏠${city.population} ⚔${city.defense}`, sx, by + bannerH * 0.75);
  }

  drawCityOnTile(tile: TileData, city: CityData, ownerColor: string, zoom: number): void {
    const [cx, cy] = axialToPixel(tile.q, tile.r);
    const hs = this.hexSize * zoom;
    const ctx = this.ctx;

    ctx.fillStyle = ownerColor;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    const corners = getHexCorners(cx, cy, hs);
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    const buildingSize = hs * 0.14;
    const cxOff = hs * 0.2;

    const buildings = [
      { x: cx, y: cy - buildingSize * 1.2 },
      { x: cx - cxOff, y: cy - buildingSize * 0.3 },
      { x: cx + cxOff, y: cy - buildingSize * 0.3 },
      { x: cx, y: cy + buildingSize * 0.7 },
    ];

    for (const b of buildings) {
      ctx.fillStyle = '#D5C4A1';
      ctx.fillRect(b.x - buildingSize * 0.5, b.y - buildingSize, buildingSize, buildingSize * 1.5);
      ctx.fillStyle = '#B8A888';
      ctx.fillRect(b.x - buildingSize * 0.5, b.y - buildingSize, buildingSize, buildingSize * 0.3);
    }

    this.drawCityBanner(cx, cy, city, ownerColor, city.name, zoom);
  }

  private drawMountainFeature(cx: number, cy: number, hs: number, hasRiver: boolean): void {
    const ctx = this.ctx;
    const peakR = hs * 0.4;
    const peaks: [number, number][] = [
      [cx - hs * 0.2, cy - hs * 0.1],
      [cx + hs * 0.15, cy - hs * 0.2],
      [cx + hs * 0.05, cy + hs * 0.1],
    ];

    for (let i = 0; i < peaks.length; i++) {
      const [px, py] = peaks[i];
      const grad = ctx.createRadialGradient(px, py - peakR * 0.3, 0, px, py, peakR);
      grad.addColorStop(0, MOUNTAIN_PEAK_COLOR);
      grad.addColorStop(0.5, '#A09578');
      grad.addColorStop(1, MOUNTAIN_COLOR);

      ctx.beginPath();
      ctx.arc(px, py, peakR * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(cx - hs * 0.25, cy + hs * 0.25);
    ctx.lineTo(cx, cy - hs * 0.3);
    ctx.lineTo(cx + hs * 0.3, cy + hs * 0.2);
    ctx.fillStyle = '#7A7060';
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawHillsFeature(cx: number, cy: number, hs: number): void {
    const ctx = this.ctx;
    const bumps: [number, number, number][] = [
      [cx - hs * 0.15, cy + hs * 0.05, hs * 0.18],
      [cx + hs * 0.12, cy - hs * 0.08, hs * 0.15],
      [cx - hs * 0.05, cy + hs * 0.2, hs * 0.12],
    ];

    for (const [bx, by, br] of bumps) {
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx - br * 0.2, by - br * 0.2, br * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
    }
  }

  private drawForestFeature(cx: number, cy: number, hs: number, isRainforest: boolean): void {
    const ctx = this.ctx;
    const treeColor = isRainforest ? RAINFOREST_COLOR : FOREST_COLOR;
    const lightColor = isRainforest ? '#2D6B1A' : '#3D7A2A';
    const treeCount = isRainforest ? 8 : 6;

    ctx.fillStyle = treeColor;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    const corners = getHexCorners(cx, cy, hs * 0.9);
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (i % 3) * 0.3;
      const dist = hs * (0.15 + (i % 3) * 0.12);
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      const tr = hs * (isRainforest ? 0.12 : 0.1);

      ctx.beginPath();
      ctx.arc(tx, ty - tr * 0.1, tr, 0, Math.PI * 2);
      ctx.fillStyle = lightColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(tx + tr * 0.3, ty + tr * 0.1, tr * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = treeColor;
      ctx.fill();
    }
  }

  private drawMarshFeature(cx: number, cy: number, hs: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = MARSH_COLOR;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    const corners = getHexCorners(cx, cy, hs);
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const dist = hs * (0.2 + (i % 2) * 0.15);
      const rx = cx + Math.cos(angle) * dist;
      const ry = cy + Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.ellipse(rx, ry, hs * 0.06, hs * 0.03, angle, 0, Math.PI * 2);
      ctx.fillStyle = '#3A5530';
      ctx.fill();
    }
  }

  private drawRiverEdges(ctx: CanvasRenderingContext2D, cx: number, cy: number, hs: number, riverEdges: number[]): void {
    const corners = getHexCorners(cx, cy, hs);
    ctx.strokeStyle = RIVER_COLOR;
    ctx.lineWidth = Math.max(2, hs * 0.07);
    ctx.lineCap = 'round';

    for (const edge of riverEdges) {
      if (edge < 0 || edge > 5) continue;
      const nextIdx = (edge + 1) % 6;
      const midX = (corners[edge][0] + corners[nextIdx][0]) / 2;
      const midY = (corners[edge][1] + corners[nextIdx][1]) / 2;

      const dx = midX - cx;
      const dy = midY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = cx + dx * 0.7;
      const ny = cy + dy * 0.7;
      const mx = cx + dx * 1.1;
      const my = cy + dy * 1.1;

      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.quadraticCurveTo(midX, midY, mx, my);
      ctx.strokeStyle = RIVER_COLOR;
      ctx.stroke();
    }
  }

  private drawResourceIcon(cx: number, cy: number, hs: number, resource: ResourceType): void {
    const ctx = this.ctx;
    const def = RESOURCE_DEFS.find(r => r.type === resource);
    if (!def) return;

    const iconSize = hs * 0.2;
    const iconY = cy;

    ctx.font = `${iconSize * 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons: Partial<Record<ResourceType, string>> = {
      [ResourceType.WHEAT]: '🌾',
      [ResourceType.CATTLE]: '🐄',
      [ResourceType.RICE]: '🌱',
      [ResourceType.MAIZE]: '🌽',
      [ResourceType.STONE]: '🪨',
      [ResourceType.FISH]: '🐟',
      [ResourceType.BANANAS]: '🍌',
      [ResourceType.DEER]: '🦌',
      [ResourceType.HORSES]: '🐎',
      [ResourceType.IRON]: '🔩',
      [ResourceType.WINE]: '🍇',
      [ResourceType.SPICES]: '🌶️',
      [ResourceType.IVORY]: '🐘',
      [ResourceType.SILK]: '🧵',
      [ResourceType.SILVER]: '🥈',
      [ResourceType.FURS]: '🦊',
    };

    const icon = icons[resource];
    if (icon) {
      ctx.fillText(icon, cx, iconY);
    }
  }

  private drawImprovement(cx: number, cy: number, hs: number, improvement: string): void {
  }

  private drawDistrict(cx: number, cy: number, hs: number, district: string, owner: number): void {
  }

  private drawBorder(cx: number, cy: number, hs: number, owner: number): void {
    const ctx = this.ctx;
    const ownerColor = PLAYER_COLORS[owner] || '#FFF';
    ctx.strokeStyle = ownerColor;
    ctx.lineWidth = Math.max(1.5, hs * 0.04);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const corners = getHexCorners(cx, cy, hs);
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawGridCell(ctx: CanvasRenderingContext2D, corners: [number, number][], hs: number): void {
    if (hs < 20) return;
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = Math.max(0.5, hs * 0.02);
    ctx.stroke();
  }

  private drawHexOutline(ctx: CanvasRenderingContext2D, corners: [number, number][], color: string, width: number): void {
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  private drawHexFill(ctx: CanvasRenderingContext2D, corners: [number, number][], color: string): void {
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  private unitSymbol(type: string): string {
    const symbols: Record<string, string> = {
      settler: '🚩',
      builder: '🔨',
      scout: '👁',
      warrior: '⚔',
      slinger: '🏹',
      archer: '🏹',
      spearman: '🔱',
      swordsman: '🗡',
      horseman: '🐎',
      chariot: '🏛',
      catapult: '💣',
      galley: '⛵',
      trader: '📦',
    };
    return symbols[type] || '●';
  }
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const fr = Math.floor(r * (1 - amount));
  const fg = Math.floor(g * (1 - amount));
  const fb = Math.floor(b * (1 - amount));
  return `rgb(${fr},${fg},${fb})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
