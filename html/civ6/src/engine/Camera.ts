import { CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX, CAMERA_PAN_SPEED, CAMERA_EDGE_SCROLL_SPEED, CAMERA_EDGE_SCROLL_MARGIN, HEX_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { axialToPixel } from '../hex/HexGrid';

export class Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.zoom = 0.7;
    this.targetZoom = 0.7;

    const [mx, my] = axialToPixel(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    this.x = canvasWidth / 2 - mx * this.zoom;
    this.y = canvasHeight / 2 - my * this.zoom;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  resize(w: number, h: number): void {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  update(dt: number): void {
    this.x += (this.targetX - this.x) * Math.min(1, dt * 6);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 6);
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 8);
    this.zoom = Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, this.zoom));
  }

  pan(dx: number, dy: number): void {
    this.targetX += dx;
    this.targetY += dy;
  }

  zoomAt(screenX: number, screenY: number, delta: number): void {
    const worldX = (screenX - this.x) / this.zoom;
    const worldY = (screenY - this.y) / this.zoom;

    this.targetZoom *= 1 - delta * 0.001;
    this.targetZoom = Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, this.targetZoom));

    this.targetX = screenX - worldX * this.targetZoom;
    this.targetY = screenY - worldY * this.targetZoom;
  }

  centerOn(px: number, py: number): void {
    this.targetX = this.canvasWidth / 2 - px * this.targetZoom;
    this.targetY = this.canvasHeight / 2 - py * this.targetZoom;
  }

  edgeScroll(mouseX: number, mouseY: number, dt: number): void {
    const speed = CAMERA_EDGE_SCROLL_SPEED * dt;
    if (mouseX < CAMERA_EDGE_SCROLL_MARGIN) this.targetX += speed;
    if (mouseX > this.canvasWidth - CAMERA_EDGE_SCROLL_MARGIN) this.targetX -= speed;
    if (mouseY < CAMERA_EDGE_SCROLL_MARGIN) this.targetY += speed;
    if (mouseY > this.canvasHeight - CAMERA_EDGE_SCROLL_MARGIN) this.targetY -= speed;
  }

  screenToWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.x) / this.zoom, (sy - this.y) / this.zoom];
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    return [wx * this.zoom + this.x, wy * this.zoom + this.y];
  }

  getScreenTransform(): { x: number; y: number; zoom: number } {
    return { x: this.x, y: this.y, zoom: this.zoom };
  }
}
