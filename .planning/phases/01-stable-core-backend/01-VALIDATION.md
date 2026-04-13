---
phase: 1
slug: stable-core-backend
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None -- relies on manual device testing or Native Android logging |
| **Config file** | none |
| **Quick run command** | `adb logcat | grep PocketHost` |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Verify TS compiles correctly (`npx tsc --noEmit`)
- **After every plan wave:** Expo local run / build
- **Before `/gsd-verify-work`:** App must build on Android cleanly.
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | CORE-01 | build | `npx expo prebuild` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | CORE-01 | static | `npx tsc` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `testing-framework` — We likely need to set up minimal static checks.
- [ ] `asset-prep` — We must ensure `jre.zip` and the `.jar` can be pulled.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Minimizing App doesn't kill server | CORE-02 | Android OS Process lifecycle | Open app, start server, press home button, wait 5 min, open app. Server should still stream logs. |
| Clean stop server | CORE-03 | Android Intent / Service binding | Click "Stop", verify log outputs "Saving chunks" and "Server Stopped". |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
