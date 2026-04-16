# STRUCTURE

## Overview
Directory layout follows a standard Expo + `src/` convention for organizational clarity and easy separation of concerns.

```text
/                       # Root
├── app/                # Expo Router filesystem-based pages and groupings
│   ├── _layout.tsx     # Root overarching layout
│   ├── index.tsx       # Default entry page
│   ├── players/        # Player management pages
│   ├── plugins/        # Plugin configuration pages
│   ├── server/         # Server dashboard/console pages
│   ├── setup/          # Initial onboarding and creation workflows
│   ├── worlds/         # World generation configurations
│   └── settings.tsx    # General application-level settings
├── modules/            # Local native Expo modules
│   └── server-process/ # Android native java bindings for the Minecraft server process
├── src/                # Shared internal React code
│   ├── components/     # Specialized functional/UI components
│   │   ├── console/    # Console/terminal related visual components
│   │   └── ui/         # Base UI elements (Button, Card, Input)
│   ├── lib/            # Shared pure-logic utility functions or wrappers
│   ├── services/       # Domain and business models/apis
│   │   ├── serverManager.ts        # Server lifecycle orchestration
│   │   ├── propertiesManager.ts    # Parse/Edit `server.properties` files
│   │   ├── worldFileManager.ts     # Save/extract `.zip` and server directories
│   │   └── ...
│   ├── stores/         # Zustand store models
│   │   └── ...         # serverStore.ts, settingsStore.ts, playerStore.ts
│   └── types/          # Typescript interface & type models
```

## Naming Conventions
- React component files are `PascalCase.tsx`.
- Hooks, libraries, stores, and services are `camelCase.ts`.
- Routing pages inside `app/` are predominantly `kebab-case.tsx` or explicitly targeted path names.
