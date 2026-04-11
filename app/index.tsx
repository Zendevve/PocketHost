import { Redirect } from 'expo-router';
import { useServerStore } from '../src/stores/serverStore';

export default function Index() {
  const { configs, activeServerId } = useServerStore();
  const activeConfig = configs.find((c) => c.id === activeServerId);

  if (activeConfig) {
    return <Redirect href="/server/dashboard" />;
  }

  return <Redirect href="/setup/version-select" />;
}
