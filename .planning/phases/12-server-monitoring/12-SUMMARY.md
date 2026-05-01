# Phase 12: Server Monitoring & Performance Tracking

## Goal
Real-time and historical server performance monitoring with TPS, memory, and player count tracking.

## Deliverables
- `src/services/metricsService.ts` — Metrics collection and persistence
- `src/stores/metricsStore.ts` — Metrics state management
- `app/server/monitoring.tsx` — Monitoring dashboard with bar charts
- Updated `src/services/console-parser.ts` — TPS and memory log parsing
- Updated `src/services/serverManager.ts` — Metrics collection integration

## Key Decisions
- Metrics collected every 30 seconds while server is running
- 24-hour rolling history (288 data points at 5-minute intervals)
- Simple bar chart visualization using native Views (no heavy charting library)
- TPS parsed from PaperMC console output

## Status
- Implemented 2026-05-01
