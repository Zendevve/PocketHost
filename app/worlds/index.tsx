import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { useWorldStore } from '../../src/stores/worldStore';
import {
  listWorlds,
  listTemplates,
  duplicateWorld,
  renameWorld,
  deleteWorld,
  createTemplateFromWorld,
  createWorldFromTemplate,
} from '../../src/services/worldTemplateService';

export default function WorldsScreen() {
  const router = useRouter();
  const worlds = useWorldStore((s) => s.worlds);
  const templates = useWorldStore((s) => s.templates);
  const isLoading = useWorldStore((s) => s.isLoading);
  const setWorlds = useWorldStore((s) => s.setWorlds);
  const setTemplates = useWorldStore((s) => s.setTemplates);
  const addTemplate = useWorldStore((s) => s.addTemplate);
  const removeTemplate = useWorldStore((s) => s.removeTemplate);
  const setLoading = useWorldStore((s) => s.setLoading);

  const activeServerId = useServerStore((s) => s.activeServerId);
  const configs = useServerStore((s) => s.configs);
  const activeConfig = configs.find((c) => c.id === activeServerId);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateFromTemplateModal, setShowCreateFromTemplateModal] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const w = await listWorlds();
      setWorlds(w);
      const t = await listTemplates();
      setTemplates(t);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDuplicate = useCallback(async () => {
    if (!selectedWorld || !inputValue) return;
    try {
      await duplicateWorld(selectedWorld.path, inputValue);
      Alert.alert('Success', `World duplicated as "${inputValue}"`);
      refreshData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setShowDuplicateModal(false);
      setSelectedWorld(null);
      setInputValue('');
    }
  }, [selectedWorld, inputValue, refreshData]);

  const handleRename = useCallback(async () => {
    if (!selectedWorld || !inputValue) return;
    try {
      await renameWorld(selectedWorld.path, inputValue);
      Alert.alert('Success', `World renamed to "${inputValue}"`);
      refreshData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setShowRenameModal(false);
      setSelectedWorld(null);
      setInputValue('');
    }
  }, [selectedWorld, inputValue, refreshData]);

  const handleDelete = useCallback(
    (world: any) => {
      Alert.alert('Delete World', `Are you sure you want to delete "${world.name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorld(world.path);
              refreshData();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]);
    },
    [refreshData]
  );

  const handleCreateTemplate = useCallback(async () => {
    if (!selectedWorld || !inputValue) return;
    try {
      const template = await createTemplateFromWorld(selectedWorld.path, inputValue);
      addTemplate(template);
      Alert.alert('Success', `Template "${inputValue}" created`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setShowTemplateModal(false);
      setSelectedWorld(null);
      setInputValue('');
    }
  }, [selectedWorld, inputValue, addTemplate]);

  const handleCreateFromTemplate = useCallback(async () => {
    if (!selectedTemplate || !inputValue) return;
    try {
      await createWorldFromTemplate(selectedTemplate.sourceWorldPath, inputValue);
      Alert.alert('Success', `World "${inputValue}" created from template`);
      refreshData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setShowCreateFromTemplateModal(false);
      setSelectedTemplate(null);
      setInputValue('');
    }
  }, [selectedTemplate, inputValue, refreshData]);

  const renderWorld = ({ item }: { item: any }) => {
    const isActive = activeConfig?.worldPath === item.path;
    return (
      <Card style={[styles.worldCard, isActive && styles.activeWorldCard]}>
        <View style={styles.worldHeader}>
          <Text style={styles.worldName}>{item.name}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.worldMeta}>{(item.size / 1024 / 1024).toFixed(1)} MB</Text>
        <View style={styles.worldActions}>
          <Button
            title="Duplicate"
            variant="secondary"
            onPress={() => {
              setSelectedWorld(item);
              setInputValue(`${item.name}_copy`);
              setShowDuplicateModal(true);
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button
            title="Rename"
            variant="secondary"
            onPress={() => {
              setSelectedWorld(item);
              setInputValue(item.name);
              setShowRenameModal(true);
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button
            title="Template"
            variant="secondary"
            onPress={() => {
              setSelectedWorld(item);
              setInputValue(`${item.name}_template`);
              setShowTemplateModal(true);
            }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button title="Delete" variant="danger" onPress={() => handleDelete(item)} style={{ flex: 1 }} />
        </View>
      </Card>
    );
  };

  const renderTemplate = ({ item }: { item: any }) => (
    <Card style={styles.templateCard}>
      <Text style={styles.templateName}>{item.name}</Text>
      <Text style={styles.templateMeta}>
        {(item.size / 1024 / 1024).toFixed(1)} MB · {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Button
        title="Create World"
        variant="secondary"
        onPress={() => {
          setSelectedTemplate(item);
          setInputValue(`${item.name}_world`);
          setShowCreateFromTemplateModal(true);
        }}
        style={{ marginTop: 8 }}
      />
    </Card>
  );

  const renderModal = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    title: string,
    onConfirm: () => void
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Name"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <Button title="Cancel" variant="secondary" onPress={() => setVisible(false)} style={{ flex: 1, marginRight: 8 }} />
            <Button title="Confirm" onPress={onConfirm} disabled={!inputValue} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Worlds</Text>
      <Text style={theme.subtext}>Manage your Minecraft worlds and templates</Text>

      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Your Worlds</Text>
      {worlds.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No worlds found. Create one in setup.</Text>
        </Card>
      ) : (
        worlds.map((item) => (
          <View key={item.path}>{renderWorld({ item })}</View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Templates</Text>
      {templates.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No templates yet. Create one from an existing world.</Text>
        </Card>
      ) : (
        templates.map((item) => (
          <View key={item.id}>{renderTemplate({ item })}</View>
        ))
      )}

      {renderModal(showDuplicateModal, setShowDuplicateModal, 'Duplicate World', handleDuplicate)}
      {renderModal(showRenameModal, setShowRenameModal, 'Rename World', handleRename)}
      {renderModal(showTemplateModal, setShowTemplateModal, 'Create Template', handleCreateTemplate)}
      {renderModal(
        showCreateFromTemplateModal,
        setShowCreateFromTemplateModal,
        'Create World from Template',
        handleCreateFromTemplate
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  worldCard: {
    marginBottom: 12,
  },
  activeWorldCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  worldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  worldName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  worldMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  worldActions: {
    flexDirection: 'row',
  },
  templateCard: {
    marginBottom: 12,
  },
  templateName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  templateMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
