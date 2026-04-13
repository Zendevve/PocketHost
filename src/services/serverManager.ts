import { NativeEventEmitter } from 'react-native';
import * as FileSystem from 'expo-file-system';
import ServerProcessModule from '../../modules/server-process';
import { useServerStore } from '../store/serverStore';
import { downloadAssets } from './downloadService';

const emitter = new NativeEventEmitter(ServerProcessModule);

export const serverManager = {
  initializeEventListeners: () => {
    // Prevent duplicate listeners
    emitter.removeAllListeners('onLog');
    emitter.removeAllListeners('onStatusChange');
    emitter.removeAllListeners('onError');

    emitter.addListener('onLog', (event: { log: string }) => {
      useServerStore.getState().actions.addLog(event.log);
      
      if (event.log.includes('https://playit.gg/claim/')) {
        const match = event.log.match(/(https:\/\/playit\.gg\/claim\/[a-zA-Z0-9]+)/);
        if (match) {
          useServerStore.getState().actions.setPlayitProperty('playitClaimUrl', match[1]);
        }
      }

      if (event.log.toLowerCase().includes('connected at:')) {
        const ipMatch = event.log.match(/connected at:\s*([a-zA-Z0-9.-]+:[0-9]+)/i);
        if (ipMatch) {
          useServerStore.getState().actions.setPlayitProperty('playitAddress', ipMatch[1]);
        }
      }
    });

    emitter.addListener('onStatusChange', (event: { status: string }) => {
      if (event.status === 'RUNNING') {
        useServerStore.getState().actions.setStatus('running');
      } else if (event.status === 'STOPPED') {
        useServerStore.getState().actions.setStatus('idle');
      }
    });

    emitter.addListener('onError', (event: { message: string }) => {
      useServerStore.getState().actions.setError(event.message);
    });
  },

  startServer: async () => {
    useServerStore.getState().actions.setStatus('starting');
    useServerStore.getState().actions.clearLogs();
    
    try {
      useServerStore.getState().actions.addLog('Ensuring assets are ready...');
      const serverDir = await downloadAssets();
      useServerStore.getState().actions.addLog('Assets ready. Starting native process...');
      
      const { memoryLimit, activeWorld } = useServerStore.getState().config;
      const jarPath = serverDir + 'server.jar';
      const worldDir = serverDir + activeWorld + '/';

      ServerProcessModule.startServer(jarPath, memoryLimit, worldDir);
    } catch (e: any) {
      useServerStore.getState().actions.setError(e.message || 'Failed to start server');
    }
  },

  stopServer: () => {
    ServerProcessModule.stopServer();
  },

  sendCommand: (command: string) => {
    ServerProcessModule.sendCommand(command);
  }
};
