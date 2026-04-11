import { create } from 'zustand';
import { Player } from '../types/player';

interface PlayerStore {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  updatePlayer: (uuid: string, partial: Partial<Player>) => void;
  removePlayer: (uuid: string) => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerStore>()((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  updatePlayer: (uuid, partial) =>
    set((s) => ({
      players: s.players.map((p) => (p.uuid === uuid ? { ...p, ...partial } : p)),
    })),
  removePlayer: (uuid) =>
    set((s) => ({
      players: s.players.filter((p) => p.uuid !== uuid),
    })),
  clear: () => set({ players: [] }),
}));
