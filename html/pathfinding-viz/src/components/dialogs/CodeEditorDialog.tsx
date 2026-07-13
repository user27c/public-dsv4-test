import { useState, useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { AlgorithmDef } from '../../types';
import styles from './Dialogs.module.css';

interface CodeEditorDialogProps {
  algorithm?: AlgorithmDef;
  onSave: (algo: AlgorithmDef) => void;
  onClose: () => void;
}

const DEFAULT_TEMPLATE = `// 寻路算法模板
// main 函数每步调用一次，通过 api 感知环境并做出行动
//
// API 方法:
//   api.getCell(x, y)        — 查询任意格子的类型
//   api.getSurroundings(r)   — 获取周围格子 (r=1返回3×3, r=2返回5×5)
//   api.getPlayer()          — 获取当前位置、背包、速度等
//   api.getGoal()            — 获取终点坐标
//   api.getMapSize()         — 获取地图尺寸 {width, height}
//   api.move('up'|'down'|'left'|'right') — 移动
//   api.useItem(slot)        — 使用道具 (0/1/2)
//   api.log(msg)             — 输出日志
//
// 格子类型: 'empty', 'solid', 'probabilistic', 'teleport_in',
//           'teleport_out', 'start', 'end', 'chest'

function main(api) {
  const goal = api.getGoal();
  const player = api.getPlayer();
  const size = api.getMapSize();
  
  // 在这里实现你的寻路算法
  
  // 简单示例: 总是往右走
  api.move('right');
}
`;

export default function CodeEditorDialog({ algorithm, onSave, onClose }: CodeEditorDialogProps) {
  const [name, setName] = useState(algorithm?.name || '新算法');
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: algorithm?.code || DEFAULT_TEMPLATE,
      extensions: [basicSetup, javascript(), oneDark],
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => view.destroy();
  }, [algorithm]);

  const handleSave = () => {
    if (!viewRef.current) return;
    const code = viewRef.current.state.doc.toString();
    const algo: AlgorithmDef = {
      id: algorithm?.id || `user_${Date.now()}`,
      name: name || '未命名',
      code,
      isBaseline: false,
    };
    onSave(algo);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          {algorithm ? '编辑算法' : '新建算法'}
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#8899aa', marginRight: 8 }}>名称:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: '#0a0a1a',
              border: '1px solid #0f3460',
              color: '#e0e0e0',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 13,
              width: 300,
            }}
          />
        </div>

        <div ref={editorRef} className={styles.editorArea} />

        <div className={styles.btnRow}>
          <button className={`${styles.editorBtn} ${styles.editorBtnSecondary}`} onClick={onClose}>
            取消
          </button>
          <button className={`${styles.editorBtn} ${styles.editorBtnPrimary}`} onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
