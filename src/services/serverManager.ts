import ServerProcess from '../../modules/server-process/src';
import { useServerStore } from '../stores/serverStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ServerConfig } from '../types/server';
import { playitService } from './playitService';

class ServerManager {
  private activeId: string | null = null;
  private unsubscribeLogs: (() => void) | null = null;
  private unsubscribeStatus: (() => void) | null = null;
  private unsubscribeError: (() => void) | null = null;

  init() {
    this.unsubscribeLogs?.();
    this.unsubscribeStatus?.();
    this.unsubscribeError?.();

    this.unsubscribeLogs = ServerProcess.addListener('onLog', (event: any) => {
      if (this.activeId) {
        useServerStore.getState().appendLog(this.activeId, event.line);
      }
    }).remove;

    this.unsubscribeStatus = ServerProcess.addListener('onStatusChange', (event: any) => {
      if (this.activeId) {
        useServerStore.getState().setStatus(this.activeId, {
          status: event.status,
        });

        // If the server just became running, initialize playit if configured
        if (event.status === 'running') {
          const { playitSecretKey } = useSettingsStore.getState();
          if (playitSecretKey) {
            playitService.setupPlayitAgent(playitSecretKey).then(address => {
               useServerStore.getState().setStatus(this.activeId!, { relayAddress: address });
            }).catch(err => {
              useServerStore.getState().appendLog(this.activeId!, `[Playit Error] ${err}`);
            });
          }
        } else if (event.status === 'idle') {
          playitService.stopPlayitAgent();
          useServerStore.getState().setStatus(this.activeId, { relayAddress: null });
        }
      }
    }).remove;

    this.unsubscribeError = ServerProcess.addListener('onError', (event: any) => {
      if (this.activeId) {
        useServerStore.getState().setStatus(this.activeId, {
          status: 'error',
          error: event.message,
        });
      }
    }).remove;
  }

  async start(config: ServerConfig): Promise<void> {
    if (!this.unsubscribeLogs) {
      this.init();
    }
    
    this.activeId = config.id;
    useServerStore.getState().setActive(config.id);
    useServerStore.getState().clearLogs(config.id);
    useServerStore.getState().setStatus(config.id, { status: 'starting', error: null, relayAddress: null });

    try {
      await ServerProcess.startServer(
        config.serverJarPath,
        config.maxMemoryMB,
        config.worldPath
      );
    } catch (e) {
      useServerStore.getState().setStatus(config.id, { status: 'error', error: String(e) });
    }
  }

  async stop(): Promise<void> {
    if (!this.activeId) return;
    useServerStore.getState().setStatus(this.activeId, { status: 'stopping' });
    try {
      await ServerProcess.stopServer();
      await playitService.stopPlayitAgent();
    } catch (e) {
      useServerStore.getState().setStatus(this.activeId, { status: 'error', error: String(e) });
    }
  }

  async restart(config: ServerConfig): Promise<void> {
    await this.stop();
    await new Promise((r) => setTimeout(r, 2000));
    await this.start(config);
  }

  async sendCommand(command: string): Promise<void> {
    await ServerProcess.sendCommand(command);
  }

  isRunning(): boolean {
    return ServerProcess.isRunning();
  }
}

export const serverManager = new ServerManager();
