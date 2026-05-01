import { create } from 'zustand';
import { MetricsSnapshot } from '../services/metricsService';

interface MetricsStore {
  history: MetricsSnapshot[];
  latest: MetricsSnapshot | null;
  isCollecting: boolean;

  setHistory: (history: MetricsSnapshot[]) => void;
  appendMetric: (snapshot: MetricsSnapshot) => void;
  setLatest: (snapshot: MetricsSnapshot) => void;
  setCollecting: (collecting: boolean) => void;
  clearHistory: () => void;
}

export const useMetricsStore = create<MetricsStore>()((set) => ({
  history: [],
  latest: null,
  isCollecting: false,

  setHistory: (history) => set({ history }),
  appendMetric: (snapshot) =>
    set((s) => {
      const next = [...s.history];
      if (next.length === 0 || snapshot.timestamp - next[next.length - 1].timestamp >= 5 * 60 * 1000) {
        next.push(snapshot);
      } else {
        next[next.length - 1] = snapshot;
      }
      return { history: next.slice(-288), latest: snapshot };
    }),
  setLatest: (latest) => set({ latest }),
  setCollecting: (isCollecting) => set({ isCollecting }),
  clearHistory: () => set({ history: [], latest: null }),
}));
