# ARCHITECTURE

## Architectural Pattern
The application follows a standard React Native / Expo layered architecture, emphasizing modularity by separating state, services, and UI components.

1. **Presentation Layer (`app/` and `src/components/`)**:
   - `app/` serves as the routing layer powered by Expo Router (filesystem routing).
   - `src/components/ui/` contains reusable atomic design elements (e.g., `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Toggle.tsx`).

2. **State Management Layer (`src/stores/`)**:
   - Centralized application state management using `zustand`. Stores (e.g., `serverStore.ts`, `settingsStore.ts`, `playerStore.ts`) manage reactivity and decoupled UI updates.

3. **Service Layer (`src/services/`)**:
   - Contains business logic that acts as the bridge between state management and lower-level logic.
   - Examples: `serverManager.ts` acts as the orchestrator for Minecraft server processes via `modules/server-process`, while `worldFileManager.ts` and `propertiesManager.ts` handle I/O side effects using `expo-file-system`.
   - `playitService.ts` handles communication with Playit.gg to provision port forwards and connections.

4. **Native Module Layer (`modules/server-process/`)**:
   - Expo module that bridges into Android's native runtime to fork/spawn a JVM or execute the Minecraft Jar process directly, streaming STDOUT/STDERR logs and capturing lifecyle statuses through events (`onLog`, `onStatusChange`, `onError`).

## Data Flow
1. User interacts with UI components inside `app/` screens.
2. The UI triggers a `src/services/` logic call via a store action, or directly.
3. The service delegates to `modules/server-process` (for server state) or `expo-file-system` (for setup configurations).
4. Asynchronous native events push updates back into the `src/stores/` (e.g., logging events received in `serverManager.ts` get pushed via `useServerStore.getState().appendLog()`).
5. `zustand` triggers re-renders on the specific subset of hooked components globally.
