import * as FileSystem from 'expo-file-system';
import { useServerStore } from '../stores/serverStore';

function getActiveId(): string {
  const id = useServerStore.getState().activeServerId;
  if (id) return id;
  const first = useServerStore.getState().configs[0]?.id;
  if (first) {
    useServerStore.getState().setActive(first);
    return first;
  }
  return '';
}

const ASSETS = {
  jre: {
    url: 'https://github.com/PojavLauncherTeam/android-openjdk-build-multiarch/releases/download/jre17-proot-20230221/jre17-zulu-android.tar.xz',
    filename: 'jre.zip'
  },
  server: {
    url: 'https://api.papermc.io/v2/projects/paper/versions/1.19.4/builds/550/downloads/paper-1.19.4-550.jar',
    filename: 'server.jar'
  },
  playit: {
    url: 'https://github.com/playit-cloud/playit-minecraft-plugin/releases/download/v0.2.14/playit-minecraft-plugin.jar',
    filename: 'playit-plugin.jar'
  }
};

export const downloadAssets = async (onProgress?: (msg: string) => void) => {
  const serverDir = FileSystem.documentDirectory + 'server/';
  const pluginsDir = serverDir + 'plugins/';

  const dirInfo = await FileSystem.getInfoAsync(serverDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(serverDir, { intermediates: true });
  }

  const pluginsDirInfo = await FileSystem.getInfoAsync(pluginsDir);
  if (!pluginsDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(pluginsDir, { intermediates: true });
  }

  const id = getActiveId();

  for (const [key, asset] of Object.entries(ASSETS)) {
    const fileUri = key === 'playit' ? pluginsDir + asset.filename : serverDir + asset.filename;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      if (onProgress) onProgress(`Downloading ${key}...`);
      if (id) useServerStore.getState().appendLog(id, `Downloading ${asset.filename}...`);

      const downloadResumable = FileSystem.createDownloadResumable(
        asset.url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        }
      );

      try {
        await downloadResumable.downloadAsync();
        if (id) useServerStore.getState().appendLog(id, `Successfully downloaded ${asset.filename}`);
      } catch (e) {
        if (id) useServerStore.getState().setStatus(id, { status: 'error', error: `Failed to download ${asset.filename}` });
        throw e;
      }
    } else {
      if (id) useServerStore.getState().appendLog(id, `Found ${asset.filename}`);
    }
  }

  return serverDir;
};
