import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Switch, TouchableOpacity } from 'react-native';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { readProperties, writeProperties } from '../../src/services/propertiesManager';
import { serverManager } from '../../src/services/serverManager';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const EDITABLE_PROPS = [
  { key: 'motd', label: 'Message of the Day (MOTD)' },
  { key: 'server-port', label: 'Server Port' },
  { key: 'difficulty', label: 'Difficulty (peaceful, easy, normal, hard)' },
  { key: 'gamemode', label: 'Game Mode (survival, creative, adventure, spectator)' },
  { key: 'pvp', label: 'PvP (true / false)' },
  { key: 'allow-flight', label: 'Allow Flight (true / false)' },
  { key: 'online-mode', label: 'Online Mode (true / false)' },
];

const PERFORMANCE_FIELDS = [
  { key: 'view-distance', label: 'View Distance', min: 3, max: 32, step: 1, unit: 'chunks', hint: 'How far players can see. Lower = better performance.' },
  { key: 'simulation-distance', label: 'Simulation Distance', min: 3, max: 32, step: 1, unit: 'chunks', hint: 'How far entities are simulated. Reduce if laggy.' },
  { key: 'max-players', label: 'Max Players', min: 1, max: 100, step: 1, unit: 'players', hint: 'Maximum concurrent players allowed.' },
  { key: 'entity-broadcast-range-percentage', label: 'Entity Render Range', min: 10, max: 500, step: 10, unit: '%', hint: 'How far entities render. Lower = less lag.' },
];

const PERFORMANCE_PRESETS = {
  low: {
    label: 'Low',
    description: 'Solo play — minimal resources',
    memory: 512,
    values: { 'view-distance': '6', 'simulation-distance': '5', 'max-players': '5', 'entity-broadcast-range-percentage': '50' },
  },
  medium: {
    label: 'Medium',
    description: '2-5 friends — balanced',
    memory: 1024,
    values: { 'view-distance': '10', 'simulation-distance': '8', 'max-players': '20', 'entity-broadcast-range-percentage': '100' },
  },
  high: {
    label: 'High',
    description: 'Small party — best experience',
    memory: 2048,
    values: { 'view-distance': '12', 'simulation-distance': '10', 'max-players': '50', 'entity-broadcast-range-percentage': '200' },
  },
};

type PresetKey = keyof typeof PERFORMANCE_PRESETS | null;

function SliderInput({ label, value, onChange, min, max, step, unit, hint }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const stepDown = () => onChange(Math.max(min, value - step));
  const stepUp = () => onChange(Math.min(max, value + step));

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={stepDown} style={{ padding: 6, backgroundColor: '#2a2a2a', borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>−</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8, height: 20, backgroundColor: '#2a2a2a', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 }} />
        </View>
        <TouchableOpacity onPress={stepUp} style={{ padding: 6, backgroundColor: '#2a2a2a', borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10, minWidth: 60, textAlign: 'right' }}>
          {value}{unit ? ` ${unit}` : ''}
        </Text>
      </View>
      {hint ? <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{hint}</Text> : null}
    </View>
  );
}

export default function PropertiesScreen() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find(c => c.id === activeServerId);
  const status = statuses[activeServerId || ''];

  const [props, setProps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>(null);
  const [jvmOptimized, setJvmOptimized] = useState(config?.jvmFlagsOptimized ?? true);
  const [restartDialogShown, setRestartDialogShown] = useState(false);

  useEffect(() => {
    if (config) setJvmOptimized(config.jvmFlagsOptimized);
  }, [config?.jvmFlagsOptimized]);

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
    setActivePreset(null);
  };

  const handleSliderChange = (key: string, value: number) => {
    setProps(prev => ({ ...prev, [key]: String(value) }));
    setActivePreset(null);
  };

  const applyPreset = (presetKey: PresetKey) => {
    if (!presetKey) {
      setActivePreset(null);
      return;
    }
    const preset = PERFORMANCE_PRESETS[presetKey];
    setProps(prev => ({ ...prev, ...preset.values }));
    if (config && activeServerId) {
      useServerStore.getState().setMaxMemory(activeServerId, preset.memory);
    }
    setActivePreset(presetKey);
  };

  const handleJvmToggle = (value: boolean) => {
    setJvmOptimized(value);
    if (activeServerId) {
      useServerStore.getState().setJvmOptimized(activeServerId, value);
    }
  };

  const handleSave = async () => {
    if (!config?.worldPath) return;
    setSaving(true);
    const success = await writeProperties(config.worldPath, props);
    setSaving(false);
    if (success) {
      if (status?.status === 'running') {
        Alert.alert(
          'Settings Saved',
          'Server must restart to apply new settings. Restart now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Restart Now',
              onPress: () => {
                serverManager.stopServer();
                setTimeout(() => serverManager.startServer(), 3000);
              },
            },
          ],
        );
      } else {
        Alert.alert('Success', 'Properties saved successfully.');
      }
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

  const isRunning = status?.status === 'running';

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Server Properties</Text>

      {isRunning && (
        <Card style={{ marginBottom: 16, backgroundColor: 'rgba(255, 204, 0, 0.1)', borderColor: '#b8860b', borderWidth: 1 }}>
          <Text style={{ color: '#ffcc00', fontWeight: 'bold' }}>⚡ Server must restart to apply new settings</Text>
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
            The server is currently running. Changes will take effect after restart.
          </Text>
        </Card>
      )}

      <Card>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Performance</Text>

        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {(Object.keys(PERFORMANCE_PRESETS) as PresetKey[]).map((key) => {
            if (!key) return null;
            const preset = PERFORMANCE_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => applyPreset(key)}
                style={{
                  flex: 1,
                  marginHorizontal: 3,
                  backgroundColor: isActive ? 'rgba(0,255,0,0.15)' : '#1e1e1e',
                  borderColor: isActive ? theme.colors.primary : '#333',
                  borderWidth: isActive ? 2 : 1,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{preset.label}</Text>
                <Text style={{ color: '#999', fontSize: 9, textAlign: 'center', marginTop: 2 }}>{preset.description}</Text>
                <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 4 }}>{preset.memory}MB</Text>
              </TouchableOpacity>
            );
          })}
          {activePreset === null && (
            <View style={{ flex: 1, marginHorizontal: 3, backgroundColor: '#1e1e1e', borderColor: '#333', borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#666', fontSize: 12 }}>Custom</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#333', borderBottomWidth: 1, borderBottomColor: '#333' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Optimize JVM Performance</Text>
            <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>Reduces lag with community-standard JVM settings (Aikar's flags). Recommended.</Text>
          </View>
          <Switch
            value={jvmOptimized}
            onValueChange={handleJvmToggle}
            trackColor={{ false: '#555', true: theme.colors.primary }}
          />
        </View>

        {PERFORMANCE_FIELDS.map((field) => (
          <SliderInput
            key={field.key}
            label={field.label}
            value={Number(props[field.key]) || field.min}
            onChange={(v) => handleSliderChange(field.key, v)}
            min={field.min}
            max={field.max}
            step={field.step}
            unit={field.unit}
            hint={field.hint}
          />
        ))}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>General Settings</Text>
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
