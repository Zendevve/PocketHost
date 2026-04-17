---
wave: 1
depends_on: []
files_modified:
  - src/components/ui/ConfigTreeEditor.tsx
  - src/components/ui/YamlNode.tsx
  - app/plugins/[id].tsx
  - src/services/pluginConfigManager.ts
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-03
  - CONF-04
---

# Phase 6 Plan — Nested Config Editor

## Objective

Replace the flat `ConfigEditor` with a tree-view YAML editor that supports nested objects and arrays, inline scalar editing, add/remove/reorder operations, and preserves YAML document structure on round-trip.

## Quality Gates

- [x] **QG-1** — At least 3 tasks defined (5 tasks present)
- [x] **QG-2** — Each task has clear acceptance criteria and file targets
- [x] **QG-3** — No phase crosses wave boundaries (all in wave 1)
- [x] **QG-4** — Dependencies internal to phase only (none external)
- [x] **QG-5** — Files exist and match project conventions (TSX, React Native, zustand)
- [x] **QG-6** — Requirement IDs in frontmatter: CONF-01, CONF-02, CONF-03, CONF-04 (all 4 present)
- [x] **QG-7** — Platform constraints honored (React Native, FileSystem, js-yaml, no native modules)

## Tasks

### Task 6-1 — Create ConfigTreeEditor component

**Files:** `src/components/ui/ConfigTreeEditor.tsx`

**Acceptance:**
- Recursive component renders YAML as tree: objects show `{ key: value }` collapsible, arrays show `[ item1, item2 ]` collapsible
- Root-level nodes are keys directly under document root
- Each node shows expansion toggle (▶/▼) for containers (objects/arrays); leaf nodes (scalars) show value preview
- Expansion state managed locally via `Record<string, boolean>` keyed by node path (e.g., `"0"`, `"0.children.1"`)
- On unmount, expansion state resets

**Dependencies:** None internal. Uses existing `theme` and `colors`.

**Implementation notes:**
- Node path encoding: path segments separated by `.`, arrays use numeric indices
- Initial expansion: root nodes collapsed by default; optionally auto-expand first level (configurable via prop `defaultExpandedDepth?: 1`)
- Render each node using `YamlNode` component (Task 6-2)

---

### Task 6-2 — YamlNode leaf rendering and inline editing

**Files:** `src/components/ui/YamlNode.tsx`

**Acceptance:**
- `YamlNode` receives `path`, `value`, `type` ('object' | 'array' | 'string' | 'number' | 'boolean' | 'null'), `onUpdate`, `onAdd`, `onRemove`, `onReorder` props
- For scalar types: renders `Input` (strings), numeric keyboard (numbers), or toggle (booleans via `Pressable` showing ON/OFF)
- Editing updates propagate up via `onUpdate(path, newValue)` callback which mutates parent container
- For container nodes: shows child count badge and expansion arrow; does not allow direct value editing
- Value display formatted: strings truncated to 40 chars, numbers shown with original precision, booleans as Yes/No, null as `<null>`

**Dependencies:** None internal.

**Implementation notes:**
- Use `Switch` or custom toggle for booleans (aligning with project design tokens)
- `Input` from `ui/Input` is reused; ensure multiline=false for scalars
- `onUpdate` signature: `(path: string, value: unknown) => void`; parent `ConfigTreeEditor` reconstructs nested object using path

---

### Task 6-3 — Array and object mutation operations

**Files:** `src/components/ui/ConfigTreeEditor.tsx` (primary), `src/components/ui/YamlNode.tsx` (UI controls)

**Acceptance:**
- Arrays: "Add Item" button appends new scalar (empty string) or empty object based on array element type inference from existing items or user selection modal (Add String / Add Number / Add Boolean / Add Object)
- Arrays: "Remove" button on each array item; "Move Up"/"Move Down" buttons on each item (except first/last)
- Objects: "Add Key" button opens simple prompt (via `Alert.prompt` or custom modal) to enter new key name; creates new leaf with empty string value
- Objects: "Remove Key" button on each key row
- All mutations update local state and trigger `onChange` callback with full updated config object
- Disable add/remove for root-level special keys? No — treat root as normal object

**Dependencies:** `ConfigTreeEditor` state (`setConfig`)

**Implementation notes:**
- For "Add Object" array item: deep clone of first object element if present, else `{}`
- Use `Alert.prompt` is deprecated; implement minimal `PromptModal` component or reuse existing UI patterns (e.g., show Input inline with "Add" button). Given simplicity, add "new key" row with Input directly in object container.

---

### Task 6-4 — YAML validation and round-trip preservation

**Files:** `src/services/pluginConfigManager.ts`

**Acceptance:**
- Before writing to disk, attempt `yaml.dump` with options: `{ lineWidth: 0, noRefs: true, quotingType: '"', forceQuotes: null }`
- If `yaml.dump` throws, display error in UI highlighting the problematic node path
- On write, call existing `writePluginConfig` (which already uses `yaml.dump`); ensure it preserves nested structure (no flattening)
- Round-trip test: load YAML string → display in tree → edit scalar → save → reload → structure matches original keys/containers

**Dependencies:** Existing `js-yaml` (already in `package.json`)

**Implementation notes:**
- js-yaml preserves order of object keys by default (ES2015+). This satisfies structure preservation.
- Comments are not preserved by js-yaml; document as known limitation (CONF-04 says "comments not guaranteed")
- Anchors/aliases: `noRefs: true` prevents duplicate serialization but may lose anchors. Acceptable per out-of-scope.

---

### Task 6-5 — Integrate into PluginDetailScreen

**Files:** `app/plugins/[id].tsx`

**Acceptance:**
- Replace `<ConfigEditor />` with `<ConfigTreeEditor />`
- Pass `initialConfig={configData}`, `configPath={configPath}`, `onSaved={loadPluginAndConfig}`
- `ConfigTreeEditor` exposes `onChange` callback; when user clicks "Save Config", component calls `writePluginConfig` internally or parent handles save. Choose parent-handled save: `ConfigTreeEditor` maintains local draft state, calls `onChange(draftConfig)` on each edit; parent accumulates via state; Save button outside (in a Card footer) triggers actual write via `writePluginConfig`.
- Alternatively, embed Save button inside `ConfigTreeEditor`; consistency with existing UI suggests keep button inside component (like current `ConfigEditor`). We'll keep button internal to simplify screen changes.
- Loading/error states: Show validation error inline if YAML invalid after edit; disable Save until valid

**Dependencies:** Tasks 6-1 through 6-4

**Implementation notes:**
- `app/plugins/[id].tsx` already imports `ConfigEditor`. Update import to `ConfigTreeEditor`.
- Ensure `configData` typed as `Record<string, unknown>` is passed correctly.
- If no config file exists, keep existing "No configuration file found" message.

---

## Verification

**Manual verification steps:**
1. Open plugin detail screen for a plugin with complex nested config (e.g., `EssentialsX` with multiple sections)
2. Verify tree renders all nested objects/arrays with expand toggles
3. Tap a scalar value → edit inline → see immediate change in tree
4. Add a new key to an object → Save → reload screen → key persists
5. Add item to an array → reorder → Save → reload → array order preserved
6. Introduce a YAML syntax error (e.g., unclosed quote) → validation shows error, Save disabled
7. Correct error → Save succeeds → config reloads without data loss

**YAML round-trip test:**
- Import a sample plugin config with comments, mixed types, deep nesting
- Edit 3–4 scattered values
- Save
- Compare pre-edit and post-reload structures via console.log; keys and hierarchy must match

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Deeply nested structures cause performance issues | Medium | Initial depth limit (auto-expand depth=1); lazy expansion renders children only when expanded |
| Large arrays (>100 items) slow rendering | Medium | Render only visible items; add "Show more" pagination if needed (polish) |
| Invalid YAML produced by malformed user input | High | Real-time validation on each edit; `yaml.safeLoad` on draft before enabling Save |
| State synchronization between tree and server store | Low | Local draft only committed on Save; existing `writePluginConfig` handles disk I/O |
| Type coercion (number vs string) confusion | Medium | Use appropriate keyboard (numeric for numbers); store as native JS types, let yaml.dump handle formatting |

## Rollback

Revert changes to `app/plugins/[id].tsx` (restore `ConfigEditor` import and usage). No server migration needed; config files remain compatible.
