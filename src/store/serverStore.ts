import { create } from 'zustand';

export type ServerStatus = 'idle' | 'starting' | 'running' | 'error';

interface ServerState {
  status: ServerStatus;
  logs: string[];
  errorMessage: string | null;
  actions: {
    setStatus: (status: ServerStatus) => void;
    addLog: (line: string) => void;
    setError: (msg: string | null) => void;
    clearLogs: () => void;
  };
}

const MAX_LOGS = 1000;

export const useServerStore = create<ServerState>((set) => ({
  status: 'idle',
  logs: [],
  errorMessage: null,
  actions: {
    setStatus: (status) => set({ status }),
    addLog: (line) =>
      set((state) => ({
        logs: [...state.logs.slice(-(MAX_LOGS - 1)), line],
      })),
    setError: (msg) => set({ errorMessage: msg, status: 'error' }),
    clearLogs: () => set({ logs: [], errorMessage: null }),
  },
}));
