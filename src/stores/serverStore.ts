import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDefaultServerState, ServerConfig, ServerState } from '../types/server';

interface ServerStore {
  configs: ServerConfig[];
  activeServerId: string | null;
  statuses: Record<string, ServerState>;
  consoleLogs: Record<string, string[]>;

  addConfig: (config: ServerConfig) => void;
  removeConfig: (id: string) => void;
  setActive: (id: string | null) => void;
  setStatus: (id: string, partial: Partial<ServerState>) => void;
  appendLog: (id: string, line: string) => void;
  clearLogs: (id: string) => void;
  reset: () => void;
}

export const useServerStore = create<ServerStore>()(
  persist(
    (set, get) => ({
      configs: [],
      activeServerId: null,
      statuses: {},
      consoleLogs: {},

      addConfig: (config) =>
        set((s) => ({
          configs: [...s.configs, config],
          statuses: {
            ...s.statuses,
            [config.id]: createDefaultServerState(config),
          },
        })),

      removeConfig: (id) =>
        set((s) => ({
          configs: s.configs.filter((c) => c.id !== id),
          activeServerId: s.activeServerId === id ? null : s.activeServerId,
          statuses: Object.fromEntries(Object.entries(s.statuses).filter(([k]) => k !== id)),
          consoleLogs: Object.fromEntries(Object.entries(s.consoleLogs).filter(([k]) => k !== id)),
        })),

      setActive: (id) => set({ activeServerId: id }),

      setStatus: (id, partial) =>
        set((s) => {
          const existing = s.statuses[id];
          if (!existing) {
            const config = s.configs.find((c) => c.id === id);
            if (!config) return s;
            return {
              statuses: {
                ...s.statuses,
                [id]: {
                  ...createDefaultServerState(config),
                  ...partial,
                },
              },
            };
          }

          return {
            statuses: {
              ...s.statuses,
              [id]: {
                ...existing,
                ...partial,
                memoryMaxMB: partial.memoryMaxMB ?? existing.memoryMaxMB,
              },
            },
          };
        }),

      appendLog: (id, line) =>
        set((s) => ({
          consoleLogs: {
            ...s.consoleLogs,
            [id]: [...(s.consoleLogs[id] ?? []).slice(-499), line],
          },
        })),

      clearLogs: (id) =>
        set((s) => ({
          consoleLogs: {
            ...s.consoleLogs,
            [id]: [],
          },
        })),

      reset: () =>
        set({
          configs: [],
          activeServerId: null,
          statuses: {},
          consoleLogs: {},
        }),
    }),
    {
      name: 'pockethost-server',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        configs: state.configs,
        activeServerId: state.activeServerId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const rebuiltStatuses: Record<string, ServerState> = {};
        for (const config of state.configs) {
          rebuiltStatuses[config.id] = createDefaultServerState(config);
        }
        useServerStore.setState({ statuses: rebuiltStatuses });
      },
    }
  )
);
