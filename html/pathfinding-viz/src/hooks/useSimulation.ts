import { useCallback, useRef } from 'react';
import { useMapStore } from '../store/mapStore';
import { useSimulationStore } from '../store/simulationStore';
import { SimulationRunner, SimStats } from '../engine/simulation';

export function useSimulation() {
  const runnerRef = useRef<SimulationRunner | null>(null);

  const startSim = useCallback(() => {
    const simStore = useSimulationStore.getState();
    const mapStore = useMapStore.getState();

    if (!mapStore.start || !mapStore.end) return;

    runnerRef.current?.destroy();

    simStore.reset();
    simStore.setStatus('running');

    const runner = new SimulationRunner(
      simStore.algorithms,
      mapStore.cells,
      mapStore.width,
      mapStore.height,
      mapStore.start,
      mapStore.end,
      mapStore.teleports,
      simStore.timeLimit,
      {
        onStep: (step) => {
          useSimulationStore.getState().setCurrentStep(step);
        },
        onLog: (algoId, msg) => {
          useSimulationStore.getState().addLog(`[${algoId.slice(0, 8)}] ${msg}`);
        },
        onResult: (result: SimStats) => {
          useSimulationStore.getState().addResult(result);
        },
        onFinish: () => {
          useSimulationStore.getState().setStatus('idle');
        },
        onPlayerUpdate: () => {},
        onProbUpdate: () => {},
      }
    );

    runnerRef.current = runner;
    runner.start();
  }, []);

  const pauseSim = useCallback(() => {
    runnerRef.current?.pause();
    const s = useSimulationStore.getState();
    useSimulationStore.getState().setStatus(s.status === 'running' ? 'paused' : 'running');
  }, []);

  const stopSim = useCallback(() => {
    runnerRef.current?.stop();
    useSimulationStore.getState().setStatus('idle');
  }, []);

  return { startSim, pauseSim, stopSim, runnerRef };
}
