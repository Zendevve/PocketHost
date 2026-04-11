import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  text: '#e5e5e5',
  textMuted: '#9ca3af',
  primary: '#4ade80',
  primaryDark: '#16a34a',
  danger: '#ef4444',
};

export const theme = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  subtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
});
