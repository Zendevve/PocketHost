import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CloudBackupEntry } from '../services/cloudBackupService';

interface CloudBackupStore {
  backups: CloudBackupEntry[];
  isSignedIn: boolean;
  isLoading: boolean;
  uploadProgress: number;
  downloadProgress: number;
  error: string | null;

  setBackups: (backups: CloudBackupEntry[]) => void;
  addBackup: (backup: CloudBackupEntry) => void;
  removeBackup: (driveFileId: string) => void;
  setSignedIn: (signedIn: boolean) => void;
  setLoading: (loading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setDownloadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCloudBackupStore = create<CloudBackupStore>()(
  persist(
    (set) => ({
      backups: [],
      isSignedIn: false,
      isLoading: false,
      uploadProgress: 0,
      downloadProgress: 0,
      error: null,

      setBackups: (backups) => set({ backups }),
      addBackup: (backup) =>
        set((s) => ({
          backups: [backup, ...s.backups],
        })),
      removeBackup: (driveFileId) =>
        set((s) => ({
          backups: s.backups.filter((b) => b.driveFileId !== driveFileId),
        })),
      setSignedIn: (isSignedIn) => set({ isSignedIn }),
      setLoading: (isLoading) => set({ isLoading }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'pockethost-cloud-backup',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        backups: state.backups,
        isSignedIn: state.isSignedIn,
      }),
    }
  )
);
