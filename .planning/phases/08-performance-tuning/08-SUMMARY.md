# Phase 8 Summary: Performance Tuning

**Status:** Complete
**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04

## Accomplishments

### PERF-01: Performance sliders
- Extended `properties.tsx` with Performance section featuring slider controls
- view-distance (3-32), simulation-distance (3-32), max-players (1-100), entity-broadcast-range-percentage (10-500)
- Custom SliderInput component with +/- buttons, progress bar, and current value display
- All values readable/editable; saved via existing `writeProperties` flow

### PERF-02: Performance presets
- Low (512MB, solo), Medium (1024MB, 2-5 friends), High (2048MB, party)
- Card-based preset selector with description and memory display
- Tapping preset updates all performance sliders and memory limit
- Manual slider changes deselect active preset (shows "Custom")

### PERF-03: JVM GC optimization toggle
- Switch toggle "Optimize JVM Performance (Aikar's flags)" between presets and sliders
- Reads/writes `jvmFlagsOptimized` field on ServerConfig via store
- Defaults to true for new servers; toggle persists across sessions
- 16-flag Aikar's preset defined in DEFAULT_JVM_FLAGS constant

### PERF-04: Restart flow
- Yellow warning banner when server is running: "Server must restart to apply new settings"
- Save while running: Alert dialog with "Restart Now" (calls stopServer → startServer) or "Later"
- Save while stopped: simple success alert, no restart prompt
- Restart gap (3s) between stop and start for clean shutdown

### Store split-brain fixed
- serverManager.ts, downloadService.ts, Dashboard, and Console all use main `src/stores/serverStore.ts`
- Legacy `src/store/serverStore.ts` no longer imported from any source file
- playitClaimUrl added to ServerState; setJvmOptimized, setJvmFlags, setMaxMemory added to store

## Files Modified

| File | Change |
|------|--------|
| `src/types/server.ts` | Added jvmFlagsOptimized, jvmFlags, playitClaimUrl, DEFAULT_JVM_FLAGS |
| `src/stores/serverStore.ts` | Added setJvmOptimized, setJvmFlags, setMaxMemory actions |
| `src/services/serverManager.ts` | Import fix to main store; JVM flags passed to native bridge |
| `src/services/downloadService.ts` | Import fix to main store |
| `src/app/index.tsx` | Dashboard reads from main store (activeServerId-based) |
| `src/components/ui/Console.tsx` | Console reads from main store (consoleLogs[activeServerId]) |
| `app/server/properties.tsx` | Major: Performance section, sliders, presets, JVM toggle, restart flow |
| `app/setup/region-select.tsx` | Added jvmFlags defaults to new ServerConfig |
| `modules/server-process/src/index.ts` | Extended startServer with optional jvmFlags param |
| `modules/.../ServerProcessModule.kt` | AsyncFunction accepts jvmFlags string; splits on pipe |
| `modules/.../ServerForegroundService.kt` | Builds command with jvmFlags inserted before -jar |

## Verification

- `npm run typecheck` exits 0
- All 4 PERF requirements have corresponding acceptance criteria met
- Legacy store import count in source files: 0
