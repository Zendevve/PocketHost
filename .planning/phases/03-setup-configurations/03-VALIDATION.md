---
phase: "03"
phase-slug: "setup-configurations"
created_at: 2026-04-13
---

# Validation Architecture

## Test Automation Strategy
Verify that state config seamlessly propagates to the native android environment.

### Unit / State Tests
- [ ] Memory limit updates in Zustand store.
- [ ] Active world correctly validates path-safe characters in Zustand store.

### Integration / Native Tests
- [ ] Calling `ServerProcessModule.startServer(jarPath, 2048, "myworld")` successfully fires the Kotlin bridging mechanisms without throwing mismatch argument exceptions.
- [ ] Kotlin successfully executes `ProcessBuilder` with `-Xmx2048M` and `--world myworld`.

### UAT Testing
- [ ] Install Phase 3 APK locally.
- [ ] Adjust RAM slider to 1024MB. 
- [ ] Change world text input to `alt-world`.
- [ ] Tap Start Server.
- [ ] Validate standard out console says JVM started with 1024MB (if visible) or successfully starts isolated in the `alt-world` folder.
- [ ] Stop server, start again with default `world` — ensure previous session map isn't loaded (verifies isolated map loading).

## Acceptance Criteria
- Memory Slider inputs are respected by the JVM process.
- Active World inputs are respected and create isolated directories inside `server/` directory on Android storage.
