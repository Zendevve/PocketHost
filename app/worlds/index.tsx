import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface WorldInfo {
  name: string;
  path: string;
  exists: boolean;
}

export default function WorldsScreen() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find(c => c.id === activeServerId);
  const status = statuses[activeServerId || ''];
  
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorlds = async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    
    const dimensions = ['world', 'world_nether', 'world_the_end'];
    const infoPromises = dimensions.map(async (dim) => {
      const path = `file://${config.worldPath}/${dim}`;
      const info = await FileSystem.getInfoAsync(path);
      return { name: dim, path, exists: info.exists };
    });
    
    const results = await Promise.all(infoPromises);
    setWorlds(results.filter(w => w.exists));
    setLoading(false);
  };

  useEffect(() => {
    fetchWorlds();
  }, [config?.worldPath]);

  const handleDelete = (world: WorldInfo) => {
    if (status?.status === 'running') {
      Alert.alert('Error', 'Cannot delete a world while the server is running. Please stop the server first.');
      return;
    }

    Alert.alert(
      'Delete World',
      `Are you sure you want to permanently delete the dimension '${world.name}'? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await FileSystem.deleteAsync(world.path, { idempotent: true });
              Alert.alert('Success', `Dimension '${world.name}' has been deleted.`);
              await fetchWorlds();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete world dimension.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!config) {
    return (
      <View style={theme.screen}>
        <Text style={theme.heading}>Worlds</Text>
        <Text style={theme.body}>Select a server first.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Worlds</Text>
      <Text style={[theme.body, { marginBottom: 20 }]}>
        Manage the dimensions of your server. Deleting a dimension will cause the server to regenerate it upon startup.
      </Text>
      
      {worlds.length === 0 ? (
        <Card>
          <Text style={theme.body}>No worlds found. Start the server to generate the world.</Text>
        </Card>
      ) : (
        worlds.map((world) => (
          <Card key={world.name} style={styles.worldCard}>
            <View style={styles.worldInfo}>
              <Text style={{ ...theme.body, fontWeight: 'bold' }}>{world.name}</Text>
              <Text style={theme.caption}>Path: /{world.name}</Text>
            </View>
            <Button 
              title="Delete" 
              variant="danger" 
              onPress={() => handleDelete(world)} 
            />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  worldInfo: {
    flex: 1,
    marginRight: 12,
  },
});