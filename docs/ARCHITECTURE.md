# PocketHost Architecture

> PocketHost v1.3 — Last updated 2026-05-01

This document describes the layered architecture of PocketHost, an Android app for self-hosting Minecraft Java Edition servers from a mobile device.

---

## Overview

PocketHost follows a **4-layer React Native architecture**:

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                 │
│  app/ (24 screens via Expo Router)                  │
│  src/components/ui/ (10 reusable components)        │
├─────────────────────────────────────────────────────┤
│  STATE LAYER                                        │
│  src/stores/ (8 Zustand stores)                     │
├─────────────────────────────────────────────────────┤
│  SERVICE LAYER                                      │
│  src/services/ (15 service modules)                 │
│  src/lib/ (config, theme, utilities)                │
│  src/types/ (TypeScript interfaces)                 │
├─────────────────────────────────────────────────────┤
│  NATIVE LAYER                                       │
│  modules/server-process/ (Android Java module)      │
│  expo-file-system (document directory I/O)          │
│  expo-auth-session (OAuth flows)                    │
└─────────────────────────────────────────────────────┘
```

---

## Layer 1: Presentation (Screens & Components)

### Routing

PocketHost uses **Expo Router v4** with file-system based routing. The root layout (`app/_layout.tsx`) wraps the entire app in `SafeAreaProvider` and sets dark theme defaults.

**Navigation tree:**

```
_layout.tsx                          (root — Stack navigator, dark theme)
├── index.tsx                        (home screen)
├── setup/
│   ├── index.tsx                    (server setup wizard)
│   ├── create.tsx                   (create new server config)
│   └── import.tsx                   (import existing world)
├── server/
│   ├── _layout.tsx                  (server Stack with shared header)
│   ├── dashboard.tsx                (main dashboard — start/stop, status, join address)
│   ├── console.tsx                  (live console output viewer)
│   ├── properties.tsx               (server.properties editor)
│   ├── monitoring.tsx               (TPS/memory/player metrics charts)
│   └── analytics.tsx                (playtime, sessions, daily stats)
├── players/
│   ├── _layout.tsx                  (player tabs)
│   ├── index.tsx                    (online players list)
│   ├── whitelist.tsx                (whitelist management)
│   ├── bans.tsx                     (ban list management)
│   └── ops.tsx                      (operator list management)
├── plugins/
│   ├── _layout.tsx                  (plugin tabs)
│   ├── index.tsx                    (installed plugins list)
│   ├── import.tsx                   (import .jar file)
│   └── [plugin].tsx                 (plugin detail with config editor)
├── backup/
│   ├── _layout.tsx                  (backup tabs)
│   ├── index.tsx                    (local backup list)
│   ├── cloud.tsx                    (Google Drive backup list)
│   └── restore.tsx                  (backup restore flow)
├── worlds/
│   └── index.tsx                    (world management — list, duplicate, rename, delete, templates)
└── settings.tsx                     (app settings — relay region, crossplay, memory, Playit key)
```

### UI Components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button.tsx` | Primary/danger/green button with loading state |
| `Card.tsx` | Container with surface background, rounded corners, border |
| `Input.tsx` | Text input with label and error message |
| `Toggle.tsx` | Binary switch/checkbox control |
| `Badge.tsx` | Status badge (online/offline/running/error) |
| `Console.tsx` | Scrollable monospace log viewer with auto-scroll |
| `ConfigEditor.tsx` | Simple key-value property editor |
| `ConfigTreeEditor.tsx` | Nested YAML tree editor with inline editing and add/remove support |
| `YamlNode.tsx` | Recursive YAML tree node renderer |
| `BackupCard.tsx` | Backup entry card with size, timestamp, and actions |

All components use the shared theme from `src/lib/theme.ts`:

```typescript
colors = {
  bg: '#0f0f0f',         // screen background
  surface: '#1a1a1a',    // card backgrounds
  border: '#2a2a2a',     // card borders
  text: '#e5e5e5',       // primary text
  textMuted: '#9ca3af',  // secondary text
  primary: '#4ade80',    // accent / success green
  primaryDark: '#16a34a',// darker green
  danger: '#ef4444',     // error / destructive red
  surfaceHover: '#262626'// slightly lighter surface
};
```

---

## Layer 2: State (Zustand Stores)

PocketHost uses **Zustand 5** for global state management. Each domain has its own store.

### Store Architecture

```
useServerStore (persisted: configs, activeServerId)
├── configs: ServerConfig[]
├── activeServerId: string | null
├── statuses: Record<string, ServerState>
├── consoleLogs: Record<string, string[]>
├── backupStatus / lastBackupTime / backupError
└── Actions: addConfig, removeConfig, setActive, setStatus, appendLog, etc.

usePlayerStore (transient — rebuilt each server session)
├── players: Player[]
└── Actions: setPlayers, addOrUpdatePlayer, removePlayer, clear

useBackupStore (persisted)
├── backups: BackupEntry[]
└── Actions: addBackup, removeBackup, clearHistory

useCloudBackupStore (persisted: backups, isSignedIn)
├── backups: CloudBackupEntry[]
├── isSignedIn, isLoading, uploadProgress, downloadProgress, error
└── Actions: setBackups, addBackup, removeBackup, etc.

useMetricsStore (transient — rebuilt each server session)
├── history: MetricsSnapshot[] (max 288 entries)
├── latest: MetricsSnapshot | null
├── isCollecting: boolean
└── Actions: setHistory, appendMetric, setLatest, clearHistory

useAnalyticsStore (transient)
├── playerSessions: PlayerSession[]
├── serverSessions: ServerSession[]
├── dailyStats: DailyStats[]
└── Actions: set*, add*

useWorldStore (transient)
├── worlds: WorldEntry[]
├── templates: WorldTemplate[]
└── Actions: setWorlds, setTemplates, addTemplate, removeTemplate

useSettingsStore (persisted: full store)
├── relayRegion, crossplayEnabled, maxMemoryMB
├── autoBackup, gdriveLinked, playitSecretKey
└── Actions: individual setters for each field
```

**Persistence pattern:** Persisted stores use `zustand/middleware` `persist` with `createJSONStorage(() => AsyncStorage)`. The `partialize` option selects which fields to persist. Stores that are rebuilt on server restart (player, metrics, analytics) are not persisted.

---

## Layer 3: Services (Business Logic)

Services form the middle layer, bridging native events to stores and providing business logic.

### Data Flow

```
Native Module (onLog event)
  → serverManager.initializeEventListeners()
    → parseLogLine() — regex matching
    → useServerStore.setStatus() — TPS/memory updates
    → usePlayerStore.addOrUpdatePlayer() — player join/leave
    → metricsService.appendMetric() — periodic snapshot
    → analyticsService.addPlayerJoin() — session tracking
    → analyticsService.recordServerStart() — on RUNNING
    → analyticsService.recordServerStop() — on STOPPED
```

### Service Dependency Map

```
serverManager
├── serverStore (status, logs)
├── playerStore (online players)
├── metricsStore (snapshots)
├── metricsService (persisted metrics)
├── analyticsService (session tracking)
├── console-parser (log parsing)
└── downloadService (asset download)

backupService
├── backupStore (backup entries)
├── serverStore (status, error)
└── serverManager (stop/start for restore)

cloudBackupService
├── AsyncStorage (token cache, backup cache)
└── FileSystem (file I/O)

worldTemplateService
├── FileSystem (directory I/O)
├── AdmZip (template zip/unzip)
└── nbtParser (level.dat reading)

pluginConfigManager
├── FileSystem (config file I/O)
├── js-yaml (YAML parse/dump)
└── AdmZip (JAR inspection)
```

### Key Design Patterns

1. **Event-driven log parsing:** Native Java process emits log lines via `NativeEventEmitter`. The `serverManager` attaches listeners that parse lines with regex patterns and update stores accordingly.

2. **Callback-based progress:** Long operations (backups, restores, uploads, downloads) accept an optional `onProgress` callback for real-time UI feedback.

3. **Defensive parsing:** Console parser uses three fallback regex patterns for both TPS and memory to handle PaperMC/Spigot/Vanilla output variations. `safeParseFloat` guards against non-finite values.

4. **Rollback safety:** Backup restore moves the current world to `.old`, extracts the backup, validates `level.dat` + `region/` exist, and rolls back on failure.

5. **Offline UUID generation:** When the server is stopped, player list modifications use a pure-JS MD5-based offline UUID generator (`"OfflinePlayer:{username}"`) with Mojang API fallback.

---

## Layer 4: Native (Android Module)

### Server Process Module (`modules/server-process/`)

A custom Expo native module written in Java that:

- Spawns a JVM process running PaperMC 1.19.4
- Streams `stdout`/`stderr` to React Native via `NativeEventEmitter`
- Reports process lifecycle status (STARTING, RUNNING, STOPPED, ERROR)
- Accepts console commands via `sendCommand()`
- Runs as an Android Foreground Service (notification-visible background execution)

**Exported methods:**
```java
startServer(jarPath, memoryLimit, worldDir, jvmFlags)  // spawn JVM
stopServer()                                             // kill process
sendCommand(command)                                     // write to stdin
```

**Events emitted:**
- `onLog` — `{ log: string }` — one line of server output
- `onStatusChange` — `{ status: "RUNNING" | "STOPPED" | "ERROR" }` — process lifecycle
- `onError` — `{ message: string }` — crash details

### Dependency Stack

```
React Native 0.76
├── Expo ~52.0 (managed workflow)
├── Expo Router 4 (file-system routing)
├── Expo Modules API (native module bridge)
│   └── expo-file-system (document directory access)
│   └── expo-document-picker (file import)
│   └── expo-auth-session (Google OAuth)
│   └── expo-web-browser (auth redirect)
│   └── expo-crypto (random bytes)
│   └── expo-asset (bundled assets)
│   └── expo-clipboard (clipboard copy)
│   └── expo-haptics (haptic feedback)
│   └── expo-status-bar (status bar theming)
├── Zustand 5 (state management)
├── AsyncStorage (key-value persistence)
├── adm-zip (ZIP/JAR I/O)
├── js-yaml (YAML config parsing)
├── pako (gzip decompression for NBT)
├── axios (HTTP for Mojang API)
└── react-native-qrcode-svg (QR code generation)
```

---

## File System Layout

### Runtime Directories

```
{documentDirectory}/
├── server/
│   ├── server.jar                          (PaperMC JAR)
│   ├── jre.zip                             (ARM JRE)
│   └── plugins/
│       └── playit-plugin.jar               (auto-injected)
├── worlds/
│   └── {worldName}/                        (Minecraft world data)
│       ├── level.dat                       (NBT world metadata)
│       ├── region/                         (chunk data)
│       ├── server.properties               (server config)
│       ├── ops.json                        (operator list)
│       ├── whitelist.json                  (whitelist entries)
│       ├── banned-players.json             (player bans)
│       ├── banned-ips.json                 (IP bans)
│       └── eula.txt                        (EULA acceptance)
├── templates/
│   └── {templateName}.zip                  (world template archives)
└── mcs_backups/                            (local backup directory)
    └── pockethost-backup-{timestamp}.zip   (backup files)
```

### AsyncStorage Keys

| Key | Purpose |
|-----|---------|
| `pockethost-server` | ServerStore (configs, activeServerId) |
| `pockethost-backups` | BackupStore (local backup entries) |
| `pockethost-cloud-backup` | CloudBackupStore (Drive backups, signed-in state) |
| `pockethost-settings` | SettingsStore (all settings) |
| `pockethost_metrics_history` | MetricsSnapshot[] history |
| `pockethost_player_sessions` | PlayerSession[] (last 500) |
| `pockethost_server_sessions` | ServerSession[] (last 100) |
| `pockethost_daily_stats` | DailyStats[] (last 30 days) |
| `gdrive_access_token` | Google Drive OAuth token |
| `gdrive_backups_cache` | Cached drive backup list |

---

## Metrics Collection Flow

```
Server starts (status: RUNNING)
  → serverManager.startMetricsCollection()
    → setInterval(30000ms):
      1. Read server status from useServerStore
      2. Read online players from usePlayerStore
      3. Build MetricsSnapshot { timestamp, tps, memoryUsedMB, memoryMaxMB, playerCount }
      4. useMetricsStore.appendMetric() — in-memory (5-min dedup)
      5. metricsService.appendMetric() — persisted to AsyncStorage (5-min dedup, max 288)
```

---

## Google Drive OAuth Flow

```
1. App reads googleOAuthWebClientId from app.json → extra field
2. User taps "Sign in with Google" on backup/cloud screen
3. expo-auth-session AuthRequest opens Chrome Custom Tab
4. Google consent screen → user grants drive.file scope
5. OAuth callback → access token stored via setAccessToken()
6. Token persisted to AsyncStorage for session resumption
7. All Drive API calls use Bearer token in Authorization header
8. signOut() clears token from memory and AsyncStorage
```

---

## Test Architecture

Tests live in `src/services/__tests__/` and use **Jest 29** with **ts-jest**.

```
jest.config.js
├── preset: ts-jest
├── testEnvironment: node
├── testMatch: **/__tests__/**/*.test.ts
├── moduleNameMapper:
│   ├── expo-file-system → src/__mocks__/expo-file-system.ts
│   └── async-storage → src/__mocks__/async-storage.ts
└── collectCoverageFrom: src/services/**/*.ts
```

**Test suites (47 tests total):**
| Suite | Tests | Focus |
|-------|-------|-------|
| `console-parser.test.ts` | 10 | Join/leave regex, TPS/memory patterns, error codes |
| `metricsService.test.ts` | 8 | History I/O, dedup, calculations (avg TPS, peak players, uptime) |
| `analyticsService.test.ts` | 12 | Session tracking, daily stats, top players |
| `nbtParser.test.ts` | 7 | Decompression, tag parsing, property extraction |
| `pluginConfigManager.test.ts` | 10 | Config path discovery, read/write, metadata extraction |
