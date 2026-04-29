# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Next milestone planning in progress. See [.planning/ROADMAP.md](.planning/ROADMAP.md).

## [1.2.0] - 2026-04-29

### Added

- Performance Tuning screen with sliders for `view-distance`, `simulation-distance`, and `max-players`.
- Low / Medium / High performance presets for one-click configuration.
- Aikar's JVM optimization toggle with restart safety prompts.
- Real-time online player list parsed from console join/leave events.
- Player context actions: kick, ban, op, deop, and gamemode change.
- Whitelist, Bans, and Operators management tabs with reason support.
- Clipboard copy for server addresses via `expo-clipboard`.
- QR code modal generation via `react-native-qrcode-svg`.
- Native OS share sheet integration for inviting friends.

### Changed

- Updated player store to use username-keyed lookups for offline servers.

## [1.1.0] - 2026-04-28

### Added

- Full world backup creation as ZIP archives with progress UI.
- Backup history persisted via AsyncStorage.
- Restore flow with dual-confirmation (dialog + world name entry).
- Automatic server stop/start around restore operations.
- Integrity validation for backup ZIPs and extracted worlds.
- Rollback to `.old` directory on restore failure.
- Nested YAML tree-view config editor for complex plugin configurations.
- Inline scalar editing, array/object add/remove/reorder in the config editor.
- Plugin JAR metadata extraction (plugin name, version, author) via `adm-zip`.
- Corrupted JAR warning handling in plugin metadata display.

### Changed

- Improved config editing UX with save-inside-editor pattern.

## [1.0.0] - 2026-04-16

### Added

- Initial release.
- Native Minecraft Java Edition server execution on Android via custom native module.
- Foreground service with persistent notification for background stability.
- Playit.gg tunnel integration with auto-injected plugin for zero-config access.
- Live dashboard with console streaming, memory allocation slider, and world selection.
- Server setup flow with JRE and server JAR downloads.
- Plugin import via file picker, enable/disable toggles, and reload command.
- Basic YAML config editing for plugin configurations.
- Zustand global state management with AsyncStorage persistence.
- Core UI component library: Button, Card, Badge, Toggle, Input.

[Unreleased]: https://github.com/Zendevve/PocketHost/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Zendevve/PocketHost/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Zendevve/PocketHost/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Zendevve/PocketHost/releases/tag/v1.0.0
