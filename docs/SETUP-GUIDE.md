# PocketHost Setup Guide

> Complete from-zero setup instructions for PocketHost v1.3
> Last updated: 2026-05-01

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Install](#clone--install)
3. [Google Drive OAuth Setup](#google-drive-oauth-setup)
4. [Running the App](#running-the-app)
5. [Creating Your First Server](#creating-your-first-server)
6. [Connecting Players](#connecting-players)
7. [Optional Configuration](#optional-configuration)
8. [Building for Production](#building-for-production)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | LTS (20.x or 22.x) | JavaScript runtime |
| **npm** | 10.x+ | Package manager |
| **Expo CLI** | Latest | Development server / build tools |
| **Android Studio** | Latest stable | Android SDK and emulator |
| **Java JDK** | 17 | Required by PaperMC at runtime (bundled JRE for the app) |

### Hardware

- **Android device** running Android 8.0 (API 26) or later
- Minimum 4 GB RAM (6 GB recommended for running a server with multiple players)
- ~2 GB free storage for server JAR, world data, and backups

### Accounts

- **Google Account** (required for Google Drive cloud backup)
- **Google Cloud Console project** (required for OAuth configuration)

---

## Clone & Install

```bash
# Clone the repository
git clone https://github.com/Zendevve/PocketHost.git
cd PocketHost

# Install dependencies
npm install
```

This installs all JavaScript dependencies including:
- `expo` ~52.0 and related packages
- `zustand` for state management
- `adm-zip` for ZIP/JAR operations
- `js-yaml` for YAML config parsing
- `pako` for NBT gzip decompression
- `jest` + `ts-jest` for testing

---

## Google Drive OAuth Setup

Google Drive cloud backup requires OAuth 2.0 configuration. Follow these steps or see `.github/GOOGLE_DRIVE_SETUP.md` for detailed instructions.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note the **Project ID**

### Step 2: Enable the Google Drive API

1. Navigate to **APIs & Services → Library**
2. Search for "Google Drive API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace org)
3. Fill in the required fields:
   - App name: `PocketHost`
   - User support email: your email
   - Developer contact: your email
4. Add the scope: `.../auth/drive.file`
5. Add your email as a test user

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `PocketHost (Android)`
5. Authorized redirect URIs: Add `https://auth.expo.io/@your-expo-username/pockethost`
6. Click **Create**
7. Copy the **Client ID** (format: `XXXX.apps.googleusercontent.com`)

### Step 5: Configure PocketHost

Edit `app.json` and replace the placeholder:

```json
{
  "expo": {
    "extra": {
      "googleOAuthWebClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com"
    }
  }
}
```

The app validates at runtime that the client ID is a real value (not the placeholder `YOUR_WEB_CLIENT_ID`).

---

## Running the App

### Development Mode

```bash
# Start the Expo development server
npm start

# Or run directly on a connected Android device / emulator
npm run android
```

Scan the QR code with the **Expo Go** app on your Android device, or connect via USB with `adb`.

### First Launch

1. **Grant storage permissions** when prompted (required for server JAR and world data)
2. **Allow foreground service** notification (required to keep the server running in the background)
3. The app opens to the home screen

---

## Creating Your First Server

### Step 1: Server Setup

1. Tap **New Server** on the home screen
2. Fill in the setup form:
   - **Server name**: Any name (e.g., "My World")
   - **Minecraft version**: Select from the fetched version list (default: PaperMC 1.19.4)
   - **Server type**: Paper (recommended for plugin support)
   - **World name**: Default or custom world directory name
   - **Max memory**: Slider from 512 MB to 4096 MB (default: 1024 MB)
   - **Relay region**: Global / NA / EU / AP (affects Playit.gg tunnel latency)
   - **Crossplay**: Enable to allow Bedrock players via Geyser (requires Geyser plugin)
3. Tap **Create Server**

### Step 2: First Launch

1. Tap **Start Server** on the dashboard
2. The app will:
   - Download PaperMC server JAR (~40 MB) if not cached
   - Download JRE17 for ARM if not cached
   - Auto-inject the Playit.gg plugin
   - Accept the EULA automatically
   - Start the Minecraft server
3. Watch the console output on the **Console** tab
4. Status light turns green when ready

### Step 3: Verify

1. The **Dashboard** will show:
   - Server status (Running)
   - Memory usage
   - TPS (Ticks Per Second — should be ~20)
   - Connection address (Playit.gg tunnel address)
2. Share the connection address with friends so they can join your server

---

## Connecting Players

### With Playit.gg (Recommended — no port forwarding)

1. The Playit.gg tunnel starts automatically with the server
2. A public join address appears on the dashboard (e.g., `xyz.playit.gg:12345`)
3. Share this address with friends:
   - **Copy to clipboard** — paste into chat
   - **QR code** — friends scan with their phone
   - **Share sheet** — send via any messaging app

### With LAN

If all players are on the same WiFi network, the LAN address will also be shown on the dashboard.

### Crossplay with Bedrock

Enable the **Crossplay** toggle in Settings, then install GeyserMC plugin. Bedrock Edition players can connect using the same Playit.gg address.

---

## Optional Configuration

### Performance Tuning

Navigate to **Server → Properties**:

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| View Distance | 10 | 3-32 | Chunks loaded around each player |
| Simulation Distance | 10 | 3-32 | Chunks actively ticking |
| Max Players | 20 | 1-100 | Maximum concurrent players |
| Memory (MB) | 1024 | 512-4096 | JVM heap size |

**Presets:**
- **Low**: view=6, sim=5, max=10 — best for devices with 4 GB RAM
- **Medium**: view=10, sim=8, max=20 — balanced
- **High**: view=16, sim=12, max=50 — best experience, needs 6+ GB RAM

**Aikar's JVM Flags** (toggle in setup): Enables optimized garbage collection flags for better TPS stability.

### Plugin Installation

1. Navigate to **Plugins** tab
2. Tap **Import** to select a `.jar` file from your device
3. The plugin appears in the list with its metadata (name, version, author)
4. Tap a plugin to edit its configuration via the YAML tree editor
5. Use **Enable/Disable** to toggle plugins
6. Tap **Reload** to apply changes

### Player Management

1. Navigate to **Players** tab
2. **Online** tab shows currently connected players
3. Tap a player for context actions: Kick, Ban, Op, Deop, Gamemode
4. Use **Whitelist**, **Bans**, and **Ops** tabs for list management

### Backups

1. Navigate to **Backups** tab
2. Tap **Create Backup** to save the current world as a ZIP
3. Backups are stored locally in `mcs_backups/` directory
4. **Restore** a backup with dual-confirmation:
   - First: Confirm you want to restore
   - Second: Type the world name to confirm
5. Failed restores automatically roll back to the previous world

### Cloud Backup (Google Drive)

1. Navigate to **Backups → Cloud** tab
2. Tap **Sign in with Google**
3. Grant `drive.file` permission
4. Upload existing backups to Drive
5. Downloaded cloud backups appear in the local backup list
6. **Note:** Simple upload supports up to 5 MB. For larger worlds, split or compress first.

---

## Building for Production

### Standalone APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure the build
eas build:configure

# Build for Android
eas build --platform android --profile production
```

The EAS build process:
1. Uploads your source to Expo servers
2. Compiles a standalone APK/AAB with the native modules
3. Provides a download link for the signed APK

### Local Build

```bash
# Build for Android locally (requires Android SDK)
npm run android
```

For a release build, use Android Studio to generate a signed APK from the `android/` directory.

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions to common issues including:
- Build/compilation errors
- Google Drive OAuth failures
- Server won't start
- Playit.gg tunnel issues
- Backup/restore failures
- Test suite failures
