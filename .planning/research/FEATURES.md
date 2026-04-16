# Features Research — v1.1 Backup & Polish

## 1. Backup & Restore Features

### Core Features (Must-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Manual world backup | User triggers backup; world folder zipped to device downloads folder | Medium | ZIP library, storage permissions |
| Backup history | List of past backups with timestamps, world names, file sizes | Low | backupStore persistence |
| Restore from backup | Select backup file → confirm → stop server → extract → restart | High | Backup validation, safe stop/start |
| Backup validation | Verify ZIP integrity before offering restore; checksum validation | Medium | ZIP library (CRC) |
| Safety prompts | "Restoring will overwrite current world. Continue?" + world name confirmation | Low | UI dialog |
| Server state lock | Prevent backup/restore while server running (except restore which stops) | Low | serverManager state |

### Polish Features (Nice-to-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Cloud backup option | Upload latest backup to Google Drive/Dropbox after local creation | High | Cloud APIs, auth flows |
| Automatic backup scheduling | Daily/weekly automatic backups (configurable retention) | Medium | Background tasks (TaskManager) |
| Incremental backups | Only changed chunks since last backup (advanced, reduces size) | High | Chunk-level diff, storage tracking |
| Backup export/share | Share backup file via Bluetooth/NFT/email | Low | expo-sharing |
| Restore preview | Show backup contents (world name, size, date) before restoring | Low | ZIP entry listing |

### Edge Cases
- World in use during backup → require server stop OR copy-on-write snapshot (too complex) → disable backup while running
- Restore interrupted → partial overwrite → atomic extraction to temp dir then swap
- Corrupted backup file → detect early, refuse restore
- Insufficient storage → pre-check free space vs world size estimate

## 2. Nested YAML Config Editor

### Core Features (Must-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Tree view rendering | Nested objects/arrays displayed as expandable/collapsible nodes | Medium | Recursive React component |
| Inline value editing | Click leaf node → edit field with appropriate type (string, number, boolean) | Medium | Modal/form per node |
| Add/remove array items | Buttons to insert/reorder/delete array elements | Medium | Array mutation handlers |
| Add/remove object keys | Add new key-value pair to object | Medium | Object mutation handlers |
| YAML formatting preserve | Round-trip should keep comments? (hard) → at least preserve structure | High | yaml.customTypes or custom dumping |
| Validation | Required fields, type checks before save | Medium | Plugin schema? (no standard) → best effort |

### Polish Features (Nice-to-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Undo/redo | Config changes reversible | Medium | Zustand history middleware |
| Type hints | Show expected type (int, float, bool) based on example values | Low | Heuristics from existing config |
| Search in config | Find keys/values in large configs | Low | Text search across tree |
| Collapse all/expand all | Bulk expand/collapse | Low | Tree state control |
| Reset to defaults | Revert to plugin's default config (if shipped) | Medium | Read defaults from JAR |

### Edge Cases
- Very deep nesting (10+ levels) → UI scroll issues → limit depth display or virtualize
- Large arrays (1000+ items) → performance → virtual list
- Comments in YAML: js-yaml drops comments by default → cannot preserve; document limitation
- Anchors/aliases: js-yaml supports, but UI editing complex → disallow editing anchors, preserve on round-trip

## 3. Plugin Metadata Display

### Core Features (Must-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Name extraction | Display plugin name from `plugin.yml` (`name:`) | Low | metadata extractor |
| Version extraction | Display version string | Low | metadata extractor |
| Author extraction | Display author/developers | Low | metadata extractor |
| Description | Short plugin description (if provided) | Low | metadata extractor |
| Icon/logo | Optional `icon.png` or `icon.yml` inside JAR | Medium | image loading from ZIP entry |
| Dependencies | List soft/hard dependencies (other plugins) | Medium | parse `depend`, `softdepend` |

### Polish Features (Nice-to-Have)
| Feature | Description | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Update check | Query SpigotMC/Modrinth for latest version | High | Network API, plugin URL |
| Load order hints | Display `load: STARTUP/EARLY` | Low | metadata extractor |
| Commands/perms list | Show what commands and permissions plugin adds | Medium | Parse `commands:` and `permissions:` sections |
| Website/Source links | Open plugin page in browser | Low | URL from metadata |
| Compatibility badge | Indicates if plugin compatible with server version | Medium | Version range validation vs Paper version |

### Edge Cases
- Missing/incomplete `plugin.yml` → fall back to MANIFEST.MF (Implementation-Title, Implementation-Version)
- Multiple authors → comma-separated list
- Legacy plugins (pre-1.13 format) → adapt parsing
- Corrupt JAR → catch and show "Metadata unavailable"

## 4. Complexity Summary

- **Backup/Restore:** High operational complexity (requires careful state management, disk I/O, user confirmation)
- **Nested Config Editor:** Medium UI complexity (tree navigation, recursive forms) but YAML parsing low risk
- **Plugin Metadata:** Low complexity (ZIP read + YAML parse) but edge cases numerous

## Dependencies Between Features
- Backup and Restore are tightly coupled: can't have one without the other
- Nested config editor depends on js-yaml (already present) but independent of backup
- Plugin metadata independent; can be done in parallel
