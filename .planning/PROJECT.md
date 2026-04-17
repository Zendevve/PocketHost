# PocketHost

## What This Is

PocketHost is an Android app that turns a user's mobile device into a lightweight, portable Minecraft Java Edition server host. It allows friends and small communities to create, manage, and run their Minecraft worlds seamlessly from their phones without relying on a desktop or paid remote hosting. v1.0 shipped a stable backend, networking tunnels, server configuration, and full plugin management.

## Core Value

Making Minecraft server hosting feel like a native mobile experience. It trades the complexity of desktop administration for simple setup, clear dashboard controls, and practical, on-the-go admin tools.

## Current Milestone: v1.1 Backup & Polish

**Goal:** Users can backup and restore server worlds, and plugin management gains nested config editing + metadata display.

**Target features:**
- World backup: zip world folder, download to device, cloud backup option
- World restore: pick backup file, extract over current world (with safety prompts)
- Nested YAML config editor — support objects and arrays in plugin configs
- Plugin metadata reader — extract name, version, author from plugin JARs

## Requirements

### Validated

- ✓ **Core Server Execution** (CORE-01, CORE-02, CORE-03) — v1.0
  - Native Minecraft server spawning and management on Android achieved; background service stable; clean stop operational.
- ✓ **Relay Access** (NET-01, NET-02) — v1.0
  - Playit.gg tunnel integration functional; users receive join address after allocation.
- ✓ **Dashboard Controls** (DASH-01, DASH-02, DASH-03) — v1.0
  - Live console streaming, memory allocation slider, and world selection implemented.
- ✓ **Plugin Management** (PLUG-01, PLUG-02) — v1.0
  - .jar import via file picker, YAML config editing, plugin enable/disable, and reload command delivered.
- ✓ **Backup & Restore** (BACK-01, BACK-02, BACK-03, BACK-04, BACK-05) — v1.1 Phase 5
  - Full backup creation (ZIP), history persisted via AsyncStorage; restore with dual-confirmation (dialog + world name), automatic server stop/start, integrity validation (ZIP and world), rollback on failure, and progress UI.
- ✓ **Nested Config Editor** (CONF-01, CONF-02, CONF-03, CONF-04) — v1.1 Phase 6
  - Tree-view YAML editor with inline scalar editing, array/object add/remove/reorder, and js-yaml-based round-trip structure preservation.

### Active

- [ ] **Plugin Metadata**: Display plugin name, version, author from JAR descriptor.

### Out of Scope

- **iOS Support** — iOS does not allow the arbitrary spawning of Java Virtual Machines or child processes required to run the Java Edition server natively.
- **Remote Cloud Hosting** — PocketHost runs the server directly on the Android hardware; it is not a frontend for a cloud VPS.
- **BungeeCord / Velocity** — Multi-server proxying is outside MVP scope.

## Context

**Shipped v1.0** — 85,209 LOC added across 4 phases, 5 days (Apr 11–16, 2026). React Native (Expo) + TypeScript + Zustand stack; native Android foreground service; Playit.gg tunnel integration; YAML config editing via js-yaml.

**Outcomes:**
- Background service stable — server survives app minimization.
- External connectivity established — users receive join address.
- Memory allocation (up to 4GB) and world selection operational.
- Plugin lifecycle complete — install, enable/disable, config edit, reload.
- World backup & restore system — ZIP creation, history persistence, dual-confirmation restore with automatic server stop/start, validation, progress feedback.
- Nested YAML config editor — tree-view rendering of complex plugin configs, inline scalar editing, array/object manipulation, round-trip structure preservation.

**Known Issues & Technical Debt:**
- CORE-03 (clean stop) not formally verified; relies on UI stop button.
- Plugin metadata extraction pending (ZIP library now in place).
- Some TypeScript workarounds: `any` casts in `serverManager.ts` for missing native typings.
- VALIDATION.md checklists contain unchecked manual tests.

**User Feedback:** N/A — v1.0 not yet released externally; internal testing only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Focus on Background Stability FIRST** | An Android system will relentlessly kill the host app when minimized. If the server cannot survive being in the background, the app's fundamental utility is broken. | ✓ Good — Foreground Service with persistent notification implemented; confirmed stable through Phase 1 completion. |
| **Use Zustand for global state** | Lightweight, React Native-friendly, minimal boilerplate compared to Redux or Context API. | ✓ Good — State patterns established cleanly; serverStore, playerStore, settingsStore scalable. |
| **Create `serverManager` abstraction** | Decouple UI from native event lifecycle; central bridge for status, logs, and commands. | ✓ Good — Native events funnel through store; enables Dashboard and Console. |
| **Download assets via RN (expo-file-system)** | Enables progress tracking and avoids native threading complexity. | ✓ Good — JRE and server.jar download logic functional; PaperMC switch seamless. |
| **PaperMC over Vanilla** | Required for plugin support from day one. | ✓ Good — Server runs Paper 1.19.4; plugin folder auto-created. |
| **Auto-inject playit-plugin.jar** | Zero-config tunnel setup for users. | ✓ Good — Plugin copied automatically; claim flow works. |
| **Track tunnel state in Zustand** | UI must react to claim/allocation events. | ✓ Good — Console and Dashboard display link/IP correctly. |
| **Regex log parsing for Playit events** | Playit outputs to stdout; simple text parsing is reliable enough. | ✓ Good — Parsing stable; no performance impact observed. |
| **Config namespace in store** | Centralize server configuration (memory, world) in one place. | ✓ Good — Config mutated by UI and read by native bridge. |
| **Direct JVM flag bridging** | Pass `-Xmx` and `--world` directly to ProcessBuilder. | ✓ Good — Memory limits and world switches respected. |
| **Choose js-yaml for YAML configs** | Proven library; supports common plugin config formats. | ✓ Good — Config round-trips correctly; no format issues. |
| **Flat key-value config editor only** | Nested objects require more UI work; defer to keep Phase 4 scope tight. | ✓ Good — Covers majority of plugin configs; nested planned for v1.1. |
| **Defer plugin metadata extraction** | Requires ZIP/JAR parsing library; out of scope for core plugin management. | ⚠️ Revisit — Add metadata reader in next milestone using ` admzip ` or similar. |
| **Adm-zip for ZIP operations** | JS ZIP library compatible with React Native (base64) | ✓ Good — Backups created and restored successfully with validation |
| **Tree-view config editor integrated inline** | Keep Save button inside ConfigTreeEditor for consistency; use modals for add operations; infer array item types | ✓ Good — Matches existing ConfigEditor UX pattern; no screen changes needed |
| **Defer plugin metadata extraction** | Requires ZIP/JAR parsing library; out of scope for core plugin management. | ⚠️ Revisit — Add metadata reader in next milestone using `admzip` or similar. |

*Last updated: 2026-04-17 after Phase 6 (Nested Config Editor) completion*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
