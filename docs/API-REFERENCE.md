# PocketHost API Reference

> Complete function signatures for all PocketHost services, grouped by domain.
> PocketHost v1.3 — Last updated 2026-05-01

---

## Table of Contents

1. [Server Lifecycle](#server-lifecycle)
2. [Console Parsing](#console-parsing)
3. [Backup & Restore](#backup--restore)
4. [Cloud Backup (Google Drive)](#cloud-backup-google-drive)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Analytics](#analytics)
7. [World Management](#world-management)
8. [Player Management](#player-management)
9. [Plugin Management](#plugin-management)
10. [Configuration (server.properties)](#configuration-serverproperties)
11. [Version Management](#version-management)
12. [NBT Parser](#nbt-parser)
13. [Playit.gg Tunneling](#playitgg-tunneling)
14. [Asset Download](#asset-download)

---

## Server Lifecycle

### `serverManager`

Services located at `src/services/serverManager.ts`. Central orchestrator bridging native Android events to Zustand stores.

```typescript
export const serverManager: {
  /** Attach native event listeners (onLog, onStatusChange, onError) to the server process. */
  initializeEventListeners: () => void;

  /** Start the Minecraft server with the active configuration. Sets status to 'starting', clears logs, downloads assets if needed. */
  startServer: () => Promise<void>;

  /** Stop the running Minecraft server process. */
  stopServer: () => void;

  /** Send a raw console command to the running server (e.g. "op", "ban", "save-all"). */
  sendCommand: (command: string) => void;
}
```

**Events handled internally:**
- `onLog` — Parses server output for TPS, memory, player join/leave, player list, and Playit.gg tunnel claims. Updates `useServerStore` and `usePlayerStore`.
- `onStatusChange` — Detects `RUNNING` → starts metrics collection; `STOPPED` → clears players, stops metrics.
- `onError` — Sets server status to `error` with the error message.

---

## Console Parsing

### `console-parser`

Located at `src/services/console-parser.ts`. Parses Minecraft server log lines into typed events.

```typescript
export type LogEvent =
  | { type: 'join'; username: string }
  | { type: 'leave'; username: string }
  | { type: 'list'; count: number; max: number; usernames: string[] }
  | { type: 'tps'; tps1m: number; tps5m: number; tps15m: number }
  | { type: 'memory'; usedMB: number; maxMB: number }
  | { type: 'unknown' };

/** Parse a single server log line into a structured LogEvent. */
export function parseLogLine(line: string): LogEvent;
```

**Regex patterns exported for testing:**
```typescript
export const JOIN_REGEX: RegExp;
export const LEAVE_REGEX: RegExp;
export const LIST_REGEX: RegExp;
```

**Defensive parsing:** Three TPS regex patterns and three memory patterns tried in fallback order. `safeParseFloat` guard ensures non-finite values default to 20 TPS or 1024 MB memory.

---

## Backup & Restore

### `backupService`

Located at `src/services/backupService.ts`.

```typescript
type ProgressCallback = (stage: string, percent: number) => void;

/** Create a ZIP backup of a world directory. Returns the backup path, size in bytes, and validity flag. */
export function createBackup(
  worldPath: string,
  destDir: string,
  onProgress?: ProgressCallback
): Promise<{ path: string; size: number; valid: true }>;

/** Validate a backup ZIP file integrity (checks entry count > 0). */
export function validateBackupFile(backupPath: string): Promise<boolean>;

/** Restore a world from a backup ZIP file. Stops server, moves current world to .old, extracts backup, validates world data (level.dat + region dir), rolls back on failure. */
export function restoreBackup(
  backupPath: string,
  worldPath: string,
  onProgress?: ProgressCallback
): Promise<boolean>;

/** List all backups in the backup store. */
export function listBackups(): Promise<Array<{ path: string; size: number; timestamp: string }>>;
```

**Safety guarantees:**
- Restore validation checks `level.dat` and `region` directory exist after extraction
- Failed restore automatically rolls back to the `.old` directory

---

## Cloud Backup (Google Drive)

### `cloudBackupService`

Located at `src/services/cloudBackupService.ts`. Google Drive OAuth integration using `expo-auth-session`.

```typescript
export interface CloudBackupEntry {
  id: string;
  driveFileId: string;
  name: string;
  size: number;
  timestamp: string;
  worldName: string;
}

/** Set the OAuth access token in memory and AsyncStorage for persistence. */
export function setAccessToken(token: string | null): void;

/** Check if a valid Google Drive session exists by calling the Drive About endpoint. */
export function isSignedIn(): Promise<boolean>;

/** Clear the access token and local cache, signing the user out. */
export function signOut(): Promise<void>;

/** Upload a local backup file to Google Drive in the `PocketHost Backups` folder. Enforces 5 MB simple-upload limit. Supports progress callback. */
export function uploadBackup(
  filePath: string,
  worldName: string,
  onProgress?: (percent: number) => void
): Promise<CloudBackupEntry>;

/** List all backups in the `PocketHost Backups` folder on Google Drive. Updates local cache. */
export function listDriveBackups(): Promise<CloudBackupEntry[]>;

/** Get cached backup list from AsyncStorage (offline access). */
export function getCachedBackups(): Promise<CloudBackupEntry[]>;

/** Download a backup file from Google Drive by its driveFileId. */
export function downloadBackup(
  driveFileId: string,
  destPath: string,
  onProgress?: (percent: number) => void
): Promise<string>;

/** Delete a backup file from Google Drive and update local cache. */
export function deleteDriveBackup(driveFileId: string): Promise<void>;
```

**OAuth flow:** Uses `expo-auth-session` `AuthRequest` with the web client ID from `app.json` → `extra.googleOAuthWebClientId`. See `.github/GOOGLE_DRIVE_SETUP.md` for configuration steps.

**Upload limit:** Simple upload supports up to 5 MB. Resumable upload API not yet implemented.

---

## Monitoring & Metrics

### `metricsService`

Located at `src/services/metricsService.ts`. Tracks server performance metrics over time.

```typescript
export interface MetricsSnapshot {
  timestamp: number;     // Unix milliseconds
  tps: number;           // Ticks per second (20 = full speed)
  memoryUsedMB: number;  // Heap memory in use
  memoryMaxMB: number;   // Max heap memory allocated
  playerCount: number;   // Online players at snapshot time
}

/** Load all stored metrics history from AsyncStorage. */
export function loadMetricsHistory(): Promise<MetricsSnapshot[]>;

/** Save metrics history to AsyncStorage, trimming to the last 288 entries (24h at 5-min intervals). */
export function saveMetricsHistory(history: MetricsSnapshot[]): Promise<void>;

/** Append a metric snapshot to history. Deduplicates within 5-minute windows by updating the last entry. */
export function appendMetric(snapshot: MetricsSnapshot): Promise<MetricsSnapshot[]>;

/** Clear all stored metrics history. */
export function clearMetricsHistory(): Promise<void>;

/** Calculate the average TPS across the history. Defaults to 20 if empty. */
export function calculateAverageTPS(history: MetricsSnapshot[]): number;

/** Calculate the average memory usage (MB) across the history. */
export function calculateAverageMemory(history: MetricsSnapshot[]): number;

/** Get the highest concurrent player count across the history. */
export function calculatePeakPlayers(history: MetricsSnapshot[]): number;

/** Estimate server uptime in minutes from the first to last snapshot timestamp. */
export function calculateUptimeMinutes(history: MetricsSnapshot[]): number;
```

**Collection:** Metrics are collected every 30 seconds while the server is running (via `setInterval` in `serverManager.ts`). History is persisted to a maximum of 288 entries (~24 hours at 5-min granularity).

---

## Analytics

### `analyticsService`

Located at `src/services/analyticsService.ts`. Tracks player sessions, server uptime, and daily activity statistics.

```typescript
export interface PlayerSession {
  username: string;
  joinedAt: number;
  leftAt: number | null;
  durationMinutes: number;
}

export interface ServerSession {
  startedAt: number;
  stoppedAt: number | null;
  durationMinutes: number;
}

export interface DailyStats {
  date: string;               // "YYYY-MM-DD"
  totalPlaytimeMinutes: number;
  peakPlayers: number;
  uniquePlayers: string[];
  sessionCount: number;
}

/** Load player session history from AsyncStorage (last 500 entries). */
export function loadPlayerSessions(): Promise<PlayerSession[]>;

/** Persist player sessions to AsyncStorage. */
export function savePlayerSessions(sessions: PlayerSession[]): Promise<void>;

/** Record a player joining (appends a new unclosed session). */
export function addPlayerJoin(username: string): Promise<void>;

/** Record a player leaving (closes the most recent unclosed session for that player). */
export function addPlayerLeave(username: string): Promise<void>;

/** Load server session history from AsyncStorage (last 100 entries). */
export function loadServerSessions(): Promise<ServerSession[]>;

/** Persist server sessions to AsyncStorage. */
export function saveServerSessions(sessions: ServerSession[]): Promise<void>;

/** Record a server start event (appends a new unclosed session). */
export function recordServerStart(): Promise<void>;

/** Record a server stop event (closes the most recent unclosed session). */
export function recordServerStop(): Promise<void>;

/** Compute daily aggregated statistics from all player and server sessions. Returns sorted array by date. */
export function computeDailyStats(): Promise<DailyStats[]>;

/** Load daily stats from AsyncStorage (last 30 days). */
export function loadDailyStats(): Promise<DailyStats[]>;

/** Persist daily stats to AsyncStorage. */
export function saveDailyStats(stats: DailyStats[]): Promise<void>;

/** Get the top N players by total playtime minutes. */
export function getTopPlayers(
  sessions: PlayerSession[],
  limit?: number
): Array<{ username: string; totalMinutes: number }>;

/** Calculate total server uptime in minutes across all sessions. */
export function getTotalUptimeMinutes(serverSessions: ServerSession[]): number;

/** Calculate average server session length in minutes. */
export function getAverageSessionLength(serverSessions: ServerSession[]): number;
```

---

## World Management

### `worldTemplateService`

Located at `src/services/worldTemplateService.ts`. Manages Minecraft worlds and reusable templates.

```typescript
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

/** Get (or create) the worlds directory: `{documentDirectory}/worlds/`. */
export function getWorldsDirectory(): Promise<string>;

/** Get (or create) the templates directory: `{documentDirectory}/templates/`. */
export function getTemplatesDirectory(): Promise<string>;

/** List all valid Minecraft worlds (directories containing a level.dat file). */
export function listWorlds(): Promise<Array<{ name: string; path: string; size: number }>>;

/** List all template ZIP files in the templates directory. */
export function listTemplates(): Promise<WorldTemplate[]>;

/** Duplicate a world directory to a new name. Throws if name already exists. */
export function duplicateWorld(sourcePath: string, newName: string): Promise<string>;

/** Rename a world directory. Throws if target name already exists. */
export function renameWorld(oldPath: string, newName: string): Promise<string>;

/** Delete a world directory and all its contents. */
export function deleteWorld(path: string): Promise<void>;

/** Create a ZIP template from an existing world directory. */
export function createTemplateFromWorld(
  worldPath: string,
  templateName: string
): Promise<WorldTemplate>;

/** Create a new world directory by extracting a template ZIP. Throws if world already exists. */
export function createWorldFromTemplate(
  templatePath: string,
  worldName: string
): Promise<string>;

/** Read and parse NBT properties from a world's level.dat file. */
export function getWorldProperties(worldPath: string): Promise<Partial<WorldProperties>>;
```

### `worldFileManager`

Located at `src/services/worldFileManager.ts`. Bootstraps new server files.

```typescript
/** Create the server directory structure, download server.jar if needed, write eula.txt. Returns jarPath and worldPath without the file:// prefix. */
export function bootstrapServerFiles(
  config: ServerConfig,
  serverJarUrl: string
): Promise<{ jarPath: string; worldPath: string }>;
```

---

## Player Management

### `playerListManager`

Located at `src/services/playerListManager.ts`. Manages whitelist, ops, and ban lists.

```typescript
export interface PlayerListEntry {
  uuid?: string;
  name?: string;
  ip?: string;
  level?: number;
  bypassesPlayerLimit?: boolean;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
}

export type ListType = 'ops' | 'whitelist' | 'banned-players' | 'banned-ips';

/** Read a player list JSON file (ops.json, whitelist.json, etc.) from the world directory. */
export function getPlayerList(
  worldPath: string,
  listType: ListType
): Promise<PlayerListEntry[]>;

/** Add or remove a player from a list. If the server is running, issues console commands. If offline, edits the JSON file directly (requires Mojang API UUID lookup or offline UUID generation). */
export function modifyPlayerList(
  worldPath: string,
  listType: ListType,
  action: 'add' | 'remove',
  playerName: string,
  isRunning: boolean,
  reason?: string
): Promise<boolean>;
```

**UUID resolution:** When the server is offline, PocketHost attempts a Mojang API lookup. On failure, it generates an offline UUID using an MD5 hash of `"OfflinePlayer:{username}"`.

---

## Plugin Management

### `pluginConfigManager`

Located at `src/services/pluginConfigManager.ts`. Reads, writes, and inspects plugin JAR files.

```typescript
export interface PluginMetadata {
  name: string;
  version?: string;
  author?: string;
  description?: string;
}

/** Find the config file path for a plugin. Checks: `{pluginPath}/config.yml`, `{basename}.yml`, `{basename}.yaml`. Async. */
export function findPluginConfigPath(pluginPath: string): Promise<string | null>;

/** Read a plugin YAML config file and return parsed object. Throws on parse failure. */
export function readPluginConfig(configPath: string): Promise<Record<string, unknown>>;

/** Write a YAML config object to the plugin config file, creating directories if needed. Returns true on success. */
export function writePluginConfig(
  configPath: string,
  config: Record<string, unknown>
): Promise<boolean>;

/** Convert a `file://` URI to a native filesystem path for file I/O libraries. */
export function uriToNativePath(uri: string): string;

/** Check if a JAR file is corrupted/unreadable by attempting to read its central directory via adm-zip. */
export function isCorruptedJar(jarPath: string): Promise<boolean>;

/** Extract plugin metadata from a JAR file. Reads plugin.yml first, falls back to META-INF/MANIFEST.MF. Returns null if no descriptor found. */
export function getPluginMetadata(pluginPath: string): Promise<PluginMetadata | null>;
```

---

## Configuration (server.properties)

### `propertiesManager`

Located at `src/services/propertiesManager.ts`.

```typescript
/** Read server.properties from a world directory. Returns key-value pairs, skipping comments. */
export function readProperties(worldPath: string): Promise<Record<string, string>>;

/** Write properties to server.properties. Preserves existing keys not in the update set and maintains comment lines. Returns true on success. */
export function writeProperties(
  worldPath: string,
  props: Record<string, string>
): Promise<boolean>;
```

---

## Version Management

### `versionManifest`

Located at `src/services/versionManifest.ts`. Fetches Minecraft version metadata from Mojang.

```typescript
/** Fetch all release versions from the Mojang version manifest. Results are cached in memory. */
export function fetchVersions(): Promise<Array<{
  id: string;
  type: 'release' | 'snapshot';
  url: string;
  releaseTime: string;
}>>;

/** Get the direct download URL for the server JAR of a specific Minecraft version. Throws if version not found. */
export function getServerJarUrl(versionId: string): Promise<string>;
```

---

## NBT Parser

### `nbtParser`

Located at `src/services/nbtParser.ts`. Minimal Named Binary Tag parser for Minecraft `level.dat` files.

```typescript
export interface WorldProperties {
  levelName: string;
  gameType: number;
  difficulty: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  time: number;
  dayTime: number;
  randomSeed?: bigint;
  version?: number;
}

/** Decompress a gzip-compressed level.dat buffer using pako inflate. Returns the raw NBT ArrayBuffer. */
export function decompressLevelDat(gzipData: Uint8Array): ArrayBuffer | null;

/** Parse an NBT ArrayBuffer into a JSON-like object tree. Returns null on parse failure. */
export function parseNbt(buffer: ArrayBuffer): Record<string, unknown> | null;

/** Extract well-known world properties from a parsed NBT root (Data compound). */
export function extractWorldProperties(
  nbtRoot: Record<string, unknown> | null
): Partial<WorldProperties>;
```

**Supported tag types:** Byte, Short, Int, Long, Float, Double, String, ByteArray, IntArray, LongArray, List, Compound (root). Big-endian (network byte order).

---

## Playit.gg Tunneling

### `playitService`

Located at `src/services/playitService.ts`. Placeholder for Playit.gg tunnel agent management.

```typescript
class PlayitService {
  /** Set up the Playit.gg tunnel agent. Currently returns a mock address (production requires bundled playit binary). */
  setupPlayitAgent(secretKey: string, serverPort?: number): Promise<string | null>;

  /** Stop the Playit.gg tunnel agent. */
  stopPlayitAgent(): Promise<void>;
}

export const playitService: PlayitService;
```

**Note:** The Playit.gg plugin is injected into the PaperMC server `plugins/` directory automatically. The native `playitService` is a placeholder for future direct binary integration.

---

## Asset Download

### `downloadService`

Located at `src/services/downloadService.ts`. Downloads server assets (JRE, PaperMC JAR, Playit plugin).

```typescript
/** Download required server assets (JRE, PaperMC server.jar, Playit plugin) if not already present. Returns the server directory path. */
export const downloadAssets: (onProgress?: (msg: string) => void) => Promise<string>;
```

**Assets downloaded:**
| Key | Source | Destination |
|-----|--------|-------------|
| `jre` | PojavLauncher JRE17 ARM build | `server/jre.zip` |
| `server` | PaperMC 1.19.4 build 550 | `server/server.jar` |
| `playit` | Playit.gg plugin v0.2.14 | `server/plugins/playit-plugin.jar` |

---

## Stores Reference

All stores use Zustand 5 with persistence via AsyncStorage where appropriate.

| Store | Key | Persisted | Purpose |
|-------|-----|-----------|---------|
| `useServerStore` | `pockethost-server` | configs, activeServerId | Server configs, statuses, console logs |
| `usePlayerStore` | — | no (transient) | Online player list |
| `useBackupStore` | `pockethost-backups` | backups | Local backup history |
| `useCloudBackupStore` | `pockethost-cloud-backup` | backups, isSignedIn | Google Drive backup list |
| `useMetricsStore` | — | no (transient) | Real-time metrics history |
| `useAnalyticsStore` | — | no (transient) | Player/server session data |
| `useWorldStore` | — | no (transient) | World and template lists |
| `useSettingsStore` | `pockethost-settings` | full store | Relay region, memory, crossplay, Playit key |

---

## Types Reference

Located at `src/types/server.ts` and `src/types/player.ts`.

### ServerConfig

```typescript
interface ServerConfig {
  id: string;
  name: string;
  mcVersion: string;
  serverType: 'vanilla' | 'paper' | 'forge' | 'fabric';
  serverJarUrl: string;
  serverJarPath: string;
  worldName: string;
  worldPath: string;
  maxMemoryMB: number;
  relayRegion: 'global' | 'na' | 'eu' | 'ap';
  crossplayEnabled: boolean;
  jvmFlagsOptimized: boolean;
  jvmFlags: string[];
  createdAt: number;
}
```

### ServerState

```typescript
interface ServerState {
  config: ServerConfig;
  status: 'idle' | 'starting' | 'running' | 'stopping' | 'error';
  pid: number | null;
  lanAddress: string | null;
  relayAddress: string | null;
  playitClaimUrl: string | null;
  uptimeSeconds: number;
  memoryUsedMB: number;
  memoryMaxMB: number;
  tps: number;
  error: string | null;
}
```

### Player

```typescript
interface Player {
  uuid: string;
  username: string;
  online: boolean;
  joinedAt: number;
}
```
