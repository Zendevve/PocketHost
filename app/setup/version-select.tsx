import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/lib/theme';
import { fetchVersions } from '../../src/services/versionManifest';

interface ReleaseItem {
  id: string;
}

export default function VersionSelectScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<ReleaseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchVersions()
      .then((v) => {
        if (!mounted) return;
        setVersions(v.slice(0, 30));
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load versions');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>Select Minecraft Version</Text>
      {error ? <Text style={[theme.subtext, { color: '#f87171' }]}>{error}</Text> : null}
      <FlatList
        data={versions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            onPress={() =>
              router.push({
                pathname: '/setup/world-create',
                params: { version: item.id },
              })
            }
          >
            <Text style={theme.body}>{item.id}</Text>
          </Card>
        )}
      />
    </View>
  );
}
