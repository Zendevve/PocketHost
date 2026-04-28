import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { v4 as uuid } from 'uuid';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/lib/theme';
import { getServerJarUrl } from '../../src/services/versionManifest';
import { bootstrapServerFiles } from '../../src/services/worldFileManager';
import { useServerStore } from '../../src/stores/serverStore';
import { RelayRegion, ServerConfig, DEFAULT_JVM_FLAGS } from '../../src/types/server';

const REGIONS: RelayRegion[] = ['global', 'na', 'eu', 'ap'];

export default function RegionSelectScreen() {
  const router = useRouter();
  const addConfig = useServerStore((s) => s.addConfig);
  const setActive = useServerStore((s) => s.setActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useLocalSearchParams<{
    version: string;
    serverName: string;
    worldName: string;
    crossplayEnabled: string;
    maxMemoryMB: string;
  }>();

  const createConfig = async (region: RelayRegion) => {
    setLoading(true);
    setError(null);
    try {
      const id = uuid();
      const worldName = params.worldName || 'world';
      const serverType: ServerConfig['serverType'] = 'vanilla';
      const maxMemory = Number(params.maxMemoryMB) || 1024;
      const mcVersion = params.version || 'latest';

      const serverJarUrl = await getServerJarUrl(mcVersion);

      const config: ServerConfig = {
        id,
        name: params.serverName || 'PocketHost Server',
        mcVersion,
        serverType,
        serverJarUrl,
        serverJarPath: '',
        worldName,
        worldPath: '',
        maxMemoryMB: maxMemory,
        relayRegion: region,
        crossplayEnabled: params.crossplayEnabled === 'true',
        jvmFlagsOptimized: true,
        jvmFlags: DEFAULT_JVM_FLAGS,
        createdAt: Date.now(),
      };

      const paths = await bootstrapServerFiles(config, serverJarUrl);
      config.serverJarPath = paths.jarPath;
      config.worldPath = paths.worldPath;

      addConfig(config);
      setActive(config.id);
      router.replace('/server/dashboard');
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={[theme.body, { textAlign: 'center', marginTop: 16 }]}>
          Setting up server environment...
        </Text>
      </View>
    );
  }

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>Select Relay Region</Text>
      {error ? <Text style={[theme.body, { color: '#ef4444', marginBottom: 12 }]}>{error}</Text> : null}
      
      {REGIONS.map((region) => (
        <Card key={region} onPress={() => createConfig(region)}>
          <Text style={theme.body}>{region.toUpperCase()}</Text>
          <Text style={theme.subtext}>Use {region.toUpperCase()} for relay routing.</Text>
        </Card>
      ))}
      <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}
