import { create } from 'zustand';

export type ServerStatus = 'idle' | 'starting' | 'running' | 'error';

interface ServerState {
  status: ServerStatus;
  logs: string[];
  errorMessage: string | null;
  playitClaimUrl: string | null;
  playitAddress: string | null;
  config: {
    memoryLimit: number;
    activeWorld: string;
  };
  actions: {
    setStatus: (status: ServerStatus) => void;
    addLog: (line: string) => void;
    setError: (msg: string | null) => void;
    clearLogs: () => void;
    setPlayitProperty: (key: 'playitClaimUrl' | 'playitAddress', value: string | null) => void;
    updateConfig: (patch: Partial<ServerState['config']>) => void;
  };
}

const MAX_LOGS = 1000;

export const useServerStore = create<ServerState>((set) => ({
  status: 'idle',
  logs: [],
  errorMessage: null,
  playitClaimUrl: null,
  playitAddress: null,
  config: {
    memoryLimit: 2048,
    activeWorld: 'world',
  },
  actions: {
    setStatus: (status) => set({ status }),
    addLog: (line) =>
      set((state) => ({
        logs: [...state.logs.slice(-(MAX_LOGS - 1)), line],
      })),
    setError: (msg) => set({ errorMessage: msg, status: 'error' }),
    clearLogs: () => set({ logs: [], errorMessage: null, playitClaimUrl: null, playitAddress: null }),
    setPlayitProperty: (key, value) => set({ [key]: value }),
    updateConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  },
}));
