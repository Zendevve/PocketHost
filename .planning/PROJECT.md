# PocketHost

## What This Is

PocketHost is an Android app that turns a user's mobile device into a lightweight, portable Minecraft Java Edition server host. It allows friends and small communities to create, manage, and run their Minecraft worlds seamlessly from their phones without relying on a desktop or paid remote hosting. v1.0 shipped a stable backend, networking tunnels, server configuration, and full plugin management. v1.1 added world backup/restore, a nested YAML config editor, and plugin metadata display.

## Core Value

Making Minecraft server hosting feel like a native mobile experience. It trades the complexity of desktop administration for simple setup, clear dashboard controls, and practical, on-the-go admin tools.

## Shipped

### v1.0 MVP (2026-04-16)
Core Minecraft server execution on Android, Playit.gg tunnel integration, live dashboard with console/memory/world config, plugin import/enable/disable/config/reload.

### v1.1 Backup & Polish (2026-04-28)
World backup ZIP creation and restore with dual-confirmation safety, nested YAML tree editor for complex plugin configs, plugin JAR metadata extraction (name/version/author) with corrupted JAR warnings.

## Current Milestone: v1.2 Server Management & Multiplayer

**Goal:** Turn PocketHost from a server runner into a proper multiplayer host — give server owners tools to manage players, share access easily, and tune performance.

**Target features:**
- Player whitelist, bans/kicks, op/de-op — control who joins and what they can do
- Sharing & invites — one-tap copy address, QR code, share sheet integration
- Performance tuning — view distance, player limits, entity caps, JVM GC flags

**Stretch:**
- Real-time online player list with join/leave events
- Server MOTD and name customization

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
- ✓ **Backup & Restore** (BACK-01, BACK-02, BACK-03, BACK-04, BACK-05) — v1.1
  - Full backup creation (ZIP), history persisted via AsyncStorage; restore with dual-confirmation (dialog + world name), automatic server stop/start, integrity validation (ZIP and world), rollback on failure, and progress UI.
- ✓ **Nested Config Editor** (CONF-01, CONF-02, CONF-03, CONF-04) — v1.1
  - Tree-view YAML editor with inline scalar editing, array/object add/remove/reorder, and js-yaml-based round-trip structure preservation.
- ✓ **Plugin Metadata** (PLUG-03, PLUG-04, PLUG-05) — v1.1
  - JAR manifest parsing via adm-zip; plugin name/version/author display; corrupted JAR warning handling.

- ✓ **Performance Tuning** (PERF-01, PERF-02, PERF-03, PERF-04) — v1.2 Phase 8
  - Slider controls for view-distance, simulation-distance, max-players; Low/Med/High presets; Aikar's JVM optimization toggle; restart safety prompts.

### Active

- [ ] **Player Management** — Whitelist, bans/kicks, op/de-op permissions (v1.2 target)
- [ ] **Sharing & Invites** — One-tap share server address, QR code generation (v1.2 target)

### Out of Scope

- **iOS Support** — iOS does not allow the arbitrary spawning of Java Virtual Machines or child processes required to run the Java Edition server natively.
- **Remote Cloud Hosting** — PocketHost runs the server directly on the Android hardware; it is not a frontend for a cloud VPS.
- **BungeeCord / Velocity** — Multi-server proxying is outside scope.
- **Cloud backup upload** — Google Drive/Dropbox integration deferred.
- **Scheduled backups** — Manual-only for v1.
- **Backup retention policies** — No automatic cleanup.
- **Config undo/redo and search** — Out of scope for v1.1 editor.
- **Plugin update detection** — No update checks or notifications.
- **Plugin icon display** — Metadata text only.

## Context

**Shipped v1.1** — 3 phases (5-7), ~12 days (Apr 16-28, 2026). React Native (Expo) + TypeScript + Zustand stack; adm-zip for ZIP/JAR operations; js-yaml for config editing; AsyncStorage for persistence.
**Total codebase:** ~12,000 LOC TypeScript.

**Outcomes:**
- World backup & restore system — ZIP creation, history persistence, dual-confirmation restore with automatic server stop/start, validation, progress feedback.
- Nested YAML config editor — tree-view rendering of complex plugin configs, inline scalar editing, array/object manipulation, round-trip structure preservation.
- Plugin metadata display — name/version/author from JAR plugin.yml, corrupted JAR warnings with blocked interactions.

**Known Issues & Technical Debt:**
- CORE-03 (clean stop) not formally verified; relies on UI stop button.
- No test runner configured (jest/vitest); Phase 7 tests exist but can't run yet.
- Some TypeScript workarounds: `any` casts in `serverManager.ts` for missing native typings.
- Plugin metadata extracted on every list load (no caching).

**User Feedback:** N/A — not yet released externally; internal testing only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Focus on Background Stability FIRST** | An Android system will relentlessly kill the host app when minimized. If the server cannot survive being in the background, the app's fundamental utility is broken. | ✓ Good — Foreground Service with persistent notification implemented; confirmed stable through Phase 1 completion. |
| **Use Zustand for global state** | Lightweight, React Native-friendly, minimal boilerplate compared to Redux or Context API. | ✓ Good — State patterns established cleanly across all stores. |
| **Create `serverManager` abstraction** | Decouple UI from native event lifecycle; central bridge for status, logs, and commands. | ✓ Good — Native events funnel through store; enables Dashboard and Console. |
| **Download assets via RN (expo-file-system)** | Enables progress tracking and avoids native threading complexity. | ✓ Good — JRE and server.jar download logic functional. |
| **PaperMC over Vanilla** | Required for plugin support from day one. | ✓ Good — Server runs Paper 1.19.4. |
| **Auto-inject playit-plugin.jar** | Zero-config tunnel setup for users. | ✓ Good — Plugin copied automatically. |
| **Choose js-yaml for YAML configs** | Proven library; supports common plugin config formats. | ✓ Good — Config round-trips correctly. |
| **Defer nested config editing to v1.1** | Nested objects require more UI work; keep Phase 4 scope tight. | ✓ Good — Delivered in Phase 6. |
| **Defer plugin metadata to v1.1** | Required JAR parsing library; out of scope for core plugin management. | ✓ Good — Delivered in Phase 7 via adm-zip. |
| **Adm-zip for ZIP operations** | JS ZIP library compatible with React Native via base64 reads. | ✓ Good — Backups and JAR parsing working. |
| **Tree-view config editor integrated inline** | Keep Save button inside ConfigTreeEditor; modals for add operations. | ✓ Good — Matches existing UX pattern. |
| **Progress reporting via callback** | Enables real-time UI feedback during backup operations. | ✓ Good — Progress bar in backup screen. |
| **Rollback strategy (.old directory)** | Safe restore: move current to .old, extract backup, validate, rollback on failure. | ✓ Good — Prevents data loss on restore failure. |

*Last updated: 2026-04-28 after v1.2 milestone initialization*

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
