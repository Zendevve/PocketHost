export type ServerStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export type RelayRegion = 'global' | 'na' | 'eu' | 'ap';

export interface ServerConfig {
  id: string;
  name: string;
  mcVersion: string;
  serverType: 'vanilla' | 'paper' | 'forge' | 'fabric';
  serverJarUrl: string;
  serverJarPath: string;
  worldName: string;
  worldPath: string;
  maxMemoryMB: number;
  relayRegion: RelayRegion;
  crossplayEnabled: boolean;
  createdAt: number;
}

export interface ServerState {
  config: ServerConfig;
  status: ServerStatus;
  pid: number | null;
  lanAddress: string | null;
  relayAddress: string | null;
  playitClaimUrl: string | null;
  uptimeSeconds: number;
  memoryUsedMB: number;
  memoryMaxMB: number;
  tps: number;
  error: string | null;
}

export function createDefaultServerState(config: ServerConfig): ServerState {
  return {
    config,
    status: 'idle',
    pid: null,
    lanAddress: null,
    relayAddress: null,
    playitClaimUrl: null,
    uptimeSeconds: 0,
    memoryUsedMB: 0,
    memoryMaxMB: config.maxMemoryMB,
    tps: 20,
    error: null,
  };
}
