import { useEditorStore, useMapStore } from '../../store';
import { useSimulationStore } from '../../store/simulationStore';
import { EditorTool } from '../../types';
import Minimap from './Minimap';
import styles from './Toolbar.module.css';

interface ToolDef {
  tool: EditorTool;
  label: string;
}

const TOOLS: ToolDef[] = [
  { tool: 'solid_wall', label: '🧱 实体墙' },
  { tool: 'prob_wall', label: '🎲 概率墙' },
  { tool: 'teleport_wall', label: '🌀 传送墙' },
  { tool: 'eraser', label: '🧹 橡皮擦' },
  { tool: 'start_point', label: '🟢 起点 (S)' },
  { tool: 'end_point', label: '🔴 终点 (E)' },
];

export default function Toolbar() {
  const tool = useEditorStore((s) => s.tool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const teleportDir = useEditorStore((s) => s.teleportDir);
  const pendingTeleportIn = useEditorStore((s) => s.pendingTeleportIn);
  const setTool = useEditorStore((s) => s.setTool);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setTeleportDir = useEditorStore((s) => s.setTeleportDir);
  const pushUndo = useMapStore((s) => s.pushUndo);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const findEmptyPositions = useMapStore((s) => s.findEmptyPositions);
  const setCell = useMapStore((s) => s.setCell);
  const resetView = useEditorStore((s) => s.resetView);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const status = useSimulationStore((s) => s.status);

  const handleSpawnChests = () => {
    pushUndo();
    const empties = findEmptyPositions();
    const count = Math.min(20, Math.max(15, Math.floor(empties.length * 0.05)));
    const shuffled = empties.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      setCell(shuffled[i].x, shuffled[i].y, { type: 'chest' });
    }
  };

  const isEditing = status === 'idle';

  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>笔刷工具</div>
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            className={`${styles.toolBtn} ${tool === t.tool ? styles.toolBtnActive : ''}`}
            onClick={() => setTool(t.tool)}
            disabled={!isEditing}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tool === 'teleport_wall' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>传送墙设置</div>
          <select
            className={styles.select}
            value={teleportDir}
            onChange={(e) => setTeleportDir(e.target.value as 'one_way' | 'two_way')}
          >
            <option value="two_way">双向传送</option>
            <option value="one_way">单向传送</option>
          </select>
          {pendingTeleportIn && (
            <div style={{ fontSize: 11, color: '#e94560', marginTop: 4 }}>
              入口已设置: ({pendingTeleportIn.x}, {pendingTeleportIn.y})
              <br />
              请点击出口位置
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>笔刷大小</div>
        <div className={styles.label}>
          <span>大小</span>
          <span>{brushSize}</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={1}
          max={10}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>编辑</div>
        <button className={styles.actionBtn} onClick={undo} disabled={!isEditing}>
          ↩ 撤销 (Ctrl+Z)
        </button>
        <button className={styles.actionBtn} onClick={redo} disabled={!isEditing}>
          ↪ 重做 (Ctrl+Y)
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>视图</div>
        <button className={styles.actionBtn} onClick={zoomIn}>
          🔍 放大
        </button>
        <button className={styles.actionBtn} onClick={zoomOut}>
          🔎 缩小
        </button>
        <button className={styles.actionBtn} onClick={resetView}>
          🎯 重置视图
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>道具</div>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleSpawnChests}
          disabled={!isEditing}
        >
          📦 生成宝箱 (15-20)
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>缩略图</div>
        <Minimap />
      </div>
    </div>
  );
}
