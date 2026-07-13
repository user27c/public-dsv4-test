import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { AlgorithmResult } from '../../types';
import styles from './Dialogs.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement
);

interface ResultsDialogProps {
  results: AlgorithmResult[];
  onClose: () => void;
}

const COLORS = [
  'rgba(233, 69, 96, 0.7)',
  'rgba(76, 175, 80, 0.7)',
  'rgba(33, 150, 243, 0.7)',
  'rgba(255, 193, 7, 0.7)',
  'rgba(156, 39, 176, 0.7)',
  'rgba(0, 188, 212, 0.7)',
];

export default function ResultsDialog({ results, onClose }: ResultsDialogProps) {
  if (results.length === 0) return null;

  const labels = results.map((r) => r.algorithmName.slice(0, 15));

  const timeData = {
    labels,
    datasets: [
      {
        label: '通关耗时 (秒)',
        data: results.map((r) => r.totalTime),
        backgroundColor: COLORS.slice(0, results.length),
      },
    ],
  };

  const radarData = {
    labels: ['步数少', '耗时短', '撞墙少', '概率墙少', '道具少', '传送少'],
    datasets: results.map((r, i) => {
      const maxSteps = Math.max(...results.map((x) => x.steps), 1);
      const maxTime = Math.max(...results.map((x) => x.totalTime), 0.1);
      const maxSolid = Math.max(...results.map((x) => x.solidWallHits), 1);
      const maxProb = Math.max(...results.map((x) => x.probWallAttempts), 1);
      const maxItems = Math.max(...results.map((x) => x.itemsUsed), 1);
      const maxTele = Math.max(...results.map((x) => x.teleportsUsed), 1);
      return {
        label: r.algorithmName.slice(0, 15),
        data: [
          ((maxSteps - r.steps) / maxSteps) * 100,
          ((maxTime - r.totalTime) / maxTime) * 100,
          ((maxSolid - r.solidWallHits) / maxSolid) * 100,
          ((maxProb - r.probWallAttempts) / maxProb) * 100,
          ((maxItems - r.itemsUsed) / maxItems) * 100,
          ((maxTele - r.teleportsUsed) / maxTele) * 100,
        ],
        backgroundColor: COLORS[i].replace('0.7', '0.2'),
        borderColor: COLORS[i],
        borderWidth: 2,
      };
    }),
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#8899aa' }, grid: { color: '#0f3460' } },
      x: { ticks: { color: '#8899aa' }, grid: { display: false } },
    },
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false },
        grid: { color: '#0f3460' },
        angleLines: { color: '#0f3460' },
        pointLabels: { color: '#8899aa', font: { size: 11 } },
      },
    },
    plugins: { legend: { labels: { color: '#8899aa', font: { size: 10 } } } },
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          测试结果对比
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.chartRow}>
          <div className={styles.chartBox}>
            <div className={styles.chartTitle}>通关耗时对比</div>
            <Bar data={timeData} options={barOptions} />
          </div>
          <div className={styles.chartBox}>
            <div className={styles.chartTitle}>综合评分 (越高越好)</div>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>算法</th>
              <th>结果</th>
              <th>耗时(s)</th>
              <th>步数</th>
              <th>撞墙</th>
              <th>概率墙尝试</th>
              <th>概率墙失败</th>
              <th>道具使用</th>
              <th>传送使用</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.algorithmId}>
                <td>{r.algorithmName}</td>
                <td className={r.success ? styles.successBadge : styles.failBadge}>
                  {r.success ? '通关' : r.error || '失败'}
                </td>
                <td>{r.totalTime.toFixed(1)}</td>
                <td>{r.steps}</td>
                <td>{r.solidWallHits}</td>
                <td>{r.probWallAttempts}</td>
                <td>{r.probWallFails}</td>
                <td>{r.itemsUsed}</td>
                <td>{r.teleportsUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
