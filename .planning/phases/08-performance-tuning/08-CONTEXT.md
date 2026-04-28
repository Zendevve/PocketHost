# Phase 8: Performance Tuning - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing `server.properties` configuration screen with performance-specific fields (view-distance, simulation-distance, max-players, entity limits), add Low/Medium/High presets that batch-configure multiple settings, add a JVM GC optimization toggle (Aikar's flags), and enforce restart safety validation. All changes are on the existing properties screen — no new screens or tabs.
</domain>

<decisions>
## Implementation Decisions

### UI Layout
- **D-01:** Extend existing `properties.tsx` screen — add a "Performance" section above the existing 8 fields
- **D-02:** Use sliders for numeric ranges (view-distance 3-32, simulation-distance 3-32, max-players 1-20, entity-broadcast-range-percentage 10-500). Sliders are mobile-friendly and provide instant feedback
- **D-03:** Use the existing Card component for section grouping — consistent with dashboard/backup UI patterns
- **D-04:** Performance section shows at the top of the properties screen (most important for mobile hosts)

### Preset Design
- **D-05:** Three presets as touchable cards: Low (solo play, 512MB RAM, low view distance), Medium (2-5 friends, 1GB RAM), High (small party, 2GB RAM)
- **D-06:** Each preset configures: view-distance, simulation-distance, max-players, entity-broadcast-range-percentage, memory allocation limit
- **D-07:** Tapping a preset card updates all slider values immediately. User can then tweak individual values manually — presets are a starting point, not a lock
- **D-08:** Active preset is highlighted. Changing any slider manually deselects the preset (shows "Custom")

### JVM Flags UX
- **D-09:** Single toggle switch: "Optimize JVM performance (Aikar's flags)" — on by default for new servers
- **D-10:** Toggle applies Aikar's G1GC flags: `-XX:+UseG1GC`, `-XX:MaxGCPauseMillis=200`, `-XX:+ParallelRefProcEnabled`, `-XX:+DisableExplicitGC`, `-XX:+AlwaysPreTouch`, `-XX:G1NewSizePercent=30`, `-XX:G1MaxNewSizePercent=40`, `-XX:G1HeapRegionSize=8M`, `-XX:InitiatingHeapOccupancyPercent=15`, `-XX:+PerfDisableSharedMem`
- **D-11:** Include brief description text under the toggle: "Reduces lag with community-standard JVM settings. Recommended for all servers."
- **D-12:** No custom flag editor in v1.2 — keep it approachable for non-technical users

### Restart Flow
- **D-13:** Save button always saves to `server.properties` and `ServerConfig` store immediately
- **D-14:** When server is running: show persistent yellow banner "Server must restart to apply new settings" below the save button
- **D-15:** After save while running: show dialog "Settings saved. Restart server now to apply changes?" with "Restart Now" and "Later" buttons
- **D-16:** When server is stopped: normal save, no restart prompt

### the agent's Discretion
- Exact slider visual design (thumb color, track style, labels)
- Preset card layout and copy text
- Validation error message wording
- Which properties appear in the "Advanced" collapsible section vs directly visible
- Exact placement of JVM toggle relative to presets
</decisions>

<canonical_refs>
## Canonical References

### Server properties specification
- `.planning/research/FEATURES.md` — Performance field definitions, valid ranges, preset configurations
- `.planning/research/SUMMARY.md` — Build order, architecture integration points

### Existing code patterns
- `src/services/propertiesManager.ts` — server.properties read/write logic (prior art for file I/O)
- `src/stores/serverStore.ts` — ServerConfig model, maxMemoryMB field (model for new JVM flags field)

### Requirements
- `.planning/REQUIREMENTS.md` — PERF-01 through PERF-04 acceptance criteria
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`propertiesManager.ts`**: Complete read/write logic for server.properties — extends directly, no new file I/O needed
- **`properties.tsx`**: 8-field form screen with save, restart warning, loading states — extend with new performance section
- **`Card` component**: Consistent UI container (shadow, rounded corners) — use for preset cards and section grouping
- **`serverStore.ts`**: Zustand store with `ServerConfig` — add `jvmFlagsOptimized` boolean field and `presetName` string field

### Established Patterns
- **Restart warnings**: Properties screen already shows "changes require restart" for some fields — consistent yellow banner pattern
- **Save flow**: `writeProperties()` reads file, replaces only changed keys, preserves comments — must preserve this round-trip behavior
- **State management**: Zustand store with persist middleware — add JVM settings to ServerConfig for persistence

### Integration Points
- **`serverManager.startServer()`**: Must be extended to accept optional JVM flags array (currently only accepts `memoryLimit` and `worldDir`). New signature: `startServer(jarPath, memoryLimit, worldDir, jvmFlags?)`
- **Native bridge** (`ServerProcessModule.kt`): May need to accept `jvmFlags` parameter. Android ProcessBuilder already supports arbitrary arg lists — likely a pass-through change
- **Properties UI route**: `app/server/properties.tsx` is already the route — no new navigation needed

### Store Split-Brain Note
- `serverManager.ts` imports from `src/store/serverStore.ts` (legacy single-server store) while UI reads from `src/stores/serverStore.ts` (multi-server store). This must be fixed for JVM flags to propagate correctly. Consolidate to use `src/stores/serverStore.ts` only.
</code_context>

<specifics>
## Specific Ideas

- Presets should feel like "difficulty levels" — Low = casual, Medium = normal, High = enthusiast
- JVM toggle should be reassuring, not intimidating — most users should feel comfortable leaving it on
- Sliders should show current value number alongside the track for precision
- Performance section should appear above existing settings because it's most impactful for mobile hosts

</specifics>

<deferred>
## Deferred Ideas

- Custom JVM flag editor — v1.3 or later (adds complexity for power users)
- Performance monitoring graphs (TPS history, memory timeline) — separate analytics phase
- Auto-tuned presets based on device specs — needs hardware detection, future phase
- Garbage collection log viewer — developer tool, not user-facing

</deferred>

---

*Phase: 08-performance-tuning*
*Context gathered: 2026-04-28*
