# Phase 14: Analytics Dashboard

## Goal
Player and server analytics including session tracking, playtime, uptime history, and peak player counts.

## Deliverables
- `src/services/analyticsService.ts` — Analytics data collection and computation
- `src/stores/analyticsStore.ts` — Analytics state management
- `app/server/analytics.tsx` — Analytics dashboard screen
- Updated `src/services/serverManager.ts` — Session tracking integration

## Key Decisions
- Player sessions tracked via join/leave log events
- Server sessions tracked via start/stop events
- Daily stats computed on-demand from session data
- Top 10 players by playtime displayed
- 7-day daily activity summary

## Status
- Implemented 2026-05-01
