---
phase: "02"
phase-slug: "networking-connectivity"
created_at: 2026-04-13
---

# Validation Architecture

## Test Automation Strategy
Since networking depends on external outbound connectivity (`playit.gg`) and Android's native runtime environment preventing mocked CI from being perfectly accurate, verification relies primarily on live-system logs and manual loopback testing.

### Local Node Tests
- [ ] Unit test logic for extracting `https://playit.gg/claim/...` out of sample log buffers.
- [ ] Unit test logic extracting assigned IP out of logs (e.g. `playit.gg allocated: 123.x.y.z:25565`).

### UAT Testing
- [ ] Install Phase 2 APK locally.
- [ ] Start server from UI and verify in the Console that PaperMC executes.
- [ ] Verify there is a "Claim" link parsed and presented in the UI.
- [ ] Navigate to the claim link, associate with playit account, and verify that upon subsequent restarts, a public IP connects to the game.

## Edge Case Coverage
- **Timeout/Offline**: What if playit.gg fails to reach its central servers due to no network? (Expected: Plugin logs an error, server still boots locally, UI handles error gracefully).
- **Log Overflow**: If playit.gg spits hundreds of warnings, ensure the regex doesn't overwork the UI thread and cause ANR.

## Acceptance Criteria
- Server downloads and executes PaperMC instead of Vanilla.
- Playit.gg plugin is seeded correctly.
- UI reveals the playit claim URL if unclaimed, and the playit IP/port if assigned.
