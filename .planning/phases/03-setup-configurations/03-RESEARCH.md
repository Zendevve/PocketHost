# Phase 03: Setup & Configurations - Research

## Objective
The objective is to implement local configuration management allowing the user to select the specific active world to run and allocate JVM memory dynamically.

## Findings

### Native Integration
- In `modules/server-process/android/src/main/java/com/pockethost/ServerForegroundService.kt`, the function `startServer(jarPath: String, maxMem: Int, worldDir: String)` perfectly exposes the parameters we need to control.
- In `src/services/serverManager.ts`, the `ServerProcessModule.startServer()` currently passes NO arguments, or the Kotlin export is hardcoded if the signature mismatches. Wait, if the Kotlin function takes 3 args, they must be passed from JS.

### Expo Module Bridge
- We need to verify `ServerProcessModule.startServer()` bridge definition. It needs to accept `(jarPath: String, maxMem: Int, worldDir: String)`.
- If it doesn't currently, we will modify the Kotlin `@ExpoMethod` inside `ServerProcessModule.kt`.

### State Management
- Update `serverStore.ts` with configurable options:
  - `memoryLimit: number` (Default: 2048 MB)
  - `activeWorld: string` (Default: 'world')
- Add actions to mutate these configurations.

### UI Implementation
- Add a new "Settings" screen or expandable UI block inside the Dashboard to let users change the memory slider and active world text input.
- We will store the final `jarPath` statically to the downloaded PaperMC path.

## Implementation Implications
1. **Kotlin Backend:** Verify/patch `ServerProcessModule.kt` to securely route the Javascript arguments into the ForegroundService.
2. **Javascript Native Hook:** Fix the `.ts` bindings for `ServerProcessModule` or recreate an `index.ts` in the `modules/server-process` so we can import it and pass arguments correctly.
3. **Zustand Store:** Add Memory and World config state.
4. **Manager API:** Update `serverManager.startServer()` to read from the store and pass values down to native.
5. **UI Layer:** Expose inputs to configure these values before starting the server.

## RESEARCH COMPLETE
