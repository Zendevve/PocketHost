# Phase 02: Networking & Connectivity - Research

## Objective
The objective is to implement a mechanism for external players to join the Minecraft server running natively on Android, effectively bypassing Carrier-Grade NAT (CGNAT) standard on most mobile data and home wifi networks.

## Findings

### Playit.gg Integration Approaches
1. **Host-level Tunnel Daemon**: Playit.gg runs normally via a compiled Rust daemon (playit program) on Linux/Windows. Running compiled native C/Rust binaries cross-compiled for Android (`aarch64-linux-android`) is possible but introduces complexity and dependency management problems for Expo.
2. **Minecraft Server Plugin (Playit Plugin)**: Playit.gg offers a native `.jar` plugin for PaperMC/Spigot servers. Since we're downloading a server `.jar`, we could transition to a server architecture that supports plugins (like PaperMC) and pre-load the playit.gg `.jar` into the `plugins/` directory.

**Decision**: Go with **Playit Minecraft Plugin**. This keeps all execution strictly inside the existing Java process we built in Phase 1 without needing to juggle JNI bridging or native daemon process orchestration on Android.

### Playit Plugin Details
- It generates a connection link/claim code in the `logs/latest.log` upon first startup.
- The user uses this claim link to assign the tunnel to their playit.gg account.
- We need to parse the stdout logs for the claim link pattern `https://playit.gg/claim/...` and surface this neatly to the user UI.
- Once claimed, playit.gg creates the persistent `playit.toml` config, and subsequent boots will automatically map the IP.

### Transition to PaperMC
- Vanilla `server.jar` does not support plugins. We MUST use `paper.jar` (PaperMC).
- We will update `downloadService.ts` to pull PaperMC instead of Vanilla, plus the Playit.gg plugin.

## Implementation Implications
1. Update `downloadService.ts` to download PaperMC and `playit-plugin.jar`.
2. Update `serverManager.ts` to parse the live log stream and capture the playit claim URL.
3. Update `serverStore.ts` tracking state: `claimUrl: string | null`, and `publicIp: string | null`.
4. Update UI to show the connection IP or the "Claim Server" button if the claim URL is present.

## RESEARCH COMPLETE
