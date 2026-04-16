# Architecture Research — v1.1 Backup & Polish

## 1. Existing Architecture recap

**PocketHost v1.0 architecture:**
- `serverManager.ts` — Central bridge to native Android service; handles start/stop/command/status
- Zustand stores: `serverStore`, `pluginStore`, `settingsStore`, `playerStore`
- React Native UI: Dashboard, Console, PluginManagement screen
- Native components: Foreground service, console streaming via events
- Plugin lifecycle: import (.jar copy), enable/disable (symlinks or folder moves), reload (server command)

## 2. Integration Points

### A. Backup/Restore
**Backup flow:**
1. User taps "Backup World" in Dashboard → UI dispatches `backupStore.startBackup(worldName)`
2. `BackupService.backupWorld(worldPath, backupDir)` invoked
   - Check server state via `serverStore.status` → if running, show warning or require stop
   - Compute world folder size, check free space
   - Use admzip to create ZIP stream to `backups/<world>_YYYYMMDD-HHMMSS.zip`
   - Update `backupStore.history` with entry (id, path, size, timestamp, worldName)
   - On completion, show notification/snackbar
3. Optional cloud upload: `CloudService.upload(backupPath)` after local backup finishes

**Restore flow:**
1. User selects backup from history → "Restore" button
2. Confirm dialog showing world name, backup date, current world will be replaced
3. If server running → auto-stop via `serverManager.stopServer()`, wait for stopped
4. `BackupService.restoreWorld(backupPath, worldPath)`:
   - Validate ZIP integrity (CRC)
   - Extract to temp dir first
   - On success, move temp dir to replace current `worlds/<world>/`
   - Update world cache if needed
5. Restart server if it was previously running (optional user choice)
6. Show success/failure notification

**Integration points:**
- `serverManager.ts`: Add `isServerRunning()` check, expose stop/start hooks for restore
- `backupStore.ts`: New Zustand store for backup metadata and operations state
- `BackupService.ts`: New service class (TS) wrapping admzip and file-system ops
- UI: Dashboard screen → add "Backups" panel/modal; backup history list; restore confirmation

**Build order:** Can be implemented independently; no dependencies on other v1.1 features except shared store pattern.

### B. Nested YAML Config Editor
**Current:** Flat key-value editor (ConfigEditor.tsx) reads/writes simple YAML via `js-yaml.dump/load`

**New architecture:**
- Replace `ConfigEditor` with `ConfigTreeEditor` component
- Recursive component: `YamlNode` that renders:
  - Object: collapsible section with key-value pairs
  - Array: list with add/remove/reorder buttons; each item a node
  - Scalar: inline text input/number/boolean toggle
- State: `configStore` holds current YAML string; parse to JS object for editing; dirty flag
- On save: `js-yaml.dump(parsedObject, { noRefs: true, lineWidth: -1 })` → preserve structure; cannot preserve comments (document limitation)
- Validation: On save attempt, re-parse YAML syntax; if error, highlight node; also basic type validation if schema available (optional)

**Integration points:**
- `ConfigEditor.tsx` replaced with `ConfigTreeEditor.tsx`
- `js-yaml` already in dependencies; no change
- Plugin management screen navigation update
- configStore possibly extended for undo/redo (optional polish)

**Build order:** Depends on nothing else in v1.1; can be done in parallel. Must coordinate with plugin UI screens.

### C. Plugin Metadata Extraction
**Current:** PluginService imports JAR to `plugins/` folder; minimal state (name from filename); enable/disable via file ops

**New architecture:**
- New utility `PluginMetadataExtractor.ts`:
  ```ts
  interface PluginMetadata {
    name: string;
    version: string;
    author: string;
    description?: string;
    dependencies?: string[];
    icon?: string; // base64 or temp path
  }
  function extractMetadata(jarPath: string): PluginMetadata | null;
  ```
  - Uses admzip to read `plugin.yml` entry (preferred)
  - Fallback to `META-INF/MANIFEST.MF` fields if plugin.yml missing
  - Handles parse errors gracefully
- `pluginService.ts`: After copying JAR, call extractor, store metadata in `pluginStore`
- `pluginStore.ts`: Extend plugin interface: `{ id, name, enabled, jarPath, metadata: PluginMetadata }`
- UI: Plugin list item shows name, version, author (if available); icon if present

**Integration points:**
- `pluginService.ts` upon import
- Optional: background scan on startup to fill metadata for existing plugins
- `pluginStore.ts` schema change

**Build order:** Independent; can be done in parallel with nested editor. However, both touch plugin UI, so coordinate UI refactor.

## 3. New Components Summary

| Component | Type | Responsibility |
|-----------|------|----------------|
| `BackupService.ts` | Service | ZIP compression/extraction, validation, backup file management |
| `CloudService.ts` | Service | Optional Google Drive/Dropbox upload/download (stubbed in v1.1, maybe later) |
| `backupStore.ts` | Zustand store | Backup history, current operation state, preferences |
| `ConfigTreeEditor.tsx` | React component | Recursive YAML editor with tree navigation |
| `YamlNode.tsx` | React component | Renders individual YAML node (object/array/scalar) |
| `PluginMetadataExtractor.ts` | Utility | Read JAR ZIP entries, parse plugin.yml, return metadata |
| `MetadataCache.ts` | Utility | Optional caching layer to avoid re-scanning JARs |

## 4. Suggested Build Order for v1.1

**Phase 5:** Backup & Restore Core
- Setup admzip, BackupService, backupStore
- Implement manual backup creation and history list
- Implement restore flow with validation and safety prompts
- UI: Backup panel in Dashboard

**Phase 6:** Nested Config Editor
- Replace ConfigEditor with ConfigTreeEditor
- Implement recursion, array/object editing
- Add validation and error handling
- Polish: undo/redo (optional)

**Phase 7:** Plugin Metadata
- Implement PluginMetadataExtractor
- Update pluginService to populate metadata on import
- Update pluginStore and UI list items to display metadata
- Optional: background metadata scan for existing plugins

**Phase 8:** Integration & Polish
- Harden backup against edge cases (large worlds, interruptions)
- Add cloud backup stub or basic Google Drive integration
- Config editor type hints and search
- Backup scheduling (stub or basic)

**Rationale:** Backup is independent and high-user-value → deliver first. Config editor and metadata both touch plugin management UI → separate to avoid merge conflicts; metadata smaller so can follow config editor. Polish last.

## 5. Data Flow Changes

```
Backup flow:
Dashboard → backupStore.startBackup → BackupService.backupWorld (admzip) → file written → store updated → UI refresh

Restore flow:
Dashboard (select backup) → confirm dialog → backupStore.startRestore → serverManager.stopServer → BackupService.restoreWorld → (success) → serverManager.startServer (optional) → UI notifications

Config edit flow:
ConfigEditor screen → configStore.parse YAML → ConfigTreeEditor (edit) → onSave: js-yaml.dump → configStore.update → serverManager.reloadConfig (if live)

Metadata flow:
Plugin import (pluginService) → extractMetadata(jar) → pluginStore.update plugin.metadata → UI re-render plugin card
```

## 6. Build Order Considerations

- **Parallelizable:** Config editor and metadata extraction can be developed simultaneously (no shared state). Backup must be sequential due to size.
- **Test dependencies:** Backup needs integration test with large files; metadata needs sample plugin JAR fixtures.
- **UI coordination:** Both Config editor and plugin metadata update same screen → coordinate final merge in Phase 8.
