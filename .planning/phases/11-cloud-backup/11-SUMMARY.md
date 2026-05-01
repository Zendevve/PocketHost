# Phase 11: Cloud Backup to Google Drive

## Goal
Enable users to upload world backups to Google Drive and restore them from cloud storage.

## Deliverables
- `src/services/cloudBackupService.ts` — Google Drive API integration
- `src/stores/cloudBackupStore.ts` — Cloud backup state management
- `app/backup/cloud.tsx` — Cloud backup UI screen
- `src/lib/config.ts` — Centralized OAuth client ID configuration
- Updated `app/backup/index.tsx` — Link to cloud backup screen

## Key Decisions
- Uses Google Drive API v3 with OAuth 2.0 via `expo-auth-session`
- Backups stored in "PocketHost Backups" folder on Drive
- Simple multipart upload for ZIP files under 5MB
- Cached backup list in AsyncStorage for offline viewing
- OAuth client ID read from `app.json` extra field (runtime validation before sign-in)

## Known Limitations
- **5 MB upload limit**: Simple multipart upload is used. Files larger than 5 MB will throw a clear error until resumable upload is implemented.
- **OAuth setup required**: Developers must set `extra.googleOAuthWebClientId` in `app.json` with a valid Google Cloud OAuth 2.0 Web Client ID.

## Status
- Implemented 2026-05-01
- Hardened 2026-05-01: typed Drive API responses, runtime OAuth validation, size guard
