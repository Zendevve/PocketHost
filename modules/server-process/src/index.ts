import { requireNativeModule, EventEmitter } from 'expo-modules-core';

// This is required to make sure the native module is actually linked when imported.
// In dev or Expo Go, it'll mock or warn if missing.
let ServerProcess: any;
let emitter: any = null;

try {
  ServerProcess = requireNativeModule('ServerProcess');
  emitter = new EventEmitter(ServerProcess);
} catch (e) {
  console.warn('Native module ServerProcess not found, using stub');
  ServerProcess = {
    startServer: async (_jarPath: string, _maxMem: number, _worldDir: string, _jvmFlags: string) => true,
    stopServer: async () => true,
    sendCommand: async () => true,
    isRunning: () => false,
  };
}

export default {
  startServer: async (jarPath: string, maxMem: number, worldDir: string, jvmFlags: string = ''): Promise<boolean> => {
    return await ServerProcess.startServer(jarPath, maxMem, worldDir, jvmFlags);
  },
  stopServer: async (): Promise<boolean> => {
    return await ServerProcess.stopServer();
  },
  sendCommand: async (command: string): Promise<boolean> => {
    return await ServerProcess.sendCommand(command);
  },
  isRunning: (): boolean => {
    return ServerProcess.isRunning();
  },
  addListener: (eventName: 'onLog' | 'onStatusChange' | 'onError', listener: (event: any) => void) => {
    if (!emitter) return { remove: () => {} };
    return emitter.addListener(eventName, listener);
  }
};
