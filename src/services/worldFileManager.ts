import * as FileSystem from 'expo-file-system';
import { ServerConfig } from '../types/server';

export async function bootstrapServerFiles(config: ServerConfig, serverJarUrl: string) {
  const rootUri = FileSystem.documentDirectory + 'servers/' + config.id + '/';
  const worldUri = rootUri + config.worldName + '/';
  
  await FileSystem.makeDirectoryAsync(worldUri, { intermediates: true });

  const jarDest = rootUri + 'server.jar';
  
  // Download jar if not exists
  const jarInfo = await FileSystem.getInfoAsync(jarDest);
  if (!jarInfo.exists && serverJarUrl) {
    await FileSystem.downloadAsync(serverJarUrl, jarDest);
  }
  
  // Create eula.txt in world directory where jar is run
  const eulaPath = worldUri + 'eula.txt';
  await FileSystem.writeAsStringAsync(eulaPath, 'eula=true\n');
  
  return {
    jarPath: jarDest.replace('file://', ''),
    worldPath: worldUri.replace('file://', '')
  };
}
