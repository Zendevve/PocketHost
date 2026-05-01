# Phase 13: Advanced World Management & Templates

## Goal
Advanced world management including duplication, renaming, templates, and world creation from templates.

## Deliverables
- `src/services/worldTemplateService.ts` — World/template CRUD operations
- `src/stores/worldStore.ts` — World and template state
- `app/worlds/index.tsx` — Enhanced world management screen

## Key Decisions
- Templates stored as ZIP files in app documents directory
- World operations use `expo-file-system` for copy/move/delete
- Active world highlighted in the UI
- NBT parsing deferred (level.dat not parsed)

## Status
- Implemented 2026-05-01
