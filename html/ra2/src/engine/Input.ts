import { GAME_WIDTH, GAME_HEIGHT } from '../constants.ts';

export interface MouseState {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  cellX: number;
  cellY: number;
  leftDown: boolean;
  rightDown: boolean;
  leftClicked: boolean;
  rightClicked: boolean;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragEndX: number;
  dragEndY: number;
  shift: boolean;
  ctrl: boolean;
}

export interface InputState {
  mouse: MouseState;
  keys: Set<string>;
  keysPressed: Set<string>;
}

export class Input {
  canvas: HTMLCanvasElement;
  state: InputState;
  private prevKeys: Set<string> = new Set();
  private scrollAccum = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.state = {
      mouse: {
        x: 0, y: 0, worldX: 0, worldY: 0, cellX: 0, cellY: 0,
        leftDown: false, rightDown: false,
        leftClicked: false, rightClicked: false,
        dragging: false, dragStartX: 0, dragStartY: 0,
        dragEndX: 0, dragEndY: 0,
        shift: false, ctrl: false,
      },
      keys: new Set(),
      keysPressed: new Set(),
    };

    this.setupListeners();
  }

  private setupListeners(): void {
    const c = this.canvas;

    c.addEventListener('mousemove', (e) => {
      const rect = c.getBoundingClientRect();
      this.state.mouse.x = e.clientX - rect.left;
      this.state.mouse.y = e.clientY - rect.top;
      if (this.state.mouse.leftDown) {
        this.state.mouse.dragging = true;
        this.state.mouse.dragEndX = this.state.mouse.x;
        this.state.mouse.dragEndY = this.state.mouse.y;
      }
    });

    c.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      this.state.mouse.x = e.clientX - rect.left;
      this.state.mouse.y = e.clientY - rect.top;

      if (e.button === 0) {
        this.state.mouse.leftDown = true;
        this.state.mouse.dragging = true;
        this.state.mouse.dragStartX = this.state.mouse.x;
        this.state.mouse.dragStartY = this.state.mouse.y;
        this.state.mouse.dragEndX = this.state.mouse.x;
        this.state.mouse.dragEndY = this.state.mouse.y;
      }
      if (e.button === 2) {
        this.state.mouse.rightDown = true;
      }
    });

    c.addEventListener('mouseup', (e) => {
      e.preventDefault();
      if (e.button === 0) {
        if (this.state.mouse.dragging &&
            Math.abs(this.state.mouse.x - this.state.mouse.dragStartX) < 5 &&
            Math.abs(this.state.mouse.y - this.state.mouse.dragStartY) < 5) {
          this.state.mouse.leftClicked = true;
        }
        this.state.mouse.leftDown = false;
        this.state.mouse.dragging = false;
      }
      if (e.button === 2) {
        this.state.mouse.rightClicked = true;
        this.state.mouse.rightDown = false;
      }
    });

    c.addEventListener('contextmenu', (e) => e.preventDefault());

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scrollAccum += -e.deltaY * 0.001;
    });

    document.addEventListener('keydown', (e) => {
      this.state.keys.add(e.key.toLowerCase());
      if (!this.prevKeys.has(e.key.toLowerCase())) {
        this.state.keysPressed.add(e.key.toLowerCase());
      }
      this.state.mouse.shift = e.shiftKey;
      this.state.mouse.ctrl = e.ctrlKey;
    });

    document.addEventListener('keyup', (e) => {
      this.state.keys.delete(e.key.toLowerCase());
      this.state.mouse.shift = e.shiftKey;
      this.state.mouse.ctrl = e.ctrlKey;
    });

    c.addEventListener('mouseleave', () => {
      this.state.mouse.leftDown = false;
      this.state.mouse.rightDown = false;
      this.state.mouse.dragging = false;
    });
  }

  getScrollDelta(): number {
    const d = this.scrollAccum;
    this.scrollAccum = 0;
    return d;
  }

  clearFrame(): void {
    this.state.mouse.leftClicked = false;
    this.state.mouse.rightClicked = false;
    this.state.keysPressed.clear();
    this.prevKeys = new Set(this.state.keys);
  }
}
