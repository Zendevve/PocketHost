import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { theme, colors } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Link } from 'expo-router';
import { getPluginMetadata, isCorruptedJar, PluginMetadata } from '../../src/services/pluginConfigManager';

interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  size: number;
  metadata?: PluginMetadata | null;
  corrupted?: boolean;
}

export default function PluginsScreen() {
  const router = useRouter();
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
          const fileInfo = await FileSystem.getInfoAsync(path, { size: true });
          if (!fileInfo.exists) {
            return {
              name: file.replace('.jar.disabled', '').replace('.jar', ''),
              path,
              enabled: !file.endsWith('.disabled'),
              size: 0,
              metadata: null,
              corrupted: false,
            };
          }
          // Extract metadata in parallel
          const [metadata, corrupted] = await Promise.all([
            getPluginMetadata(path),
            isCorruptedJar(path),
          ]);
          return {
            name: file.replace('.jar.disabled', '').replace('.jar', ''),
            path,
            enabled: !file.endsWith('.disabled'),
            size: fileInfo.size,
            metadata: corrupted ? null : metadata,
            corrupted,
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

   const handleImportPlugin = async () => {
     if (!config?.worldPath) {
       Alert.alert('Error', 'No server configured.');
       return;
     }

     try {
       const result = await DocumentPicker.getDocumentAsync({
         type: 'application/java-archive',
         copyToCacheDirectory: true,
       });

       if (result.canceled || !result.assets || result.assets.length === 0) {
         return;
       }

       const asset = result.assets[0];
       const pluginsDir = `${config.worldPath}/plugins`;
       const destPath = `${pluginsDir}/${asset.name}`;

       // Ensure plugins directory exists
       const dirInfo = await FileSystem.getInfoAsync(pluginsDir);
       if (!dirInfo.exists) {
         await FileSystem.makeDirectoryAsync(pluginsDir, { intermediates: true });
       }

       // Handle duplicate filename
       let finalDestPath = destPath;
       const destInfo = await FileSystem.getInfoAsync(destPath);
       if (destInfo.exists) {
         const timestamp = Date.now();
         const renamed = `${asset.name.replace('.jar', '')}-${timestamp}.jar`;
         finalDestPath = `${pluginsDir}/${renamed}`;
         await FileSystem.copyAsync({
           from: asset.uri,
           to: finalDestPath,
         });
       } else {
         await FileSystem.copyAsync({
           from: asset.uri,
           to: destPath,
         });
       }

       // Immediately check if the imported JAR is corrupted
       const corrupted = await isCorruptedJar(finalDestPath);
       if (corrupted) {
         // Remove the corrupted file
         await FileSystem.deleteAsync(finalDestPath, { idempotent: true });
         Alert.alert('Import Failed', 'The plugin JAR appears to be corrupted or unreadable. Please obtain a valid plugin file.');
         return;
       }

       // Success feedback
       Alert.alert('Imported', `Plugin ${asset.name} installed successfully.`);

       // Refresh list
       await fetchPlugins();
     } catch (e: any) {
       console.error('Import failed:', e);
       Alert.alert('Import Error', e.message || 'Failed to import plugin.');
     }
   };

  useEffect(() => {
    fetchPlugins();
  }, [config?.worldPath]);

  const togglePlugin = async (plugin: PluginInfo) => {
    if (plugin.corrupted) {
      Alert.alert('Corrupted Plugin', 'This plugin JAR is unreadable or damaged. Please re-install it.');
      return;
    }
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
         <ActivityIndicator color={colors.primary} size="large" />
       </View>
     );
   }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={theme.heading}>Plugins</Text>
        <Button title="+ Import" onPress={handleImportPlugin} />
      </View>
      <Text style={[theme.body, { marginBottom: 20 }]}>
        Manage server plugins. Drop `.jar` files into the `plugins/` folder to install new plugins. (Note: Only Paper/Spigot/Purpur servers support plugins).
      </Text>
      
      {plugins.length === 0 ? (
        <Card>
          <Text style={theme.body}>No plugins found in the plugins directory.</Text>
        </Card>
       ) : plugins.map((plugin) => (
          <Card key={plugin.path} style={styles.pluginCard}>
            <View style={styles.pluginInfo}>
              <Pressable
                onPress={() => {
                  if (plugin.corrupted) {
                    Alert.alert('Corrupted Plugin', 'This plugin JAR is unreadable or damaged. Please re-install it.');
                  } else {
                    router.push(`/plugins/${encodeURIComponent(plugin.name)}`);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[theme.body, { fontWeight: 'bold', color: plugin.enabled ? '#fff' : '#6b7280' }]}>
                    {plugin.metadata?.name || plugin.name}
                  </Text>
                  {plugin.corrupted && <Text style={{ fontSize: 16 }}>⚠️</Text>}
                </View>
              </Pressable>
              {plugin.metadata?.version && (
                <Text style={theme.subtext}>Version: {plugin.metadata.version}</Text>
              )}
              {plugin.metadata?.author && (
                <Text style={theme.subtext}>Author: {plugin.metadata.author}</Text>
              )}
              <Text style={theme.subtext}>Size: {(plugin.size / 1024 / 1024).toFixed(2)} MB</Text>
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
        )
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
