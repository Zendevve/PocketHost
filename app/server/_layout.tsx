import { Stack } from 'expo-router';

export default function ServerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#e5e5e5',
        contentStyle: { backgroundColor: '#0f0f0f' },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="console" options={{ title: 'Console' }} />
      <Stack.Screen name="properties" options={{ title: 'Properties' }} />
    </Stack>
  );
}
