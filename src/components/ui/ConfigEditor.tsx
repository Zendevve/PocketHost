import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { theme } from '../../lib/theme';
import { writePluginConfig } from '../../services/pluginConfigManager';

interface ConfigEditorProps {
  initialConfig: Record<string, unknown>;
  configPath: string;
  onSaved?: () => void;
}

export function ConfigEditor({ initialConfig, configPath, onSaved }: ConfigEditorProps) {
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(initialConfig)) {
      flat[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
    return flat;
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedConfig: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(config)) {
        const trimmed = v.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            parsedConfig[k] = JSON.parse(trimmed);
            continue;
          } catch { }
        }
        parsedConfig[k] = v;
      }
      const ok = await writePluginConfig(configPath, parsedConfig);
      if (ok) {
        Alert.alert('Success', 'Plugin configuration saved.');
        onSaved?.();
      } else {
        Alert.alert('Error', 'Failed to save configuration.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ marginBottom: 16 }}>
      {Object.entries(config).map(([key, value]) => (
        <Input
          key={key}
          label={key}
          value={value}
          onChangeText={text => updateField(key, text)}
          style={{ marginBottom: 8 }}
        />
      ))}
      <Button
        title={saving ? 'Saving...' : 'Save Config'}
        onPress={handleSave}
        disabled={saving}
      />
    </ScrollView>
  );
}
