import * as FileSystem from 'expo-file-system';
import AdmZip from 'adm-zip';
import { useBackupStore } from '../stores/backupStore';
import { useServerStore } from '../stores/serverStore';
import { serverManager } from './serverManager';

type ProgressCallback = (stage: string, percent: number) => void;

async function collectFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const names = await FileSystem.readDirectoryAsync(dir);
  for (const name of names) {
    const fullPath = `${dir}/${name}`;
    const info = await FileSystem.getInfoAsync(fullPath);
    if (info.isDirectory) {
      const subFiles = await collectFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function createBackup(
  worldPath: string,
  destDir: string,
  onProgress?: ProgressCallback
): Promise<{ path: string; size: number; valid: true }> {
  useServerStore.getState().setBackupStatus('creating');
  try {
    onProgress?.('Scanning files...', 0);
    const allFiles = await collectFiles(worldPath);
    const totalFiles = allFiles.length;

    const zip = new AdmZip();
    for (let i = 0; i < allFiles.length; i++) {
      const fullPath = allFiles[i];
      const relPath = fullPath.substring(worldPath.length + 1); // relative path
      const base64 = await FileSystem.readAsStringAsync(fullPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = Buffer.from(base64, 'base64');
      zip.addFile(relPath, buffer);
      const percent = Math.round(((i + 1) / totalFiles) * 50);
      onProgress?.('Zipping...', percent);
    }

    onProgress?.('Validating...', 50);
    const zipBuffer = zip.toBuffer();
    // Verify integrity
    try {
      const verify = new AdmZip(zipBuffer);
      if (verify.getEntries().length === 0) {
        throw new Error('Empty archive');
      }
    } catch (e) {
      throw new Error('Backup verification failed — file may be corrupted');
    }

    // Ensure destination directory exists
    try {
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    } catch {
      // ignore if exists
    }

    const backupFileName = `pockethost-backup-${Date.now()}.zip`;
    const sanitizedDest = destDir.endsWith('/') ? destDir : destDir + '/';
    const backupPath = `${sanitizedDest}${backupFileName}`;
    await FileSystem.writeAsStringAsync(backupPath, zipBuffer.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });

    const size = zipBuffer.length;
    const worldName = worldPath.split(/[\\/]/).pop() || 'world';
    const backupEntry = {
      id: Date.now().toString(),
      path: backupPath,
      size,
      timestamp: new Date().toISOString(),
      worldName,
    };
    useBackupStore.getState().addBackup(backupEntry);

    // Update server store status
    useServerStore.getState().setBackupStatus('idle');
    useServerStore.getState().setLastBackup(backupEntry.timestamp);
    useServerStore.getState().setBackupError(null);

    onProgress?.('Complete', 100);
    return { path: backupPath, size, valid: true };
  } catch (err: any) {
    useServerStore.getState().setBackupStatus('error');
    useServerStore.getState().setBackupError(err.message);
    throw err;
  }
}

export async function validateBackupFile(backupPath: string): Promise<boolean> {
  return (async () => {
    try {
      const base64 = await FileSystem.readAsStringAsync(backupPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = Buffer.from(base64, 'base64');
      const zip = new AdmZip(buffer);
      return zip.getEntries().length > 0;
    } catch {
      return false;
    }
  })();
}

async function waitForServerStatus(
  targetStatus: string,
  timeoutMs = 30000
): Promise<void> {
  const interval = 200;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const state = useServerStore.getState();
      const activeId = state.activeServerId;
      if (!activeId) {
        reject(new Error('No active server'));
        return;
      }
      const status = state.statuses[activeId]?.status;
      if (status === targetStatus) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for server status ${targetStatus}`));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

export async function restoreBackup(
  backupPath: string,
  worldPath: string,
  onProgress?: ProgressCallback
): Promise<boolean> {
  useServerStore.getState().setBackupStatus('restoring');
  try {
    onProgress?.('Validating backup...', 0);
    const isValid = await validateBackupFile(backupPath);
    if (!isValid) {
      throw new Error('Invalid backup file');
    }

    onProgress?.('Stopping server...', 10);
    serverManager.stopServer();

    try {
      await waitForServerStatus('idle');
    } catch (e) {
      // Proceed anyway, but we'll handle errors later
      console.warn('Warning: server may not have stopped cleanly', e);
    }

    onProgress?.('Backing up current world...', 20);
    const oldPath = worldPath + '.old';
    try {
      const info = await FileSystem.getInfoAsync(oldPath);
      if (info.exists) {
        await FileSystem.deleteAsync(oldPath, { idempotent: true });
      }
    } catch (_) {}
    await FileSystem.moveAsync({ from: worldPath, to: oldPath });

    onProgress?.('Extracting backup...', 30);
    const base64 = await FileSystem.readAsStringAsync(backupPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = Buffer.from(base64, 'base64');
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    await FileSystem.makeDirectoryAsync(worldPath, { intermediates: true });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryName = entry.entryName;
      const targetPath = `${worldPath}/${entryName}`;

      // Ensure directory exists
      const lastSlash = entryName.lastIndexOf('/');
      if (lastSlash > 0) {
        const dirPath = `${worldPath}/${entryName.substring(0, lastSlash)}`;
        try {
          await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        } catch {}
      }

      const data = entry.getData();
      const dataB64 = data.toString('base64');
      await FileSystem.writeAsStringAsync(targetPath, dataB64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const percent = 30 + Math.round(((i + 1) / entries.length) * 40);
      onProgress?.('Extracting...', percent);
    }

    onProgress?.('Validating world...', 70);
    const levelDat = `${worldPath}/level.dat`;
    const regionDir = `${worldPath}/region`;
    const [levelInfo, regionInfo] = await Promise.all([
      FileSystem.getInfoAsync(levelDat),
      FileSystem.getInfoAsync(regionDir),
    ]);
    if (!levelInfo.exists || !regionInfo.isDirectory) {
      // Rollback
      onProgress?.('Validation failed, rolling back...', 75);
      await FileSystem.deleteAsync(worldPath, { idempotent: true });
      await FileSystem.moveAsync({ from: oldPath, to: worldPath });
      throw new Error('World data incomplete — rolled back to previous world');
    }

    onProgress?.('Restarting server...', 80);
    serverManager.startServer();

    // Optionally wait for server to start? Not necessary but we'll wait for 'running' if possible.
    try {
      await waitForServerStatus('running');
    } catch {
      // ignore
    }

    onProgress?.('Restore complete', 100);
    useServerStore.getState().setBackupStatus('idle');
    return true;
  } catch (err: any) {
    useServerStore.getState().setBackupStatus('error');
    useServerStore.getState().setBackupError(err.message);
    throw err;
  }
}



export async function listBackups(): Promise<Array<{ path: string; size: number; timestamp: string }>> {
  return useBackupStore.getState().backups.map((b) => ({
    path: b.path,
    size: b.size,
    timestamp: b.timestamp,
  }));
}
