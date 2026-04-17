# v1.1 Requirements — Backup & Polish

## Backup & Restore

- [ ] **BACK-01**: User can create a manual backup of the current world as a ZIP file saved to the device downloads folder
- [ ] **BACK-02**: User can view a history of backups showing timestamp, world name, file size, and storage path
- [ ] **BACK-03**: User can restore a selected backup after dual confirmation (dialog + world name text input) with automatic server stop and optional restart
- [ ] **BACK-04**: System validates ZIP integrity (CRC) before offering restore, and displays real-time progress during backup/restore operations
- [ ] **BACK-05**: After restore completes, server automatically restarts (if it was running before) and world loads without errors

## Configuration

- [x] **CONF-01**: User can view plugin configuration as a nested tree with expandable/collapsible objects and arrays
- [x] **CONF-02**: User can edit any scalar value (string, number, boolean) inline with real-time YAML syntax validation
- [x] **CONF-03**: User can add new items to arrays and object keys, remove existing items, and reorder array elements
- [x] **CONF-04**: Config editor preserves YAML document structure on round-trip (comments not guaranteed, but formatting minimally affected)

## Plugin Metadata

- [ ] **PLUG-03**: System extracts plugin name, version, author, and description from `plugin.yml` inside the JAR on import
- [ ] **PLUG-04**: Plugin management screen displays metadata alongside filename (name, version, author); falls back to filename if metadata missing
- [ ] **PLUG-05**: Corrupted or unreadable JARs show a warning icon and display an error toast on selection

## Traceability

| Req ID | Phase | Status | Notes |
|--------|-------|--------|-------|
| BACK-01 | 5 | validated | implemented |
| BACK-02 | 5 | validated | implemented |
| BACK-03 | 5 | validated | implemented |
| BACK-04 | 5 | validated | implemented |
| BACK-05 | 5 | validated | implemented |
| CONF-01 | 6 | validated | tree-view YAML editor implemented |
| CONF-02 | 6 | validated | inline scalar editing with YAML validation |
| CONF-03 | 6 | validated | add/remove/reorder arrays and objects |
| CONF-04 | 6 | validated | js-yaml round-trip structure preservation |
| PLUG-03 | 7 | pending | |
| PLUG-04 | 7 | pending | |
| PLUG-05 | 7 | pending | |

## Out of Scope

- Cloud backup upload (Google Drive/Dropbox)
- Automatic scheduled backups
- Backup retention policies (keep last N)
- Config editor undo/redo
- Config search across keys/values
- Plugin update detection/notifications
- Plugin icon/logo display
- Incremental/differential backups

---

*Last updated: 2026-04-16 — v1.1 requirements drafted following research*
