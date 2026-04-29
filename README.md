# PocketHost

Turn your Android device into a lightweight, portable Minecraft Java Edition server host. PocketHost lets you create, manage, and run Minecraft worlds directly from your phone — no desktop or paid remote hosting required.

> [!NOTE]
> This project is documented using the [GSD (Goal-Structured Design)](.planning) methodology. All requirements, roadmaps, architecture decisions, and phase plans live in the `.planning/` directory and are kept in sync with the codebase.

## Features

### Server Management
- **Native Server Execution** — Spawn and manage a PaperMC server via a custom Android native module with foreground service persistence.
- **Live Dashboard** — Real-time console streaming, memory allocation controls, and server status monitoring.
- **Performance Tuning** — Adjust `view-distance`, `simulation-distance`, `max-players`, and apply Low / Medium / High presets plus Aikar's JVM flags.

### Networking & Access
- **Zero-Config Tunnels** — Auto-injected Playit.gg plugin for instant join addresses without port forwarding.
- **Share & Invite** — Copy addresses to clipboard, generate QR codes, or use the native OS share sheet.

### Configuration & Plugins
- **Plugin Management** — Import `.jar` files, enable/disable plugins, reload, and view extracted metadata (name, version, author).
- **Nested Config Editor** — Tree-view YAML editor for complex plugin configurations with inline scalar editing and safe round-trip serialization.
- **World Management** — Select worlds and manage `server.properties` from the UI.

### Backups & Players
- **Backup & Restore** — Create full world backups as ZIP archives with dual-confirmation restore, integrity validation, and automatic rollback on failure.
- **Player Management** — Real-time online player list, kick / ban / op / deop / gamemode actions, and dedicated management tabs for whitelist, bans, and operators.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo ~52.0, React Native 0.76 |
| Routing | Expo Router 4 (file-system based) |
| Language | TypeScript |
| State | Zustand 5 |
| Storage | AsyncStorage, expo-file-system |
| Native Module | Custom Android Expo module (`modules/server-process`) |
| Server Runtime | PaperMC 1.19.4 |
| Tunneling | Playit.gg |

## Getting Started

### Prerequisites
- Node.js LTS
- Android Studio or a physical Android device
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
npm install
```

### Running the app

```bash
# Start the Expo development server
npm run start

# Or run directly on a platform
npm run android
```

## Architecture

PocketHost follows a layered React Native architecture:

1. **Presentation** (`app/`, `src/components/ui/`) — Screens and reusable UI primitives.
2. **State** (`src/stores/`) — Zustand stores for server, settings, players, and backups.
3. **Services** (`src/services/`) — Business logic bridging stores to native modules and file I/O.
4. **Native** (`modules/server-process/`) — Android Java module that spawns the JVM and streams logs.

For the full architecture overview, data flow diagrams, and conventions, see [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md).

## Project Structure

```
app/                    # Expo Router screens
src/
  components/ui/        # Atomic UI components (Button, Card, Input, ...)
  stores/               # Zustand state stores
  services/             # Business logic & orchestration
  types/                # Shared TypeScript types
  utils/                # Helpers and constants
modules/server-process/ # Custom Android native module
.planning/              # GSD requirements, roadmaps, and decisions
```

## Documentation

All project documentation is managed through the GSD framework inside `.planning/`:

- [Project Overview & Requirements](.planning/PROJECT.md)
- [Roadmap & Milestones](.planning/ROADMAP.md)
- [Architecture](.planning/codebase/ARCHITECTURE.md)
- [Tech Stack](.planning/codebase/STACK.md)
- [Conventions](.planning/codebase/CONVENTIONS.md)
- [Milestone Requirements](.planning/milestones/)

## Roadmap

- **v1.0 MVP** (shipped 2026-04-16) — Core server execution, networking, dashboard, plugins
- **v1.1 Backup & Polish** (shipped 2026-04-28) — World backups, nested config editor, plugin metadata
- **v1.2 Server Management & Multiplayer** (shipped 2026-04-29) — Performance tuning, player management, sharing tools
- **v1.3** — Planned; see [.planning/ROADMAP.md](.planning/ROADMAP.md) for details

## Known Limitations

- **Android only** — iOS does not allow arbitrary JVM or child process spawning required for a Java Edition server.
- **Manual backups only** — Automated scheduling and cloud upload are not yet supported.
- **No plugin update detection** — Plugins must be updated manually.

## Disclaimer

PocketHost is an independent community project and is not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios.
