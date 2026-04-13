import * as FileSystem from 'expo-file-system';
import { useServerStore } from '../store/serverStore';

const ASSETS = {
  jre: {
    url: 'https://github.com/PojavLauncherTeam/android-openjdk-build-multiarch/releases/download/jre17-proot-20230221/jre17-zulu-android.tar.xz', // Temporary placeholder for demonstration
    filename: 'jre.zip'
  },
  server: {
    url: 'https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar', // 1.19.4 Vanilla Server as fallback/placeholder.
    filename: 'server.jar'
  }
};

export const downloadAssets = async (onProgress?: (msg: string) => void) => {
  const serverDir = FileSystem.documentDirectory + 'server/';
  
  // Ensure server directory exists
  const dirInfo = await FileSystem.getInfoAsync(serverDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(serverDir, { intermediates: true });
  }

  for (const [key, asset] of Object.entries(ASSETS)) {
    const fileUri = serverDir + asset.filename;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      if (onProgress) onProgress(`Downloading ${key}...`);
      useServerStore.getState().actions.addLog(`Downloading ${asset.filename}...`);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        asset.url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          // Could update state progress here
        }
      );

      try {
        await downloadResumable.downloadAsync();
        useServerStore.getState().actions.addLog(`Successfully downloaded ${asset.filename}`);
      } catch (e) {
        useServerStore.getState().actions.setError(`Failed to download ${asset.filename}`);
        throw e;
      }
    } else {
       useServerStore.getState().actions.addLog(`Found ${asset.filename}`);
    }
  }

  return serverDir;
};
