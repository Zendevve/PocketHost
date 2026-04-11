# PocketHost (Phase 1 Scaffold)

This repository contains a Phase 1 MVP scaffold for PocketHost (Expo + React Native + TypeScript).

Implemented:

- Expo Router root and setup flow screens
- Zustand stores with AsyncStorage persistence
- Corrected server data model (`serverJarPath`, `worldPath`)
- Default server state initializer to avoid partial state issues
- Basic theme and core UI components (`Button`, `Card`, `Badge`, `Toggle`, `Input`)
- Minecraft release version fetch service with in-memory manifest caching

## Run

1. Install dependencies:

   `npm install`

2. Start Expo:

   `npm run start`
