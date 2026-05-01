# Phase 9 Research: Player Management

**Date:** 2026-04-28
**Phase:** 09 — Player Management (PLAY-01 to PLAY-05)
**Researcher:** gsd-phase-researcher

---

## Summary

Phase 9 builds on existing, partially-functional player management infrastructure. The project already has:

- `playerListManager.ts` — CRUD for whitelist, ops, banned-players, banned-ips JSON files, with both online (console command) and offline (direct JSON edit) modes
- `playerStore.ts` — Zustand store for online player tracking (currently unused / unpopulated)
- `app/players/index.tsx` — a 4-tab UI (Operators, Whitelist, Bans, IP Bans) using local state; no online player list yet
- Console log parsing in `serverManager.ts` — only parses playit.gg URLs and relay addresses; needs extension for join/leave/list

**Key findings:**
1. Minecraft Java Edition console output uses a predictable `[timestamp] [thread/LEVEL]: message` format. Join/leave events are parseable with anchored regex.
2. All required player management commands exist as vanilla console commands (`/kick`, `/ban`, `/ban-ip`, `/pardon`, `/pardon-ip`, `/op`, `/deop`, `/whitelist`, `/gamemode`).
3. The native bridge (`server-process` module) already supports `sendCommand`; no native changes are required for this phase.
4. Server JSON files (`whitelist.json`, `ops.json`, `banned-players.json`, `banned-ips.json`) follow standard Mojang schemas with UUID-based entries.
5. React Native UI patterns in the project favor: `ScrollView` + `Card` for lists, `Button` with `variant` for actions, `Alert` for confirmation dialogs, `Switch` for toggles, and `TextInput` for forms.
6. State management should use the existing `playerStore.ts` for ephemeral online player data, and `playerListManager.ts` + file system for persistent server config. A new `consoleParser.ts` service is recommended to decouple log parsing from `serverManager.ts`.
7. The biggest risks are: regex false positives from chat messages, offline UUID generation, command race conditions, and UI state desync when the server modifies JSON files independently.

---

## Minecraft Console Patterns

### Log Format (Minecraft Java Edition — Vanilla/Paper/Spigot)

```
[HH:MM:SS] [Server thread/INFO]: <message>
[HH:MM:SS] [Server thread/WARN]: <message>
[HH:MM:SS] [Server thread/ERROR]: <message>
```

### Player Join Pattern

```
[12:34:56] [Server thread/INFO]: Steve joined the game
```

**Regex:**
```typescript
const JOIN_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) joined the game$/;
```

**Capture group 1:** Player username (Unicode-aware; Minecraft allows CJK, emoji, spaces in some contexts, but standard usernames are `[a-zA-Z0-9_]{3,16}` for online mode).

### Player Leave Pattern

```
[12:35:10] [Server thread/INFO]: Steve left the game
```

**Regex:**
```typescript
const LEAVE_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) left the game$/;
```

### `/list` Command Output (Vanilla)

```
There are 2 of a max of 20 players online: Steve, Alex
```

**Regex:**
```typescript
const LIST_REGEX = /^There are (\d+) of a max of (\d+) players online: (.+)$/;
```

**Capture groups:**
1. Current online count
2. Max player count
3. Comma-separated player list

**Note:** Paper/Spigot may format `/list` differently (e.g., with colors or prefixes). For Phase 9 MVP, target Vanilla format. If Paper is detected, the parser can fall back to a looser regex or skip `/list` bulk sync.

### Command Response Patterns

Most console commands produce no output on success (silent). Some produce confirmation:

```
[12:36:00] [Server thread/INFO]: Opped Steve
[12:36:01] [Server thread/INFO]: De-opped Steve
[12:36:02] [Server thread/INFO]: Added Steve to the whitelist
[12:36:03] [Server thread/INFO]: Removed Steve from the whitelist
[12:36:04] [Server thread/INFO]: Banned Steve: Banned by an operator.
[12:36:05] [Server thread/INFO]: Unbanned Steve
[12:36:06] [Server thread/INFO]: Kicked Steve: You have been kicked
```

**Parsing strategy:** Do NOT rely on command outputs for state confirmation. Instead, trust the command dispatch succeeded if `sendCommand` returns `true`, and reconcile state by:
1. Re-reading the relevant `.json` file after a short delay (500ms)
2. For online list, relying on join/leave events

### TPS / Performance Patterns (already noted for context)

```
[12:34:56] [Server thread/WARN]: Can't keep up! Is the server overloaded?
```

This is handled by existing infrastructure but shows where parsing lives.

---

## Player Management Commands

### Command Reference Table

| Action | Command | Syntax | Expected Server Response | Notes |
|--------|---------|--------|--------------------------|-------|
| **Kick** | `kick` | `kick <player> [reason]` | Silent or `Kicked <player>: <reason>` | Reason optional. Player must be online. |
| **Ban (name)** | `ban` | `ban <player> [reason]` | `Banned <player>: <reason>` | Adds to `banned-players.json`. Kicks if online. |
| **Ban (IP)** | `ban-ip` | `ban-ip <address\|player> [reason]` | `Banned IP <ip>: <reason>` | Adds to `banned-ips.json`. Can target online player by name. |
| **Unban (name)** | `pardon` | `pardon <player>` | `Unbanned <player>` | Removes from `banned-players.json`. |
| **Unban (IP)** | `pardon-ip` | `pardon-ip <address>` | `Unbanned <ip>` | Removes from `banned-ips.json`. |
| **Op** | `op` | `op <player>` | `Opped <player>` | Adds to `ops.json` with level 4. |
| **Deop** | `deop` | `deop <player>` | `De-opped <player>` | Removes from `ops.json`. |
| **Whitelist add** | `whitelist` | `whitelist add <player>` | `Added <player> to the whitelist` | Requires `white-list=true` in `server.properties`. |
| **Whitelist remove** | `whitelist` | `whitelist remove <player>` | `Removed <player> from the whitelist` | — |
| **Whitelist on/off** | `whitelist` | `whitelist on` / `whitelist off` | `Turned on the whitelist` / `Turned off the whitelist` | Does not edit `server.properties`; toggles runtime state. |
| **Gamemode** | `gamemode` | `gamemode <mode> <player>` | Silent or `Set <player>'s game mode to <mode>` | Mode: `survival`, `creative`, `adventure`, `spectator`. |
| **List players** | `list` | `list` | `There are N of a max of M players online: ...` | Used for bulk sync / reconciliation. |

### Command Dispatch Implementation

Commands are sent via the existing native bridge:

```typescript
import ServerProcess from '../../modules/server-process';

await ServerProcess.sendCommand('kick Steve Spamming');
```

The `sendCommand` function returns a `Promise<boolean>` indicating the write to stdin succeeded, NOT whether the command executed successfully server-side.

### Error Handling for Commands

| Failure Mode | Cause | Mitigation |
|--------------|-------|------------|
| Command sent while server stopped | `ServerProcess.sendCommand` throws or returns false | Check `status === 'running'` before enabling UI actions; disable buttons when stopped |
| Player not found | Command targets offline/nonexistent player | Server prints `That player does not exist` — do not rely on parsing this; instead refresh JSON lists after command |
| Permission denied | Non-op user trying op command | Not applicable — console has full permissions |
| Invalid gamemode | Typo in mode string | Use `<Picker>` or buttons with validated enum values; never free-text gamemode |

---

## Server File Formats

All files live in the active world directory (`config.worldPath`). They are standard Minecraft server files.

### `ops.json`

```json
[
  {
    "uuid": "uuid-with-dashes",
    "name": "Steve",
    "level": 4,
    "bypassesPlayerLimit": false
  }
]
```

**Schema:**
- `uuid` (string, required): Player UUID with dashes
- `name` (string, required): Username
- `level` (number, default 4): Operator permission level
- `bypassesPlayerLimit` (boolean, default false)

### `whitelist.json`

```json
[
  {
    "uuid": "uuid-with-dashes",
    "name": "Steve"
  }
]
```

**Schema:**
- `uuid` (string, required)
- `name` (string, required)

### `banned-players.json`

```json
[
  {
    "uuid": "uuid-with-dashes",
    "name": "Steve",
    "created": "2026-04-28T12:00:00.000Z",
    "source": "Server",
    "expires": "forever",
    "reason": "Banned by an operator."
  }
]
```

**Schema:**
- `uuid` (string, required)
- `name` (string, required)
- `created` (string, ISO 8601 date)
- `source` (string, e.g., "Server")
- `expires` (string, "forever" or ISO 8601 date)
- `reason` (string, optional)

### `banned-ips.json`

```json
[
  {
    "ip": "192.168.1.100",
    "created": "2026-04-28T12:00:00.000Z",
    "source": "Server",
    "expires": "forever",
    "reason": "Banned by an operator."
  }
]
```

**Schema:**
- `ip` (string, required): IPv4 or IPv6 address
- `created`, `source`, `expires`, `reason` (same as banned-players)

### Important Notes

1. **UUID Requirement:** Online-mode servers require valid Mojang UUIDs. Offline-mode servers can use deterministic offline UUIDs (`OfflinePlayer:<name>` hashed) or any placeholder. The existing `playerListManager.ts` fetches Mojang UUIDs via `https://api.mojang.com/users/profiles/minecraft/<username>` and falls back to a zero UUID.
2. **File Write Safety:** When the server is running, it may overwrite these files after a command. The app should re-read the file after a 500ms delay rather than assuming its own write persisted.
3. **Encoding:** UTF-8, no BOM.

---

## UI/UX Patterns

### Existing Project Patterns

The project uses a custom dark theme (`#0f0f0f` background, `#1a1a1a` cards, `#4ade80` primary). Established components:

| Component | Location | Use Case |
|-----------|----------|----------|
| `Card` | `src/components/ui/Card.tsx` | Content containers, list items, sections |
| `Button` | `src/components/ui/Button.tsx` | Actions; variants: `default`, `secondary`, `danger` |
| `Toggle` | `src/components/ui/Toggle.tsx` | Boolean switches (uses React Native `Switch`) |
| `Input` | `src/components/ui/Input.tsx` | Text form fields with label |
| `Badge` | `src/components/ui/Badge.tsx` | Status labels (e.g., "Online", "OP") |
| `Console` | `src/components/ui/Console.tsx` | `FlatList` for scrolling text output |

### Recommended Patterns for Phase 9

#### 1. Real-Time Online Player List (PLAY-01)

- Use a `FlatList` inside a `Card` for the online player list (more performant than `ScrollView` for dynamic lists)
- Each row: player name + status badge ("Online" in green)
- Tap a row to open a context menu — use `Alert.alert` with an array of buttons (React Native's built-in action sheet pattern)
- Show an empty state card when no players are online

```typescript
// Context menu pattern
Alert.alert(
  playerName,
  'Choose an action',
  [
    { text: 'Kick', onPress: () => kickPlayer(playerName), style: 'destructive' },
    { text: 'Ban', onPress: () => banPlayer(playerName) },
    { text: 'Set Gamemode', onPress: () => showGamemodePicker(playerName) },
    { text: 'Op', onPress: () => opPlayer(playerName) },
    { text: 'Cancel', style: 'cancel' },
  ]
);
```

#### 2. Context Menu Actions (PLAY-02)

- **Kick:** Show `Alert.prompt` (or custom modal with `Input`) for optional reason
- **Ban:** Show confirmation dialog with optional reason input; default reason: "Banned by an operator."
- **Op/Deop:** Immediate action with confirmation `Alert.alert`; toggle based on current op status
- **Gamemode:** Use `ActionSheetIOS` on iOS or `Alert.alert` with mode options on Android; or a simple inline `<Picker>` (from `@react-native-picker/picker` if already installed, otherwise use `Alert` buttons)

#### 3. Whitelist Management (PLAY-03)

- **Toggle:** Use existing `Toggle` component bound to a state variable
- **Add/Remove:** Extend existing `app/players/index.tsx` tab UI
- **Sync:** When whitelist toggle changes, dispatch `whitelist on` / `whitelist off` command if server is running

#### 4. Ban Management (PLAY-04)

- **Tabs:** The existing 4-tab layout (`ops`, `whitelist`, `banned-players`, `banned-ips`) already covers this
- **Add ban:** Use `Input` with placeholder specifying "Player name or IP address"
- **Reason:** Add an optional `Input` labeled "Reason (optional)" below the name field
- **Unban:** Each ban row gets a "Remove" / "Unban" `Button` with `variant="danger"` or `variant="secondary"`

#### 5. Operator Management (PLAY-05)

- Already in the existing `ops` tab
- **Grant:** Add button in the "Add" form
- **Revoke:** "Remove" / "Demote" button per row
- **List display:** Current ops with level badge (e.g., `Badge label="Level 4"`)

### Navigation

The `players` screen already exists at `app/players/index.tsx` under the `(tabs)` or stack layout. No new routes are strictly required. If gamemode selection needs a dedicated picker screen, a modal or inline dropdown is preferred over a new route to keep the flow lightweight.

---

## State Management

### Current Stores

**`serverStore.ts`** (persisted via AsyncStorage):
- `configs: ServerConfig[]`
- `activeServerId: string | null`
- `statuses: Record<string, ServerState>`
- `consoleLogs: Record<string, string[]>`
- Not persisted: `statuses`, `consoleLogs`, `backupStatus`

**`playerStore.ts`** (NOT persisted; ephemeral):
- `players: Player[]`
- Actions: `setPlayers`, `updatePlayer`, `removePlayer`, `clear`

### Recommended State Architecture for Phase 9

#### 1. Online Players (Ephemeral)

Keep in `playerStore.ts` but simplify the `Player` type for Phase 9 MVP. Full location/health/hunger tracking is deferred per REQUIREMENTS.md (Out of Scope).

```typescript
// Updated Player type for Phase 9
export interface Player {
  uuid: string;
  username: string;
  online: boolean;
  joinedAt: number | null;
  // Defer to v1.3:
  // ip, latencyMs, world, x, y, z, health, hunger, gameMode
}
```

**Data flow:**
```
Native onLog event → serverManager.ts → consoleParser.ts → playerStore.setPlayers / updatePlayer / removePlayer
```

Why a separate `consoleParser.ts`:
- Decouples regex logic from `serverManager.ts`
- Makes parser unit-testable
- Allows easy addition of new patterns without touching the native bridge

#### 2. Persistent Lists (Ops, Whitelist, Bans)

Do NOT put these in Zustand. They are server-owned JSON files that can change via:
- In-game commands by other ops
- Server auto-flushing after console commands
- Direct file edits

**Data flow:**
```
UI action → playerListManager.modifyPlayerList() → console command OR file write
                    ↓
            Re-fetch from file → local component state (useState)
```

The existing `app/players/index.tsx` already uses this pattern (`useState` + `fetchList`). This is correct. Do not migrate to global store because:
- The data is not app-global; it is server-specific and file-backed
- Stale global state is worse than local state refreshed on tab focus

#### 3. Server Status for Conditional UI

Read from `serverStore.statuses[activeServerId].status`:
- `'running'` → enable player actions, show online list, allow commands
- `'idle'` / `'error'` → disable actions, show offline state, allow only file-based edits (via `playerListManager.ts` offline mode)

#### 4. Whitelist Toggle State

The whitelist runtime state (`on`/`off`) is NOT stored in any JSON file — it is a runtime property controlled by `whitelist on` / `whitelist off` commands. The `server.properties` has `white-list` (or `whitelist` in newer versions), but that only controls whether the whitelist is enforced on startup.

**Recommendation:** Do not persist the runtime whitelist toggle in the store. Instead:
- Derive from `server.properties` read at screen load (for initial state display)
- Update optimistically in UI after sending command
- Re-read `server.properties` if the user needs to verify

Alternatively, simply do not show a visual toggle for runtime state — only enforce via `server.properties` editor (which already exists) and commands. But PLAY-03 requires "whitelist on/off toggle", so implement it as a `Switch` that dispatches the command and shows a transient success indicator.

---

## Implementation Risks

### Risk 1: Regex False Positives from Chat Messages

**Problem:** A player chat message like `Hey, Steve joined the game yesterday` or `I left the game early` could match naive join/leave regex.

**Mitigation:**
- Anchor regex to the exact log prefix and suffix: `^\[.*\] \[Server thread\/INFO\]: (.+?) joined the game$`
- Require `Server thread/INFO` context
- Do not use `.+` without anchors

### Risk 2: Chat Format Plugins (Paper/Spigot)

**Problem:** Paper and Spigot may modify console output format, add color codes, or change `/list` output.

**Mitigation:**
- Test regex against Vanilla first (MVP)
- Use a fallback: if join/leave regex fails for 30 seconds after server start, trigger a `/list` poll to populate the online list
- Make regex patterns configurable or overridable per server type

### Risk 3: Command Race Conditions

**Problem:** User clicks "Ban" then immediately "Kick" for the same player. Commands may queue in stdin unpredictably.

**Mitigation:**
- Disable action buttons while a command is in flight (loading state)
- Show a brief toast or inline spinner during command dispatch
- Queue commands serially rather than parallel (already handled by single stdin pipe)

### Risk 4: Offline UUID Generation

**Problem:** `playerListManager.ts` currently generates `'00000000-0000-0000-0000-000000000000'` as fallback offline UUID. This causes collisions if multiple offline players are added.

**Mitigation:**
- Implement proper offline UUID generation using the Mojang algorithm: `UUID.nameUUIDFromBytes("OfflinePlayer:<name>".getBytes(UTF_8))`
- In TypeScript/JS:
  ```typescript
  import { createHash } from 'crypto'; // or a lightweight uuid lib
  // Algorithm: MD5("OfflinePlayer:Steve") → format as UUID v3
  ```
- Note: React Native may not have Node `crypto` available. Use `expo-crypto` or a pure-JS MD5 library.

### Risk 5: File Desync When Server Is Running

**Problem:** App edits `ops.json` directly while server is running. Server may overwrite the file on next command or auto-save, losing the app's changes.

**Mitigation:**
- `playerListManager.modifyPlayerList()` already prefers console commands when `isRunning === true`. Keep this behavior.
- For offline edits, ensure server is truly stopped before direct JSON mutation.
- After any command, wait 500ms then re-read the JSON file to confirm.

### Risk 6: Player Name Case Sensitivity

**Problem:** `Steve` and `steve` are treated differently by some file operations.

**Mitigation:**
- Mojang usernames are case-sensitive for display but often treated case-insensitively for lookups
- Use `toLowerCase()` for deduplication comparisons, but preserve original case for display and commands

### Risk 7: Legacy Store Import in serverManager

**Problem:** Per PITFALLS.md and Phase 8 work, `serverManager.ts` may still have split-brain store issues. If not fully resolved in Phase 8, player-related status reads may fail.

**Mitigation:**
- Verify `serverManager.ts` imports from `src/stores/serverStore.ts` (multi-server store) before Phase 9 execution
- If legacy store still exists, fix as Phase 9 prerequisite

### Risk 8: Gamemode Command Validation

**Problem:** Invalid gamemode string (e.g., `creativee`) sent to console fails silently or with an unclear error.

**Mitigation:**
- Use a controlled selection UI (`Picker`, `ActionSheet`, or button group) with only valid values: `survival`, `creative`, `adventure`, `spectator`
- Never allow free-text gamemode input

---

## Validation Architecture

### Manual UAT (User Acceptance Testing)

Since the project has no test runner configured (jest/vitest), validation relies on manual UAT and TypeScript type checking.

#### PLAY-01: Real-Time Online Player List

1. Start server
2. Join from a Minecraft client
3. **Expected:** Player name appears in "Online" section of Players screen within 5 seconds
4. Leave from client
5. **Expected:** Player name disappears or shows "Offline" status within 5 seconds
6. Send `/list` command from console
7. **Expected:** Online list reconciles with `/list` output if there was any drift

#### PLAY-02: Context Menu Actions

1. With 1+ player online, tap player name
2. **Expected:** Native action sheet / alert appears with options: Kick, Ban, Op/Deop, Set Gamemode, Cancel
3. Tap Kick → enter reason → confirm
4. **Expected:** Player is disconnected; console shows kick message
5. Re-join player; tap Ban → confirm
6. **Expected:** Player is disconnected and cannot rejoin; `banned-players.json` contains entry
7. Tap Op (on a non-op player)
8. **Expected:** `ops.json` updated; player can execute op commands in-game

#### PLAY-03: Whitelist Management

1. Ensure `white-list=true` in `server.properties` (or enable via UI)
2. Add player `Steve` to whitelist
3. **Expected:** `whitelist.json` contains Steve; Steve can join
4. Remove Steve from whitelist
5. **Expected:** Steve cannot join (gets "You are not whitelisted" message)
6. Toggle whitelist ON/OFF
7. **Expected:** Console shows `Turned on/off the whitelist`; toggle state reflects runtime status

#### PLAY-04: Ban Management

1. Ban player `Griefer` with reason "Griefing spawn"
2. **Expected:** `banned-players.json` entry includes reason; Griefer is kicked and cannot rejoin
3. Ban IP `192.168.1.50`
4. **Expected:** `banned-ips.json` contains entry; any player from that IP cannot join
5. Unban Griefer and unban IP
6. **Expected:** Entries removed from respective JSON files; player/IP can join again

#### PLAY-05: Operator Management

1. Op player `Steve`
2. **Expected:** `ops.json` contains Steve with level 4; Steve has op permissions in-game
3. Demote Steve
4. **Expected:** Steve removed from `ops.json`; op permissions revoked

### Automated Checks (TypeScript + Static Analysis)

1. `npm run typecheck` — must pass with zero errors
2. `grep` checks for required strings in modified files (pattern from Phase 8)
3. Verify no imports from legacy `src/store/serverStore.ts` in modified services

### Edge Case Testing

| Scenario | Test Step |
|----------|-----------|
| Server stopped | All action buttons disabled; file-based edits still work for whitelist/ops/bans |
| Unicode player name | Player with name `测试玩家` joins; parser captures name correctly; context actions work |
| Rapid join/leave | 5 players join/leave within 10 seconds; online list stays consistent |
| `/list` during drift | Disconnect network briefly; reconnect; send `/list`; list reconciles |
| Offline mode server | UUID fallback works; no crash when Mojang API is unreachable |

---

## RESEARCH COMPLETE
