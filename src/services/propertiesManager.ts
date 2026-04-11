import * as FileSystem from 'expo-file-system';

export async function readProperties(worldPath: string): Promise<Record<string, string>> {
  const filePath = `file://${worldPath}/server.properties`;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) return {};

    const content = await FileSystem.readAsStringAsync(filePath);
    const lines = content.split('\n');
    const props: Record<string, string> = {};

    for (const line of lines) {
      if (line.trim().startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      props[key.trim()] = rest.join('=').trim();
    }

    return props;
  } catch (e) {
    console.error('Failed to read properties', e);
    return {};
  }
}

export async function writeProperties(worldPath: string, props: Record<string, string>): Promise<boolean> {
  const filePath = `file://${worldPath}/server.properties`;
  try {
    let content = '#Minecraft server properties\n';
    
    // Maintain existing comments/order if we wanted to be perfect, 
    // but for MVP, recreating the file is sufficient since properties are just key/value.
    // However, recreating it completely drops properties we didn't store. 
    // It's safer to read the file, modify only the changed keys, and write back.
    let existingLines: string[] = [];
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(filePath);
      existingLines = raw.split('\n');
    }

    const newProps = { ...props };
    const finalLines = [];

    for (const line of existingLines) {
      if (line.trim().startsWith('#') || !line.includes('=')) {
        finalLines.push(line);
        continue;
      }
      
      const [key] = line.split('=');
      const trimmedKey = key.trim();
      
      if (trimmedKey in newProps) {
        finalLines.push(`${trimmedKey}=${newProps[trimmedKey]}`);
        delete newProps[trimmedKey]; // mark as processed
      } else {
        finalLines.push(line);
      }
    }

    // append any properties that weren't in the original file
    for (const [key, val] of Object.entries(newProps)) {
      finalLines.push(`${key}=${val}`);
    }

    await FileSystem.writeAsStringAsync(filePath, finalLines.join('\n'));
    return true;
  } catch (e) {
    console.error('Failed to write properties', e);
    return false;
  }
}
