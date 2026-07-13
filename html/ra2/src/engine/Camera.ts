import {
  GAME_WIDTH, GAME_HEIGHT, TILE_W, TILE_H, TILE_HALF_W, TILE_HALF_H,
  MAP_W, MAP_H, CAMERA_SPEED, CAMERA_EDGE_SCROLL, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX,
} from '../constants.ts';
import { IsoPoint, ScreenPoint } from '../types.ts';
import { isoToScreen, screenToIso, clamp } from '../utils.ts';

export class Camera {
  x = 0;
  y = 0;
  zoom = 1.0;
  targetZoom = 1.0;
  width = GAME_WIDTH;
  height = GAME_HEIGHT;

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  update(dt: number): void {
    this.zoom += (this.targetZoom - this.zoom) * Math.min(dt * 8, 1);
  }

  pan(dx: number, dy: number): void {
    this.x += dx / this.zoom;
    this.y += dy / this.zoom;
    this.clamp();
  }

  centerOn(iso: IsoPoint): void {
    const screen = isoToScreen(iso);
    this.x = screen.x - this.width / 2 / this.zoom;
    this.y = screen.y - this.height / 2 / this.zoom;
    this.clamp();
  }

  setZoom(z: number): void {
    this.targetZoom = clamp(z, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX);
  }

  zoomAt(mx: number, my: number, delta: number): void {
    const oldZoom = this.targetZoom;
    this.targetZoom = clamp(this.targetZoom + delta, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX);
    const ratio = this.targetZoom / oldZoom;
    this.x = mx - (mx - this.x) * ratio;
    this.y = my - (my - this.y) * ratio;
    this.clamp();
  }

  screenToWorld(sx: number, sy: number): IsoPoint {
    const wx = this.x + sx / this.zoom;
    const wy = this.y + sy / this.zoom;
    return screenToIso({ x: wx, y: wy });
  }

  worldToScreen(iso: IsoPoint): ScreenPoint {
    const screen = isoToScreen(iso);
    return {
      x: (screen.x - this.x) * this.zoom,
      y: (screen.y - this.y) * this.zoom,
    };
  }

  getVisibleTileRange(): { start: IsoPoint; end: IsoPoint } {
    const tl = screenToIso({
      x: this.x - TILE_W,
      y: this.y - TILE_H,
    });
    const br = screenToIso({
      x: this.x + this.width / this.zoom + TILE_W,
      y: this.y + this.height / this.zoom + TILE_H,
    });
    return {
      start: { x: Math.max(0, Math.floor(tl.x)), y: Math.max(0, Math.floor(tl.y)) },
      end: { x: Math.min(MAP_W, Math.ceil(br.x) + 1), y: Math.min(MAP_H, Math.ceil(br.y) + 1) },
    };
  }

  private clamp(): void {
    const minX = -TILE_HALF_W * MAP_W - 100;
    const minY = -TILE_HALF_H * MAP_W - 100;
    const maxX = TILE_HALF_W * MAP_H + 100;
    const maxY = TILE_HALF_H * MAP_H + 100;
    this.x = clamp(this.x, minX, maxX);
    this.y = clamp(this.y, minY, maxY);
  }
}
