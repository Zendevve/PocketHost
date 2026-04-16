# Research Synthesis — v1.1 Backup & Polish

## Project Context
**Milestone:** v1.1 Backup & Polish  
**Scope:** World backup/restore workflows, nested YAML config editor, plugin metadata extraction  
**Research dimensions:** Stack, Features, Architecture, Pitfalls

---

## Stack Additions

| Library/Component | Purpose | Version | Notes |
|-------------------|---------|---------|-------|
| `admzip` | ZIP read/write for backups and JAR metadata | ^2.1.0 | Pure JS, no native linking required; reuse for both backups and metadata |
| (expo-file-system) | Already present; used for file I/O, downloads dir access | — | No change needed |
| (expo-document-picker) | Already present; used for backup restore file selection | — | Already used for plugin import |
| (js-yaml) | Already present; handles nested structures natively | — | No change needed |

**Integration:**
- New `BackupService.ts` — wraps admzip for backup creation and restore extraction
- Extend `serverManager.ts` with `backupWorld()` and `restoreWorld()` methods
- New Zustand `backupStore.ts` — tracks backup history and operation state
- `PluginMetadataExtractor.ts` — uses admzip to read `plugin.yml` and `MANIFEST.MF` from JARs
- `pluginStore.ts` — extend plugin state with `metadata` field

No native Gradle changes expected; admzip is pure JS.

---

## Feature Table Stakes

### Backup & Restore
- **Must-have:** Manual backup creation, backup history list (timestamp, size), restore from selected backup with confirmation dialog, server stop requirement before restore, ZIP integrity validation, operation progress display
- **Complexity:** High (state management, file I/O, user confirmation flows)
- **Dependencies:** admzip, storage permissions, server state

### Nested YAML Config Editor
- **Must-have:** Tree view (expandable objects/arrays), inline scalar editing, add/remove array items and object keys, YAML round-trip without syntax loss, real-time validation
- **Complexity:** Medium (recursive UI, but js-yaml already handles parsing)
- **Dependencies:** ConfigTreeEditor component replacing flat ConfigEditor

### Plugin Metadata
- **Must-have:** Name, version, author, description from plugin.yml; fallback to MANIFEST.MF; display in plugin list cards
- **Complexity:** Low (ZIP entry read + YAML parse)
- **Dependencies:** admzip reuse, pluginStore update, UI card redesign

---

## Architecture Integration

**New components:**
- `BackupService.ts` — backup/restore operations, admzip orchestration
- `backupStore.ts` — backup history and state
- `ConfigTreeEditor.tsx` + `YamlNode.tsx` — recursive YAML editor
- `PluginMetadataExtractor.ts` — JAR metadata reader

**Modified components:**
- `serverManager.ts` — add backup/restore methods, server stop hooks for restore
- `pluginStore.ts` — add metadata field per plugin
- `pluginService.ts` — call metadata extractor after JAR import
- Config screen UI — replace ConfigEditor with ConfigTreeEditor

**Data flow:**
- Backup: Dashboard → backupStore.startBackup → BackupService (admzip) → file written → store updated → UI toast
- Restore: Dashboard (select) → confirm dialog → backupStore.startRestore → serverManager.stop → BackupService.extract → optional restart → UI notify
- Config edit: Config screen → parse YAML → tree editor (mutate object) → js-yaml.dump → save → server reload if running
- Metadata: Plugin import → extractMetadata(jar) → pluginStore.update → UI re-render

**Suggested build order:**
1. Phase 5: Backup/restore core (standalone, high value)
2. Phase 6: Nested config editor (touches plugin UI but independent)
3. Phase 7: Plugin metadata extraction (small, touches same UI area)
4. Phase 8: Polish (cloud backup stub, retention, undo/redo, config search)

**Rationale:** Backup first because independent and user-critical. Config and metadata parallelizable but merge-coordinated in final phase.

---

## Watch Out For

### Critical Pitfalls
- **Backup corruption mid-write** → use atomic temp-file + rename; validate ZIP after creation
- **Restore overwrite without warning** → dual confirmation (dialog + world name text input); require server stopped
- **Restore while server running** → auto-stop before restore; block restore if stop fails
- **Large world OOM** → stream ZIP; show progress; warn user; consider chunked buffer
- **Config editor produces invalid YAML** → real-time validation; prevent save on error; highlight node

### High-Impact Pitfalls
- **Storage permission failures (Android Scoped Storage)** → request correct permissions; use app-specific directory as fallback
- **No progress indication during backup/restore** → stream events to store; UI progress bar with % and ETA
- **Metadata extraction crashes on malformed JAR** → try/catch all ZIP operations; show "unavailable" gracefully

### Medium-Impact Pitfalls
- **YAML comments/anchors lost** → document limitation; try to preserve anchors via custom YAML tags if feasible (polish)
- **Backup retention fills disk** → implement keep-last-N or size-limit policy in Phase 6 polish
- **Metadata cache stale** → invalidate on plugin import/enable/disable; background scan on startup with debounce

### Phase Mitigation Mapping
- Phase 5 (Backup): Atomic writes, validation, server locking, storage pre-check, progress reporting, permissions
- Phase 6 (Config Editor): Validation, type coercion, anchor handling, virtualized lists, undo stack (polish)
- Phase 7 (Metadata): Error handling, fallback logic, caching, security sanitization
- Phase 8 (Polish): Retention policy, cloud conflict handling, config search, undo/redo

---

## Conclusions

- **Stack:** One new library (`admzip`) covers both backup and metadata needs. No native modules.
- **Features:** Backup/restore core is high-complexity but straightforward; nested config editor medium UI complexity; metadata low complexity.
- **Architecture:** Clear separation; backup mostly independent; config and metadata both modify plugin UI → coordinate Phase 6–8 merge.
- **Pitfalls:** Focus on atomicity, validation, permissions, and user confirmation. Backup/restore requires the most careful error handling.

**Recommended first phase (Phase 5):** Backup/restore implementation with validation, progress, and safety confirmations.
