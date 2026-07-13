import { useEffect, useRef, useCallback, useState, MutableRefObject } from 'react';
import { useMapStore, useEditorStore, useSimulationStore } from '../../store';
import { CellType, posKey, CellData } from '../../types';
import { renderGrid, renderProbWallOverlay } from '../../renderer/gridCanvas';
import { SimulationRunner } from '../../engine/simulation';
import styles from './MapCanvas.module.css';

const CELL_SIZE = 4;

function getCellAtMouse(
  mx: number,
  my: number,
  zoom: number,
  panX: number,
  panY: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } | null {
  const worldX = (mx - canvasWidth / 2 - panX) / zoom;
  const worldY = (my - canvasHeight / 2 - panY) / zoom;
  const cellX = Math.floor(worldX / CELL_SIZE);
  const cellY = Math.floor(worldY / CELL_SIZE);
  if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) return null;
  return { x: cellX, y: cellY };
}

interface MapCanvasProps {
  runnerRef: MutableRefObject<SimulationRunner | null>;
}

export default function MapCanvas({ runnerRef }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const drawInterval = useRef(0);

  const cells = useMapStore((s) => s.cells);
  const mapW = useMapStore((s) => s.width);
  const mapH = useMapStore((s) => s.height);
  const start = useMapStore((s) => s.start);
  const end = useMapStore((s) => s.end);
  const teleports = useMapStore((s) => s.teleports);
  const setCell = useMapStore((s) => s.setCell);
  const setStart = useMapStore((s) => s.setStart);
  const setEnd = useMapStore((s) => s.setEnd);
  const addTeleportLink = useMapStore((s) => s.addTeleportLink);
  const setCells = useMapStore((s) => s.setCells);
  const pushUndo = useMapStore((s) => s.pushUndo);
  const getCell = useMapStore((s) => s.getCell);

  const tool = useEditorStore((s) => s.tool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const teleportDir = useEditorStore((s) => s.teleportDir);
  const pendingTeleportIn = useEditorStore((s) => s.pendingTeleportIn);
  const setPendingTeleportIn = useEditorStore((s) => s.setPendingTeleportIn);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const setPan = useEditorStore((s) => s.setPan);
  const setZoom = useEditorStore((s) => s.setZoom);

  const status = useSimulationStore((s) => s.status);
  const currentStep = useSimulationStore((s) => s.currentStep);
  const elapsed = useSimulationStore((s) => s.elapsed);
  const showBaselinePath = useSimulationStore((s) => s.showBaselinePath);

  const isEditing = status === 'idle';

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: width, h: height });
      }
    });
    obs.observe(wrapper);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    renderGrid(ctx, cells, mapW, mapH, start, end, teleports, zoom, panX, panY, canvasSize.w, canvasSize.h, CELL_SIZE);

    if (status === 'running' || status === 'paused') {
      const runner = runnerRef.current;
      if (runner) {
        const probStates = runner.getProbStates();
        renderProbWallOverlay(ctx, probStates, cells, mapW, mapH, zoom, panX, panY, canvasSize.w, canvasSize.h, CELL_SIZE);
      }
    }

    ctx.restore();
  }, [cells, mapW, mapH, start, end, teleports, zoom, panX, panY, canvasSize, status, runnerRef]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (status === 'running') {
      const loop = () => {
        draw();
        drawInterval.current = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(drawInterval.current);
    }
  }, [status, draw]);

  const [hoverCoord, setHoverCoord] = useState('');

  const coordStr = useCallback(
    (x: number, y: number) => {
      const cell = getCell(x, y);
      const type = cell?.type ?? 'out of bounds';
      return `(${x}, ${y}) [${type}]`;
    },
    [getCell]
  );

  const applyTool = useCallback(
    (cellX: number, cellY: number, isInitial: boolean) => {
      if (!isEditing) return;
      const rx = cellX;
      const ry = cellY;

      if (tool === 'start_point') {
        setStart({ x: rx, y: ry });
        return;
      }
      if (tool === 'end_point') {
        setEnd({ x: rx, y: ry });
        return;
      }
      if (tool === 'teleport_wall') {
        if (!pendingTeleportIn) {
          setPendingTeleportIn({ x: rx, y: ry });
          return;
        }
        pushUndo();
        addTeleportLink(pendingTeleportIn, { x: rx, y: ry }, teleportDir);
        setPendingTeleportIn(null);
        return;
      }

      const half = Math.floor(brushSize / 2);
      const updates: { x: number; y: number; cell: CellData }[] = [];
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = rx + dx;
          const ny = ry + dy;
          const existing = getCell(nx, ny);
          if (!existing) continue;
          if (existing.type === 'start' || existing.type === 'end') continue;
          let cell: CellData;
          switch (tool) {
            case 'solid_wall':
              cell = { type: 'solid' };
              break;
            case 'prob_wall':
              cell = { type: 'probabilistic' };
              break;
            case 'eraser':
              cell = { type: 'empty' };
              break;
            default:
              cell = { type: 'empty' };
          }
          updates.push({ x: nx, y: ny, cell });
        }
      }
      setCells(updates);
    },
    [
      tool,
      brushSize,
      isEditing,
      pendingTeleportIn,
      teleportDir,
      setStart,
      setEnd,
      setCells,
      getCell,
      pushUndo,
      addTeleportLink,
      setPendingTeleportIn,
    ]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      const pos = getCellAtMouse(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
        zoom,
        panX,
        panY,
        mapW,
        mapH,
        canvasSize.w,
        canvasSize.h
      );
      if (!pos) return;
      isDrawing.current = true;
      if (tool !== 'teleport_wall') pushUndo();
      applyTool(pos.x, pos.y, true);
    },
    [zoom, panX, panY, mapW, mapH, canvasSize, tool, applyTool, pushUndo]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        setPan(panX + dx, panY + dy);
        lastPan.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const pos = getCellAtMouse(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
        zoom,
        panX,
        panY,
        mapW,
        mapH,
        canvasSize.w,
        canvasSize.h
      );
      if (pos) {
        setHoverCoord(coordStr(pos.x, pos.y));
      } else {
        setHoverCoord('');
      }

      if (isDrawing.current && pos) {
        applyTool(pos.x, pos.y, false);
      }
    },
    [zoom, panX, panY, mapW, mapH, canvasSize, applyTool, setPan, coordStr]
  );

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom * factor));
      const newPanX = mx - (mx - panX - canvasSize.w / 2) * (newZoom / zoom) - canvasSize.w / 2;
      const newPanY = my - (my - panY - canvasSize.h / 2) * (newZoom / zoom) - canvasSize.h / 2;
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    },
    [zoom, panX, panY, canvasSize, setZoom, setPan]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          useMapStore.getState().redo();
        } else {
          useMapStore.getState().undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        useMapStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        className={styles.wrapper}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          地图: <span className={styles.statusValue}>{mapW}×{mapH}</span>
        </div>
        <div className={styles.statusItem}>
          缩放: <span className={styles.statusValue}>{(zoom * 100).toFixed(0)}%</span>
        </div>
        <div className={styles.statusItem}>
          坐标: <span className={styles.statusValue}>{hoverCoord || '-'}</span>
        </div>
        <div className={styles.statusItem}>
          工具: <span className={styles.statusValue}>{tool}</span>
        </div>
        {status === 'running' && (
          <>
            <div className={styles.statusItem}>
              步数: <span className={styles.statusValue}>{currentStep}</span>
            </div>
            <div className={styles.statusItem}>
              耗时: <span className={styles.statusValue}>{(elapsed / 1000).toFixed(1)}s</span>
            </div>
          </>
        )}
        {!start && status === 'idle' && (
          <span className={styles.noStartEnd}>请设置起点(S)</span>
        )}
        {!end && status === 'idle' && (
          <span className={styles.noStartEnd}>请设置终点(E)</span>
        )}
      </div>
    </>
  );
}
