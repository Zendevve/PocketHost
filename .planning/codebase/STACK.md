# STACK

## Overview
This application is a React Native mobile application built with the Expo framework, specifically targeting Android for running a local Minecraft server utilizing a custom native Expo module.

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
  - `@react-native-async-storage/async-storage` (`2.0.0`)
  - `expo-file-system` (`~18.0.0`)
- **UI/UX Utilities**:
  - `react-native-safe-area-context` (`4.12.0`)
  - `expo-status-bar` (`~2.0.0`)
  - `expo-haptics` (`~14.0.1`)

## Custom Native Modules
- **`server-process`**: A local module (`modules/server-process`) that integrates Java code to spawn and manage a Minecraft server child process on Android.
