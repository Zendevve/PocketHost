# Pitfalls Research — v1.2 Server Management & Multiplayer

## 1. Console Log Parsing Pitfalls

### Player names with special characters
- Minecraft allows Unicode names. Regex `(.+)` is greedy and may capture log noise.
- **Prevention:** Use non-greedy `(.+?)` and anchor to known patterns. Test with CJK, emoji, and apostrophe names.
- **Phase to address:** Phase 9 (Player Management)

### Log buffering and race conditions
- Server output is buffered. Join/leave may arrive out of order relative to commands.
- `/list` output may include recently-left or recently-joined players during the window.
- **Prevention:** Use `joinedAt` timestamps for deduplication. Poll `/list` periodically as reconciliation mechanism.

### Regex false positives
- Chat messages containing "joined the game" or "left the game" will match player patterns.
- **Prevention:** Require `[Server thread/INFO]:` prefix in regex. Strip chat-formatted log lines first.
- **Phase to address:** Phase 9

## 2. Store Split-Brain Risk

### Two conflicting serverStore implementations
- `serverManager.ts` writes to legacy `src/store/serverStore.ts`
- UI reads from `src/stores/serverStore.ts` (multi-server, persisted)
- **Symptom:** Status changes from native bridge may not propagate to UI.
- **Prevention:** Consolidate to `src/stores/serverStore.ts`. Update `serverManager.ts` import. Test startup/shutdown lifecycle.
- **Phase to address:** Should be fixed first — affects everything. Include in Phase 8 as dependency fix.

## 3. Sharing Integration Pitfalls

### QR code rendering performance
- `react-native-qrcode-svg` renders SVG which can be slow on older Android devices.
- **Prevention:** Set fixed size (256x256), memoize component, avoid re-renders during animations.
- **Phase to address:** Phase 10

### Share intent failure
- `expo-sharing` opens OS share dialog. Some Android skins (Xiaomi, Huawei) have non-standard share behavior.
- **Prevention:** Fall back to clipboard copy if share fails. Show copy confirmation toast.
- **Phase to address:** Phase 10

### expo-sharing API compatibility
- `expo-sharing` requires `expo` SDK 52+. Already met (project uses SDK 52).
- **Verification:** Run `expo install expo-sharing` to get correct version.

## 4. Performance Tuning Pitfalls

### Invalid server.properties values
- Some properties have strict type/ranges. Writing invalid values crashes server on next start.
- **Prevention:** Validate all inputs client-side. Use `<Picker>` for enums, clamp sliders to valid ranges. Show warning if server is running (changes require restart).
- **Phase to address:** Phase 8

### JVM flag compatibility
- Not all JVM flags work on Android JRE (which may be trimmed/optimized).
- Aikar's flags reference `-XX:+UseG1GC` which requires G1GC enabled in the JRE build.
- **Prevention:** Test with actual Android JRE. Provide opt-in toggle with warning. Start with safe defaults.
- **Phase to address:** Phase 8

### Server crash on property change
- Changing `server.properties` while server is running doesn't crash the server, but REQUIRES restart to take effect.
- **Prevention:** Show clear "Restart required" warning. Disable editing when server is running, or save-only with restart prompt.

## 5. Player Management Pitfalls

### UUID lookup failures
- Mojang API may be rate-limited or offline. UUID lookup failure should not block player management.
- **Prevention:** Use offline UUID (`OfflinePlayer:username`) as fallback. Cache UUIDs locally.
- Already handled in `playerListManager.ts`.

### Command dispatch failures
- Server may not be running when player management action is triggered.
- **Prevention:** Already handled — `playerListManager.modifyPlayerList()` checks `isRunning` param and falls back to direct JSON file editing.

## 6. Existing Technical Debt Impact

| Debt | v1.2 Risk | Mitigation |
|------|-----------|------------|
| CORE-03 (clean stop) unverified | Server may not stop cleanly for restart after property changes | Include restart validation in Phase 8 testing |
| No test runner | Can't run automated tests for new features | Consider adding jest before Phase 8 |
| `any` casts in serverManager | Type safety gaps in console parsing code | Keep `any` casts minimal; add explicit type guards for new code |
