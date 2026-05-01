import * as FileSystem from 'expo-file-system';
import AdmZip from 'adm-zip';
import { decompressLevelDat, parseNbt, extractWorldProperties, WorldProperties } from './nbtParser';

export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  sourceWorldPath: string;
  createdAt: number;
  size: number;
}

export interface WorldInfo {
  name: string;
  path: string;
  size: number;
  properties: Partial<WorldProperties>;
}

export async function getWorldsDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}worlds`;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {}
  return dir;
}

export async function getTemplatesDirectory(): Promise<string> {
  const dir = `${FileSystem.documentDirectory}templates`;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {}
  return dir;
}

function getFileSize(info: FileSystem.FileInfo): number {
  if (!info.exists) return 0;
  const withSize = info as FileSystem.FileInfo & { size?: number };
  return withSize.size ?? 0;
}

function getFileModificationTime(info: FileSystem.FileInfo): number {
  if (!info.exists) return Date.now();
  const withTime = info as FileSystem.FileInfo & { modificationTime?: number };
  return withTime.modificationTime ?? Date.now();
}

export async function listWorlds(): Promise<Array<{ name: string; path: string; size: number }>> {
  const worldsDir = await getWorldsDirectory();
  try {
    const names = await FileSystem.readDirectoryAsync(worldsDir);
    const worlds: Array<{ name: string; path: string; size: number }> = [];
    for (const name of names) {
      const path = `${worldsDir}/${name}`;
      const info = await FileSystem.getInfoAsync(path);
      if (info.isDirectory && !name.startsWith('.')) {
        // Check if it looks like a Minecraft world (has level.dat)
        const levelDat = `${path}/level.dat`;
        const levelInfo = await FileSystem.getInfoAsync(levelDat);
        if (levelInfo.exists) {
          worlds.push({ name, path, size: getFileSize(info) });
        }
      }
    }
    return worlds;
  } catch {
    return [];
  }
}

export async function listTemplates(): Promise<WorldTemplate[]> {
  const templatesDir = await getTemplatesDirectory();
  try {
    const names = await FileSystem.readDirectoryAsync(templatesDir);
    const templates: WorldTemplate[] = [];
    for (const name of names) {
      if (!name.endsWith('.zip')) continue;
      const path = `${templatesDir}/${name}`;
      const info = await FileSystem.getInfoAsync(path);
      const id = name.replace('.zip', '');
      templates.push({
        id,
        name: id,
        description: 'Template',
        sourceWorldPath: path,
        createdAt: getFileModificationTime(info),
        size: getFileSize(info),
      });
    }
    return templates.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(dest, { intermediates: true });
  const entries = await FileSystem.readDirectoryAsync(src);
  for (const entry of entries) {
    const srcPath = `${src}/${entry}`;
    const destPath = `${dest}/${entry}`;
    const info = await FileSystem.getInfoAsync(srcPath);
    if (info.isDirectory) {
      await copyDirectory(srcPath, destPath);
    } else {
      await FileSystem.copyAsync({ from: srcPath, to: destPath });
    }
  }
}

export async function duplicateWorld(sourcePath: string, newName: string): Promise<string> {
  const worldsDir = await getWorldsDirectory();
  const destPath = `${worldsDir}/${newName}`;
  const exists = await FileSystem.getInfoAsync(destPath);
  if (exists.exists) {
    throw new Error(`World "${newName}" already exists`);
  }
  await copyDirectory(sourcePath, destPath);
  return destPath;
}

export async function renameWorld(oldPath: string, newName: string): Promise<string> {
  const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
  const newPath = `${parentDir}/${newName}`;
  const exists = await FileSystem.getInfoAsync(newPath);
  if (exists.exists) {
    throw new Error(`World "${newName}" already exists`);
  }
  await FileSystem.moveAsync({ from: oldPath, to: newPath });
  return newPath;
}

export async function deleteWorld(path: string): Promise<void> {
  await FileSystem.deleteAsync(path, { idempotent: true });
}

export async function createTemplateFromWorld(
  worldPath: string,
  templateName: string
): Promise<WorldTemplate> {
  const templatesDir = await getTemplatesDirectory();
  const templatePath = `${templatesDir}/${templateName}.zip`;
  const exists = await FileSystem.getInfoAsync(templatePath);
  if (exists.exists) {
    throw new Error(`Template "${templateName}" already exists`);
  }

  const zip = new AdmZip();
  await addDirectoryToZip(zip, worldPath, '');
  const buffer = zip.toBuffer();

  await FileSystem.writeAsStringAsync(templatePath, buffer.toString('base64'), {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    id: templateName,
    name: templateName,
    description: 'Template created from world',
    sourceWorldPath: templatePath,
    createdAt: Date.now(),
    size: buffer.length,
  };
}

async function addDirectoryToZip(zip: AdmZip, dir: string, zipRoot: string): Promise<void> {
  const entries = await FileSystem.readDirectoryAsync(dir);
  for (const entry of entries) {
    const fullPath = `${dir}/${entry}`;
    const zipPath = zipRoot ? `${zipRoot}/${entry}` : entry;
    const info = await FileSystem.getInfoAsync(fullPath);
    if (info.isDirectory) {
      await addDirectoryToZip(zip, fullPath, zipPath);
    } else {
      const base64 = await FileSystem.readAsStringAsync(fullPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      zip.addFile(zipPath, Buffer.from(base64, 'base64'));
    }
  }
}

export async function createWorldFromTemplate(
  templatePath: string,
  worldName: string
): Promise<string> {
  const worldsDir = await getWorldsDirectory();
  const destPath = `${worldsDir}/${worldName}`;
  const exists = await FileSystem.getInfoAsync(destPath);
  if (exists.exists) {
    throw new Error(`World "${worldName}" already exists`);
  }

  const base64 = await FileSystem.readAsStringAsync(templatePath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const buffer = Buffer.from(base64, 'base64');
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  await FileSystem.makeDirectoryAsync(destPath, { intermediates: true });

  for (const entry of entries) {
    const entryName = entry.entryName;
    const targetPath = `${destPath}/${entryName}`;
    const lastSlash = entryName.lastIndexOf('/');
    if (lastSlash > 0) {
      const dirPath = `${destPath}/${entryName.substring(0, lastSlash)}`;
      try {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      } catch {}
    }
    const data = entry.getData();
    await FileSystem.writeAsStringAsync(targetPath, data.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  return destPath;
}

export async function getWorldProperties(worldPath: string): Promise<Partial<WorldProperties>> {
  try {
    const levelDatPath = `${worldPath}/level.dat`;
    const info = await FileSystem.getInfoAsync(levelDatPath);
    if (!info.exists) return {};

    const base64 = await FileSystem.readAsStringAsync(levelDatPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const gzipData = Buffer.from(base64, 'base64');
    const decompressed = decompressLevelDat(new Uint8Array(gzipData));
    if (!decompressed) return {};

    const nbt = parseNbt(decompressed);
    return extractWorldProperties(nbt);
  } catch {
    return {};
  }
}
