export type ServerStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error';

export type RelayRegion = 'global' | 'na' | 'eu' | 'ap';

export const DEFAULT_JVM_FLAGS = [
  '-XX:+UseG1GC',
  '-XX:+ParallelRefProcEnabled',
  '-XX:MaxGCPauseMillis=200',
  '-XX:+UnlockExperimentalVMOptions',
  '-XX:+DisableExplicitGC',
  '-XX:+AlwaysPreTouch',
  '-XX:G1NewSizePercent=30',
  '-XX:G1MaxNewSizePercent=40',
  '-XX:G1HeapRegionSize=8M',
  '-XX:G1ReservePercent=20',
  '-XX:G1HeapWastePercent=5',
  '-XX:G1MixedGCCountTarget=4',
  '-XX:InitiatingHeapOccupancyPercent=15',
  '-XX:SurvivorRatio=32',
  '-XX:+PerfDisableSharedMem',
  '-XX:MaxTenuringThreshold=1',
];

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
  jvmFlagsOptimized: boolean;
  jvmFlags: string[];
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
