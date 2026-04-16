# INTEGRATIONS

## External APIs & Services
- **Playit.gg**: Integrated via `src/services/playitService.ts`. Used to create tunnels/relays to make the local Minecraft server instance accessible over the internet without port forwarding.

## Sub-processes / Daemons
- **Minecraft Server JAR**: Bootstrapped and managed natively using the `server-process` Expo module. The JavaScript layer (`src/services/serverManager.ts`) communicates with this process to parse logs (`onLog`), monitor status (`onStatusChange`), and handle errors (`onError`).

## Local System Integration
- **File System**: Utilizes `expo-file-system` to read, write, and manage underlying Minecraft world folders (`src/services/worldFileManager.ts`), server JARs (`src/services/versionManifest.ts`), and `server.properties` (`src/services/propertiesManager.ts`).
