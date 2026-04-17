import { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import { theme, colors } from '../../lib/theme';

interface YamlNodeProps {
  path: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  expanded: boolean;
  depth: number;
  onToggleExpand: (path: string) => void;
  onUpdate: (path: string, value: unknown) => void;
  onAddArrayItem: (path: string) => void;
  onRemoveArrayItem: (path: string, index: number) => void;
  onMoveArrayItem: (path: string, from: number, to: number) => void;
  onAddObjectKey: (path: string, key: string) => void;
  onRemoveObjectKey: (path: string, key: string) => void;
}

function formatValue(value: unknown): string {
  if (value === null) return '<null>';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    return value.length > 40 ? value.slice(0, 40) + '...' : value;
  }
  return '';
}

function getNewScalarForArray(type: 'string' | 'number' | 'boolean' | 'object'): unknown {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'object': return {};
    default: return '';
  }
}

function detectArrayItemType(array: unknown[]): 'string' | 'number' | 'boolean' | 'object' {
  if (array.length === 0) return 'string';
  const firstType = typeof array[0];
  if (firstType === 'object') {
    if (array[0] === null) return 'string';
    return 'object';
  }
  return firstType as 'string' | 'number' | 'boolean';
}

export function YamlNode({
  path,
  value,
  type,
  expanded,
  depth,
  onToggleExpand,
  onUpdate,
  onAddArrayItem,
  onRemoveArrayItem,
  onMoveArrayItem,
  onAddObjectKey,
  onRemoveObjectKey,
}: YamlNodeProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showArrayMenu, setShowArrayMenu] = useState(false);

  const isContainer = type === 'object' || type === 'array';
  const indent = depth * 20;

  const handleStartEdit = () => {
    if (isContainer) return;
    setEditValue(String(value === null ? '' : value));
    setEditing(true);
  };

  const handleCommitEdit = () => {
    let parsed: unknown = editValue;
    if (type === 'number') {
      parsed = Number(editValue);
    } else if (type === 'boolean') {
      parsed = editValue.toLowerCase() === 'true';
    }
    onUpdate(path, parsed);
    setEditing(false);
  };

  const handleToggle = () => {
    if (isContainer) {
      onToggleExpand(path);
    }
  };

  const renderNode = () => (
    <View style={{ marginLeft: depth > 0 ? 12 : 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 8,
          backgroundColor: depth === 0 ? colors.surface : undefined,
          borderRadius: 6,
          borderWidth: depth === 0 ? 1 : 0,
          borderColor: colors.border,
        }}
      >
        {/* Expand/Collapse arrow */}
        <Pressable
          onPress={handleToggle}
          disabled={!isContainer}
          style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: 'bold' }}>
            {isContainer ? (expanded ? '▼' : '▶') : '•'}
          </Text>
        </Pressable>

        {/* Key label (for non-root) */}
        {depth > 0 && (
          <Text style={{ color: colors.primary, fontSize: 14, marginRight: 8, minWidth: 100 }}>
            {path.split('.').pop()}
          </Text>
        )}

        {/* Scalar editing */}
        {type === 'string' || type === 'number' || type === 'boolean' || type === 'null' ? (
          editing ? (
            <TextInput
              autoFocus
              value={editValue}
              onChangeText={setEditValue}
              onSubmitEditing={handleCommitEdit}
              onBlur={() => setEditing(false)}
              keyboardType={type === 'number' ? 'numeric' : 'default'}
              style={{
                flex: 1,
                backgroundColor: colors.bg,
                color: colors.text,
                padding: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            />
          ) : (
            <Pressable onPress={handleStartEdit} style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14 }}>
                {formatValue(value)}
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>
                  ({type})
                </Text>
              </Text>
            </Pressable>
          )
        ) : (
          <Text style={{ color: colors.textMuted, flex: 1 }}>
            {type === 'array' ? `Array(${(value as unknown[]).length})` : '{...}'}
          </Text>
        )}

        {/* Container actions */}
        {isContainer && expanded && (
          <View style={{ flexDirection: 'row', marginLeft: 8 }}>
            {type === 'array' && (
              <>
                <Pressable
                  onPress={() => setShowArrayMenu(true)}
                  style={{ padding: 6, backgroundColor: colors.primary + '30', borderRadius: 4 }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12 }}>+</Text>
                </Pressable>
                {depth > 0 && (
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 8 }}>
                    {(value as unknown[]).length} items
                  </Text>
                )}
              </>
            )}
            {type === 'object' && depth > 0 && (
              <Pressable
                onPress={() => setShowKeyPrompt(true)}
                style={{ padding: 6, backgroundColor: colors.primary + '30', borderRadius: 4 }}
              >
                <Text style={{ color: colors.primary, fontSize: 12 }}>+ Key</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Expanded children */}
      {expanded && isContainer && (
        <View>
          {type === 'array' &&
            (value as unknown[]).map((item, idx) => {
              const itemPath = `${path}.${idx}`;
              const itemType = getNodeType(item);
              return (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <YamlNode
                    path={itemPath}
                    value={item}
                    type={itemType}
                    expanded={false}
                    depth={depth + 1}
                    onToggleExpand={onToggleExpand}
                    onUpdate={onUpdate}
                    onAddArrayItem={onAddArrayItem}
                    onRemoveArrayItem={onRemoveArrayItem}
                    onMoveArrayItem={onMoveArrayItem}
                    onAddObjectKey={onAddObjectKey}
                    onRemoveObjectKey={onRemoveObjectKey}
                  />
                  {/* Array item controls */}
                  <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                    <Pressable
                      onPress={() => onMoveArrayItem(path, idx, idx - 1)}
                      disabled={idx === 0}
                      style={{ padding: 4, opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <Text style={{ color: colors.primary }}>↑</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onMoveArrayItem(path, idx, idx + 1)}
                      disabled={idx === (value as unknown[]).length - 1}
                      style={{ padding: 4, opacity: idx === (value as unknown[]).length - 1 ? 0.3 : 1 }}
                    >
                      <Text style={{ color: colors.primary }}>↓</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveArrayItem(path, idx)}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: colors.danger }}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

          {type === 'object' &&
            Object.entries(value as Record<string, unknown>).map(([k, v]) => {
              const childPath = `${path}.${k}`;
              const childType = getNodeType(v);
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <YamlNode
                    path={childPath}
                    value={v}
                    type={childType}
                    expanded={false}
                    depth={depth + 1}
                    onToggleExpand={onToggleExpand}
                    onUpdate={onUpdate}
                    onAddArrayItem={onAddArrayItem}
                    onRemoveArrayItem={onRemoveArrayItem}
                    onMoveArrayItem={onMoveArrayItem}
                    onAddObjectKey={onAddObjectKey}
                    onRemoveObjectKey={onRemoveObjectKey}
                  />
                  {/* Object key removal */}
                  {depth > 0 && (
                    <Pressable
                      onPress={() => onRemoveObjectKey(path, k)}
                      style={{ padding: 4, marginTop: 10 }}
                    >
                      <Text style={{ color: colors.danger }}>✕</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
        </View>
      )}
    </View>
  );

  return (
    <View>
      {renderNode()}

      {/* Add Array Item Modal */}
      <Modal
        visible={showArrayMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArrayMenu(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}
          onPress={() => setShowArrayMenu(false)}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20 }}>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 16 }}>
              Add Array Item
            </Text>
            {(['string', 'number', 'boolean', 'object'] as const).map(t => (
              <Pressable
                key={t}
                onPress={() => {
                  onAddArrayItem(path);
                  setShowArrayMenu(false);
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceHover,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.text }}>
                  {t === 'object' ? 'Empty Object' : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Add Object Key Modal */}
      <Modal
        visible={showKeyPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyPrompt(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 }}
          onPress={() => setShowKeyPrompt(false)}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20 }}>
            <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 12 }}>
              Add Key to Object
            </Text>
            <TextInput
              autoFocus
              placeholder="Key name"
              placeholderTextColor={colors.textMuted}
              value={newKey}
              onChangeText={setNewKey}
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => {
                  if (newKey.trim()) {
                    onAddObjectKey(path, newKey.trim());
                    setNewKey('');
                    setShowKeyPrompt(false);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.bg, fontWeight: '600' }}>Add</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setNewKey('');
                  setShowKeyPrompt(false);
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceHover,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
