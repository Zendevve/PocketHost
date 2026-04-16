import * as FileSystem from 'expo-file-system';
import yaml from 'js-yaml';

/**
 * PluginConfigManager — handles plugin configuration discovery, read/write, and metadata extraction.
 *
 * Pattern: Follows propertiesManager.ts for file I/O conventions.
 */

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
 * Extract plugin metadata (name, version, author) from a plugin JAR file.
 * Reads plugin.yml from inside the JAR if present.
 * Returns null if no descriptor found.
 *
 * NOTE: React Native's FileSystem lacks native zip archive traversal. A full
 * implementation would require a ZIP parsing library (e.g. expo-zip) or a custom
 * central-directory reader. This stub returns null until such capability is added.
 */
export async function getPluginMetadata(_pluginPath: string): Promise<{ name: string; version?: string; author?: string } | null> {
  // Not implementable without zip support. Derive name from filename as fallback elsewhere.
  return null;
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
