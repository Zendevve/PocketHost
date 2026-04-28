# Phase 8: Performance Tuning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 08-performance-tuning
**Areas discussed:** UI & Layout, Preset Design, JVM Flags UX, Restart Flow

---

## UI & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing properties.tsx | Add Performance section at the top of the current screen; sliders for numeric inputs | ✓ |
| New Performance tab/screen | Separate screen or tab just for performance settings | |

**Agent's recommendation (selected):** Extend existing `properties.tsx` — the screen already handles server.properties editing, adding a Performance section is the simplest integration. Use sliders for view-distance (3-32), simulation-distance (3-32), max-players, entity-broadcast-range-percentage. Card component for section grouping.

**Notes:** User deferred all decisions to the agent. Recommendation based on existing codebase patterns (don't create new screens unnecessarily) and mobile UX (sliders are more natural on touch devices than text inputs for ranges).

---

## Preset Design

| Option | Description | Selected |
|--------|-------------|----------|
| Card-based presets with manual override | 3 cards (Low/Med/High), tap to apply, sliders update, user can tweak after | ✓ |
| Dropdown/button presets | Simple button or dropdown that overwrites all values | |
| No presets | Only individual slider controls | |

**Agent's recommendation (selected):** Card-based presets. Three presets: Low (solo play, 512MB, view-distance 6, simulation-distance 5), Medium (2-5 friends, 1GB, view-distance 10, simulation-distance 8), High (party, 2GB, view-distance 12, simulation-distance 10). Each card shows description text below the name. Tapping highlights the card, updates sliders. Manual slider changes deselect preset (shows "Custom").

---

## JVM Flags UX

| Option | Description | Selected |
|--------|-------------|----------|
| Simple toggle (Aikar's on/off) | Single switch, on by default, brief description text | ✓ |
| Expert custom editor | Text area for custom JVM flags with preset as starting point | |

**Agent's recommendation (selected):** Simple toggle. Label: "Optimize JVM performance (Aikar's flags)". Description: "Reduces lag with community-standard JVM settings. Recommended for all servers." Toggle applies Aikar's G1GC flag set. No custom editor in v1.2 — keeps the UI approachable.

---

## Restart Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Save-with-restart-prompt | Save immediately, show dialog if server is running, yellow banner warning | ✓ |
| Save-only (auto-restart) | Save then automatically restart the server | |
| Block editing when running | Don't allow changes while server is running | |

**Agent's recommendation (selected):** Save-always, prompt for restart. Save writes to file and store immediately. When server is running: yellow banner "Server must restart to apply new settings" appears, and after save a dialog offers "Restart Now" / "Later". When server is stopped: normal save with no prompt.

---

## Agent's Discretion

- Slider visual design (thumb, track, labels)
- Preset card exact layout and copy text  
- Validation error message wording
- Which fields go in "Advanced" collapsible section
- JVM toggle placement relative to presets

## Deferred Ideas

- Custom JVM flag editor — v1.3+
- Performance monitoring graphs — separate analytics phase
- Auto-tuned presets based on device specs — future phase
