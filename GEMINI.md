<!-- GSD:project-start source:PROJECT.md -->
## Project

**PocketHost**

PocketHost is an Android app that turns a user's mobile device into a lightweight, portable Minecraft Java Edition server host. It allows friends and small communities to create, manage, and run their Minecraft worlds seamlessly from their phones without relying on a desktop or paid remote hosting.

**Core Value:** Making Minecraft server hosting feel like a native mobile experience. It trades the complexity of desktop administration for simple setup, clear dashboard controls, and practical, on-the-go admin tools.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Overview
## Languages
- **TypeScript**: Primary language for the React Native/Expo UI and application logic.
- **Java**: Used for the custom native Android Expo module (`modules/server-process`).
## Runtime & Frameworks
- **React Native**: `0.76.0`
- **Expo**: `~52.0.0`
- **Expo Router**: `~4.0.0` for filesystem-based routing.
## Dependencies & Libraries
- **State Management**: `zustand` (`^5.0.0`)
- **Network**: `axios` (`^1.7.0`)
- **Storage/File System**: 
- **UI/UX Utilities**:
## Custom Native Modules
- **`server-process`**: A local module (`modules/server-process`) that integrates Java code to spawn and manage a Minecraft server child process on Android.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- **Type Safety**: Strictly enforced via TypeScript compiler checks (see `package.json` with `tsc --noEmit`). Components and Store states are strongly-typed via interfaces housed primarily in `src/types/`.
- **Component Paradigms**: Heavy reliance on React Hooks for lifecycle mechanisms with functional components.
- **State Approach**: `zustand` is used pervasively for overarching application state via specific domain modules. Mutators and accessors live within the zustand store, decoupling them from UI components. Actions are generally executed async where necessary.
## Naming & Organization
- Custom UI components inside `src/components/ui/` act as pure, stylable components mimicking Atomic Design. File names match the component name (e.g. `Card.tsx` exports `<Card>`).
- Services suffix their name with 'Manager' or 'Service' and are typically exported as singletons or namespaces (e.g., `export const serverManager = new ServerManager()`).
- All internal configuration files adhere to strict naming conventions as expected by Expo (e.g., `app.json`, `babel.config.js`, `tsconfig.json`).
## Error Handling
- Errors are predominantly caught in asynchronous functions within the `src/services/` layer. Failures interact back with `zustand` error states allowing the UI layers to conditionally render `alert` banners or toasts.
- In native bindings (`modules/server-process`), process-level errors bridge via the `'onError'` event, captured safely by `serverManager.ts`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Architectural Pattern
## Data Flow
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
