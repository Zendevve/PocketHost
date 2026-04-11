export interface Player {
  uuid: string;
  username: string;
  online: boolean;
  ip: string | null;
  latencyMs: number | null;
  world: string;
  x: number;
  y: number;
  z: number;
  health: number;
  hunger: number;
  gameMode: string;
  joinedAt: number | null;
}
