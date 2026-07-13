import { useEffect, useRef } from 'react';
import { useMapStore } from '../../store';
import styles from './Toolbar.module.css';

const MINIMAP_SIZE = 200;

const COLORS: Record<string, string> = {
  empty: '#1a1a2e',
  solid: '#555555',
  probabilistic: 'rgba(180,130,255,0.5)',
  teleport_in: '#00bcd4',
  teleport_out: '#0097a7',
  start: '#4caf50',
  end: '#f44336',
  chest: '#ffc107',
};

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cells = useMapStore((s) => s.cells);
  const width = useMapStore((s) => s.width);
  const height = useMapStore((s) => s.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_SIZE * dpr;
    canvas.height = MINIMAP_SIZE * dpr;
    canvas.style.width = `${MINIMAP_SIZE}px`;
    canvas.style.height = `${MINIMAP_SIZE}px`;
    ctx.scale(dpr, dpr);

    const scaleX = MINIMAP_SIZE / width;
    const scaleY = MINIMAP_SIZE / height;
    const cellW = Math.max(1, scaleX);
    const cellH = Math.max(1, scaleY);

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y]?.[x];
        if (!cell) continue;
        if (cell.type === 'empty') continue;
        ctx.fillStyle = COLORS[cell.type] || '#666';
        ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }, [cells, width, height]);

  return <canvas ref={canvasRef} className={styles.minimap} />;
}
