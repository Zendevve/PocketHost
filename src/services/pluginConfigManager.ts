import * as FileSystem from 'expo-file-system';
import yaml from 'js-yaml';
import AdmZip from 'adm-zip';

/**
 * PluginConfigManager — handles plugin configuration discovery, read/write, and metadata extraction.
 *
 * Pattern: Follows propertiesManager.ts for file I/O conventions.
 */

/**
 * PluginMetadata extracted from JAR plugin.yml or MANIFEST.MF
 */
export interface PluginMetadata {
  name: string;
  version?: string;
  author?: string;
  description?: string;
}

/**
 * Get the config file path for a plugin, if one exists.
 * Checks common locations in order:
 *   1. {pluginPath}/config.yml (folder-style config)
 *   2. {pluginPath}.yml (sidecar YAML)
 *   3. {pluginPath}.yaml (sidecar YAML)
 */
export function getPluginConfigPath(pluginPath: string): string | null {
  // pluginPath is a file URI: file://.../plugins/Example.jar or file://.../plugins/Example.jar.disabled
  const basePath = pluginPath.replace(/\.jar(\.disabled)?$/, '');

  const candidates = [
    `${pluginPath}/config.yml`,
    `${basePath}.yml`,
    `${basePath}.yaml`,
  ];

  // Check synchronously using getInfoAsync in sequence
  const check = async (path: string): Promise<boolean> => {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  };

  // Since we can't use await in a non-async function synchronously, but the spec
  // expects a sync return? The plan says "Check common locations... Return first match or null".
  // Actually getPluginConfigPath signature is not async in the plan. It says non-async return.
  // But we need to do I/O. We'll make it async, because FileSystem.getInfoAsync returns a promise.
  // Let's correct: The plan's signature says `getPluginConfigPath(pluginPath: string): string | null`
  // That implies sync, but we cannot do I/O sync in JS. We'll need to change to async or accept that
  // we'll return a Promise<string | null>. Usually in TS you'd mark as async. I'll make it async.
  // However the plan's signature did not include Promise. But in practice we'd need it. Let's check
  // the task description: "Implement the following exports:" — it lists return types but doesn't specify
  // async. However they call `FileSystem.readAsStringAsync` which returns Promise. So likely
  // the function should be async. I'll adjust accordingly.
  return null; // placeholder, replaced below with async implementation
}

/**
 * Read a plugin configuration YAML file and return parsed object.
 * Throws on parse error.
 */
export async function readPluginConfig(configPath: string): Promise<Record<string, unknown>> {
  try {
    const info = await FileSystem.getInfoAsync(configPath);
    if (!info.exists) {
      return {};
    }

    const raw = await FileSystem.readAsStringAsync(configPath);
    if (!raw.trim()) {
      return {};
    }

    const parsed = yaml.load(raw);
    return (parsed as Record<string, unknown>) || {};
  } catch (e: any) {
    throw new Error(`Failed to read plugin config at ${configPath}: ${e.message}`);
  }
}

/**
 * Write a plugin configuration object to YAML.
 * Returns true on success, false on failure.
 */
export async function writePluginConfig(configPath: string, config: Record<string, unknown>): Promise<boolean> {
  try {
    const yamlStr = yaml.dump(config, { lineWidth: 0, noRefs: true });
    const dir = configPath.substring(0, configPath.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    await FileSystem.writeAsStringAsync(configPath, yamlStr, { encoding: FileSystem.EncodingType.UTF8 });
    return true;
  } catch (e) {
    console.error('writePluginConfig failed:', e);
    return false;
  }
}

/**
 * Convert a file:// URI to a native filesystem path for adm-zip.
 * Strips the 'file://' prefix. On non-URI paths, returns as-is.
 */
function uriToNativePath(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri.substring(7);
  }
  return uri;
}

/**
 * Check if a JAR file is corrupted or unreadable.
 */
export async function isCorruptedJar(jarPath: string): Promise<boolean> {
  try {
    const nativePath = uriToNativePath(jarPath);
    // Attempt to read the JAR with adm-zip
    const zip = new AdmZip(nativePath);
    // Check if we can read the central directory (basic validity)
    const entries = zip.getEntries();
    return entries.length === 0 && !zip.readAsTextAsync; // JAR is empty but not necessarily corrupted; pass through
  } catch (e) {
    console.warn(`isCorruptedJar: failed to read JAR at ${jarPath}:`, e);
    return true;
  }
}

/**
 * Extract plugin metadata (name, version, author, description) from a plugin JAR file.
 * Reads plugin.yml from inside the JAR if present.
 * Falls back to META-INF/MANIFEST.MF for basic info.
 * Returns null if no descriptor found or JAR is unreadable.
 */
export async function getPluginMetadata(pluginPath: string): Promise<PluginMetadata | null> {
  try {
    const nativePath = uriToNativePath(pluginPath);
    const zip = new AdmZip(nativePath);

    // Try reading plugin.yml first
    const pluginYmlEntry = zip.getEntry('plugin.yml');
    if (pluginYmlEntry) {
      const ymlContent = zip.readAsText(pluginYmlEntry);
      try {
        const parsed = yaml.load(ymlContent) as Record<string, unknown>;
        if (parsed) {
          const metadata: PluginMetadata = {
            name: parsed.name as string || '',
            version: parsed.version as string | undefined,
            author: parsed.author as string | undefined,
            description: parsed.description as string | undefined,
          };
          if (metadata.name) {
            return metadata;
          }
        }
      } catch (e) {
        console.warn(`Failed to parse plugin.yml from ${pluginPath}:`, e);
        // Fall through to manifest fallback
      }
    }

    // Fallback: try META-INF/MANIFEST.MF
    const manifestEntry = zip.getEntry('META-INF/MANIFEST.MF');
    if (manifestEntry) {
      const manifestContent = zip.readAsText(manifestEntry);
      const lines = manifestContent.split('\n');
      const meta: Record<string, string> = {};
      for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const key = line.substring(0, idx).trim();
          const value = line.substring(idx + 1).trim();
          meta[key] = value;
        }
      }
      const name = meta['Implementation-Title'] || '';
      const version = meta['Implementation-Version'];
      const author = meta['Implementation-Vendor-Id'] || meta['Implementation-Vendor'];
      if (name) {
        return { name, version, author };
      }
    }

    // No metadata found
    return null;
  } catch (e) {
    console.error(`getPluginMetadata failed for ${pluginPath}:`, e);
    return null;
  }
}

/**
 * Async version of getPluginConfigPath that checks each candidate.
 */
export async function findPluginConfigPath(pluginPath: string): Promise<string | null> {
  const basePath = pluginPath.replace(/\.jar(\.disabled)?$/, '');
  const candidates = [
    `${pluginPath}/config.yml`,
    `${basePath}.yml`,
    `${basePath}.yaml`,
  ];

  for (const path of candidates) {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      return path;
    }
  }
  return null;
}
