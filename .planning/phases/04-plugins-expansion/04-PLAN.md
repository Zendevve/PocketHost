---
wave: 1
depends_on: []
files_modified:
  - src/services/pluginConfigManager.ts
  - app/plugins/[id].tsx
  - app/plugins/index.tsx
  - src/components/ui/ConfigEditor.tsx
autonomous: true
requirements:
  - PLUG-01
  - PLUG-02
---

# Phase 4: Plugins & Expansion Plan 01

## Objective
Complete plugin management by adding configuration editing for plugins (PLUG-02) and enhancing the plugin installation workflow (PLUG-01). The existing `app/plugins/index.tsx` provides plugin listing and toggling; this plan adds per-plugin config editing with YAML support, a reload plugin command, and file-picker based .jar installation.

## Verification
- All TypeScript files pass `npx tsc --noEmit` with 0 errors.
- `jest` tests (if any) pass.
- Manual verification after implementation: plugin config can be edited and saved; .jar files can be added via file picker.

## Tasks

```xml
<task id="4-01-01">
  <title>Create PluginConfigManager service</title>
  <description>Build a service to discover, read, and write plugin configuration files (YAML format) located in the world's plugins directory.</description>
  <read_first>
    - src/services/propertiesManager.ts (reference pattern for file I/O)
    - src/services/serverManager.ts (reference worldPath usage)
  </read_first>
  <action>
    Create `src/services/pluginConfigManager.ts`.

    Implement the following exports:

    1. `getPluginConfigPath(pluginPath: string): string | null`
       - Check common locations in order:
         a) `{pluginPath}/config.yml` (folder config)
         b) `{pluginPath.replace('.jar', '.yml')}` (sidecar YAML)
         c) `{pluginPath.replace('.jar', '.yaml')}`
       - Return first match or null if none found.

    2. `readPluginConfig(configPath: string): object`
       - Read file as text using `FileSystem.readAsStringAsync`.
       - Parse YAML using `js-yaml` library: `import yaml from 'js-yaml'`.
       - Return parsed object (or empty object {} if file empty).
       - On parse error, throw descriptive error.

    3. `writePluginConfig(configPath: string, config: object): Promise<boolean>`
       - Convert object to YAML string via `yaml.dump(config, { lineWidth: 0, noRefs: true })`.
       - Write atomically via `FileSystem.writeAsStringAsync(configPath, yamlStr)`.
       - Return true on success, false on failure.

    4. `getPluginMetadata(pluginPath: string): { name: string, version?: string, author?: string } | null`
       - Open the .jar as zip (using `expo-zip` or manual zip reading).
       - Read `plugin.yml` (standard Bukkit/Spigot plugin descriptor) from inside the JAR if present.
       - Parse the YAML frontmatter to extract name, version, author.
       - Return null if no descriptor found.

    Add `js-yaml` as dependency: `npx expo install js-yaml`.
  </action>
  <acceptance_criteria>
    - `src/services/pluginConfigManager.ts` exists with all 4 exports.
    - `readPluginConfig` successfully parses a sample YAML file (e.g., test/fixtures/config.yml).
    - `writePluginConfig` writes valid YAML and preserves structure for simple objects.
    - `getPluginConfigPath` returns correct paths for known conventions.
    - `package.json` includes `js-yaml` (version 4.x).
    - TypeScript compilation succeeds with 0 errors.
  </acceptance_criteria>
</task>

```xml
<task id="4-01-02">
  <title>Build Plugin Detail Screen with Config Editor</title>
  <description>Create a new screen to display plugin details and edit configuration when a config file is present.</description>
  <read_first>
    - app/plugins/index.tsx (existing plugins routing)
    - src/components/ui/Card.tsx
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/lib/theme.ts
  </read_first>
  <action>
    Create `app/plugins/[id].tsx` (Expo Router dynamic route).

    Screen behavior:
    - Accept route param `id` which is the plugin name (URL-safe slug). Map back to plugin path via useServerStore (need to lookup in worldPath/plugins).
    - Display:
      - Plugin name (heading)
      - Size, enabled/disabled status
      - If config exists: render a YAML config editor UI
    - "Save Config" button (enabled when config editable)
    - "Reload Plugin" button: when pressed, send `/reload {pluginName}` or general `/reload` to the server console via `serverManager.sendCommand()` (need to check if sendCommand exists)
    - "Back" button navigates to `/plugins`

    For editing:
    - If config YAML is a flat key-value map, render `<Input>` per field.
    - If nested objects, render a simple expandable section or flat dot-notation input (future phase, keep simple now).
    - Represent all values as strings; convert types later if needed.

    Update `app/plugins/index.tsx`:
    - Wrap each plugin row in a `<Link href="/plugins/[name]">` so tapping name opens detail.
    - Alternatively, add an explicit "Configure" button.
  </action>
  <acceptance_criteria>
    - `app/plugins/[id].tsx` exists and compiles.
    - Navigating to a plugin with a config shows editable fields pre-filled.
    - Editing a field and pressing "Save Config" updates the YAML file on disk.
    - "Reload Plugin" button sends console command and shows feedback (toast/Alert).
    - Back navigation returns to the plugins list.
    - TypeScript compilation succeeds with 0 errors.
  </acceptance_criteria>
</task>

```xml
<task id="4-01-03">
  <title>Add File Picker for .jar Import</title>
  <description>Allow users to select a .jar file from device storage and copy it into the world's plugins directory directly from the Plugins screen.</description>
  <read_first>
    - app/plugins/index.tsx
    - src/services/serverManager.ts (for worldPath lookup)
  </read_first>
  <action>
    In `app/plugins/index.tsx`:
    - Add a "+ Import Plugin" button in the header or above the list.
    - On press, use `expo-document-picker` (already linked in Expo) to launch file picker limited to `.jar` files.
    - On file selection, copy file to `{worldPath}/plugins/{fileName}.jar` using `FileSystem.copyAsync`.
    - Show success Alert, then refresh plugin list.
    - Handle errors: duplicate file name (rename with timestamp), permission denied.

    Install if needed: `npx expo install expo-document-picker`.

    Ensure the plugin list automatically refreshes after import.
  </action>
  <acceptance_criteria>
    - Import button appears on Plugins screen.
    - Selecting a .jar file from device copies it into `plugins/` directory.
    - Plugin appears in the list immediately after copy.
    - Duplicate file names are handled gracefully (unique filename or error shown).
    - TypeScript compilation succeeds with 0 errors.
  </acceptance_criteria>
</task>

```xml
<task id="4-01-04">
  <title>Test end-to-end plugin config workflow</title>
  <description>Run manual verification of the plugin management features: install, enable/disable, config edit, reload.</description>
  <read_first>
    - app/plugins/index.tsx
    - app/plugins/[id].tsx
    - src/services/pluginConfigManager.ts
  </read_first>
  <action>
    Manual QA steps:
    1. In emulator/device, start app and navigate to Plugins screen.
    2. Use Import button to add a known plugin (e.g., LuckPerms.jar).
    3. Verify plugin appears in list as enabled.
    4. Tap plugin name → open detail screen.
    5. If plugin has a config.yml shown: edit a value (e.g., `debug: false` → `debug: true`).
    6. Press Save → confirm success alert.
    7. Press Reload Plugin → send `/reload LuckPerms` → check server console shows reload success.
    8. Return to list, disable plugin → verify file renamed to `.jar.disabled`.
    9. Enable again → file renamed back.
    10. Stop and restart server → verify plugin loads with modified config.

    If any step fails, note issue.
  </action>
  <acceptance_criteria>
    - All 10 QA steps can be completed without crash or error.
    - Config file persists edited values after restarts.
    - Reload command takes effect without requiring full restart.
    - TypeScript compilation succeeds with 0 errors (unchanged).
  </acceptance_criteria>
</task>
```