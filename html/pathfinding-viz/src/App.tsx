import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from './store/simulationStore';
import { useSimulation } from './hooks/useSimulation';
import { AlgorithmDef } from './types';
import Layout from './components/layout/Layout';
import Toolbar from './components/toolbar/Toolbar';
import MapCanvas from './components/canvas/MapCanvas';
import Sidebar from './components/sidebar/Sidebar';
import ResultsDialog from './components/dialogs/ResultsDialog';
import CodeEditorDialog from './components/dialogs/CodeEditorDialog';

export default function App() {
  const { startSim, pauseSim, stopSim, runnerRef } = useSimulation();
  const status = useSimulationStore((s) => s.status);
  const results = useSimulationStore((s) => s.results);
  const elapsed = useSimulationStore((s) => s.elapsed);
  const elapsedRef = useRef(0);
  const prevStatusRef = useRef(status);

  const [showResults, setShowResults] = useState(false);
  const [editAlgo, setEditAlgo] = useState<AlgorithmDef | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (status === 'running') {
      const startTime = performance.now() - elapsed;
      const tick = () => {
        const s = useSimulationStore.getState();
        if (s.status !== 'running') return;
        useSimulationStore.getState().setElapsed(performance.now() - startTime);
        elapsedRef.current = requestAnimationFrame(tick);
      };
      elapsedRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(elapsedRef.current);
    }
  }, [status]);

  useEffect(() => {
    if (prevStatusRef.current === 'running' && status === 'idle') {
      if (results.length > 0) setShowResults(true);
    }
    prevStatusRef.current = status;
  }, [status, results.length]);

  const handleNewAlgo = () => {
    setEditAlgo(undefined);
    setShowEditor(true);
  };

  const handleEditAlgo = (algo: AlgorithmDef) => {
    setEditAlgo(algo);
    setShowEditor(true);
  };

  const handleSaveAlgo = (algo: AlgorithmDef) => {
    const store = useSimulationStore.getState();
    const existing = store.algorithms.find((a) => a.id === algo.id);
    if (existing) {
      store.updateAlgorithm(algo.id, algo.code);
    } else {
      store.addAlgorithm(algo);
    }
    setShowEditor(false);
  };

  return (
    <>
      <Layout
        left={<Toolbar />}
        center={<MapCanvas runnerRef={runnerRef} />}
        right={
          <Sidebar
            onStart={startSim}
            onPause={pauseSim}
            onStop={stopSim}
            onNewAlgo={handleNewAlgo}
            onEditAlgo={handleEditAlgo}
          />
        }
      />
      {showResults && (
        <ResultsDialog results={results} onClose={() => setShowResults(false)} />
      )}
      {showEditor && (
        <CodeEditorDialog
          algorithm={editAlgo}
          onSave={handleSaveAlgo}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
