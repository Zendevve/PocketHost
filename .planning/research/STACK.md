# Stack Research — v1.1 Backup & Polish

## 1. Backup/Restore Libraries

### Current Stack
- `expo-file-system` — already in use for JRE/server.jar downloads
- `expo-document-picker` — already used for .jar plugin import
- `js-yaml` — already used for config editing

### Recommended Additions

#### ZIP handling: `admzip` (v2.1.0+)
- **Choice:** `admzip` (npm) — pure JS ZIP library, works in RN without native linking
- **Alternatives:** `react-native-zip-archive` (native, needs linking), `jszip` (larger bundle)
- **Rationale:** admzip supports reading/writing ZIP with good performance; no native module overhead; used widely in RN projects for archive operations
- **Integration:** Call from backup service to compress world folder (`world/` directory) to `.zip` on device storage; extract on restore with safety checks
- **Version:** `^2.1.0` (current as of 2026)

#### Cloud backup: `expo-file-system` + platform-specific APIs
- **Google Drive:** `expo-auth-session` + `expo-web-browser` for OAuth, Drive REST API for file upload
- **Dropbox:** Similar OAuth flow, Dropbox API v2
- **Rationale:** Keep cloud optional; local backup is primary; cloud sync as premium extension
- **Integration:** CloudService module that wraps Drive/Dropbox clients; backup jobs upload after local zip created

#### YAML nested editor: No new library needed
- `js-yaml` already supports nested objects/arrays via `load`/`dump`
- Need UI components only (see FEATURES.md)
- Consider `react-native-json-tree` or custom recursive form

#### JAR metadata: `admzip` (reuse) + custom parser
- JAR = ZIP format; admzip can read entries without extraction
- Read `META-INF/MANIFEST.MF` and `plugin.yml` entries
- Parse `plugin.yml` with existing `js-yaml`
- No separate library required

## 2. Integration Points

| Feature | Integration Point | Current File | Change Type |
|---------|-------------------|--------------|-------------|
| Backup/restore | `serverManager.ts` | `src/services/serverManager.ts` | Extend: add `backupWorld()`, `restoreWorld(backupPath)` methods |
| Backup/restore | Store layer | `src/stores/` | New: `backupStore` (Zustand) for backup history, preferences |
| Config editor | Config editor UI | `src/components/ConfigEditor.tsx` | Modify: switch from flat form to recursive tree editor component |
| Plugin metadata | Plugin service | `src/services/pluginService.ts` | Extend: add `extractMetadata(jarPath)` function, cache results |
| Plugin metadata | Plugin store | `src/stores/pluginStore.ts` | Modify: add `metadata` field to plugin state interface |

## 3. Native/Android Considerations

- Storage permissions: Android Scoped Storage (API 29+) — use `expo-file-system` with `documentDirectory` or `downloadsDirectory`; request `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` if targeting legacy
- Large files: World folders can be GBs; stream ZIP writing (admzip supports streaming); warn users on large operations
- Background operations: Backup/restore should use `expo-task-manager` or extend existing foreground service pattern from Phase 1
- No new Gradle dependencies expected; admzip pure JS avoids rebuilds

## 4. Migration Path

1. Install `admzip@^2.1.0`
2. Add `BackupService.ts` with compression/extraction logic
3. Extend `serverManager.ts` to call BackupService
4. Create `backupStore.ts` with backup history and preferences
5. Update Dashboard UI to add Backup/Restore buttons (disabled during server runtime)
6. Replace ConfigEditor with ConfigTreeEditor component (reuse js-yaml)
7. Add `PluginMetadataExtractor.ts` using admzip to read JAR entries
8. Populate pluginStore.metadata on plugin import and on-demand refresh
