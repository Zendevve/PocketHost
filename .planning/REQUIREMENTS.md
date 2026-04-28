# v1.2 Requirements — Server Management & Multiplayer

**Defined:** 2026-04-28
**Core Value:** Making Minecraft server hosting feel like a native mobile experience

## v1 Requirements

### Performance Tuning

- [ ] **PERF-01**: User can adjust key `server.properties` performance fields (view-distance, simulation-distance, max-players, entity-broadcast-range-percentage) via sliders/inputs with valid range constraints
- [ ] **PERF-02**: User can select from Low/Medium/High performance presets that configure multiple server.properties settings and JVM flags at once
- [ ] **PERF-03**: User can enable JVM GC optimization flags (Aikar's preset) with an on/off toggle; flags applied on next server start
- [ ] **PERF-04**: Property edits show clear "restart required" warning when server is running; server validates values before restart

### Player Management

- [ ] **PLAY-01**: User sees real-time online player list updated from server console output (join/leave events parsed with regex)
- [ ] **PLAY-02**: User can tap an online player to access context menu actions: kick, ban, op/deop, set gamemode
- [ ] **PLAY-03**: User can manage server whitelist — add/remove players; whitelist on/off toggle; entries sync to server
- [ ] **PLAY-04**: User can manage bans by player name and IP address with optional reason; ban list shows active bans with unban option
- [ ] **PLAY-05**: User can grant and revoke operator permissions; ops list shows current ops with demote option

### Sharing & Invites

- [ ] **SHAR-01**: User can copy the server join address (relay IP:port or local IP:port) to clipboard with a single tap
- [ ] **SHAR-02**: User can view a generated QR code for the server address suitable for other players to scan and join
- [ ] **SHAR-03**: User can open the native OS share sheet to share server address via SMS, Discord, WhatsApp, or any messaging app

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-game chat monitoring | Privacy concern; complex chat format parsing |
| Player inventory editing | Can't do via console commands; requires plugin API |
| Public server browser or listing | Requires backend infrastructure; not mobile-appropriate |
| Discord bot integration | External service dependency; out of server management scope |
| Performance metrics graphs/history | Adds complexity; current approach is point-in-time display |
| Player stats (health, location, gamemode display) | Requires additional command polling; defer to v1.3 |
| Server MOTD/brand customization | Minor feature; defer to polish milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 | 8 | Pending |
| PERF-02 | 8 | Pending |
| PERF-03 | 8 | Pending |
| PERF-04 | 8 | Pending |
| PLAY-01 | 9 | Pending |
| PLAY-02 | 9 | Pending |
| PLAY-03 | 9 | Pending |
| PLAY-04 | 9 | Pending |
| PLAY-05 | 9 | Pending |
| SHAR-01 | 10 | Pending |
| SHAR-02 | 10 | Pending |
| SHAR-03 | 10 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---

*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 after initial definition*
