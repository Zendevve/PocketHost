import { NativeEventEmitter } from 'react-native';
import * as FileSystem from 'expo-file-system';
import ServerProcessModule from '../../modules/server-process';
import { useServerStore } from '../stores/serverStore';
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
    });

    emitter.addListener('onStatusChange', (event: { status: string }) => {
      const id = getActiveId();
      if (event.status === 'RUNNING') {
        useServerStore.getState().setStatus(id, { status: 'running' });
      } else if (event.status === 'STOPPED') {
        useServerStore.getState().setStatus(id, { status: 'idle' });
      }
    });

    emitter.addListener('onError', (event: { message: string }) => {
      const id = getActiveId();
      useServerStore.getState().setStatus(id, { status: 'error', error: event.message });
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

      ServerProcessModule.startServer(jarPath, memoryLimit, worldDir);
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
    ServerProcessModule.sendCommand(command);
  },
};
