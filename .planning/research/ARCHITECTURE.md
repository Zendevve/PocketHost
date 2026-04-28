# Architecture Research — v1.2 Server Management & Multiplayer

## Integration Points

### 1. Console Log Parsing → Player Tracking

**Current state:** `serverManager.ts` parses only playit.gg patterns. Console output streams raw to UI via Zustand store.

**v1.2 change:** Add regex-based parsing in `serverManager.ts` (or new `consoleParser.ts`):
```
Pattern 1 (Join):  /^\[.*INFO\]: (.+) joined the game$/
Pattern 2 (Leave): /^\[.*INFO\]: (.+) left the game$/
Pattern 3 (List):  /^There are (\d+) of a max of (\d+) players online: (.+)$/
```

**Flow:**
1. Console log event received → `onLog` callback
2. New: try each regex pattern match
3. If join → upsert player in `playerStore` with `online: true`
4. If leave → set `online: false` in `playerStore`
5. If `/list` output → bulk sync online players
6. REST: pass through to existing console log display

**Architecture fit:** Non-breaking. Adds a processing step inside `serverManager.ts` before log append. No new native module calls.

### 2. Sharing & Invites → New Feature

**No integration with existing native bridge needed.** Pure React Native + Expo:

**Flow:**
1. Read `relayAddress` or `lanAddress` from serverStore
2. Format as `hostname:port`
3. QR code: render `<QRCode value={address} />` in a new sharing screen
4. Copy: `Clipboard.setStringAsync(address)` on button press
5. Share: `Sharing.shareAsync(address, { dialogTitle: 'Share Server Address' })`

**New screen:** `app/server/share.tsx` — QR code + copy/share buttons

### 3. Performance Tuning → Extending Existing

**Current state:** `propertiesManager.ts` handles `server.properties` read/write. `properties.tsx` has 8 hardcoded fields in `EDITABLE_PROPS`.

**v1.2 change:**
1. Add performance fields to `EDITABLE_PROPS` array: `view-distance`, `simulation-distance`, `entity-broadcast-range-percentage`, `network-compression-threshold`
2. Add JVM flags section — stores in a new `jvmFlags` field on `ServerConfig`
3. Modify `startServer()` in native bridge to accept optional JVM flags array
4. Add preset configurations (Low/Med/High) as pre-built settings objects

**Architecture fit:** Extends existing patterns — same read/write flow, same UI pattern, no new stores needed.

### 4. Server Store Consolidation

**Problem:** Two `useServerStore` implementations exist:
- `src/stores/serverStore.ts` — multi-server, used by UI (dashboard, console, properties)
- `src/store/serverStore.ts` — single-server legacy, used by `serverManager.ts` native bridge

**Fix for v1.2:** Update `serverManager.ts` to import from and write to `src/stores/serverStore.ts` (the main one). Remove legacy store reference, or redirect it to alias the main store.

## Data Flow — New Features

```
┌──────────────────────────────────────────────────────────┐
│                      Native Bridge                        │
│  startServer / stopServer / sendCommand → process stdout  │
└─────────────┬───────────────────────┬────────────────────┘
              │ onLog                 │ onStatusChange
              ▼                       ▼
    ┌─────────────────┐     ┌──────────────────┐
    │ consoleParser.ts │     │ useServerStore    │
    │ (NEW)            │     │ (status, uptime)  │
    │ join/leave/list  │     └──────────────────┘
    │ regex matching   │
    └───┬──────────────┘
        │ player events
        ▼
   ┌──────────────┐
   │ playerStore  │ ←── playerListManager (whitelist/ban/op)
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Players Screen               │
   │  - Online Players tab (NEW)  │
   │  - Operators tab (existing)  │
   │  - Whitelist tab (existing)  │
   │  - Bans tab (existing)       │
   │  - IP Bans tab (existing)    │
   └──────────────────────────────┘
```

## Build Order

**Phase 8:** Performance Tuning (lowest risk, extends existing patterns)
**Phase 9:** Player Management & Online List (depends on console parser)
**Phase 10:** Sharing & Invites (independent, parallel-safe)
