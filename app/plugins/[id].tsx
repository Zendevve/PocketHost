import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ConfigTreeEditor } from '../../src/components/ui/ConfigTreeEditor';
import { useServerStore } from '../../src/stores/serverStore';
import { serverManager } from '../../src/services/serverManager';
import { getPluginConfigPath, readPluginConfig, findPluginConfigPath, getPluginMetadata, isCorruptedJar, PluginMetadata } from '../../src/services/pluginConfigManager';
import { colors, theme } from '../../src/lib/theme';

interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  size: number;
  metadata?: PluginMetadata | null;
  corrupted?: boolean;
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
      const info = await FileSystem.getInfoAsync(fullPath, { size: true });
      if (!info.exists) {
        Alert.alert('Not found', 'Plugin file missing.');
        router.back();
        return;
      }
      // Extract metadata and check corruption in parallel
      const [metadata, corrupted] = await Promise.all([
        getPluginMetadata(fullPath),
        isCorruptedJar(fullPath),
      ]);
      setPlugin({
        name: id,
        path: fullPath,
        enabled: !match.endsWith('.disabled'),
        size: info.size,
        metadata: corrupted ? null : metadata,
        corrupted,
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
    if (plugin?.corrupted) {
      Alert.alert('Cannot Reload', 'Plugin is corrupted and cannot be reloaded.');
      return;
    }
    // Send reload command to server
    const cmd = `/reload ${plugin?.name || ''}`.trim();
    serverManager.sendCommand(cmd);
    Alert.alert('Command Sent', `Sent: "${cmd}" to server console.`);
  };

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={theme.heading}>{plugin.metadata?.name || plugin.name}</Text>
        {plugin.corrupted && <Text style={{ fontSize: 20 }}>⚠️</Text>}
      </View>
      {plugin.metadata?.version && (
        <Text style={theme.subtext}>Version: {plugin.metadata.version}</Text>
      )}
      {plugin.metadata?.author && (
        <Text style={theme.subtext}>Author: {plugin.metadata.author}</Text>
      )}
      {plugin.metadata?.description && (
        <Text style={[theme.body, { marginTop: 8 }]} numberOfLines={3}>
          {plugin.metadata.description}
        </Text>
      )}
      <Text style={[theme.body, { color: plugin.enabled ? colors.primary : colors.textMuted, marginTop: 8 }]}>
        Status: {plugin.enabled ? 'Enabled' : 'Disabled'}
      </Text>
      <Text style={theme.subtext}>Size: {(plugin.size / 1024 / 1024).toFixed(2)} MB</Text>

      {plugin.corrupted && (
        <Card style={{ backgroundColor: '#3f1f1f', borderColor: colors.danger, marginTop: 16 }}>
          <Text style={[theme.body, { color: colors.danger }]}>
            ⚠️ This plugin JAR is corrupted or unreadable. It may not work correctly. Consider re-installing it.
          </Text>
        </Card>
      )}

      {hasConfig && configPath && !plugin.corrupted ? (
        <>
          <Text style={[theme.subtext, { marginTop: 12 }]}>Configuration</Text>
          <Card>
            <ConfigTreeEditor
              initialConfig={configData}
              configPath={configPath}
              onSaved={() => {
                loadPluginAndConfig();
              }}
            />
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: 12 }}>
          <Text style={theme.body}>
            {plugin.corrupted ? 'Configuration editor is disabled for corrupted plugins.' : 'No configuration file found for this plugin.'}
          </Text>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Button 
          title="Reload Plugin" 
          onPress={handleReload} 
          disabled={plugin.corrupted}
          style={plugin.corrupted ? { opacity: 0.5 } : undefined}
        />
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
