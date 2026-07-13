import { Game } from './engine/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
  resize();
  if (game) game.camera.resize(canvas.width, canvas.height);
});

resize();

const game = new Game(canvas);
(window as any).game = game;
game.start();
