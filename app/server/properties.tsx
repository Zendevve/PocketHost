import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { readProperties, writeProperties } from '../../src/services/propertiesManager';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const EDITABLE_PROPS = [
  { key: 'motd', label: 'Message of the Day (MOTD)' },
  { key: 'max-players', label: 'Max Players' },
  { key: 'server-port', label: 'Server Port' },
  { key: 'difficulty', label: 'Difficulty (peaceful, easy, normal, hard)' },
  { key: 'gamemode', label: 'Game Mode (survival, creative, adventure, spectator)' },
  { key: 'pvp', label: 'PvP (true / false)' },
  { key: 'allow-flight', label: 'Allow Flight (true / false)' },
  { key: 'online-mode', label: 'Online Mode (true / false)' },
];

export default function PropertiesScreen() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find(c => c.id === activeServerId);
  const status = statuses[activeServerId || ''];
  
  const [props, setProps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (config?.worldPath) {
        setLoading(true);
        const data = await readProperties(config.worldPath);
        setProps(data);
        setLoading(false);
      }
    }
    load();
  }, [config?.worldPath]);

  const handleChange = (key: string, value: string) => {
    setProps(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!config?.worldPath) return;
    setSaving(true);
    const success = await writeProperties(config.worldPath, props);
    setSaving(false);
    if (success) {
      Alert.alert('Success', 'Properties saved successfully. Restart the server to apply changes.');
    } else {
      Alert.alert('Error', 'Failed to save properties.');
    }
  };

  if (!config) {
    return (
      <View style={theme.screen}>
        <Text style={theme.heading}>Server Properties</Text>
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
      <Text style={theme.heading}>Server Properties</Text>
      
      {status?.status === 'running' && (
        <Card style={{ marginBottom: 16, backgroundColor: 'rgba(255, 204, 0, 0.1)', borderColor: '#b8860b', borderWidth: 1 }}>
          <Text style={{ color: '#ffcc00', fontWeight: 'bold' }}>Warning</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>
            The server is currently running. Changes will not take effect until the server is restarted.
          </Text>
        </Card>
      )}

      <Card>
        {EDITABLE_PROPS.map((item) => (
          <Input 
            key={item.key}
            label={item.label}
            value={props[item.key] || ''}
            onChangeText={(text) => handleChange(item.key, text)}
          />
        ))}
        
        <Button 
          title={saving ? 'Saving...' : 'Save Properties'} 
          onPress={handleSave} 
          disabled={saving} 
          style={{ marginTop: 12 }}
        />
      </Card>
    </ScrollView>
  );
}
