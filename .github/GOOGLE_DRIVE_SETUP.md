# Google Drive OAuth Setup Guide

## Why This Is Needed

Cloud Backup (Phase 11) uses Google Drive API v3 to upload/download world backups.
Accessing a user's Google Drive requires OAuth 2.0 authentication with a valid
Web Client ID from the Google Cloud Console.

## Quick Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Google Drive API**:
   - APIs & Services → Library → Search "Google Drive API" → Enable

### 2. Create OAuth 2.0 Credentials

1. APIs & Services → Credentials → Create Credentials → **OAuth client ID**
2. Application type: **Web application**
3. Name: `PocketHost Web Client`
4. Authorized redirect URIs:
   - Add: `https://auth.expo.io/@yourusername/pockethost`
     - Replace `@yourusername` with your Expo account username
   - For development with Expo Go, also add:
     - `https://auth.expo.io/@anonymous/pockethost`
5. Click **Create**
6. Copy the **Client ID** (looks like `123456789-abc123.apps.googleusercontent.com`)

### 3. Configure PocketHost

Open `app.json` and set the client ID in the `extra` field:

```json
{
  "expo": {
    "extra": {
      "googleOAuthWebClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com"
    }
  }
}
```

### 4. Build and Test

```bash
npx expo prebuild
npx expo run:android
```

Navigate to **Backups → Cloud Backups** and tap **Sign in with Google**.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "OAuth Not Configured" button | Client ID is missing or still contains `YOUR_WEB_CLIENT_ID` placeholder in `app.json` |
| `redirect_uri_mismatch` error | Add the exact Expo auth redirect URI to the Google Cloud Console credentials |
| `access_denied` | Check that the Google Drive API is enabled for the project |
| Token expires quickly | Normal for development. The app stores the token in AsyncStorage and validates it on launch. |

## Security Notes

- The Web Client ID is embedded in the app bundle. This is standard for OAuth 2.0
  public clients (mobile apps). Do NOT include the client secret.
- Tokens are stored in AsyncStorage (device-local, sandboxed per app).
- Only `drive.file` scope is requested — the app can only access files it creates,
  not the user's entire Drive.

## EAS Build (Production)

If using EAS Build, set the client ID via an environment variable and inject it
into `app.json` during the build process:

```bash
eas secret:create --name GOOGLE_OAUTH_CLIENT_ID --value "your-client-id.apps.googleusercontent.com"
```

Then modify `app.json` to read from an environment variable if available.
