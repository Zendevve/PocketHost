import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { theme, colors } from '../../lib/theme';
import { YamlNode } from './YamlNode';
import * as yaml from 'js-yaml';
import { writePluginConfig } from '../../services/pluginConfigManager';

interface ConfigTreeEditorProps {
  initialConfig: Record<string, unknown>;
  configPath: string;
  onSaved?: () => void;
}

type NodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

interface YamlNodeInfo {
  path: string;
  value: unknown;
  type: NodeType;
}

function getNodeType(value: unknown): NodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as NodeType;
}

function flattenYaml(
  obj: Record<string, unknown>,
  prefix: string = ''
): YamlNodeInfo[] {
  const nodes: YamlNodeInfo[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const type = getNodeType(value);

    nodes.push({ path, value, type });

    if (type === 'object' || type === 'array') {
      const childObj = value as Record<string, unknown>;
      nodes.push(...flattenYaml(childObj, path));
    }
  }

  return nodes;
}

export function ConfigTreeEditor({ initialConfig, configPath, onSaved }: ConfigTreeEditorProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(() => ({
    ...initialConfig,
  }));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleExpand = useCallback((path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const updateValue = useCallback((path: string, newValue: unknown) => {
    setConfig(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current: any = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        const next = current[k];
        current[k] = Array.isArray(next) ? [...next] : { ...next };
        current = current[k];
      }

      current[keys[keys.length - 1]] = newValue;
      return result;
    });
    setValidationError(null);
  }, []);

  const addArrayItem = useCallback((arrayPath: string) => {
    setConfig(prev => {
      const keys = arrayPath.split('.');
      const result = { ...prev };
      let current: any = result;

      for (const k of keys) {
        current = current[k];
      }

      if (Array.isArray(current)) {
        const inferType = current.length > 0 ? getNodeType(current[0]) : 'string';
        const newItem = inferType === 'object' ? {} : inferType === 'number' ? 0 : inferType === 'boolean' ? false : '';
        current.push(newItem);
      }

      return result;
    });
  }, []);

  const removeArrayItem = useCallback((arrayPath: string, index: number) => {
    setConfig(prev => {
      const keys = arrayPath.split('.');
      const result = { ...prev };
      let current: any = result;

      for (const k of keys) {
        current = current[k];
      }

      if (Array.isArray(current)) {
        current.splice(index, 1);
      }

      return result;
    });
  }, []);

  const moveArrayItem = useCallback((arrayPath: string, fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const keys = arrayPath.split('.');
      const result = { ...prev };
      let current: any = result;

      for (const k of keys) {
        current = current[k];
      }

      if (Array.isArray(current)) {
        const [item] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, item);
      }

      return result;
    });
  }, []);

  const addObjectKey = useCallback((objectPath: string, key: string) => {
    setConfig(prev => {
      const keys = objectPath.split('.');
      const result = { ...prev };
      let current: any = result;

      for (const k of keys) {
        current = current[k];
      }

      if (typeof current === 'object' && !Array.isArray(current)) {
        current[key] = '';
      }

      return result;
    });
  }, []);

  const removeObjectKey = useCallback((objectPath: string, key: string) => {
    setConfig(prev => {
      const keys = objectPath.split('.');
      const result = { ...prev };
      let current: any = result;

      for (const k of keys) {
        current = current[k];
      }

      if (typeof current === 'object' && !Array.isArray(current)) {
        delete current[key];
      }

      return result;
    });
  }, []);

  const handleSave = async () => {
    setValidationError(null);

    try {
      yaml.dump(config, { lineWidth: 0, noRefs: true, quotingType: '"' });
    } catch (e: any) {
      setValidationError(`Invalid YAML: ${e.message}`);
      return;
    }

    setSaving(true);
    try {
      const ok = await writePluginConfig(configPath, config);
      if (ok) {
        Alert.alert('Success', 'Configuration saved.');
        onSaved?.();
      } else {
        Alert.alert('Error', 'Failed to save configuration.');
      }
    } catch (e: any) {
      setValidationError(`Save failed: ${e.message}`);
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const rootNodes = Object.entries(config).map(([key, value]) => ({
    path: key,
    value,
    type: getNodeType(value),
  }));

  return (
    <ScrollView style={{ marginBottom: 16 }}>
      <View style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Configuration</Text>
        {rootNodes.map(({ path, value, type }) => (
          <YamlNode
            key={path}
            path={path}
            value={value}
            type={type}
            expanded={expanded[path] ?? false}
            onToggleExpand={toggleExpand}
            onUpdate={updateValue}
            onAddArrayItem={addArrayItem}
            onRemoveArrayItem={removeArrayItem}
            onMoveArrayItem={moveArrayItem}
            onAddObjectKey={addObjectKey}
            onRemoveObjectKey={removeObjectKey}
            depth={0}
          />
        ))}
      </View>

      {validationError && (
        <View style={{ backgroundColor: colors.danger + '20', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ color: colors.danger }}>{validationError}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: colors.bg, fontWeight: '600' }}>
            {saving ? 'Saving...' : 'Save Config'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
