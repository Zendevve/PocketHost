# Roadmap

## [x] Phase 1: Stable Core Backend
**Goal**: Run a Minecraft Server on Android that survives app minimization and surfaces logs properly.
**Requirements Maps**: `CORE-01`, `CORE-02`, `CORE-03`, `DASH-01`

**Success Criteria**:
- [x] Server boots successfully from the UI.
- [x] Minimizing the PocketHost app does not suspend or kill the Java process.
- [x] UI console streams stdout lines continuously while the server runs.

---

## [x] Phase 2: Networking & Connectivity
**Goal**: Automate networking tunnels so external players can join safely.
**Requirements Maps**: `NET-01`, `NET-02`

**Success Criteria**:
- [x] Playit.gg agent connects successfully after server boot.
- [x] The UI exposes a simple link/IP that external friends can connect to.

---

## [x] Phase 3: Setup & Configurations
**Goal**: Ensure users can easily select which world to run and allocate specific RAM based on device resources.
**Requirements Maps**: `DASH-02`, `DASH-03`

**Success Criteria**:
- [x] Settings screen allows customizing Xmx/Xms params.
- [x] Server UI lets users swap or configure the active world folder before boot.

---

## [x] Phase 4: Plugins & Expansion *(Completed: 2026-04-16)*
**Goal**: Integrate full plugin support so admins can add `.jar` files and manage basic configs.
**Requirements Maps**: `PLUG-01`, `PLUG-02`

**Success Criteria**:
- [x] Plugins screen displays installed `.jar` files.
- [x] Users can enable/disable plugins and basic config properties without file exploring manually.
