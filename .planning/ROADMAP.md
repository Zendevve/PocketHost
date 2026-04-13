# Roadmap

## Phase 1: Stable Core Backend
**Goal**: Run a Minecraft Server on Android that survives app minimization and surfaces logs properly.
**Requirements Maps**: `CORE-01`, `CORE-02`, `CORE-03`, `DASH-01`

**Success Criteria**:
- Server boots successfully from the UI.
- Minimizing the PocketHost app does not suspend or kill the Java process.
- UI console streams stdout lines continuously while the server runs.

---

## Phase 2: Networking & Connectivity
**Goal**: Automate networking tunnels so external players can join safely.
**Requirements Maps**: `NET-01`, `NET-02`

**Success Criteria**:
- Playit.gg agent connects successfully after server boot.
- The UI exposes a simple link/IP that external friends can connect to.

---

## Phase 3: Setup & Configurations
**Goal**: Ensure users can easily select which world to run and allocate specific RAM based on device resources.
**Requirements Maps**: `DASH-02`, `DASH-03`

**Success Criteria**:
- Settings screen allows customizing Xmx/Xms params.
- Server UI lets users swap or configure the active world folder before boot.

---

## Phase 4: Plugins & Expansion
**Goal**: Integrate full plugin support so admins can add `.jar` files and manage basic configs.
**Requirements Maps**: `PLUG-01`, `PLUG-02`

**Success Criteria**:
- Plugins screen displays installed `.jar` files.
- Users can enable/disable plugins and basic config properties without file exploring manually.
