# Phase 11: Cloud Backup to Google Drive

## Goal
Enable users to upload world backups to Google Drive and restore them from cloud storage.

## Deliverables
- `src/services/cloudBackupService.ts` — Google Drive API integration
- `src/stores/cloudBackupStore.ts` — Cloud backup state management
- `app/backup/cloud.tsx` — Cloud backup UI screen
- Updated `app/backup/index.tsx` — Link to cloud backup screen

## Key Decisions
- Uses Google Drive API v3 with OAuth 2.0 via `expo-auth-session`
- Backups stored in "PocketHost Backups" folder on Drive
- Simple multipart upload for ZIP files under 5MB
- Cached backup list in AsyncStorage for offline viewing

## Status
- Implemented 2026-05-01
