# Requirements

## v1 Requirements

### Core Architecture
- [ ] **CORE-01**: User can spawn and manage the Java Minecraft Server natively on Android.
- [ ] **CORE-02**: User can minimize the app without the server being abruptly killed by Android (Background Service).
- [ ] **CORE-03**: User can cleanly stop the server process.

### Dashboard Core
- [ ] **DASH-01**: User can view live console logs (stdout/stderr) from the server.
- [ ] **DASH-02**: User can configure basic server startup parameters (e.g., Memory limit).
- [ ] **DASH-03**: User can configure the target world and easily switch active worlds.

### Plugin Management
- [ ] **PLUG-01**: User can easily toggle and install `.jar` plugins for their server instance.
- [ ] **PLUG-02**: User can manage existing plugin configurations.

### External Networking
- [ ] **NET-01**: User can expose the Android server to the internet using Playit.gg tunnels overriding CGNAT.
- [ ] **NET-02**: User receives a copyable remote join-address when the server boots successfully.

## Traceability
- **Phase 1**: CORE-01, CORE-02, CORE-03, DASH-01
- **Phase 2**: NET-01, NET-02
- **Phase 3**: DASH-02, DASH-03
- **Phase 4**: PLUG-01, PLUG-02

## v2 Requirements (Deferred)
- Automatic snapshotting/backups to Google Drive or local storage.
- Detailed historical analytics of CPU, Memory, and Player TPS.

## Out of Scope
- iOS execution (Apple sandbox restrictions prevent running the Java JRE required by Minecraft Java).
- BungeeCord / Velocity multi-server proxying.
