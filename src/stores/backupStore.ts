import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface BackupEntry {
  id: string;
  path: string;
  size: number;
  timestamp: string;
  worldName: string;
}

interface BackupStore {
  backups: BackupEntry[];
  addBackup: (entry: BackupEntry) => void;
  removeBackup: (id: string) => void;
  clearHistory: () => void;
}

export const useBackupStore = create<BackupStore>()(
  persist(
    (set) => ({
      backups: [],

      addBackup: (entry) =>
        set((state) => ({
          backups: [entry, ...state.backups],
        })),

      removeBackup: (id) =>
        set((state) => ({
          backups: state.backups.filter((b) => b.id !== id),
        })),

      clearHistory: () => set({ backups: [] }),
    }),
    {
      name: 'pockethost-backups',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
