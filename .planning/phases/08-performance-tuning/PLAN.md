---
wave: 1
depends_on: []
files_modified:
  - src/services/serverManager.ts
  - src/services/nativeBridge.ts
  - src/stores/serverStore.ts
  - src/services/propertiesManager.ts
  - app/server/properties.tsx
  - src/store/serverStore.ts (legacy — may be removed)
autonomous: true
requirements:
  - PERF-01
  - PERF-02
  - PERF-03
  - PERF-04
---

# Phase 8 Plan: Performance Tuning

## Goal
Extend the server.properties configuration screen with performance-specific controls (sliders for view-distance, simulation-distance, max-players, entity limits), Low/Medium/High performance presets that batch-configure multiple settings, a JVM GC optimization toggle (Aikar's flags), and restart safety validation. Fix the store split-brain so JVM flags propagate correctly from UI to native bridge.

## Requirements Coverage
- **PERF-01**: Adjustable performance fields with valid ranges via sliders
- **PERF-02**: Low/Med/High presets that configure multiple settings at once
- **PERF-03**: JVM GC optimization flags toggle (Aikar's preset, on by default)
- **PERF-04**: Restart required warning and validation

## Current State
- `propertiesManager.ts` — reads/writes server.properties, preserves comments and order
- `properties.tsx` — 8 hardcoded fields (MOTD, port, difficulty, gamemode, PvP, allow-flight, online-mode, memory) with save/restart warning
- `serverStore.ts` (multi-server) — used by UI, has ServerConfig with maxMemoryMB, not imported by serverManager
- `serverStore.ts` (legacy) — used by serverManager native bridge for config/status
- `serverManager.ts` — startServer accepts memoryLimit + worldDir only, no JVM flags
- `nativeBridge.ts` — forwards to ServerProcessModule.startServer(jarPath, memoryLimit, worldDir)
- Card component exists in `src/components/ui/Card.tsx`
- No slider component pattern exists yet in the codebase

## Tasks

### Task 1: Fix store split-brain — consolidate serverManager to use main store

**Files:** `src/services/serverManager.ts`, `src/stores/serverStore.ts`

```xml
<task>
  <number>8-01</number>
  <title>Consolidate serverManager to use main serverStore</title>
  <objective>Fix the split-brain where serverManager.ts writes status and config to the legacy single-server store (src/store/serverStore.ts) while the UI reads from the multi-server store (src/stores/serverStore.ts). This prevents JVM flags from silently failing to propagate.</objective>

  <read_first>
    - src/services/serverManager.ts (current import from legacy store)
    - src/stores/serverStore.ts (target store — verify exports: useServerStore, ServerConfig, getState/setState patterns)
    - src/store/serverStore.ts (legacy store — verify what fields it has that the main store may be missing)
    - src/services/backupService.ts (already imports from main store — pattern reference)
  </read_first>

  <action>
    In src/services/serverManager.ts:
    1. Change import: from `src/store/serverStore` → to `src/stores/serverStore`
    2. Replace all `useServerStore.getState()` calls with the main store's equivalent
    3. Verify these fields exist in main store's state: `statuses`, `configs`, `activeServerId`, `consoleLogs`
    4. If any field is missing from main store, add it to ServerConfig or store state
    5. Update `setPlayitProperty`, `setStatus`, `setPid`, `setLanAddress`, `setRelayAddress`, `setUptimeSeconds`, `setMemoryUsedMB`, `setMemoryMaxMB`, `setTps` to use the main store's nested server config pattern (update by activeServerId)
    6. Ensure `startServer()` reads memoryLimit and activeWorld from main store's active config
  </action>

  <acceptance_criteria>
    - grep "from 'src/store/serverStore'" src/services/serverManager.ts returns empty (old import removed)
    - grep "from 'src/stores/serverStore'" src/services/serverManager.ts finds the new import
    - npm run typecheck exits 0
    - backupService.startServer() call (which uses serverManager.stopServer/startServer) still compiles
  </acceptance_criteria>
</task>
```

### Task 2: Add JVM flags field to ServerConfig and extend native bridge

**Files:** `src/stores/serverStore.ts`, `src/services/nativeBridge.ts`

```xml
<task>
  <number>8-02</number>
  <title>Add JVM flags support to ServerConfig and native bridge</title>
  <objective>Add a jvmFlagsOptimized boolean and jvmFlags string[] to ServerConfig for persistence. Extend the native bridge to pass JVM flags to the Android process.</objective>

  <read_first>
    - src/stores/serverStore.ts (ServerConfig interface, default values, store actions)
    - src/services/nativeBridge.ts or src/services/serverProcess.ts (native module interface for startServer)
    - android/app/src/main/java/.../ServerProcessModule.kt or .java (native startServer implementation)
  </read_first>

  <action>
    In src/stores/serverStore.ts:
    1. Add to ServerConfig interface: `jvmFlagsOptimized: boolean` (default: true)
    2. Add to ServerConfig interface: `jvmFlags: string[]` (default: Aikar's flags array)
    3. Add to store actions: `setJvmFlagsOptimized(id: string, optimized: boolean)` and `setJvmFlags(id: string, flags: string[])`
    4. Default JVM flags array (Aikar's):
       `['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled', '-XX:MaxGCPauseMillis=200', '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC', '-XX:+AlwaysPreTouch', '-XX:G1NewSizePercent=30', '-XX:G1MaxNewSizePercent=40', '-XX:G1HeapRegionSize=8M', '-XX:G1ReservePercent=20', '-XX:G1HeapWastePercent=5', '-XX:G1MixedGCCountTarget=4', '-XX:InitiatingHeapOccupancyPercent=15', '-XX:SurvivorRatio=32', '-XX:+PerfDisableSharedMem', '-XX:MaxTenuringThreshold=1']`

    In src/services/nativeBridge.ts:
    5. Extend startServer signature: `startServer(jarPath: string, memoryLimit: number, worldDir: string, jvmFlags?: string[])`
    6. Pass jvmFlags to native module call

    In native Kotlin/Java module:
    7. Accept jvmFlags array parameter in startServer method
    8. Insert flags after `-Xms` and `-Xmx` arguments but before `-jar` in the ProcessBuilder command
  </action>

  <acceptance_criteria>
    - grep "jvmFlagsOptimized" src/stores/serverStore.ts finds the field in ServerConfig
    - grep "jvmFlags" src/stores/serverStore.ts finds the string[] field
    - grep "setJvmFlagsOptimized" src/stores/serverStore.ts finds the action
    - grep "jvmFlags" src/services/nativeBridge.ts finds the extended startServer parameter
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 3: Extend server.properties editor with performance sliders

**Files:** `app/server/properties.tsx`, `src/services/propertiesManager.ts`

```xml
<task>
  <number>8-03</number>
  <title>Add performance fields to server.properties editor with slider controls</title>
  <objective>Extend the existing properties.tsx screen with a "Performance" section containing slider controls for view-distance, simulation-distance, max-players, and entity-broadcast-range-percentage. Each slider has the correct valid range and shows the current value.</objective>

  <read_first>
    - app/server/properties.tsx (current form layout, EDITABLE_PROPS array pattern, save logic, restart warning)
    - src/services/propertiesManager.ts (readProperties/writeProperties signatures)
    - src/components/ui/Card.tsx (reusable card component for section grouping)
    - .planning/research/FEATURES.md (valid ranges for each property)
  </read_first>

  <action>
    In src/services/propertiesManager.ts:
    1. Add to properties list: `view-distance`, `simulation-distance`, `max-players`, `entity-broadcast-range-percentage`
    2. Define valid ranges constant:
       ```
       const PERFORMANCE_RANGES = {
         'view-distance': { min: 3, max: 32, default: 10 },
         'simulation-distance': { min: 3, max: 32, default: 10 },
         'max-players': { min: 1, max: 100, default: 20 },
         'entity-broadcast-range-percentage': { min: 10, max: 500, default: 100 },
       };
       ```

    In app/server/properties.tsx:
    3. Add `PerformanceSection` component above existing fields
    4. Render a Card with title "Performance" containing:
       - Slider for view-distance (3-32, step 1, label "View Distance: {value} chunks")
       - Slider for simulation-distance (3-32, step 1, label "Simulation Distance: {value} chunks")  
       - Slider for max-players (1-100, step 1, label "Max Players: {value}")
       - Slider for entity-broadcast-range-percentage (10-500, step 10, label "Entity Render Range: {value}%")
    5. Each slider shows value as a number label to the right of the track
    6. Add subtext below each slider explaining what the setting affects (from research)
    7. Validation: clamp values to range before save
    8. Slider values read from and write to the existing props state (same save flow)
  </action>

  <acceptance_criteria>
    - grep "Performance" app/server/properties.tsx finds the section title
    - grep "view-distance" app/server/properties.tsx finds the slider with min 3 max 32
    - grep "simulation-distance" app/server/properties.tsx finds the slider
    - grep "entity-broadcast-range-percentage" app/server/properties.tsx finds the slider
    - grep "max-players" app/server/properties.tsx finds the slider
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 4: Implement performance preset cards (Low/Med/High)

**Files:** `app/server/properties.tsx`

```xml
<task>
  <number>8-04</number>
  <title>Add Low/Medium/High performance preset cards</title>
  <objective>Three touchable preset cards that configure view-distance, simulation-distance, max-players, entity-broadcast-range-percentage, and memory limit in one tap. Tapping a card updates all sliders. Manual slider changes deselect the active preset (shows "Custom").</objective>

  <read_first>
    - app/server/properties.tsx (after Task 3 changes — slider state management pattern)
    - src/stores/serverStore.ts (setMaxMemory action for preset memory changes)
    - src/components/ui/Card.tsx (card with onPress support)
  </read_first>

  <action>
    In app/server/properties.tsx:
    1. Define presets constant:
       ```
       const PERFORMANCE_PRESETS = {
         low: {
           label: 'Low',
           description: 'Solo play — minimal resource usage',
           memory: 512,
           values: { 'view-distance': 6, 'simulation-distance': 5, 'max-players': 5, 'entity-broadcast-range-percentage': 50 },
         },
         medium: {
           label: 'Medium',
           description: '2-5 friends — balanced performance',
           memory: 1024,
           values: { 'view-distance': 10, 'simulation-distance': 8, 'max-players': 20, 'entity-broadcast-range-percentage': 100 },
         },
         high: {
           label: 'High',
           description: 'Small party — best experience',
           memory: 2048,
           values: { 'view-distance': 12, 'simulation-distance': 10, 'max-players': 50, 'entity-broadcast-range-percentage': 200 },
         },
       };
       ```
    2. Add `activePreset` state: `string | null` (null = no preset / Custom)
    3. Render three Card components in a horizontal row (or vertical stack) above the sliders
    4. Each card shows: preset label (bold), description (subtext), memory amount
    5. Active preset card gets highlighted border (theme.colors.primary) and slightly elevated shadow
    6. Tapping a preset: sets `activePreset`, updates all slider values + memory limit
    7. When any slider changes manually: set `activePreset = null`
    8. Show "Custom" text when no preset is active

    In src/stores/serverStore.ts:
    9. Ensure setMaxMemory action exists (used by preset to update memory config)
  </action>

  <acceptance_criteria>
    - grep "PERFORMANCE_PRESETS" app/server/properties.tsx finds the constant with low/medium/high
    - grep "activePreset" app/server/properties.tsx finds state variable
    - grep "Custom" app/server/properties.tsx finds the inactive state label
    - grep "Solo play" app/server/properties.tsx finds low preset description
    - grep "onPress" app/server/properties.tsx finds card press handler for presets
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 5: Implement JVM flags toggle

**Files:** `app/server/properties.tsx`, `src/stores/serverStore.ts`

```xml
<task>
  <number>8-05</number>
  <title>Add JVM GC optimization toggle (Aikar's flags)</title>
  <objective>Add a toggle switch for JVM GC optimization using Aikar's flags. When enabled, the optimized flags are passed to the server process on next start. When disabled, no extra JVM flags are passed.</objective>

  <read_first>
    - app/server/properties.tsx (existing toggle pattern — online-mode uses a similar boolean toggle)
    - src/stores/serverStore.ts (jvmFlagsOptimized field from Task 2)
    - src/services/nativeBridge.ts (extended startServer with jvmFlags param from Task 2)
  </read_first>

  <action>
    In app/server/properties.tsx:
    1. Read `jvmFlagsOptimized` from active server config in store
    2. Add toggle row in Performance section below presets:
       - Label: "Optimize JVM Performance"
       - Description subtext: "Reduces lag with community-standard JVM settings (Aikar's flags). Recommended for all servers."
       - Switch component (from React Native's built-in Switch)
       - On toggle: call `store.setJvmFlagsOptimized(activeServerId, newValue)`
    3. Show the toggle between the preset cards and the sliders section
    4. Toggle is enabled/disabled regardless of server running state (JVM flags require restart anyway)
    5. When disabled: pass empty array to startServer in the native bridge call
    6. When enabled: pass Aikar's flags array (defined in Task 2) to startServer
  </action>

  <acceptance_criteria>
    - grep "Optimize JVM Performance" app/server/properties.tsx finds the label text
    - grep "Aikar's flags" app/server/properties.tsx finds the description text
    - grep "jvmFlagsOptimized" app/server/properties.tsx finds the toggle binding
    - grep "Switch" app/server/properties.tsx finds the React Native Switch component
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 6: Implement restart safety validation and prompts

**Files:** `app/server/properties.tsx`

```xml
<task>
  <number>8-06</number>
  <title>Implement restart validation and save-with-restart-prompt flow</title>
  <objective>After saving performance settings, if the server is running, show a persistent yellow warning banner and a restart-now dialog. If the server is stopped, save silently with no prompt.</objective>

  <read_first>
    - app/server/properties.tsx (existing save logic, existing restart warning for some fields)
    - src/stores/serverStore.ts (serverStatus: 'idle' | 'starting' | 'running' | 'stopping' | 'error')
  </read_first>

  <action>
    In app/server/properties.tsx:
    1. Read `serverStatus` from the store (from active server's statuses entry)
    2. After save succeeds (writeProperties returns true), check `serverStatus`
    3. If server is running ('running' or 'starting'):
       a. Show yellow banner below save button: "⚡ Server must restart to apply new settings"
       b. Show Alert dialog: "Settings saved. Restart server now to apply changes?" with buttons "Restart Now" and "Later"
       c. "Restart Now" calls: serverManager.stopServer() → wait for idle → serverManager.startServer()
       d. "Later" dismisses dialog, banner remains visible
    4. If server is stopped ('idle' or 'error'):
       a. Show normal success alert: "Settings saved"
       b. No restart prompt
    5. During save: disable save button, show saving indicator
    6. Validate all property values are within ranges before saving (prevent server crash on restart)
  </action>

  <acceptance_criteria>
    - grep "Server must restart" app/server/properties.tsx finds the warning banner text
    - grep "Restart server now" app/server/properties.tsx finds the dialog text
    - grep "serverStatus" app/server/properties.tsx finds the conditional check
    - grep "stopServer" app/server/properties.tsx finds the restart flow call
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 7: Wire serverManager.startServer to use JVM flags

**Files:** `src/services/serverManager.ts`

```xml
<task>
  <number>8-07</number>
  <title>Wire JVM flags through serverManager.startServer</title>
  <objective>Update serverManager.startServer to read JVM flags from the store and pass them to the native bridge. Ensure the existing backup service (which calls startServer) is not broken by the signature change.</objective>

  <read_first>
    - src/services/serverManager.ts (startServer function — current signature and flow)
    - src/stores/serverStore.ts (active config — jvmFlagsOptimized, jvmFlags, maxMemoryMB)
    - src/services/nativeBridge.ts (updated startServer with jvmFlags param from Task 2)
    - src/services/backupService.ts (restoreBackup calls startServer — verify no breakage)
  </read_first>

  <action>
    In src/services/serverManager.ts:
    1. In startServer(), after reading memoryLimit and worldDir from store:
       a. Read jvmFlagsOptimized from active config
       b. If true: read jvmFlags array from active config (default Aikar's flags)
       c. If false: pass empty array or undefined
    2. Pass jvmFlags as the 4th argument to nativeBridge.startServer(jarPath, memoryLimit, worldDir, jvmFlags)
    3. Log the JVM flags being applied (console log entry)
    4. Verify backupService.restoreBackup() still works — it calls serverManager.startServer() which should now pass jvmFlags automatically from the store
  </action>

  <acceptance_criteria>
    - grep "jvmFlags" src/services/serverManager.ts finds the flag reading and passing logic
    - grep "jvmFlagsOptimized" src/services/serverManager.ts finds the conditional check
    - grep "nativeBridge.startServer" src/services/serverManager.ts shows 4 arguments passed
    - npm run typecheck exits 0
  </acceptance_criteria>
</task>
```

### Task 8: Integration, testing, and final validation

**Files:** `app/server/properties.tsx`, `src/services/serverManager.ts`, `src/stores/serverStore.ts`

```xml
<task>
  <number>8-08</number>
  <title>End-to-end integration, typecheck, and code review</title>
  <objective>Verify all pieces work together: presets update sliders, slider values persist to server.properties, JVM toggle propagates to startServer, restart flow works, store split-brain is resolved. Run typecheck and fix any issues.</objective>

  <read_first>
    - All files modified in Tasks 1-7
    - .planning/REQUIREMENTS.md (PERF-01 through PERF-04 acceptance criteria)
  </read_first>

  <action>
    1. Run `npm run typecheck` — fix any type errors
    2. Verify PERF-01: Open properties screen → Performance section visible → sliders have correct ranges (3-32 for view-distance, 3-32 for simulation-distance, 1-100 for max-players, 10-500 for entity-range)
    3. Verify PERF-02: Tap "Low" preset → sliders update to values (view-distance=6, simulation-distance=5, max-players=5, entity-range=50, memory=512MB) → change a slider manually → active preset shows "Custom"
    4. Verify PERF-03: JVM toggle is present and on by default → toggle off → store updates jvmFlagsOptimized to false
    5. Verify PERF-04: Server running → edit and save → yellow banner appears → dialog offers restart → server stops and restarts with new settings
    6. Verify no regressions in backup flow: backupService.restoreBackup still compiles and serverManager.startServer is compatible
    7. Verify legacy store is no longer imported by serverManager (Task 1)
  </action>

  <acceptance_criteria>
    - npm run typecheck exits 0 with no errors
    - grep "Performance" app/server/properties.tsx confirms section exists
    - grep "PERFORMANCE_PRESETS" app/server/properties.tsx confirms presets defined
    - grep "jvmFlagsOptimized" src/stores/serverStore.ts AND app/server/properties.tsx both contain the field
    - grep "jvmFlags" src/services/serverManager.ts shows the flag passing logic
    - grep "src/store/serverStore" src/services/serverManager.ts returns empty (legacy import removed)
    - All 4 PERF requirements have corresponding acceptance criteria met
  </acceptance_criteria>
</task>
```

## Verification

### must_haves (goal-backward)
1. Performance section renders with 4 sliders (view-distance, simulation-distance, max-players, entity-range) — each with correct valid range
2. Low/Med/High preset cards update all sliders and memory limit in one tap
3. JVM toggle reads from and writes to store; toggling off passes empty flags to native bridge
4. Save while server running shows restart dialog; restart actually applies new settings
5. Store split-brain fixed — serverManager uses main serverStore

### Files Affected
| File | Change |
|------|--------|
| `src/services/serverManager.ts` | Import fix → main store; read JVM flags; pass to native bridge |
| `src/services/nativeBridge.ts` | Extended startServer(jarPath, memoryLimit, worldDir, jvmFlags?) |
| `src/stores/serverStore.ts` | Added jvmFlagsOptimized, jvmFlags, setJvmFlagsOptimized, setJvmFlags, setMaxMemory |
| `src/services/propertiesManager.ts` | Added performance fields and PERFORMANCE_RANGES constant |
| `app/server/properties.tsx` | Major: Performance section, sliders, preset cards, JVM toggle, restart flow |
| `src/store/serverStore.ts` | May be removed or deprecated if fully consolidated |
| Native module (Kotlin) | Extended startServer to accept jvmFlags argument |
