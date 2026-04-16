import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ConfigEditor } from '../../src/components/ui/ConfigEditor';
import { useServerStore } from '../../src/stores/serverStore';
import { serverManager } from '../../src/services/serverManager';
import { getPluginConfigPath, readPluginConfig, findPluginConfigPath } from '../../src/services/pluginConfigManager';
import { theme } from '../../src/lib/theme';

interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  size: number;
}

export default function PluginDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { configs } = useServerStore();
  const config = configs.find(c => c.id === useServerStore.getState().activeServerId);
  
  const [plugin, setPlugin] = useState<PluginInfo | null>(null);
  const [configPath, setConfigPath] = useState<string | null>(null);
  const [configData, setConfigData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);

  const loadPluginAndConfig = useCallback(async () => {
    if (!config?.worldPath) return;
    const pluginsDir = `file://${config.worldPath}/plugins`;
    try {
      const files = await FileSystem.readDirectoryAsync(pluginsDir);
      // Find plugin file that matches the id (slugified name)
      const match = files.find(f => {
        const base = f.replace(/\.jar(\.disabled)?$/, '');
        return base === id;
      });
      if (!match) {
        Alert.alert('Not found', 'Plugin not found in plugins directory.');
        router.back();
        return;
      }
      const fullPath = `${pluginsDir}/${match}`;
      const info = await FileSystem.getInfoAsync(fullPath);
      setPlugin({
        name: id,
        path: fullPath,
        enabled: !match.endsWith('.disabled'),
        size: info.size || 0,
      });

      // Look for config
      const cfgPath = await findPluginConfigPath(fullPath);
      if (cfgPath) {
        setConfigPath(cfgPath);
        const parsed = await readPluginConfig(cfgPath);
        setConfigData(parsed);
        setHasConfig(true);
      } else {
        setHasConfig(false);
      }
    } catch (e) {
      console.error('Failed to load plugin:', e);
      Alert.alert('Error', 'Could not load plugin details.');
    } finally {
      setLoading(false);
    }
  }, [config?.worldPath, id, router]);

  useEffect(() => {
    loadPluginAndConfig();
  }, [loadPluginAndConfig]);

  const handleReload = () => {
    // Send reload command to server
    const cmd = `/reload ${plugin?.name || ''}`.trim();
    serverManager.sendCommand(cmd);
    Alert.alert('Command Sent', `Sent: "${cmd}" to server console.`);
  };

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!plugin) {
    return (
      <View style={theme.screen}>
        <Text style={theme.body}>Plugin not found.</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>{plugin.name}</Text>
      <Text style={theme.body}>Size: {(plugin.size / 1024 / 1024).toFixed(2)} MB</Text>
      <Text style={[theme.body, { color: plugin.enabled ? theme.colors.primary : theme.colors.textMuted }]}>
        Status: {plugin.enabled ? 'Enabled' : 'Disabled'}
      </Text>

      {hasConfig && configPath ? (
        <>
          <Text style={[theme.subtext, { marginTop: 12 }]}>Configuration</Text>
          <Card>
            <ConfigEditor
              initialConfig={configData}
              configPath={configPath}
              onSaved={() => {
                // Optionally refresh config from disk after save
                loadPluginAndConfig();
              }}
            />
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: 12 }}>
          <Text style={theme.body}>No configuration file found for this plugin.</Text>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Button title="Reload Plugin" onPress={handleReload} />
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
