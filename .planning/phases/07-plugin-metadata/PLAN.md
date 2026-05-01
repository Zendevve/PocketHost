---
wave: 1
depends_on: []
files_modified:
  - src/services/pluginConfigManager.ts
  - app/plugins/index.tsx
  - app/plugins/[id].tsx
  - src/components/ui/Card.tsx (maybe)
autonomous: true
requirements:
  - PLUG-03
  - PLUG-04
  - PLUG-05
---

# Phase 7 Plan: Plugin Metadata

## Goal
Extract plugin name, version, author, and description from `plugin.yml` inside JAR files on import, display this metadata in the plugin management screen, and handle corrupted/unreadable JARs gracefully.

## Requirements Coverage
- **PLUG-03**: Extract metadata from plugin.yml inside JAR (admzip)
- **PLUG-04**: Display metadata in plugin list; fallback to filename if missing
- **PLUG-05**: Warning icon + error toast for corrupted JARs

## Current State
- `getPluginMetadata()` in `pluginConfigManager.ts` is a stub returning null
- Plugin list shows only filename-derived name, size, enabled status
- No error handling for unreadable JARs during import or listing

## Tasks

### Task 1: Implement PluginMetadataExtractor service
**File:** `src/services/pluginConfigManager.ts` (extend existing)

- Add admzip import: `import AdmZip from 'adm-zip';`
- Implement `extractPluginMetadata(jarPath: string): Promise<PluginMetadata | null>`
  - Read JAR using `new AdmZip(jarPath)` (need to handle file URI → native path)
  - Try read `plugin.yml` from root of archive
  - Parse YAML to get `name`, `version`, `author`, `description`
  - If plugin.yml missing or invalid, fallback to `META-INF/MANIFEST.MF`
    - Parse manifest for `Implementation-Title`, `Implementation-Version`, `Implementation-Vendor-Id`
  - Return normalized `{ name, version, author, description }` or null
- Add error handling: catch zip read errors, return null
- Helper: `isCorruptedJar(jarPath: string): Promise<boolean>` for PLUG-05

**Note:** admzip works with file paths, not file:// URIs. Need to convert URI to filesystem path (React Native). Use `FileSystem.localUriToNativePath` or strip `file://` prefix.

### Task 2: Update plugin list to display metadata
**File:** `app/plugins/index.tsx`

- Extend `PluginInfo` interface:
  ```ts
  interface PluginInfo {
    name: string;
    path: string;
    enabled: boolean;
    size: number;
    metadata?: {
      name: string;
      version?: string;
      author?: string;
      description?: string;
    } | null;
    corrupted?: boolean;
  }
  ```
- In `fetchPlugins()`:
  - For each JAR file, call `extractPluginMetadata(path)` (parallel)
  - Attach metadata to plugin object; if null, keep filename-derived name
  - If `isCorruptedJar` returns true, set `corrupted: true` and `metadata: null`
- Update UI render:
  - Show `metadata.name` if present, otherwise filename-derived name (existing behavior)
  - Show version and author as subtext lines below name
  - If `corrupted` is true, show warning icon (⚠️ or icon component) next to name
  - Keep size display

### Task 3: Error toast for corrupted JARs on selection
**File:** `app/plugins/index.tsx`

- In plugin card actions, when user taps a corrupted plugin:
  - Show `Alert.alert('Corrupted Plugin', 'This plugin JAR is unreadable or damaged. Please re-install it.')`
  - Disable enable/disable and delete buttons? Or allow delete but not enable? Keep delete enabled.
- Alternative: Use toast (if toast system exists). Check for existing toast/notification utility. If none, use Alert.

### Task 4: Update plugin detail page with metadata
**File:** `app/plugins/[id].tsx`

- Extend loaded plugin state to include `metadata` and `corrupted` fields
- Call `extractPluginMetadata` in `loadPluginAndConfig`
- Display metadata below title:
  - Version: X.Y.Z
  - Author: name
  - Description: truncated if long
- If corrupted, show warning banner and disable config editor and reload button

### Task 5: Import flow enhancement
**File:** `app/plugins/index.tsx` (handleImportPlugin)

- After copying JAR to plugins folder, immediately extract metadata
- Store metadata? Currently plugins are re-scanned on each load, so metadata is extracted fresh each time. Acceptable for low complexity.
- If import fails due to corrupted JAR, show error toast and do not add to list.

### Task 6: Type definitions
**File:** `src/services/pluginConfigManager.ts`

```ts
export interface PluginMetadata {
  name: string;
  version?: string;
  author?: string;
  description?: string;
}
```

## Open Questions
- Native path conversion: Confirm `FileSystem.localUriToNativePath` exists in this expo version or use string replace `file://` → ``. Test on Android.
- Toast system: Check if app has a toast/notification context. If not, use Alert for now (polish later).

## Verification
- Import a well-formed plugin JAR: name/version/author appear in list and detail
- Import a JAR with missing plugin.yml: falls back to filename, no crash
- Import a corrupted/invalid ZIP: warning icon appears, alert on tap
- PLUG-03/04/05 all satisfied
