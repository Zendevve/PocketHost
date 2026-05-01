# Phase 13: Advanced World Management & Templates

## Goal
Advanced world management including duplication, renaming, templates, world creation from templates, and NBT-based world property reading.

## Deliverables
- `src/services/worldTemplateService.ts` — World/template CRUD operations
- `src/services/nbtParser.ts` — Minimal NBT parser for Minecraft level.dat files
- `src/stores/worldStore.ts` — World and template state
- `app/worlds/index.tsx` — Enhanced world management screen

## Key Decisions
- Templates stored as ZIP files in app documents directory
- World operations use `expo-file-system` for copy/move/delete
- Active world highlighted in the UI
- NBT parsing implemented with `pako` for gzip decompression — reads level name, spawn, game type, difficulty, time, seed

## Status
- Implemented 2026-05-01
- NBT parser added 2026-05-01
