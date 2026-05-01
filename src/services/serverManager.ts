import { NativeEventEmitter } from 'react-native';
import * as FileSystem from 'expo-file-system';
import ServerProcessModule from '../../modules/server-process';
import { useServerStore } from '../stores/serverStore';
import { usePlayerStore } from '../stores/playerStore';
import { useMetricsStore } from '../stores/metricsStore';
import { appendMetric } from '../services/metricsService';
import { addPlayerJoin, addPlayerLeave, recordServerStart, recordServerStop } from '../services/analyticsService';
import { parseLogLine } from './console-parser';
import { downloadAssets } from './downloadService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emitter = new NativeEventEmitter(ServerProcessModule as any);

function getActiveId(): string {
  const id = useServerStore.getState().activeServerId;
  if (!id) {
    const first = useServerStore.getState().configs[0]?.id;
    if (first) {
      useServerStore.getState().setActive(first);
      return first;
    }
    throw new Error('No server configured');
  }
  return id;
}

function getActiveConfig() {
  const id = getActiveId();
  const config = useServerStore.getState().configs.find((c) => c.id === id);
  if (!config) throw new Error(`Server config not found for id: ${id}`);
  return config;
}

let metricsInterval: ReturnType<typeof setInterval> | null = null;

function startMetricsCollection() {
  if (metricsInterval) clearInterval(metricsInterval);
  metricsInterval = setInterval(() => {
    const state = useServerStore.getState();
    const activeId = state.activeServerId;
    if (!activeId) return;
    const status = state.statuses[activeId];
    if (!status || status.status !== 'running') return;

    const players = usePlayerStore.getState().players;
    const snapshot = {
      timestamp: Date.now(),
      tps: status.tps || 20,
      memoryUsedMB: status.memoryUsedMB || 0,
      memoryMaxMB: status.memoryMaxMB || status.config?.maxMemoryMB || 1024,
      playerCount: players.filter((p) => p.online).length,
    };

    useMetricsStore.getState().appendMetric(snapshot);
    appendMetric(snapshot);
  }, 30000); // Every 30 seconds
}

function stopMetricsCollection() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

export const serverManager = {
  initializeEventListeners: () => {
    emitter.removeAllListeners('onLog');
    emitter.removeAllListeners('onStatusChange');
    emitter.removeAllListeners('onError');

    emitter.addListener('onLog', (event: { log: string }) => {
      const id = getActiveId();
      useServerStore.getState().appendLog(id, event.log);

      if (event.log.includes('https://playit.gg/claim/')) {
        const match = event.log.match(/(https:\/\/playit\.gg\/claim\/[a-zA-Z0-9]+)/);
        if (match) {
          useServerStore.getState().setStatus(id, { playitClaimUrl: match[1] });
        }
      }

      if (event.log.toLowerCase().includes('connected at:')) {
        const ipMatch = event.log.match(/connected at:\s*([a-zA-Z0-9.-]+:[0-9]+)/i);
        if (ipMatch) {
          useServerStore.getState().setStatus(id, { relayAddress: ipMatch[1] });
        }
      }

      const parsed = parseLogLine(event.log);
      if (parsed.type === 'join') {
        usePlayerStore.getState().addOrUpdatePlayer({
          uuid: '',
          username: parsed.username,
          online: true,
          joinedAt: Date.now(),
        });
        addPlayerJoin(parsed.username).catch(() => {});
      } else if (parsed.type === 'leave') {
        usePlayerStore.getState().removePlayer(parsed.username);
        addPlayerLeave(parsed.username).catch(() => {});
      } else if (parsed.type === 'list') {
        const currentPlayers = usePlayerStore.getState().players;
        const nextPlayers = parsed.usernames.map((username) => {
          const existing = currentPlayers.find((p) => p.username === username);
          return existing
            ? { ...existing, online: true }
            : { uuid: '', username, online: true, joinedAt: Date.now() };
        });
        usePlayerStore.getState().setPlayers(nextPlayers);
      } else if (parsed.type === 'tps') {
        useServerStore.getState().setStatus(id, { tps: parsed.tps1m });
      } else if (parsed.type === 'memory') {
        useServerStore.getState().setStatus(id, {
          memoryUsedMB: parsed.usedMB,
          memoryMaxMB: parsed.maxMB,
        });
      }
    });

    emitter.addListener('onStatusChange', (event: { status: string }) => {
      const id = getActiveId();
      if (event.status === 'RUNNING') {
        useServerStore.getState().setStatus(id, { status: 'running' });
        startMetricsCollection();
        recordServerStart().catch(() => {});
      } else if (event.status === 'STOPPED') {
        useServerStore.getState().setStatus(id, { status: 'idle' });
        usePlayerStore.getState().clear();
        stopMetricsCollection();
        recordServerStop().catch(() => {});
      }
    });

    emitter.addListener('onError', (event: { message: string }) => {
      const id = getActiveId();
      useServerStore.getState().setStatus(id, { status: 'error', error: event.message });
      stopMetricsCollection();
    });
  },

  startServer: async () => {
    const id = getActiveId();
    const config = getActiveConfig();
    useServerStore.getState().setStatus(id, { status: 'starting' });
    useServerStore.getState().clearLogs(id);

    try {
      useServerStore.getState().appendLog(id, 'Ensuring assets are ready...');
      const serverDir = await downloadAssets();
      useServerStore.getState().appendLog(id, 'Assets ready. Starting native process...');

      const memoryLimit = config.maxMemoryMB;
      const worldDir = config.worldPath.endsWith('/') ? config.worldPath : config.worldPath + '/';
      const jarPath = serverDir + 'server.jar';

      const jvmFlagsStr = config.jvmFlagsOptimized && config.jvmFlags.length > 0
        ? config.jvmFlags.join('|')
        : '';

      ServerProcessModule.startServer(jarPath, memoryLimit, worldDir, jvmFlagsStr);
    } catch (e: any) {
      useServerStore.getState().setStatus(id, {
        status: 'error',
        error: e.message || 'Failed to start server',
      });
    }
  },

  stopServer: () => {
    ServerProcessModule.stopServer();
  },

  sendCommand: (command: string) => {
    return ServerProcessModule.sendCommand(command);
  },
};
