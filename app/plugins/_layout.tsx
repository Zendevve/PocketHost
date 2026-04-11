import { Stack } from 'expo-router';

export default function PluginsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#e5e5e5',
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Plugins' }} />
    </Stack>
  );
}
