# PocketHost

Turn your Android device into a lightweight, portable Minecraft Java Edition server host. PocketHost lets you create, manage, and run Minecraft worlds directly from your phone — no desktop or paid remote hosting required.

> [!NOTE]
> This project is documented using the [GSD (Goal-Structured Design)](.planning) methodology. All requirements, roadmaps, architecture decisions, and phase plans live in the `.planning/` directory and are kept in sync with the codebase.

## Features

### Server Management
- **Native Server Execution** — Spawn and manage a PaperMC server via a custom Android native module with foreground service persistence.
- **Live Dashboard** — Real-time console streaming, memory allocation controls, TPS display, and server status monitoring.
- **Performance Tuning** — Adjust `view-distance`, `simulation-distance`, `max-players`, and apply Low / Medium / High presets plus Aikar's JVM flags.

### Networking & Access
- **Zero-Config Tunnels** — Auto-injected Playit.gg plugin for instant join addresses without port forwarding.
- **Share & Invite** — Copy addresses to clipboard, generate QR codes, or use the native OS share sheet.

### Configuration & Plugins
- **Plugin Management** — Import `.jar` files, enable/disable plugins, reload, and view extracted metadata (name, version, author).
- **Nested Config Editor** — Tree-view YAML editor for complex plugin configurations with inline scalar editing and safe round-trip serialization.
- **World Management** — Select worlds, manage `server.properties`, duplicate/rename/delete worlds, create from templates.

### Backups & Players
- **Backup & Restore** — Create full world backups as ZIP archives with dual-confirmation restore, integrity validation, and automatic rollback on failure.
- **Cloud Backup** — Google Drive OAuth integration for off-device world backup storage. Upload, download, and manage Drive backups.
- **Player Management** — Real-time online player list, kick / ban / op / deop / gamemode actions, and dedicated management tabs for whitelist, bans, and operators.

### Monitoring & Analytics
- **Server Monitoring** — Real-time TPS, memory, and player count tracking with 24-hour historical bar charts and summary statistics.
- **Analytics Dashboard** — Player session tracking, total playtime, server uptime history, peak player counts, daily activity summaries, and top players leaderboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo ~52.0, React Native 0.76 |
| Routing | Expo Router 4 (file-system based) |
| Language | TypeScript 5.6 |
| State | Zustand 5 |
| Storage | AsyncStorage, expo-file-system |
| Native Module | Custom Android Expo module (`modules/server-process`) |
| Server Runtime | PaperMC 1.19.4 |
| Tunneling | Playit.gg |
| Archive I/O | adm-zip |
| Config Parsing | js-yaml |
| NBT Parsing | pako (gzip), custom NBT reader |
| OAuth | expo-auth-session, expo-web-browser |
| Testing | Jest 29, ts-jest (47 tests, 5 suites) |

## Getting Started

### Prerequisites
- Node.js LTS (20.x or 22.x)
- Android Studio or a physical Android device running Android 8.0+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
git clone https://github.com/Zendevve/PocketHost.git
cd PocketHost
npm install
```

### Running the app

```bash
npm run start           # Expo dev server
npm run android         # Run on connected device / emulator
npm run typecheck       # TypeScript type checking
npm run test            # Run 47 tests across 5 suites
npm run test:coverage   # Test coverage report
```

## Architecture

PocketHost follows a layered React Native architecture:

1. **Presentation** (`app/`, `src/components/ui/`) — 24 screens and 10 reusable UI primitives.
2. **State** (`src/stores/`) — 8 Zustand stores for server, settings, players, backups, cloud, metrics, analytics, and worlds.
3. **Services** (`src/services/`) — 15 business logic modules bridging stores to native modules and file I/O.
4. **Native** (`modules/server-process/`) — Android Java module that spawns the JVM and streams logs.

For the full architecture, data flow diagrams, and conventions, see the documentation:

- [API Reference](docs/API-REFERENCE.md) — Complete function signatures for all 15 services
- [Architecture](docs/ARCHITECTURE.md) — 4-layer architecture, data flow, store design, file system layout
- [Setup Guide](docs/SETUP-GUIDE.md) — From-zero tutorial with OAuth configuration
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Solutions for common issues

## Project Structure

```
app/                       # Expo Router screens (24 files)
src/
  components/ui/           # Atomic UI components (10 files)
  stores/                  # Zustand state stores (8 files)
  services/                # Business logic & orchestration (15 files)
  services/__tests__/      # Jest test suites (5 files, 47 tests)
  types/                   # Shared TypeScript interfaces
  lib/                     # Theme, config, utilities
  __mocks__/               # Jest manual mocks
modules/server-process/    # Custom Android native module
docs/                      # Public documentation (API, Architecture, Setup, Troubleshooting)
.planning/                 # GSD requirements, roadmaps, and decisions
.github/                   # GitHub Actions and OAuth setup guide
```

## Documentation

- [API Reference](docs/API-REFERENCE.md) — Service function signatures grouped by domain
- [Architecture](docs/ARCHITECTURE.md) — 4-layer architecture with data flow diagrams
- [Setup Guide](docs/SETUP-GUIDE.md) — Complete from-zero installation and configuration
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Common issues and solutions
- [Google Drive OAuth Setup](.github/GOOGLE_DRIVE_SETUP.md) — Step-by-step OAuth configuration
- [Project Overview & Requirements](.planning/PROJECT.md)
- [Roadmap & Milestones](.planning/ROADMAP.md)

## Roadmap

- **v1.0 MVP** (shipped 2026-04-16) — Core server execution, networking, dashboard, plugins
- **v1.1 Backup & Polish** (shipped 2026-04-28) — World backups, nested config editor, plugin metadata
- **v1.2 Server Management** (shipped 2026-04-29) — Performance tuning, player management, sharing tools
- **v1.3 Competitor Parity** (shipped 2026-05-01) — Cloud backup, server monitoring, world management, analytics, comprehensive documentation

See [.planning/ROADMAP.md](.planning/ROADMAP.md) for the full milestone breakdown and future plans.

## Known Limitations

- **Android only** — iOS does not allow arbitrary JVM or child process spawning required for a Java Edition server.
- **Manual backups only** — Automated scheduling is not yet implemented.
- **Cloud backup 5 MB limit** — Simple upload endpoint caps at 5 MB. Resumable uploads planned.
- **No plugin update detection** — Plugins must be updated manually.
- **Aggressive OEMs** — Some Android manufacturers (Xiaomi, Huawei, OnePlus) may kill the background server process despite the foreground service.

## Testing

```bash
npm run test            # Run all 47 tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Coverage report
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| console-parser | 10 | Join/leave regex, TPS/memory patterns |
| metricsService | 8 | History I/O, dedup, calculations |
| analyticsService | 12 | Session tracking, daily stats, top players |
| nbtParser | 7 | Decompression, tag parsing, properties |
| pluginConfigManager | 10 | Config paths, read/write, metadata |

## Disclaimer

PocketHost is an independent community project and is not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios.
