import * as FileSystem from 'expo-file-system';
import { ServerProcess } from '../../modules/server-process/src';

export interface PlayerListEntry {
  uuid: string;
  name: string;
  level?: number;
  bypassesPlayerLimit?: boolean;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
}

export type ListType = 'ops' | 'whitelist' | 'banned-players' | 'banned-ips';

export async function getPlayerList(worldPath: string, listType: ListType): Promise<PlayerListEntry[]> {
  const filePath = `file://${worldPath}/${listType}.json`;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) return [];
    
    const content = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(content) as PlayerListEntry[];
  } catch (e) {
    console.error(`Error reading ${listType}.json`, e);
    return [];
  }
}

export async function modifyPlayerList(
  worldPath: string,
  listType: ListType,
  action: 'add' | 'remove',
  playerName: string,
  isRunning: boolean
): Promise<boolean> {
  if (isRunning) {
    // If the server is running, dispatch a command so it handles logic correctly
    let command = '';
    if (listType === 'ops') command = action === 'add' ? `op ${playerName}` : `deop ${playerName}`;
    if (listType === 'whitelist') command = `whitelist ${action} ${playerName}`;
    if (listType === 'banned-players') command = action === 'add' ? `ban ${playerName}` : `pardon ${playerName}`;
    if (listType === 'banned-ips') command = action === 'add' ? `ban-ip ${playerName}` : `pardon-ip ${playerName}`;
    
    if (command) {
      await ServerProcess.sendCommand(command);
      // Wait a moment for server to flush to disk
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    }
  } else {
    // If the server is offline, we must edit the JSON directly (or create it)
    // Note: editing JSON directly without UUIDs requires UUID resolution,
    // which offline we don't have easily without Mojang API. 
    // For MVP, we will only allow modifying offline IF we can generate a mock UUID or fetch from API.
    // To simplify, MVP can just require the server to be running to add players, 
    // OR we do a quick fetch to Mojang API.
    try {
      let currentList = await getPlayerList(worldPath, listType);
      
      if (action === 'remove') {
        currentList = currentList.filter(p => p.name.toLowerCase() !== playerName.toLowerCase());
      } else {
        // Add player (needs UUID)
        const uuid = await fetchMojangUuid(playerName) || generateOfflineUuid(playerName);
        const entry: PlayerListEntry = { uuid, name: playerName };
        
        if (listType === 'ops') {
          entry.level = 4;
          entry.bypassesPlayerLimit = false;
        } else if (listType.startsWith('banned')) {
          entry.created = new Date().toISOString();
          entry.source = 'Server';
          entry.expires = 'forever';
          entry.reason = 'Banned by an operator.';
        }
        
        // Prevent duplicates
        if (!currentList.find(p => p.name.toLowerCase() === playerName.toLowerCase())) {
          currentList.push(entry);
        }
      }
      
      const filePath = `file://${worldPath}/${listType}.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(currentList, null, 2));
      return true;
    } catch (e) {
      console.error(`Error modifying ${listType}.json offline`, e);
      return false;
    }
  }
  return false;
}

async function fetchMojangUuid(username: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (res.ok) {
      const data = await res.json();
      if (data.id) {
        // format to uuid with dashes
        return data.id.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');
      }
    }
  } catch (e) {
    // Network error
  }
  return null;
}

function generateOfflineUuid(username: string): string {
  // Just a fake UUID for offline mode servers
  return '00000000-0000-0000-0000-000000000000';
}
