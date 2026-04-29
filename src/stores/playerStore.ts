import { create } from 'zustand';
import { Player } from '../types/player';

interface PlayerStore {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  addOrUpdatePlayer: (player: Player) => void;
  removePlayer: (username: string) => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerStore>()((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  addOrUpdatePlayer: (player) =>
    set((state) => {
      const exists = state.players.find((p) => p.username === player.username);
      if (exists) {
        return {
          players: state.players.map((p) =>
            p.username === player.username ? { ...p, ...player } : p
          ),
        };
      }
      return { players: [...state.players, player] };
    }),
  removePlayer: (username) =>
    set((state) => ({
      players: state.players.filter((p) => p.username !== username),
    })),
  clear: () => set({ players: [] }),
}));
