import Constants from 'expo-constants';

export const GOOGLE_OAUTH_WEB_CLIENT_ID: string =
  Constants.expoConfig?.extra?.googleOAuthWebClientId ?? '';

export function isGoogleOAuthConfigured(): boolean {
  return (
    typeof GOOGLE_OAUTH_WEB_CLIENT_ID === 'string' &&
    GOOGLE_OAUTH_WEB_CLIENT_ID.length > 0 &&
    !GOOGLE_OAUTH_WEB_CLIENT_ID.includes('YOUR_WEB_CLIENT_ID')
  );
}
