import { create } from 'zustand';
import { PlayerSession, ServerSession, DailyStats } from '../services/analyticsService';

interface AnalyticsStore {
  playerSessions: PlayerSession[];
  serverSessions: ServerSession[];
  dailyStats: DailyStats[];

  setPlayerSessions: (sessions: PlayerSession[]) => void;
  setServerSessions: (sessions: ServerSession[]) => void;
  setDailyStats: (stats: DailyStats[]) => void;
  addPlayerSession: (session: PlayerSession) => void;
  addServerSession: (session: ServerSession) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>()((set) => ({
  playerSessions: [],
  serverSessions: [],
  dailyStats: [],

  setPlayerSessions: (playerSessions) => set({ playerSessions }),
  setServerSessions: (serverSessions) => set({ serverSessions }),
  setDailyStats: (dailyStats) => set({ dailyStats }),
  addPlayerSession: (session) =>
    set((s) => ({
      playerSessions: [...s.playerSessions.slice(-499), session],
    })),
  addServerSession: (session) =>
    set((s) => ({
      serverSessions: [...s.serverSessions.slice(-99), session],
    })),
}));
