# PocketHost

## What This Is

PocketHost is an Android app that turns a user's mobile device into a lightweight, portable Minecraft Java Edition server host. It allows friends and small communities to create, manage, and run their Minecraft worlds seamlessly from their phones without relying on a desktop or paid remote hosting.

## Core Value

Making Minecraft server hosting feel like a native mobile experience. It trades the complexity of desktop administration for simple setup, clear dashboard controls, and practical, on-the-go admin tools.

## Requirements

### Validated

- ✓ **Core Server Execution**: Spawning and managing a Minecraft Server child process natively on Android.
- ✓ **Relay Access**: Initial Playit.gg integrations to expose the local server to the broader internet.
- ✓ **UI Foundation**: A React Native (Expo) shell utilizing Zustand for bridging native server events (logs, status) to the UI.
- ✓ **Plugin Management**: Admins can install .jar plugins via file picker, edit YAML configs, and reload plugins without restart. (PLUG-01, PLUG-02 — validated in Phase 4)

### Active

- [ ] **Background Stability**: Implement an Android Foreground Service with persistent notifications so the OS doesn't kill the server process when the user toggles away from the app.
- [ ] **Dashboard & Config Expansion**: Flesh out the user interfaces to handle Plugin installations, server.properties configurations, and player activity monitoring.
- [ ] **Backup & Restore**: Implement world zipping and restoration workflows.
- [ ] **Robust Edge-Case Networking**: Defend against Playit downtimes, CGNAT errors, and network connection drops.

### Out of Scope

- **iOS Support** — iOS does not allow the arbitrary spawning of Java Virtual Machines or child processes required to run the Java Edition server natively.
- **Remote Cloud Hosting** — PocketHost runs the server directly on the Android hardware; it is not a frontend for a cloud VPS.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Focus on Background Stability FIRST** | An Android system will relentlessly kill the host app when minimized. If the server cannot survive being in the background, the app's fundamental utility is broken. | — Pending |
---

*Last updated: 2026-04-16 after Phase 4 (Plugins & Expansion) completion*

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
