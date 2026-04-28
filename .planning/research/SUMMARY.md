# Research Summary — v1.2 Server Management & Multiplayer

## Key Findings

### Stack
- **No heavy dependencies needed** — 4 lightweight Expo packages: `expo-sharing`, `react-native-qrcode-svg`, `react-native-svg`, `expo-clipboard`
- Player management and performance tuning leverage existing codebase fully
- All packages are Expo SDK 52 compatible

### Architecture
- **Console log parsing** is the critical new capability — enables online player tracking
- **Store split-brain** must be fixed: serverManager writes to legacy store, UI reads from main store
- **playerStore** and **playerListManager** already exist but need wiring
- **propertiesManager** and **properties.tsx** just need field extension
- **Native bridge** sufficient as-is for v1.2 features

### Feature Table Stakes
| Category | Must Have | Already Exists |
|----------|-----------|----------------|
| Player Management | Online list, context actions (kick/ban/op) | Whitelist, ban, op infrastructure complete |
| Sharing | Copy address, QR code, share sheet | Nothing — all new |
| Performance | View distance, max players, simulation distance, JVM presets | propertiesManager, properties.tsx |

### Pitfalls
1. **Regex false positives** — player names in chat can trigger join/leave patterns; fix with prefix anchoring
2. **Store split-brain** — serverManager writes to wrong store; fix in Phase 8
3. **Property validation** — invalid server.properties values crash server on restart
4. **JVM flag compatibility** — Aikar's flags may not work on Android JRE; test first
5. **Mojang API downtime** — UUID lookup already has fallback; keep it

### Recommended Build Order
1. **Phase 8: Performance Tuning** — fix store split-brain, extend properties, add JVM presets (lowest risk)
2. **Phase 9: Player Management** — console parser, online list, wire playerStore, context actions
3. **Phase 10: Sharing & Invites** — QR code, copy, share sheet (independent, can be parallel)

## What NOT to Do
- Don't add chat monitoring or player inventory editing (privacy/complexity)
- Don't add public server browser (needs backend)
- Don't add Discord bot integration (out of scope)
- Don't try to fix both serverStores with a migration — just consolidate to the main one
