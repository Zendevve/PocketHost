# Phase 1: Stable Core Backend - Research

## Context
We are implementing the foundation for PocketHost: running a Java Minecraft server as an Android background process that can survive when the app is minimized (CORE-01, CORE-02, CORE-03, DASH-01).

## Findings
I reviewed `ServerProcessModule.kt` and `ServerForegroundService.kt` in `modules/server-process`. 

1. **Native Implementation Exists**: The Kotlin code is robust and mostly implemented. `ServerForegroundService` uses `java.lang.ProcessBuilder` to launch the server with standard IO redirected. It binds an event stream (onLog, onStatusChange, onError) back to React Native.
2. **Missing Dependencies**: The foreground service attempts to extract `jre.zip` from Android assets, but `jre.zip` is not currently present in `modules/server-process/android/src/main/assets/`. It also relies on a `jarPath` (the server Java file). We need a mechanism to securely download or supply the `jre.zip` and the Minecraft server `.jar` (like PaperMC) the first time the app runs, or bundle them.
3. **App Minimization (CORE-02)**: The `ServerForegroundService` is correctly declared in `AndroidManifest.xml` with `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_SPECIAL_USE`. However, modern Android requires user-facing notification configurations, which are partially implemented. 
4. **UI Connective Tissue (DASH-01)**: The UI layer (`src/app/index.tsx` or similar) needs to cleanly subscribe to `ServerProcess.addListener('onLog')` and append it to a terminal-like block via Zustand or safe state arrays. Currently, `src/services/serverManager.ts` acts as the middleman.

## Proposed Strategy
1. **Asset Resolution**: We should write utility code in JS to dynamically fetch the JRE (for aarch64 Android) and PaperMC `.jar` upon initial setup instead of bloating the APK with a bundled `jre.zip`. Alternatively, we provide a mock/placeholder script to inject them into the local app folder for now so `ServerForegroundService.kt` works.
2. **UI Implementation**: Build a `Console` component displaying standard output, using an inverted FlatList for performance. `serverManager.ts` needs to store bounded logs (e.g. max 1000 lines).
3. **Server Controls**: Build a Dashboard view to trigger `serverManager.start()` and `serverManager.stop()`. 

## Validation Architecture
- Boot the React Native UI.
- Trigger "Start Server".
- Verify that `java` is extracted and executed.
- Verify logs begin streaming in the UI component.
- Minimize app -> process should remain alive.
- Send "Stop" command -> process should exit cleanly.
