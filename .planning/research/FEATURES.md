# Feature Research — v1.2 Server Management & Multiplayer

## Category: Player Management

### Table Stakes (minimum viable)
| Feature | Description | Complexity |
|---------|-------------|------------|
| Online player list | Parse join/leave from console logs, show real-time list | Medium |
| Whitelist management | Add/remove players from whitelist (already functional) | Low (exists) |
| Ban management | Ban/unban players by name or IP (already functional) | Low (exists) |
| Op/Deop | Grant/revoke operator permissions (already functional) | Low (exists) |

### Differentiators
| Feature | Description | Complexity |
|---------|-------------|------------|
| Player context actions | Tap player → kick, ban, op, gamemode from context menu | Medium |
| Join/leave notifications | Toast or log entry when players join/leave | Low |
| Player stats | Display health, location, gamemode for online players | Medium-High |

### Anti-Features
- In-game chat monitoring (privacy concern, complex regex)
- Player inventory editing (can't do via console commands)

## Category: Sharing & Invites

### Table Stakes
| Feature | Description | Complexity |
|---------|-------------|------------|
| Copy server address | One-tap copy IP:port to clipboard | Low |
| QR code generation | Generate QR code from server address | Low |
| Share sheet | Open OS share dialog with server address | Low |

### Differentiators
| Feature | Description | Complexity |
|---------|-------------|------------|
| Share with connection instructions | Share text + address + quick-start guide | Low |
| Server status page | Shareable URL showing server online/offline status | High (needs backend) |

### Anti-Features
- Public server browser (privacy, requires authentication)
- Discord bot integration (out of scope, requires backend)

## Category: Performance Tuning

### Table Stakes
| Feature | Description | Complexity |
|---------|-------------|------------|
| View distance slider | Control view-distance in server.properties | Low (extend existing) |
| Max players | Control max-players in server.properties | Low (extend existing) |
| Simulation distance | Control simulation-distance (CPU savings) | Low |
| Entity limits | Control entity-broadcast-range-percentage | Low |

### Differentiators
| Feature | Description | Complexity |
|---------|-------------|------------|
| JVM GC flags | Aikar's flags preset for G1GC optimization | Medium |
| Performance presets | Low/Med/High presets that adjust multiple settings | Medium |
| Memory pressure monitoring | Real-time heap usage display | Medium-High |

### Anti-Features
- CPU profiling or JVM debug tools (developer tools, not user-facing)
- Auto-scaling (not applicable on single device)

## Existing vs Changed

| What Exists | v1.2 Change |
|-------------|-------------|
| `playerListManager.ts` — whitelist/ban/op CRUD | Unchanged, lean on it |
| `playerStore.ts` — Zustand store (unused) | Wire to console log parsing |
| `players/index.tsx` — 4-tab UI using local state | Migrate to playerStore |
| `propertiesManager.ts` — server.properties read/write | Extend EDITABLE_PROPS list |
| `properties.tsx` — 8-property settings form | Add performance section |
| Console log parsing (playit only) | Add join/leave/TPS/list patterns |
| Two conflicting serverStores | Consolidate or bridge properly |
