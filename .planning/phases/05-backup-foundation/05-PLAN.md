---
wave: 1
depends_on: []
files_modified:
  - src/services/backupService.ts
  - app/backup/index.tsx
  - src/components/ui/BackupCard.tsx
  - src/stores/backupStore.ts
  - src/services/serverManager.ts
autonomous: true
requirements:
  - BACK-01
  - BACK-02
  - BACK-03
  - BACK-04
  - BACK-05
---

# Phase 5: Backup Foundation Plan 01

## Objective
Implement complete world backup and restore system: users can create ZIP backups of their server world, view backup history with metadata, restore any backup with dual-confirmation safety and automatic server stop/restart, with integrity validation and progress feedback throughout.

## Verification
- TypeScript compilation: `npx tsc --noEmit` returns 0 errors
- Manual QA: create backup → verify file in downloads, restore → server restarts with world loaded, invalid ZIP rejected
- Backup ZIP opens cleanly with system unzip tool

## Tasks

```xml
<task id="5-01-01">
  <title>Create BackupStore and BackupService</title>
  <description>Build state management and core backup/restore service using admzip and expo-file-system.</description>
  <read_first>
    - src/services/serverManager.ts (for server lifecycle integration)
    - src/stores/serverStore.ts (state pattern reference)
    - package.json (to verify admzip dependency)
  </read_first>
  <action>
    1. Install admzip: `npx expo install admzip`
    2. Create `src/stores/backupStore.ts`:
       - State: `backups: Array<{id, path, size, timestamp, worldName}>`
       - Actions: `addBackup(entry)`, `removeBackup(id)`, `clearHistory()`
       - Persist to AsyncStorage for history survival across app restarts
    3. Create `src/services/backupService.ts`:
       Exports:
       - `createBackup(worldPath: string, destDir: string): Promise<{path: string, size: number}>`
         * Use `FileSystem.readDirectoryAsync(worldPath)` to enumerate world files
         * Create ZIP via `new AdmZip()`, add each file with `addLocalFile` or `addFile` (buffer)
         * Write to temp file: `${destDir}/pockethost-backup-${Date.now()}.zip`
         * Validate: `AdmZip.checkZip()` or open and verify central directory
         * On success, call `backupStore.getState().addBackup({...})`
         * Return path and size
       - `restoreBackup(backupPath: string, worldPath: string): Promise<boolean>`
         * Validate ZIP integrity first (AdmZip can open; check CRC)
         * Stop server via `serverManager.stopServer()` and wait for 'stopped' status
         * Backup current world folder to `.old` before extraction (safety rollback)
         * Extract ZIP contents into `worldPath` overwriting existing files
         * Start server via `serverManager.startServer(...)` (auto-restart)
         * On error, rollback from `.old` folder
       - `listBackups(): Promise<Array<{path, size, timestamp}>>` from persisted storage
       - `validateBackupFile(backupPath: string): Promise<boolean>` using AdmZip open + entry count check
       - Events: Use callbacks or emit via BackupStore for progress (use `onProgress` callback param)
    4. Add `backupStore` to your app's root store injection (if using Zustand, just export hook)
    5. Update `src/services/serverManager.ts` to expose `stopServer`/`startServer` publicly if not already
  </action>
  <acceptance_criteria>
    - `src/stores/backupStore.ts` exists with Zustand store: `useBackupStore` exporting state + actions
    - `src/services/backupService.ts` exists with all 5 exports implemented
    - `package.json` includes `admzip` (version ^2.1.0)
    - `npx tsc --noEmit` passes with 0 errors
    - BackupStore persists data via AsyncStorage (or localStorage for web fallback)
  </acceptance_criteria>
</task>

```xml
<task id="5-01-02">
  <title>Build Backup History Screen</title>
  <description>Create UI for viewing backup history, creating new backups, and initiating restore with safety dialogs.</description>
  <read_first>
    - app/plugins/index.tsx (pattern for screen layout, Card usage, list rendering)
    - src/components/ui/Card.tsx
    - src/components/ui/Button.tsx
    - src/lib/theme.ts
  </read_first>
  <action>
    Create `app/backup/index.tsx` (Expo Router screen).

    Screen layout:
    - Heading: "World Backups"
    - Description: "Create ZIP backups of your world. Restoring stops the server and replaces the current world folder."
    - "Create Backup Now" primary button (calls backupService.createBackup, shows progress via ActivityIndicator)
    - Backup list: FlatList of BackupCard components (see next task)
    - Empty state: Card with "No backups yet. Create your first backup."

    Hook into `useBackupStore` to read `backups` array.
    On mount: call `backupService.listBackups()` to populate store.
    On create backup: show modal/progress overlay, handle success/error Alert.
    On restore button (from card): open confirmation dialog (see task 5-01-03 for flow).

    Navigation: Add entry to app layout menu or bottom tab as "Backups" linking to /backup.
  </action>
  <acceptance_criteria>
    - `app/backup/index.tsx` exists and compiles
    - Screen shows "Create Backup Now" button and list of backups with timestamp, size
    - Tapping "Create Backup" triggers service, shows progress, then success toast
    - Backup list updates after creation
    - TypeScript compilation: 0 errors
  </acceptance_criteria>
</task>

```xml
<task id="5-01-03">
  <title>Implement Dual-Confirmation Restore Flow</title>
  <description>Add safety checks before restore: confirmation dialog + world name text input to prevent accidental overwrite.</description>
  <read_first>
    - app/backup/index.tsx
    - src/services/backupService.ts
  </read_first>
  <action>
    1. In `BackupCard` component (or inline in list):
       - Add "Restore" button (variant="danger" or "secondary" with warning icon)
       - On press → show Alert with:
         Title: "Restore World"
         Message: "This will STOP the server, replace your current world with the selected backup, and restart the server. This cannot be undone."
         Buttons: [Cancel, "I Understand — Continue"]
    2. If user confirms "I Understand — Continue":
       Show a second prompt: Text input asking user to type the world name as confirmation.
       Label: "Type world name to confirm"
       Placeholder: e.g., "myworld"
       Button: "Restore Now"
    3. On valid typed match (compare to current world name from serverManager/config):
       - Call `backupService.restoreBackup(backupPath, worldPath)`
       - Show progress indicator: "Stopping server...", "Extracting backup...", "Restarting server..."
       - On completion: Alert "Restore complete. Server restarted."
       - On error: Alert error + rollback status
    4. If user cancels at any point: abort
    5. While restore running: disable all backup actions to prevent concurrent modification
  </action>
  <acceptance_criteria>
    - Restore requires two steps: dialog confirmation AND text input matching world name
    - Server stop call visible in logs before extraction
    - Progress messages displayed during each stage
    - Errors shown to user if restore fails
    - TypeScript compilation: 0 errors
  </acceptance_criteria>
</task>

```xml
<task id="5-01-04">
  <title>Add Backup Integrity Validation and Progress Reporting</title>
  <description>Ensure backups are verified on creation and restores validate ZIP before extraction, with progress callbacks to UI.</description>
  <read_first>
    - src/services/backupService.ts
    - app/backup/index.tsx
  </read_first>
  <action>
    1. In `createBackup`:
       - After ZIP built, call `AdmZip.checkZip()` or open + verify `getEntries()` length > 0
       - If invalid: throw error "Backup verification failed — file may be corrupted"
       - Return `{valid: true, path, size}` on success
    2. In `restoreBackup`:
       - Before stopping server: call `validateBackupFile(backupPath)`; if fails, abort with error "Invalid backup file"
       - After extraction: verify world folder contains expected files (level.dat, region/ folder)
       - If missing: trigger rollback from `.old` backup, show error "World data incomplete — rolled back"
    3. Progress reporting:
       - Modify service signature to accept `onProgress: (stage: string, percent: number) => void`
       - Stages: "Zipping...", "Validating...", "Stopping server...", "Extracting...", "Restarting..."
       - In UI: pass callback from screen to service, update state `progressStage`, `progressPercent`
       - Render progress bar or text: "Stage: {stage} — {percent}%"
    4. Handle cancellation? Not required for v1.1, keep simple.
  </action>
  <acceptance_criteria>
    - createBackup validates ZIP before reporting success
    - restoreBackup checks ZIP first, validates world post-extraction, falls back to rollback
    - UI receives progress callbacks and displays stage + percentage
    - TypeScript compilation: 0 errors
  </acceptance_criteria>
</task>

```xml
<task id="5-01-05">
  <title>Wire Backup into Server Lifecycle and Dashboard</title>
  <description>Integrate backup service into server store, add backup status indicator, block backup during server errors, link from dashboard.</description>
  <read_first>
    - src/stores/serverStore.ts
    - app/index.tsx (dashboard — if exists, otherwise main screen)
    - src/services/serverManager.ts
  </read_first>
  <action>
    1. In `src/stores/serverStore.ts`:
       - Add `backupStatus: 'idle'|'creating'|'restoring'|'error'`
       - Add `lastBackupTime: string | null`
       - Add `backupError: string | null`
       - Actions: `setBackupStatus(status)`, `setLastBackup(time)`, `setBackupError(msg)`
    2. In `backupService.createBackup`:
       - Dispatch: `useServerStore.getState().setBackupStatus('creating')`
       - On completion: `setBackupStatus('idle')`, `setLastBackup(new Date().toISOString())`
       - On error: `setBackupStatus('error')`, `setBackupError(error.message)`
    3. In Dashboard UI (likely `app/index.tsx` or app layout):
       - Add backup status indicator (small badge: "Backup Ready" / "Backup in progress...")
       - Add link/button to "Backups" screen (`router.push('/backup')`)
       - Disable backup button if server status is 'error'
    4. Ensure restore blocks server controls during operation:
       - In server UI disable Start/Stop buttons while `backupStatus === 'restoring'`
    5. Add basic error boundary: if backup fails, show Alert with retry option.
  </action>
  <acceptance_criteria>
    - Server store includes backup-related state fields
    - Backup creation updates status visible in UI
    - Dashboard includes navigation to backups screen
    - Server controls disabled during restore
    - TypeScript compilation: 0 errors
  </acceptance_criteria>
</task>
```