import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  size: number;
}

export default function PluginsScreen() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find(c => c.id === activeServerId);
  const status = statuses[activeServerId || ''];
  
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    
    const pluginsDir = `file://${config.worldPath}/plugins`;
    try {
      const info = await FileSystem.getInfoAsync(pluginsDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(pluginsDir, { intermediates: true });
        setPlugins([]);
        setLoading(false);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(pluginsDir);
      const pluginPromises = files
        .filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
        .map(async (file) => {
          const path = `${pluginsDir}/${file}`;
          const fileInfo = await FileSystem.getInfoAsync(path);
          return {
            name: file.replace('.jar.disabled', '').replace('.jar', ''),
            path,
            enabled: !file.endsWith('.disabled'),
            size: fileInfo.size || 0,
          };
        });
        
      const results = await Promise.all(pluginPromises);
      setPlugins(results.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.error('Failed to fetch plugins:', e);
      Alert.alert('Error', 'Could not read plugins folder.');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchPlugins();
  }, [config?.worldPath]);

  const togglePlugin = async (plugin: PluginInfo) => {
    if (status?.status === 'running') {
      Alert.alert('Warning', 'Server is running. Changes will take effect on next restart.');
    }

    try {
      setLoading(true);
      const newExt = plugin.enabled ? '.jar.disabled' : '.jar';
      const newPath = plugin.path.replace(/\.jar(\.disabled)?$/, newExt);
      await FileSystem.moveAsync({
        from: plugin.path,
        to: newPath
      });
      await fetchPlugins();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to toggle plugin.');
      setLoading(false);
    }
  };

  const deletePlugin = async (plugin: PluginInfo) => {
    Alert.alert(
      'Delete Plugin',
      `Are you sure you want to permanently delete '${plugin.name}'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await FileSystem.deleteAsync(plugin.path, { idempotent: true });
              await fetchPlugins();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete plugin.');
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
        <Text style={theme.heading}>Plugins</Text>
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
      <Text style={theme.heading}>Plugins</Text>
      <Text style={[theme.body, { marginBottom: 20 }]}>
        Manage server plugins. Drop `.jar` files into the `plugins/` folder to install new plugins. (Note: Only Paper/Spigot/Purpur servers support plugins).
      </Text>
      
      {plugins.length === 0 ? (
        <Card>
          <Text style={theme.body}>No plugins found in the plugins directory.</Text>
        </Card>
      ) : (
        plugins.map((plugin) => (
          <Card key={plugin.path} style={styles.pluginCard}>
            <View style={styles.pluginInfo}>
              <Text style={{ ...theme.body, fontWeight: 'bold', color: plugin.enabled ? '#fff' : '#6b7280' }}>
                {plugin.name}
              </Text>
              <Text style={theme.caption}>Size: {(plugin.size / 1024 / 1024).toFixed(2)} MB</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button 
                title={plugin.enabled ? 'Disable' : 'Enable'} 
                variant={plugin.enabled ? 'secondary' : 'default'} 
                onPress={() => togglePlugin(plugin)} 
              />
              <Button 
                title="Del" 
                variant="danger" 
                onPress={() => deletePlugin(plugin)} 
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pluginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pluginInfo: {
    flex: 1,
    marginRight: 12,
  },
});
