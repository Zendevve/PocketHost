# Pitfalls Research — v1.1 Backup & Polish

## 1. Backup & Restore Pitfalls

| Pitfall | Impact | Prevention | Phase |
|---------|--------|------------|-------|
| Backup interrupted (app crash, power loss) → partial/corrupted ZIP | High | Atomic write: write to temp file, then rename; admzip streaming with error events; checksum (CRC) validation on completion | 5 |
| Restore overwrites current world without confirmation → data loss | Critical | Dual confirmation dialogs (text input world name to confirm); require manual server stop; show backup metadata prominently | 5 |
| Restore when server running → file lock errors, world corruption | High | Auto-stop server before restore; wait for stopped state; block restore if server won't stop | 5 |
| Large world (>2GB) causes OOM or timeout during ZIP | High | Stream ZIP in chunks; show progress; allow cancel; warn user of duration; increase Node heap? (unlikely in RN) | 5 |
| Insufficient storage → backup fails mid-way | Medium | Pre-check free space > world size × 1.2 (ZIP overhead); fail early with clear error | 5 |
| Backup retention uncontrolled → fills device storage | Medium | Retention policy UI: keep last N backups OR total size limit; auto-delete oldest | 6 (polish) |
| Cloud sync conflicts (if implemented) → backup overwritten | Medium | Use versioned filenames; avoid overwrite; detect conflicts via ETag/checksum | 8 (polish) |
| Backup file name collisions → overwrite old backup | Low | Timestamp in filename (ISO format) ensures uniqueness | 5 |

### Additional Risks
- Android Scoped Storage permissions: `expo-file-system` needs proper directory access; test on Android 13+; request legacy external storage if targeting older
- Backup validation: Simple CRC check on ZIP central directory; not bulletproof but deters casual corruption

## 2. Nested YAML Config Editor Pitfalls

| Pitfall | Impact | Prevention | Phase |
|---------|--------|------------|-------|
| YAML formatting/comments lost on save | Medium | Document that comments are not preserved; use `noRefs: true, lineWidth: -1` to keep minimal formatting; consider preserving comments via custom tags (complex, defer) | 6 |
| Type coercion: string "123" vs number 123 → plugin behavior changes | Medium | Type inference: if original value was number, keep number on edit; on save, validate against expected type (if known) and warn | 6 |
- Anchors/aliases lost or duplicated | Low | Use yaml.IDENT options to preserve; or forbid editing nodes with anchors (display warning) | 6 |
| Deeply nested config (10+ levels) → UI navigation painful | Low | Flatten view breadcrumbs; add "go to parent" button; limit depth expansion to 5 by default (virtualized) | 6 |
| Large arrays (50+ items) → performance lag | Medium | Virtualized list for array items; pagination or lazy loading | 6 |
- Editing produces invalid YAML → config breaks plugin | Critical | Real-time validation: parse dump after each edit; catch errors and highlight node; prevent save if invalid | 6 |
- Undo/redo not implemented → user mistakes irreversible | Medium | Optional: implement simple undo stack (Zustand with history); mark as polish | 8 |
- Unexpected default values merged from plugin.yml on reload | Low | On load, distinguish user-edited vs default; keep original user config separate; merge only on plugin update | 6 |

## 3. Plugin Metadata Extraction Pitfalls

| Pitfall | Impact | Prevention | Phase |
|---------|--------|------------|-------|
| JAR is corrupt or not a valid ZIP → extractor throws, plugin list freezes | Medium | Wrap extraction in try/catch; on failure set metadata = null; continue listing plugin | 7 |
| `plugin.yml` missing or malformed YAML → no metadata | Low | Fallback to MANIFEST.MF fields (Implementation-Title, Version); still show partial | 7 |
| JAR encoding issues (non-UTF8) → parse errors | Low | Use yaml.safeLoad with explicit UTF-8; admzip gives Buffer → decode('utf8', { fatal: false }) | 7 |
- Multiple versions of same plugin installed → metadata confusion | Low | Enforce single version; or show latest metadata; dedupe by plugin name | 7 |
- Security: malicious plugin.yml with path traversal entries | Low | Sanitize ZIP entry names when reading; only read known paths (`plugin.yml`, `META-INF/MANIFEST.MF`, `icon.png`) | 7 |
| Performance: scanning entire plugin folder on every app start → slow | Low | Cache metadata to file (JSON); invalidate on plugin import/delete; background scan with debounce | 7 |
- Metadata out of date after plugin update (new version) → stale cache | Medium | Invalidate cache on plugin enable/disable/reload; re-extract on demand | 7 |

## 4. Integration Pitfalls

| Pitfall | Impact | Prevention | Phase |
|---------|--------|------------|-------|
| Backup operations run on UI thread → jank, ANR | High | Offload to background via `expo-task-manager` or native service extension; keep main thread for notifications only | 5 |
| Long backup/restore shows no progress → user thinks app frozen | Medium | Stream progress events to Zustand; UI shows progress bar with % and ETA | 5 |
| State race: backup starts while server starting → inconsistent | Low | Use store state machine: `backupStatus: idle | running | error`; guard entry points | 5 |
| Config editor and plugin list both update plugin state → race conditions | Low | Single source of truth: pluginStore; both components dispatch actions; use immer or careful updates | 6–7 |
- Config editor saves while server running → plugin reload needed but not automatic | Medium | On config save, if server running, dispatch server command `/pbreload <plugin>` via console; else just save file | 6 |
- Permissions: backup storage access denied (Android 13 scoped storage) | Critical | Request `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`? Actually need `READ_EXTERNAL_STORAGE` for downloads folder; use `expo-file-system` getContentUriAsync; fallback to app-specific directory | 5 |
- File picker for restore backup: user picks file from unknown location → path handling errors | Low | Use `expo-document-picker` copy to app cache before extracting; validate extension `.zip` | 5 |

## 5. Phase Assignment Summary

- **Phase 5 (Backup Core):** Addresses backup/restore pitfalls: atomic writes, validation, server stop locking, storage pre-check, permission handling, progress reporting
- **Phase 6 (Config Editor):** Addresses YAML pitfalls: type coercion, validation, anchors, large arrays, undo/redo (optional)
- **Phase 7 (Metadata):** Addresses JAR parsing pitfalls: corruption handling, fallback, caching, security sanitization
- **Phase 8 (Polish):** Backup retention, cloud sync, undo/redo, config search, etc.

## 6. Emergency Mitigation

If backup corruption reported in production:
- Immediately disable backup feature via remote config flag
- Provide manual instructions for users to copy world folder via file manager
- Investigate ZIP write path, temp file handling, and rename atomicity

If config editor breaks plugin configs:
- Add "Reset to original" button that restores from disk copy (keep pre-edit backup of YAML string)
- Revert to flat editor temporarily until nested issues resolved

If metadata extraction crashes app:
- Wrap all extractor calls in try/catch at call sites; default to showing filename only
- Release hotfix that disables metadata scan on startup (on-demand only)
