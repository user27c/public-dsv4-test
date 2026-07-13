export class Input {
  mouseX: number = 0;
  mouseY: number = 0;
  worldX: number = 0;
  worldY: number = 0;
  hoveredQ: number = -1;
  hoveredR: number = -1;
  isMouseDown: boolean = false;
  isRightDown: boolean = false;
  isDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragStartCamX: number = 0;
  dragStartCamY: number = 0;
  keys: Set<string> = new Set();

  onClickHandlers: ((q: number, r: number, button: number) => void)[] = [];
  onRightClickHandlers: ((q: number, r: number) => void)[] = [];
  onEndTurnHandlers: (() => void)[] = [];
  onKeyHandlers: ((key: string) => void)[] = [];

  private canvas: HTMLCanvasElement;
  private screenToWorld: (sx: number, sy: number) => [number, number];
  private pixelToAxial: (px: number, py: number) => [number, number];
  private onCameraPan: (dx: number, dy: number) => void;
  private onCameraZoom: (sx: number, sy: number, delta: number) => void;
  private onEdgeScroll: (mx: number, my: number, dt: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    screenToWorld: (sx: number, sy: number) => [number, number],
    pixelToAxial: (px: number, py: number) => [number, number],
    onCameraPan: (dx: number, dy: number) => void,
    onCameraZoom: (sx: number, sy: number, delta: number) => void,
    onEdgeScroll: (mx: number, my: number, dt: number) => void,
  ) {
    this.canvas = canvas;
    this.screenToWorld = screenToWorld;
    this.pixelToAxial = pixelToAxial;
    this.onCameraPan = onCameraPan;
    this.onCameraZoom = onCameraZoom;
    this.onEdgeScroll = onEdgeScroll;

    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('wheel', this.onWheel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    const [wx, wy] = this.screenToWorld(this.mouseX, this.mouseY);
    this.worldX = wx;
    this.worldY = wy;
    const [q, r] = this.pixelToAxial(wx, wy);
    this.hoveredQ = q;
    this.hoveredR = r;

    if (this.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.onCameraPan(dx * 0.8, dy * 0.8);
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 1) {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      return;
    }
    this.isMouseDown = e.button === 0;
    this.isRightDown = e.button === 2;
    if (e.button === 2) {
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 1) {
      this.isDragging = false;
      return;
    }
    if (this.isDragging) {
      this.isDragging = false;
      this.isRightDown = false;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const [wx, wy] = this.screenToWorld(mx, my);
    const [q, r] = this.pixelToAxial(wx, wy);

    if (e.button === 0) {
      for (const handler of this.onClickHandlers) {
        handler(q, r, 0);
      }
    } else if (e.button === 2) {
      for (const handler of this.onRightClickHandlers) {
        handler(q, r);
      }
    }

    this.isMouseDown = false;
    this.isRightDown = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.onCameraZoom(sx, sy, e.deltaY);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());

    if (e.key === 'Enter') {
      for (const handler of this.onEndTurnHandlers) {
        handler();
      }
      return;
    }

    for (const handler of this.onKeyHandlers) {
      handler(e.key.toLowerCase());
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  update(dt: number): void {
    this.onEdgeScroll(this.mouseX, this.mouseY, dt);

    const panSpeed = 600 * dt;
    if (this.keys.has('w') || this.keys.has('arrowup')) this.onCameraPan(0, panSpeed);
    if (this.keys.has('s') || this.keys.has('arrowdown')) this.onCameraPan(0, -panSpeed);
    if (this.keys.has('a') || this.keys.has('arrowleft')) this.onCameraPan(panSpeed, 0);
    if (this.keys.has('d') || this.keys.has('arrowright')) this.onCameraPan(-panSpeed, 0);
  }

  destroy(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
