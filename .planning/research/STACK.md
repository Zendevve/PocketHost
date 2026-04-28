# Stack Research — v1.2 Server Management & Multiplayer

## New Dependencies Needed

### Sharing & QR Code
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-sharing` | ~13.0 | OS-native share sheet (SMS, Discord, WhatsApp) |
| `react-native-qrcode-svg` | ^6.3 | Generate QR codes with customizable styling |
| `react-native-svg` | ~15.0 | SVG rendering (required by qrcode-svg) |
| `expo-clipboard` | ~7.0 | Copy server address to clipboard |

**Integration:** No native module issues — all are pure JS + Expo managed workflow. `expo install` handles version compatibility with Expo SDK 52.

### Player Management
**No new dependencies needed.** Existing `playerListManager.ts` handles:
- `ops.json`, `whitelist.json`, `banned-players.json`, `banned-ips.json` read/write
- Mojang API UUID lookup (`https://api.mojang.com/users/profiles/minecraft/{username}`)
- Server command dispatch when online (`/op`, `/deop`, `/whitelist add/remove`, `/ban`, `/pardon`, etc.)

`playerStore.ts` already exists as a Zustand store but is **unused** — needs wiring.

### Performance Tuning
**No new dependencies needed.** Existing `propertiesManager.ts` handles `server.properties` read/write. Need to extend the `EDITABLE_PROPS` list.

## What NOT to Add
- `react-native-share` — `expo-sharing` is simpler and Expo-managed
- `react-native-clipboard` — use `expo-clipboard`
- Bukkit/Spigot API dependencies — player management uses vanilla Minecraft commands only

## Integration Points
- `expo-sharing` uses `expo-file-system` (already in use)
- `expo-clipboard` uses React Native clipboard (no conflict)
- `react-native-svg` is a peer dependency of `react-native-qrcode-svg`

## Risk: Expo SDK 52 Compatibility
All listed packages have Expo SDK 52 support. Verify with `expo install` which resolves compatible versions automatically.
