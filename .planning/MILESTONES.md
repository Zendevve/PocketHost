# Milestone History

## v1.2 Server Management & Multiplayer (Shipped: 2026-04-29)

**Scope:** Phases 8–10 | **Plans:** 5 | **Tasks:** ~17 | **Timeline:** 2 days (Apr 28–29, 2026)
**Code:** 46 files changed, +3,308 / -738 LOC

### Accomplishments

1. **Performance Tuning** — Interactive server.properties sliders (view-distance, simulation-distance, max-players), Low/Med/High preset cards, Aikar's JVM GC optimization toggle, restart safety flow with 3s gap.
2. **Player Management** — Real-time online player list via console log regex parsing, native action sheet for kick/ban/op/deop/gamemode, whitelist/banned-players/banned-ips/ops management tabs with reason support.
3. **Sharing & Invites** — One-tap clipboard copy via expo-clipboard, QR code modal via react-native-qrcode-svg, native OS share sheet integration.

### Key Decisions & Outcomes

- Pure-JS MD5 for offline UUID generation → avoids external crypto dependency in React Native
- Username-keyed player store → join events don't include UUIDs, username is reliable
- Console commands preferred when running, direct JSON edits when stopped → safest approach
- react-native-qrcode-svg for QR → pure JS, no extra native deps beyond react-native-svg

---

## v1.1 Backup & Polish — Shipped 2026-04-28

**Scope:** Phases 5–7 | **Plans:** 3 | **Tasks:** ~12 | **Timeline:** ~12 days (Apr 16–28, 2026)
**Code:** React Native (Expo) + TypeScript + Zustand; adm-zip, js-yaml

### Accomplishments

1. **World Backup & Restore** — ZIP creation with progress, AsyncStorage history, dual-confirmation restore with automatic server stop/start, integrity validation, rollback on failure.
2. **Nested YAML Config Editor** — Tree-view rendering, inline scalar editing, array/object add/remove/reorder, js-yaml round-trip preservation.
3. **Plugin Metadata** — JAR manifest parsing via adm-zip, name/version/author display, corrupted JAR warnings.

---

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

_Next: v1.3 (Phase 11+ planned)_
