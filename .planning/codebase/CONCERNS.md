# CONCERNS

## Technical Debt & Architecture Issues
- **Background Task Durability**: React Native apps can easily be suspended or killed when minimized by Android OS memory management. Spawning a heavy Java child process (a Minecraft server) natively puts the overall app at extremely high risk of being purged by the system, leading to abrupt server crashes. It is crucial to implement Foreground Service architectures with a persistent notification layer to ensure the server continues routing requests when the app is backgrounded.
- **Test Infrastructure Deficits**: Lack of Jest configuration or a robust unit testing approach. Manual verification of edge case state synchronization between native event streams (`onLog`, `onStatusChange`) and the UI renders limits long-term maintainability.
- **Relay Limitations**: Usage of Playit.gg (`playitService.ts`) is critical for external networking as standard mobile ISPs map IPv4 aggressively through Carrier Grade NAT (`CGNAT`). Error handling edge cases for Playit downtimes or network latency switching (e.g. WiFi to Cellular) requires heightened defensive engineering.

## Fragile Areas
- `src/services/serverManager.ts`: Heavily relies on event streams wrapping Android Java bindings. Accidental unsubscriptions or memory leaks from stale `addListener` returns can easily crash the app with duplicate events or stale data renders.
- `src/services/propertiesManager.ts`: Direct I/O and parsing logic to mutate standard `server.properties` needs stringent validation to prevent corruption of the properties file causing the underlying server parsing logic to fail on boot.

## Security Considerations
- **Playit Tunnels**: Secure storage of the `playitSecretKey` inside async storage (`settingsStore.ts`) must be handled securely to prevent local data scraping of network routing secrets.
- **World Files Extraction**: Parsing and loading ZIP files for world uploads (`worldFileManager.ts`) carries potential zip-slip vulnerabilities or storage exhaustions (users providing arbitrarily massive worlds overriding Android storage allocations).
