# PocketHost

## What This Is

PocketHost is an Android app that turns a user's mobile device into a lightweight, portable Minecraft Java Edition server host. It allows friends and small communities to create, manage, and run their Minecraft worlds seamlessly from their phones without relying on a desktop or paid remote hosting. v1.0 shipped a stable backend, networking tunnels, server configuration, and full plugin management. v1.1 added world backup/restore, a nested YAML config editor, and plugin metadata display. v1.2 added performance tuning, player management (whitelist, bans, ops), and sharing tools (QR code, share sheet).

## Core Value

Making Minecraft server hosting feel like a native mobile experience. It trades the complexity of desktop administration for simple setup, clear dashboard controls, and practical, on-the-go admin tools.

## Shipped

### v1.0 MVP (2026-04-16)
Core Minecraft server execution on Android, Playit.gg tunnel integration, live dashboard with console/memory/world config, plugin import/enable/disable/config/reload.

### v1.1 Backup & Polish (2026-04-28)
World backup ZIP creation and restore with dual-confirmation safety, nested YAML tree editor for complex plugin configs, plugin JAR metadata extraction (name/version/author) with corrupted JAR warnings.

## Current Milestone: v1.3 Competitor Parity (Complete)

**Goal:** Achieve feature parity with competitor apps by delivering cloud backup, server monitoring, advanced world management, and analytics.

**Shipped:** 2026-05-01 — 4 phases (11-14), 12 new files, +2,100 LOC.

**Phases:**
- Phase 11: Cloud Backup — Google Drive OAuth, backup upload/download, cached backup list
- Phase 12: Server Monitoring — TPS/memory/player metrics, 24h history, bar chart dashboard
- Phase 13: World Management — templates, duplication, rename, delete, create from template
- Phase 14: Analytics Dashboard — player sessions, uptime history, peak players, daily stats

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
- ✓ **Player Management** (PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05) — v1.2 Phase 9
  - Real-time online player list via console log parsing; context actions (kick/ban/op/deop/gamemode); whitelist/bans/ops management tabs with reason support.
- ✓ **Sharing & Invites** (SHAR-01, SHAR-02, SHAR-03) — v1.2 Phase 10
  - Clipboard copy via expo-clipboard; QR code modal via react-native-qrcode-svg; native OS share sheet integration.

### Validated

- ✓ **Cloud Backup to Google Drive** (CLOUD-01 to CLOUD-04) — v1.3 Phase 11
  - OAuth sign-in via expo-auth-session, backup upload to Drive, list Drive backups, restore from Drive.
- ✓ **Server Monitoring & Metrics** (MON-01 to MON-04) — v1.3 Phase 12
  - Real-time TPS/memory/player tracking, historical metrics store (24h), performance dashboard with bar charts.
- ✓ **Advanced World Management** (WORLD-01 to WORLD-04) — v1.3 Phase 13
  - World templates/presets, world duplication, rename, delete, create world from template.
- ✓ **Analytics Dashboard** (ANALYTICS-01 to ANALYTICS-04) — v1.3 Phase 14
  - Player session tracking, total playtime, server uptime history, peak player counts, daily activity summary.

### Active

- [ ] **TBD** — Next milestone requirements not yet defined.

### Out of Scope

- **iOS Support** — iOS does not allow the arbitrary spawning of Java Virtual Machines or child processes required to run the Java Edition server natively.
- **Remote Cloud Hosting** — PocketHost runs the server directly on the Android hardware; it is not a frontend for a cloud VPS.
- **BungeeCord / Velocity** — Multi-server proxying is outside scope.
- **Cloud backup providers other than Google Drive** — Dropbox/OneDrive deferred.
- **Scheduled backups** — Manual-only for v1.
- **Backup retention policies** — No automatic cleanup.
- **Config undo/redo and search** — Out of scope for v1.1 editor.
- **Plugin update detection** — No update checks or notifications.
- **Plugin icon display** — Metadata text only.

## Context

**Shipped v1.2** — 3 phases (8-10), 2 days (Apr 28-29, 2026). 46 files changed, +3,308 / -738 LOC.

**Shipped v1.3** — 4 phases (11-14), 1 day (May 1, 2026). 12 files changed, +2,100 LOC.

**Outcomes:**
- Performance tuning — server.properties sliders, Low/Med/High presets, Aikar's JVM toggle, restart flow.
- Player management — console log parser for join/leave events, real-time online list, context actions, whitelist/ban/ops tabs.
- Sharing & invites — clipboard copy, QR code modal, native share sheet.
- Cloud backup — Google Drive OAuth via expo-auth-session, multipart upload, folder management, cached backup list.
- Server monitoring — 30-second metrics collection, 24h rolling history, bar chart visualization using native Views.
- World management — template creation from worlds, world duplication/rename/delete, create world from template.
- Analytics — player session tracking via join/leave events, server uptime tracking, top players, daily activity summary.

**Known Issues & Technical Debt:**
- CORE-03 (clean stop) not formally verified; relies on UI stop button.
- Test runner configured (jest + ts-jest); 47 tests passing across 5 test suites.
- Some TypeScript workarounds: `any` casts in `serverManager.ts` for missing native typings.
- Plugin metadata extracted on every list load (no caching).
- Player store uses username as key (not UUID) — join events don't include UUIDs.
- Google Drive OAuth requires web client ID configuration in app.json for production use (see `.github/GOOGLE_DRIVE_SETUP.md`).

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
| **Pure-JS MD5 for offline UUIDs** | Avoids external crypto dependency in React Native. | ✓ Good — Works without native module changes. |
| **Username-keyed player store** | Join events don't include UUIDs; username is reliable. | ✓ Good — Simple and correct for offline servers. |
| **Console commands preferred when running** | Server handles logic and file writes; safest approach. | ✓ Good — Avoids race conditions with running server. |
| **react-native-qrcode-svg for QR** | Pure JS, no extra native deps beyond react-native-svg. | ✓ Good — Works in Expo Go. |

*Last updated: 2026-04-29 after v1.2 milestone completion*

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
