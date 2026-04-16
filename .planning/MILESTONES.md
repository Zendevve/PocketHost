# Milestone History

## v1.0 MVP — Shipped 2026-04-16

**Scope:** Phases 1–4 | **Plans:** 4 | **Tasks:** ~12 | **Timeline:** 5 days (Apr 11–16, 2026)  
**Code:** 492 files changed, +85,209 LOC

### Accomplishments

1. **Stable Core Backend** — Zustand store, serverManager bridge, Dashboard UI with live console streaming; Android foreground service keeps server alive when minimized.
2. **Networking & Connectivity** — Playit.gg tunnel integration with automatic plugin injection; claim links and public IP display in UI.
3. **Setup & Configurations** — Memory allocation slider (up to 4GB), world folder selector, JVM flag bridging; controls locked during runtime.
4. **Plugins & Expansion** — Full plugin lifecycle: .jar import via file picker, YAML config editor, enable/disable, reload; js-yaml and expo-document-picker added.

### Key Decisions & Outcomes

- Background stability first → confirmed good; foreground service proven.
- Zustand & serverManager abstraction → scalable state layer.
- PaperMC over Vanilla → plugin-ready foundation.
- js-yaml & flat config editor → shipped; nested deferred.
- Plugin metadata extraction → deferred (needs ZIP library).

---

_Next: v1.x (Phase 5+ planned)_
