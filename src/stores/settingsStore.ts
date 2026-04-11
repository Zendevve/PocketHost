import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RelayRegion } from '../types/server';

interface SettingsStore {
  relayRegion: RelayRegion;
  crossplayEnabled: boolean;
  maxMemoryMB: number;
  autoBackup: boolean;
  gdriveLinked: boolean;
  playitSecretKey: string | null;
  setRelayRegion: (r: RelayRegion) => void;
  setCrossplay: (v: boolean) => void;
  setMaxMemory: (mb: number) => void;
  setAutoBackup: (v: boolean) => void;
  setGdriveLinked: (v: boolean) => void;
  setPlayitSecretKey: (key: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      relayRegion: 'global',
      crossplayEnabled: true,
      maxMemoryMB: 1024,
      autoBackup: false,
      gdriveLinked: false,
      playitSecretKey: null,
      setRelayRegion: (relayRegion) => set({ relayRegion }),
      setCrossplay: (crossplayEnabled) => set({ crossplayEnabled }),
      setMaxMemory: (maxMemoryMB) => set({ maxMemoryMB }),
      setAutoBackup: (autoBackup) => set({ autoBackup }),
      setGdriveLinked: (gdriveLinked) => set({ gdriveLinked }),
      setPlayitSecretKey: (playitSecretKey) => set({ playitSecretKey }),
    }),
    {
      name: 'pockethost-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
