# Phase 4: Plugins & Expansion - Research

## Context
We are implementing full plugin management for PocketHost: adding `.jar` plugin files to the server `plugins/` directory, enabling/disabling them, and editing their configuration files (PLUG-01, PLUG-02). The server runs in Android's `modules/server-process` with a world directory mounted; each world has its own `plugins/` subfolder.

## Findings

### Existing Implementation
1. **Plugins Screen exists**: `app/plugins/index.tsx` already implements:
   - Scanning `{worldPath}/plugins/` for `.jar` and `.jar.disabled` files
   - Displaying plugin name, size, and enabled state
   - Toggling enabled/disabled via `FileSystem.moveAsync` (renaming extension)
   - Deleting plugins
   - Basic instruction text explaining functionality

2. **Server Process Module**: `modules/server-process` already exposes UTILS API to `ServerProcessModule` that likely allows reloading plugins without restart (e.g., sending `reload` command or `plugman` if supported).

### Technical Approach
**PLUG-01 (Plugin Installation & Toggle)** — Already implemented:
- Users drop `.jar` files into `worldPath/plugins/` through the app's file picker (future), or manually transfer files
- Screen reads directory, lists all `.jar` files with `.jar.disabled` for disabled ones
- Toggle renames file extension to enable/disable

**PLUG-02 (Plugin Configuration Management)** — Remaining work:
- Most Minecraft plugins store configuration in YAML files within:
  - `{worldPath}/plugins/{pluginName}/` (folder per plugin) OR
  - `{worldPath}/plugins/{pluginName}.yml` OR
  - `{worldPath}/plugins/{pluginName}/config.yml`
- Need a **PluginConfigManager** service to:
  1. Scan for config files alongside each plugin JAR
  2. Parse YAML (using `js-yaml` or similar)
  3. Edit values via a form UI
  4. Write back to file while preserving comments/formatting where possible

### Integration with Server
- PaperMC/Spigot servers automatically load `.jar` files from `plugins/` on boot
- Disabled plugins are loaded if renamed to `.jar.disabled` (Paper convention: `.jar.disabled` or `.jar` ignored if not ending in `.jar`)
- Config changes typically need server reload (`/reload`) or plugin-specific reload command. However, we can expose a "Reload All Plugins" button that sends the console command.

### UI Design for Plugin Configs
- Inside `app/plugins/[plugin].tsx` (detail page), show:
  - Plugin metadata (name, version, author from JAR manifest if decodable)
  - Config editor: read YAML and render editable fields (key-value pairs or nested objects)
  - "Save Config" button
  - "Reload Plugin" button to apply changes without restart
- Use existing `Card`, `Input`, `Button` components from `src/components/ui/`

## Proposed Strategy
1. **Confirm PLUG-01 completeness**: Test current plugin listing/toggle in emulator/device. Ensure `.jar.disabled` convention works.
2. **Create PluginConfigService** in `src/services/pluginConfigManager.ts`:
   - `getPluginConfig(pluginPath: string)`: determine config file location (if any)
   - `readYamlConfig(configPath: string)`: parse YAML to object
   - `writeYamlConfig(configPath: string, config: object)`: serialize with preserved comments using `js-yaml` (line folding, anchor support)
3. **Build PluginDetailScreen** at `app/plugins/[id].tsx`:
   - Read plugin name and potential config paths
   - If config found, render a dynamic form (simple key-value pairs first, nested later)
   - Save button calls `writeYamlConfig`
4. **Add navigation**: Modify `app/plugins/index.tsx` to link each plugin row to its detail screen
5. **Optional**: Add file-picker integration so users can import `.jar` files from device storage directly into `plugins/` folder

## Validation Architecture
- Boot React Native app
- Navigate to Plugins screen (requires active server world configured)
- Add a plugin JAR manually to file system, verify it appears in list
- Tap Enable/Disable, verify file extension toggles and state updates
- Tap plugin name to open detail screen
- Edit a config value (if plugin has config), Save, verify file content updated
- If server running, use reload button → verify plugin acknowledges reload (check console/log output)
- Restart server → verify plugin loaded with new config