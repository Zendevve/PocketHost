---
wave: 1
depends_on: []
files_modified:
  - src/services/serverManager.ts
  - src/services/downloadService.ts
  - src/components/ui/Console.tsx
  - src/app/index.tsx
  - src/store/serverStore.ts
autonomous: true
requirements:
  - CORE-01
  - CORE-02
  - CORE-03
  - DASH-01
---

# Phase 1: Stable Core Backend Plan 01

## Objective
Establish the foundational React Native code that can invoke the native module, handle JRE and server jar downloads, and surface server logs in the UI without crashing during background minimization.

## Verification
- Run `npx tsc --noEmit` and check for 0 errors.

## Tasks

```xml
<task id="1-01-01">
  <title>Create server Store for global state</title>
  <description>Create a Zustand store to hold server logs, current status (idle, starting, running), and error states. This allows the UI to stay perfectly in sync with the native module.</description>
  <read_first>
    - package.json
  </read_first>
  <action>
    Create `src/store/serverStore.ts`.
    Export a hook `useServerStore`.
    State shape should include:
    - `status: 'idle' | 'starting' | 'running' | 'error'`
    - `logs: string[]` (max 1000 items)
    - `errorMessage: string | null`
    Actions:
    - `setStatus(status)`
    - `addLog(line: string)`
    - `setError(msg: string)`
    - `clearLogs()`
  </action>
  <acceptance_criteria>
    - `src/store/serverStore.ts` exists and exports `useServerStore`.
    - Types for the state and actions are rigorously defined.
  </acceptance_criteria>
</task>

<task id="1-01-02">
  <title>Create Asset Downloading Service</title>
  <description>The native module expects `jarPath`. We need to download a server jar before starting.</description>
  <read_first>
    - src/services/serverManager.ts
  </read_first>
  <action>
    Create `src/services/downloadService.ts`.
    Implement `downloadServerJar(version: string, destDir: string)` which fakes a download for now or uses `expo-file-system` to download `https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/496/downloads/paper-1.20.4-496.jar`.
    Ensure `expo-file-system` is installed: `npx expo install expo-file-system`.
  </action>
  <acceptance_criteria>
    - `downloadService.ts` exports `downloadServerJar`.
    - `package.json` contains `expo-file-system`.
  </acceptance_criteria>
</task>

<task id="1-01-03">
  <title>Connect native events to Zustand</title>
  <description>Update the existing `serverManager.ts` to push incoming logs and status changes to the Zustand store.</description>
  <read_first>
    - src/services/serverManager.ts
    - src/store/serverStore.ts
  </read_first>
  <action>
    In `src/services/serverManager.ts`:
    When `onLog` is emitted, call `useServerStore.getState().addLog(event.line)`.
    When `onStatusChange` is emitted, call `useServerStore.getState().setStatus(event.status)`.
    When `onError` is emitted, call `useServerStore.getState().setError(event.message)`.
  </action>
  <acceptance_criteria>
    - `src/services/serverManager.ts` contains imports to `useServerStore`.
    - `addLog` is called inside the listener.
  </acceptance_criteria>
</task>

<task id="1-01-04">
  <title>Build Dashboard UI</title>
  <description>Create the main view containing the Start/Stop buttons and the Console Log view.</description>
  <read_first>
    - src/app/index.tsx
  </read_first>
  <action>
    Overwrite `src/app/index.tsx` (the main Expo Router screen).
    Use `useServerStore` to get current status and logs.
    Create a highly styled "Start Server" and "Stop Server" button block using basic React Native styling (or Tailwind if configured).
    Create a `<FlatList>` or `<ScrollView>` containing the logs, ensuring recent logs appear.
    Hook the "Start Server" button to `serverManager.startServer(...)`.
    Hook the "Stop Server" button to `serverManager.stopServer()`.
  </action>
  <acceptance_criteria>
    - `src/app/index.tsx` contains `useServerStore()`.
    - Start and Stop buttons trigger the respective `serverManager` methods.
  </acceptance_criteria>
</task>
```
