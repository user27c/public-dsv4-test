import { TILE_W, TILE_H, TILE_HALF_W, TILE_HALF_H, MAP_W, MAP_H, COUNTRY_COLORS } from '../constants.ts';
import { Entity, EntityManager } from '../entity/Entity.ts';
import { EntityKind, Owner, TileData, TileTerrain, CommandType } from '../types.ts';
import { Camera } from './Camera.ts';
import { Input } from './Input.ts';
import { isoToScreen } from '../utils.ts';
import { renderTile, renderShroud, renderExploredOverlay } from '../map/TileRender.ts';
import {
  drawTank, drawInfantry, drawBuilding, drawHarvester, drawAircraft,
  drawHealthBar, drawSelectionCircle, drawSelectionBox,
  drawExplosion, drawOreParticle,
  drawConstructionYard, drawPowerPlant, drawBarracks,
  drawRefinery, drawWarFactory, drawOreMine, drawAirField, drawDefenseStructure,
} from '../draw/Primitives.ts';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cam: Camera;
  private overlaysCanvas: HTMLCanvasElement;
  private overlaysCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, cam: Camera) {
    this.ctx = canvas.getContext('2d')!;
    this.cam = cam;
    this.overlaysCanvas = document.createElement('canvas');
    this.overlaysCanvas.width = canvas.width;
    this.overlaysCanvas.height = canvas.height;
    this.overlaysCtx = this.overlaysCanvas.getContext('2d')!;
  }

  render(
    tiles: TileData[][],
    entities: Entity[],
    entityMgr: EntityManager,
    input: Input,
    effects: Effect[],
  ): void {
    const ctx = this.ctx;
    const cam = this.cam;
    const ow = cam.width;
    const oh = cam.height;

    ctx.clearRect(0, 0, ow, oh);
    ctx.save();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ow, oh);

    const range = cam.getVisibleTileRange();
    const extra = 2;
    const sX = Math.max(0, range.start.x - extra);
    const sY = Math.max(0, range.start.y - extra);
    const eX = Math.min(MAP_W, range.end.x + extra);
    const eY = Math.min(MAP_H, range.end.y + extra);

    const allDrawables: Drawable[] = [];

    for (let y = sY; y < eY; y++) {
      for (let x = sX; x < eX; x++) {
        const tile = tiles[y]?.[x];
        if (!tile) continue;
        if (tile.shroudState < 1) continue;
        allDrawables.push({ type: 'tile', x, y, tile, depth: x + y });
      }
    }

    for (const entity of entities) {
      if (!entity.alive) continue;
      allDrawables.push({
        type: 'entity',
        x: entity.cellX,
        y: entity.cellY,
        entity,
        depth: entity.cellX + entity.cellY + entity.width + entity.height + 1,
      });
    }

    for (const effect of effects) {
      allDrawables.push({
        type: 'effect',
        x: effect.cellX,
        y: effect.cellY,
        effect,
        depth: effect.cellX + effect.cellY + 10,
      });
    }

    allDrawables.sort((a, b) => a.depth - b.depth);

    for (const d of allDrawables) {
      if (d.type === 'tile') {
        this.drawTileAt(d.x!, d.y!, d.tile!);
      } else if (d.type === 'entity') {
        this.drawEntity(d.entity!);
      } else if (d.type === 'effect') {
        this.drawEffectGlobal(d.effect!);
      }
    }

    renderShroud(ctx, tiles, cam, range);
    renderExploredOverlay(ctx, tiles, cam, range);

    this.drawSelectionBox(input);
    this.drawHUD();

    ctx.restore();
  }

  private drawTileAt(x: number, y: number, tile: TileData): void {
    renderTile(this.ctx, tile, x, y, this.cam);
  }

  private drawEntity(entity: Entity): void {
    const screen = this.cam.worldToScreen({ x: entity.x, y: entity.y });
    const sx = screen.x;
    const sy = screen.y;

    if (sx < -100 || sx > this.cam.width + 100 || sy < -100 || sy > this.cam.height + 100) return;

    const faction = entity.owner === Owner.Allies ? 'allies' : entity.owner === Owner.Soviets ? 'soviet' : 'neutral';
    const primary = COUNTRY_COLORS[faction === 'allies' ? 0 : 5] || '#ffffff';
    const secondary = faction === 'allies' ? '#ffffff' : '#ffcc00';

    drawSelectionCircle(this.ctx, sx, sy, 20);
    drawHealthBar(this.ctx, sx, sy, 30, entity.hp, entity.maxHp);

    const size = 20;

    switch (entity.kind) {
      case EntityKind.Infantry:
        drawInfantry(this.ctx, sx, sy, size, primary, secondary, entity.facing);
        break;
      case EntityKind.Vehicle:
        if (entity.typeId === 'harv') {
          drawHarvester(this.ctx, sx, sy, size, primary, '#888888', entity.facing);
        } else {
          drawTank(this.ctx, sx, sy, size, primary, secondary, entity.facing);
        }
        break;
      case EntityKind.Aircraft:
        drawAircraft(this.ctx, sx, sy, size, primary, secondary, entity.facing, true);
        break;
      case EntityKind.Naval:
        drawTank(this.ctx, sx, sy, size * 1.5, primary, secondary, entity.facing);
        break;
      case EntityKind.Building:
        this.drawBuildingEntity(entity, sx, sy, size, primary, secondary);
        break;
    }
  }

  private drawBuildingEntity(
    entity: Entity, sx: number, sy: number, size: number, primary: string, secondary: string,
  ): void {
    switch (entity.typeId) {
      case 'gacnst':
        drawConstructionYard(this.ctx, sx, sy, size * 1.2, primary, secondary, 0);
        break;
      case 'gapowr':
      case 'napowr':
        drawPowerPlant(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'gabar':
      case 'nahand':
        drawBarracks(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'garef':
      case 'naref':
        drawRefinery(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'gaweap':
      case 'naweap':
        drawWarFactory(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'gaore':
      case 'namine':
        drawOreMine(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'gaairc':
      case 'naairc':
        drawAirField(this.ctx, sx, sy, size, primary, secondary);
        break;
      case 'gapill':
      case 'napill':
      case 'gatsla':
      case 'natesl':
      case 'gagap':
      case 'naflak':
        drawDefenseStructure(this.ctx, sx, sy, size, primary, secondary);
        break;
      default:
        drawBuilding(this.ctx, sx, sy, size * 2, size * 1.5, primary, secondary, entity.owner);
        break;
    }
  }

  private drawSelectionBox(input: Input): void {
    if (input.state.mouse.dragging && input.state.mouse.leftDown) {
      drawSelectionBox(
        this.ctx,
        input.state.mouse.dragStartX,
        input.state.mouse.dragStartY,
        input.state.mouse.dragEndX,
        input.state.mouse.dragEndY,
      );
    }
  }

  private drawHUD(): void {
    const ctx = this.ctx;
    const w = this.cam.width;

    // bottom bar background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, this.cam.height - 60, w, 60);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, this.cam.height - 60, w, 60);

    // top bar for credits & power
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, 30);
  }

  private drawEffectGlobal(effect: Effect): void {
    const screen = this.cam.worldToScreen({ x: effect.x, y: effect.y });
    const sx = screen.x;
    const sy = screen.y;

    if (sx < -50 || sx > this.cam.width + 50 || sy < -50 || sy > this.cam.height + 50) return;

    if (effect.type === 'explosion') {
      drawExplosion(this.ctx, sx, sy, effect.size * this.cam.zoom, effect.life / effect.maxLife);
    } else if (effect.type === 'ore') {
      drawOreParticle(this.ctx, sx, sy, effect.size * this.cam.zoom, effect.isGem ?? false);
    }
  }
}

export interface Effect {
  type: string;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
  size: number;
  life: number;
  maxLife: number;
  isGem?: boolean;
}

interface Drawable {
  type: 'tile' | 'entity' | 'effect';
  x?: number;
  y?: number;
  tile?: TileData;
  entity?: Entity;
  effect?: Effect;
  depth: number;
}
