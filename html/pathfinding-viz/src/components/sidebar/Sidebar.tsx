import { useSimulationStore, useMapStore } from '../../store';
import { AlgorithmDef } from '../../types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onNewAlgo: () => void;
  onEditAlgo: (algo: AlgorithmDef) => void;
}

export default function Sidebar({ onStart, onPause, onStop, onNewAlgo, onEditAlgo }: SidebarProps) {
  const status = useSimulationStore((s) => s.status);
  const algorithms = useSimulationStore((s) => s.algorithms);
  const results = useSimulationStore((s) => s.results);
  const logs = useSimulationStore((s) => s.logs);
  const currentStep = useSimulationStore((s) => s.currentStep);
  const elapsed = useSimulationStore((s) => s.elapsed);
  const timeLimit = useSimulationStore((s) => s.timeLimit);
  const showBaselinePath = useSimulationStore((s) => s.showBaselinePath);
  const removeAlgorithm = useSimulationStore((s) => s.removeAlgorithm);
  const setTimeLimit = useSimulationStore((s) => s.setTimeLimit);
  const setShowBaselinePath = useSimulationStore((s) => s.setShowBaselinePath);
  const clearLogs = useSimulationStore((s) => s.clearLogs);
  const setAlgorithms = useSimulationStore((s) => s.setAlgorithms);

  const start = useMapStore((s) => s.start);
  const end = useMapStore((s) => s.end);
  const teleports = useMapStore((s) => s.teleports);
  const removeTeleportLink = useMapStore((s) => s.removeTeleportLink);

  const canRun = status === 'idle' && algorithms.length > 0 && start && end;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.ts,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const code = reader.result as string;
        const name = file.name.replace(/\.[^/.]+$/, '');
        const algo: AlgorithmDef = {
          id: `user_${Date.now()}`,
          name,
          code,
          isBaseline: false,
        };
        setAlgorithms([...algorithms, algo]);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportMap = () => {
    const state = useMapStore.getState();
    const data = {
      width: state.width,
      height: state.height,
      cells: state.cells,
      start: state.start,
      end: state.end,
      teleports: state.teleports,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportMap = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const store = useMapStore.getState();
          store.resize(data.width, data.height);
          store.setCells(
            data.cells
              .flatMap((row: any[], y: number) =>
                row.map((cell: any, x: number) => ({ x, y, cell }))
              )
          );
          if (data.start) store.setStart(data.start);
          if (data.end) store.setEnd(data.end);
        } catch {
          alert('无效的地图文件');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleNewMap = () => {
    const w = prompt('地图宽度 (10-1000):', '200');
    const h = prompt('地图高度 (10-1000):', '200');
    if (!w || !h) return;
    const nw = Math.max(10, Math.min(1000, parseInt(w) || 200));
    const nh = Math.max(10, Math.min(1000, parseInt(h) || 200));
    useMapStore.getState().pushUndo();
    useMapStore.getState().resize(nw, nh);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>地图操作</div>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleNewMap}>
          🗺 新建地图
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleExportMap}>
          📥 导出地图
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleImportMap}>
          📤 导入地图
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>算法管理</div>
        {algorithms.map((algo) => (
          <div key={algo.id} className={styles.algoItem}>
            <span className={styles.algoName} title={algo.name}>
              {algo.isBaseline ? '📌' : '✏️'} {algo.name}
            </span>
            <div className={styles.algoActions}>
              <button className={styles.btnSm} onClick={() => onEditAlgo(algo)} title="查看/编辑">
                📝
              </button>
              {!algo.isBaseline && (
                <button
                  className={`${styles.btnSm} ${styles.btnSmDanger}`}
                  onClick={() => removeAlgorithm(algo.id)}
                  title="删除"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onNewAlgo}>
          ➕ 新建算法
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleImport}>
          📂 导入算法文件
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>传送墙 ({teleports.length})</div>
        <div style={{ maxHeight: 80, overflowY: 'auto' }}>
          {teleports.map((tp) => (
            <span
              key={tp.id}
              className={styles.teleportTag}
              onClick={() => removeTeleportLink(tp.id)}
              title="点击删除"
            >
              {tp.id.slice(-4)}: ({tp.in.x},{tp.in.y})→({tp.out.x},{tp.out.y}) {tp.dir === 'two_way' ? '⇄' : '→'}
            </span>
          ))}
          {teleports.length === 0 && (
            <div style={{ fontSize: 10, color: '#556' }}>无传送墙</div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>模拟控制</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <label style={{ fontSize: 11, color: '#8899aa' }}>超时(秒):</label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            style={{
              width: 60,
              background: '#16213e',
              border: '1px solid #0f3460',
              color: '#e0e0e0',
              borderRadius: 4,
              padding: '2px 4px',
              fontSize: 11,
            }}
            min={10}
            max={3600}
          />
        </div>
        <label style={{ fontSize: 11, color: '#8899aa', display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showBaselinePath}
            onChange={(e) => setShowBaselinePath(e.target.checked)}
          />
          显示基准算法路径
        </label>
        <button
          className={`${styles.btn} ${styles.btnSuccess}`}
          onClick={onStart}
          disabled={!canRun}
        >
          ▶ 开始测试
        </button>
        {status === 'running' || status === 'paused' ? (
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onPause}>
            {status === 'paused' ? '▶ 继续' : '⏸ 暂停'}
          </button>
        ) : null}
        {status !== 'idle' && (
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onStop}>
            ⏹ 停止
          </button>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>实时数据</div>
        <div className={styles.dataGrid}>
          <div className={styles.dataItem}>
            <div className={styles.dataLabel}>步数</div>
            <div className={styles.dataValue}>{currentStep}</div>
          </div>
          <div className={styles.dataItem}>
            <div className={styles.dataLabel}>耗时</div>
            <div className={styles.dataValue}>{(elapsed / 1000).toFixed(1)}s</div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>测试结果</div>
          {results.map((r) => (
            <div key={r.algorithmId} style={{ marginBottom: 4, fontSize: 11 }}>
              <div style={{ fontWeight: 600, color: r.success ? '#4caf50' : '#f44336' }}>
                {r.algorithmName} {r.success ? '✓' : '✗'}
              </div>
              <div style={{ color: '#8899aa' }}>
                耗时: {r.totalTime.toFixed(1)}s | 步数: {r.steps} | 撞墙: {r.solidWallHits}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          日志 ({logs.length})
          <button
            className={styles.btnSm}
            onClick={clearLogs}
            style={{ float: 'right' }}
          >
            清空
          </button>
        </div>
        <div className={styles.logContainer}>
          {logs.map((line, i) => (
            <div key={i} className={styles.logLine}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
