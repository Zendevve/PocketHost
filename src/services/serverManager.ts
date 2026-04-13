import { NativeEventEmitter } from 'react-native';
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
      
      ServerProcessModule.startServer();
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
