import { Game } from './engine/Game.ts';

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas not found');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(canvas);
game.start();

window.addEventListener('resize', () => {
  game.resize();
});

document.body.style.cursor = 'crosshair';
