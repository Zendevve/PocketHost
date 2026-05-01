# PocketHost Troubleshooting

> Solutions for common issues when running PocketHost v1.3
> Last updated: 2026-05-01

---

## Table of Contents

1. [Build & Compilation Issues](#build--compilation-issues)
2. [Google Drive OAuth Issues](#google-drive-oauth-issues)
3. [Server Startup Issues](#server-startup-issues)
4. [Playit.gg Tunnel Issues](#playitgg-tunnel-issues)
5. [Backup & Restore Issues](#backup--restore-issues)
6. [Plugin Issues](#plugin-issues)
7. [Test Suite Issues](#test-suite-issues)
8. [Runtime Crashes](#runtime-crashes)

---

## Build & Compilation Issues

### `npx tsc --noEmit` fails

**Symptom:** TypeScript type-checking produces errors.

**Fix:**
1. Ensure all dependencies are installed: `npm install`
2. Clear TypeScript cache: delete `node_modules/.cache` and restart
3. Verify `tsconfig.json` extends `expo/tsconfig.base` and includes correct paths
4. If the error is in test files: tests are excluded in `tsconfig.json` (`**/*.test.ts` in exclude) — this is intentional since tests use Jest mocks

### `npx expo export --platform android` fails

**Symptom:** Metro bundler cannot resolve a module.

**Fix:**
1. Clear Metro cache: `npx expo start --clear`
2. Verify all dependencies listed in `package.json` are installed
3. Check for missing peer dependencies with `npm ls`
4. If a specific package is missing, install it explicitly

### EAS Build fails

**Symptom:** Remote build fails with dependency resolution errors.

**Fix:**
1. Run `npm install` to ensure `package-lock.json` is up to date
2. Verify `eas.json` configuration matches `app.json`
3. Check the EAS build logs for specific error messages
4. For native module issues, ensure `modules/server-process/` Android files are included

---

## Google Drive OAuth Issues

### "Not signed in to Google Drive" error

**Symptom:** Cloud backup operations fail with "Not signed in" even after signing in.

**Fix:**
1. Check if the OAuth token expired — sign out and sign back in
2. Verify the `googleOAuthWebClientId` in `app.json` is set correctly:
   ```json
   "extra": { "googleOAuthWebClientId": "REAL_ID.apps.googleusercontent.com" }
   ```
   The app validates at runtime that this does NOT contain `YOUR_WEB_CLIENT_ID`.
3. Clear AsyncStorage data and re-authenticate
4. Verify the redirect URI in Google Cloud Console matches your Expo OAuth redirect

### "isGoogleOAuthConfigured() returns false"

**Symptom:** The app reports that OAuth is not configured even though `app.json` has a client ID.

**Fix:**
1. The `isGoogleOAuthConfigured()` function in `src/lib/config.ts` checks three conditions:
   - Value is a non-empty string
   - Value does NOT contain the placeholder `YOUR_WEB_CLIENT_ID`
2. Ensure the string in `app.json` is your actual Google client ID, not the placeholder
3. After changing `app.json`, restart the Expo dev server

### "Upload failed: 5 MB limit exceeded"

**Symptom:** Cannot upload large world backups to Google Drive.

**Cause:** The current implementation uses Google Drive's simple upload endpoint, which has a 5 MB limit.

**Workaround:**
1. Compress the world further (delete old region files, reduce world size)
2. Upload individual dimension folders separately
3. Use local backups for large worlds (no size limit)
4. Resumable upload support is planned for a future release

### Drive folder listing returns empty

**Symptom:** `listDriveBackups()` returns an empty array even though backups exist.

**Fix:**
1. Verify the Google account used has the correct permissions
2. Check that backups are in the `PocketHost Backups` folder on Drive
3. Manually verify in the Google Drive web UI that files exist
4. The `drive.file` scope only grants access to files created by this app — backups uploaded from other sources won't appear

---

## Server Startup Issues

### Server won't start — status stuck at "starting"

**Symptom:** Tapping "Start Server" shows "starting" but never transitions to "running."

**Fix:**
1. Check the **Console** tab for error messages
2. Verify the device has sufficient free storage (~2 GB minimum)
3. Check available RAM — the OS may have killed the background process
4. Delete `server/server.jar` to force re-download on next start
5. Verify the JRE was downloaded correctly:
   - Check `{documentDirectory}/server/jre.zip` exists
   - Check `{documentDirectory}/server/server.jar` exists

### Server crashes immediately with "error" status

**Symptom:** Status flips to "error" with a message.

**Fix:**
1. Read the error message on the Dashboard
2. Common causes:
   - **Out of memory**: Reduce `maxMemoryMB` in settings. On a 4 GB device, 1024 MB is the maximum recommended value.
   - **Corrupted world**: Try starting with a fresh world (rename current world directory)
   - **Port conflict**: Another process is using port 25565. Restart the device.
   - **Java version mismatch**: The bundled JRE is ARM-specific. On x86 emulators, this will fail.
3. If the error message is blank, check the **Console** tab for stack traces

### "No server configured" error

**Symptom:** Start button does nothing; console shows "No server configured."

**Fix:**
1. No server configuration exists — create one via Setup
2. If a configuration exists but is corrupted, delete it and create a new one
3. The active server ID stored in AsyncStorage may be stale. Go to Settings and re-select your server.

---

## Playit.gg Tunnel Issues

### No Playit.gg address appears

**Symptom:** Server is running but no relay address is shown.

**Fix:**
1. Wait up to 30 seconds after server starts — the Playit.gg plugin needs time to initialize and claim a tunnel
2. Check the **Console** tab for `https://playit.gg/claim/` URLs — if present, the tunnel is waiting for you to claim it
3. Visit the claim URL in a browser to link the tunnel to your Playit.gg account
4. Check `server/plugins/` directory — verify `playit-plugin.jar` exists

### "connected at: none" or empty address

**Symptom:** Console shows "Connected at:" but the address is missing or wrong.

**Fix:**
1. The Playit.gg service may be experiencing issues — check [playit.gg/status](https://playit.gg)
2. Try a different relay region in Settings (e.g., switch from Global to NA)
3. Restart the server to force Playit.gg to re-claim a tunnel

### Friends can't connect

**Symptom:** Players get "Connection timed out" or "Unknown host."

**Fix:**
1. Verify the address is correct — copy it directly from the dashboard
2. Ensure the server is running (green status indicator)
3. Check that the Playit.gg tunnel is active (address is not mock/mock-server)
4. If using the `playitService` mock address (`mock-server.auto.playit.gg:12345`), this is a development placeholder — the production app uses the real Playit.gg plugin
5. Have the player verify they're entering the address correctly in Minecraft (including the port number after the colon)

---

## Backup & Restore Issues

### Restore fails with "Validation failed, rolled back"

**Symptom:** Restore process fails and the world is reverted.

**Fix:**
1. The original world is preserved in the `.old` directory — no data is lost
2. The backup ZIP may be corrupted — verify with `validateBackupFile()`
3. Check that the backup contains both `level.dat` and a `region/` directory
4. Try creating a fresh backup and restore that instead

### "Backup verification failed — file may be corrupted"

**Symptom:** Backup creation fails with a verification error.

**Fix:**
1. Check available storage space — the backup ZIP needs room to write
2. The source world may contain unreadable files — check file permissions
3. Try closing other apps to free up RAM during the ZIP operation
4. For very large worlds, backup may exceed available memory — reduce world size first

---

## Plugin Issues

### Plugin JAR shows as "corrupted"

**Symptom:** Imported plugin shows a corruption warning.

**Fix:**
1. The JAR file may be incomplete — re-download the plugin from the official source
2. Some JARs use compression methods not supported by `adm-zip`
3. Verify the JAR can be opened with a desktop ZIP tool (7-Zip, WinRAR, etc.)
4. Only PaperMC-compatible plugins are supported (Bukkit/Spigot/Paper plugins)

### Plugin config doesn't save

**Symptom:** Changes to plugin YAML config are lost after server restart.

**Fix:**
1. Ensure the plugin directory has write permissions
2. Some plugins regenerate their config on startup — changes should be made while the server is running
3. Use the **Save** button in the config editor explicitly — auto-save is not implemented
4. Check the console for YAML parse errors — invalid YAML structure will cause write failures

### Plugin doesn't appear after import

**Symptom:** Imported JAR is not listed in the plugins screen.

**Fix:**
1. Check the `server/plugins/` directory — the file should be there
2. If the file has `.disabled` extension, it was imported as disabled — enable it
3. Ensure the file is a valid JAR (not renamed from another format)
4. Tap **Reload** on the plugins screen to refresh the list

---

## Test Suite Issues

### Tests won't run — "Cannot find module" error

**Symptom:** `npm test` fails with module resolution errors.

**Fix:**
1. Ensure all dependencies are installed: `npm install`
2. Verify `jest.config.js` is present and `ts-jest` is configured
3. Check `moduleNameMapper` in jest config — expo-file-system and async-storage are mocked
4. Tests only match `**/__tests__/**/*.test.ts` — ensure test files are in the correct directory

### Individual test failures

**Symptom:** Specific tests fail.

**Fix:**
1. Run `npm run test:watch` to debug interactively
2. Check if the failure is in console-parser regex matching — different server versions produce different TPS/memory format strings. The parser has 3 fallback patterns each.
3. For NBT tests, ensure test data is valid gzip-compressed NBT
4. Mock files in `src/__mocks__/` may need updating if API changes were made to `expo-file-system` or `async-storage`

### Coverage reports empty

**Symptom:** `npm run test:coverage` shows 0% coverage.

**Fix:**
1. Verify `collectCoverageFrom` in jest config targets `src/services/**/*.ts`
2. Ensure tests are actually importing services from the source path (not a mock)
3. Run `npm test` first to verify tests pass before checking coverage

---

## Runtime Crashes

### App crashes on startup

**Symptom:** The app force-closes immediately after opening.

**Fix:**
1. Check for native module mismatch — ensure the Expo SDK version matches the React Native version in `package.json`
2. Clear app data: Android Settings → Apps → PocketHost → Storage → Clear Data
3. Reinstall the app completely
4. Check AsyncStorage data — corrupted persisted state can cause crashes. The `partialize` function in stores should protect against this.

### Server kills itself in background

**Symptom:** Server stops running when the app is minimized or screen is locked.

**Cause:** Android aggressively kills background processes to save battery. The app uses a Foreground Service with a persistent notification to mitigate this, but aggressive OEMs (Xiaomi, Huawei, OnePlus) may still kill it.

**Fix:**
1. Ensure the Foreground Service notification is visible (Android notification shade)
2. Disable battery optimization for PocketHost:
   - Settings → Apps → PocketHost → Battery → Unrestricted
3. Lock the app in recent apps (if your device supports it)
4."Wake lock" is acquired by the native module — if the device still kills the process, check OEM-specific power settings

### Memory errors (OutOfMemoryError)

**Symptom:** Server crashes with `java.lang.OutOfMemoryError`.

**Fix:**
1. Reduce `maxMemoryMB` in settings
2. Close other apps on the device
3. Use the **Low** performance preset (reduces chunk loading)
4. On devices with ≤4 GB RAM, do not exceed 1024 MB for the JVM
