import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface CloudBackupEntry {
  id: string;
  driveFileId: string;
  name: string;
  size: number;
  timestamp: string;
  worldName: string;
}

let accessToken: string | null = null;

async function getAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  const stored = await AsyncStorage.getItem('gdrive_access_token');
  if (stored) {
    accessToken = stored;
    return stored;
  }
  return null;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    AsyncStorage.setItem('gdrive_access_token', token);
  } else {
    AsyncStorage.removeItem('gdrive_access_token');
  }
}

export async function isSignedIn(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    const res = await fetch(`${DRIVE_API_BASE}/about?fields=user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  setAccessToken(null);
  await AsyncStorage.removeItem('gdrive_access_token');
  await AsyncStorage.removeItem('gdrive_backups_cache');
}

async function findOrCreateFolder(folderName: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');

  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
    )}&spaces=drive&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const createData = await createRes.json();
  return createData.id;
}

export async function uploadBackup(
  filePath: string,
  worldName: string,
  onProgress?: (percent: number) => void
): Promise<CloudBackupEntry> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in to Google Drive');

  const fileName = filePath.split('/').pop() || `pockethost-backup-${Date.now()}.zip`;
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  const fileSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;

  const folderId = await findOrCreateFolder('PocketHost Backups');

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: `PocketHost world backup: ${worldName}`,
    appProperties: {
      worldName,
      timestamp: new Date().toISOString(),
      app: 'pockethost',
    },
  };

  const base64 = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Simple upload for files under 5MB; for larger files, resumable upload would be needed
  const boundary = 'pockethost_boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/zip\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${base64}\r\n` +
    `--${boundary}--`;

  onProgress?.(50);

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,size,createdTime,appProperties`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  onProgress?.(90);

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} ${err}`);
  }

  const data = await uploadRes.json();
  onProgress?.(100);

  const entry: CloudBackupEntry = {
    id: data.id,
    driveFileId: data.id,
    name: data.name,
    size: fileSize,
    timestamp: data.createdTime || new Date().toISOString(),
    worldName: data.appProperties?.worldName || worldName,
  };

  // Update cache
  const cached = await getCachedBackups();
  cached.unshift(entry);
  await AsyncStorage.setItem('gdrive_backups_cache', JSON.stringify(cached.slice(0, 50)));

  return entry;
}

export async function listDriveBackups(): Promise<CloudBackupEntry[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in to Google Drive');

  const folderId = await findOrCreateFolder('PocketHost Backups');

  const res = await fetch(
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed=false`
    )}&spaces=drive&fields=files(id,name,size,createdTime,appProperties)&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`List failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const entries: CloudBackupEntry[] = (data.files || []).map((f: any) => ({
    id: f.id,
    driveFileId: f.id,
    name: f.name,
    size: parseInt(f.size || '0', 10),
    timestamp: f.createdTime,
    worldName: f.appProperties?.worldName || 'unknown',
  }));

  await AsyncStorage.setItem('gdrive_backups_cache', JSON.stringify(entries));
  return entries;
}

export async function getCachedBackups(): Promise<CloudBackupEntry[]> {
  const cached = await AsyncStorage.getItem('gdrive_backups_cache');
  if (!cached) return [];
  try {
    return JSON.parse(cached);
  } catch {
    return [];
  }
}

export async function downloadBackup(
  driveFileId: string,
  destPath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in to Google Drive');

  onProgress?.(10);

  const res = await fetch(
    `${DRIVE_API_BASE}/files/${driveFileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Download failed: ${res.status} ${err}`);
  }

  onProgress?.(50);

  const base64 = await res.text();
  onProgress?.(80);

  await FileSystem.writeAsStringAsync(destPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  onProgress?.(100);
  return destPath;
}

export async function deleteDriveBackup(driveFileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in to Google Drive');

  const res = await fetch(`${DRIVE_API_BASE}/files/${driveFileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Delete failed: ${res.status} ${err}`);
  }

  // Update cache
  const cached = await getCachedBackups();
  const filtered = cached.filter((b) => b.driveFileId !== driveFileId);
  await AsyncStorage.setItem('gdrive_backups_cache', JSON.stringify(filtered));
}
