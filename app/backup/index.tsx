import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { BackupCard } from '../../src/components/ui/BackupCard';
import { theme } from '../../src/lib/theme';
import { useBackupStore, BackupEntry } from '../../src/stores/backupStore';
import { createBackup, restoreBackup, listBackups } from '../../src/services/backupService';
import { useServerStore } from '../../src/stores/serverStore';
import * as FileSystem from 'expo-file-system';

export default function BackupScreen() {
  const router = useRouter();
  const backups = useBackupStore((s) => s.backups);
  const serverStatus = useServerStore((s) => s.backupStatus);
  const lastBackup = useServerStore((s) => s.lastBackupTime);
  const backupError = useServerStore((s) => s.backupError);

  const [creating, setCreating] = useState(false);
  const [progressStage, setProgressStage] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupEntry | null>(null);
  const [worldNameInput, setWorldNameInput] = useState('');
  const [showWorldInput, setShowWorldInput] = useState(false);

  const activeServerId = useServerStore((s) => s.activeServerId);
  const configs = useServerStore((s) => s.configs);
  const activeConfig = configs.find((c) => c.id === activeServerId);
  const currentWorldName = activeConfig?.worldName || '';

  useEffect(() => {
    // Load backups on mount
    listBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (!activeConfig) return;
    setCreating(true);
    setProgressStage('Starting...');
    setProgressPercent(0);
    try {
      const worldPath = activeConfig.worldPath;
      const destDir = `${FileSystem.documentDirectory}backups`;
      await createBackup(worldPath, destDir, (stage, percent) => {
        setProgressStage(stage);
        setProgressPercent(percent);
      });
      Alert.alert('Success', 'Backup created successfully');
    } catch (e: any) {
      Alert.alert('Backup failed', e.message || 'Unknown error');
    } finally {
      setCreating(false);
      setProgressStage(null);
      setProgressPercent(0);
    }
  };

  const handleRestorePress = (backup: BackupEntry) => {
    setSelectedBackup(backup);
    setShowConfirm(true);
  };

  const handleConfirmRestore = () => {
    setShowConfirm(false);
    setShowWorldInput(true);
  };

  const handleCancelRestore = () => {
    setShowConfirm(false);
    setSelectedBackup(null);
  };

  const handleWorldNameSubmit = async () => {
    if (!selectedBackup || !activeConfig) return;
    if (worldNameInput !== currentWorldName) {
      Alert.alert('Mismatch', `World name does not match. Expected "${currentWorldName}"`);
      return;
    }
    setShowWorldInput(false);
    setRestoringId(selectedBackup.id);
    try {
      await restoreBackup(selectedBackup.path, activeConfig.worldPath, (stage, percent) => {
        setProgressStage(stage);
        setProgressPercent(percent);
      });
      Alert.alert('Restore Complete', 'Server restarted with restored world.');
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message || 'Unknown error');
    } finally {
      setRestoringId(null);
      setSelectedBackup(null);
      setWorldNameInput('');
      setProgressStage(null);
      setProgressPercent(0);
    }
  };

  const handleCancelWorldInput = () => {
    setShowWorldInput(false);
    setWorldNameInput('');
    setSelectedBackup(null);
  };

  const renderBackupItem = ({ item }: { item: BackupEntry }) => (
    <BackupCard
      backup={{
        id: item.id,
        worldName: item.worldName,
        timestamp: item.timestamp,
        size: item.size,
        path: item.path,
      }}
      onRestore={() => handleRestorePress(item)}
      disabled={busy || serverStatus === 'restoring'}
    />
  );

  const busy = creating || restoringId !== null;

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>World Backups</Text>
      <Text style={theme.subtext}>
        Create ZIP backups of your world. Restoring stops the server and replaces the current world folder.
      </Text>

      <Button
        title="Create Backup Now"
        onPress={handleCreateBackup}
        disabled={busy || serverStatus === 'error'}
        style={{ marginTop: 16, marginBottom: 16 }}
      />

      {busy && progressStage && (
        <Card style={styles.progressCard}>
          <Text style={styles.progressText}>{progressStage}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </Card>
      )}

      {backups.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No backups yet. Create your first backup.</Text>
        </Card>
      ) : (
        <FlatList
          data={backups}
          keyExtractor={(item) => item.id}
          renderItem={renderBackupItem}
          contentContainerStyle={{ gap: 12 }}
        />
      )}

      {/* Confirmation Dialog */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restore World</Text>
            <Text style={styles.modalText}>
              This will STOP the server, replace your current world with the selected backup, and restart the server. This cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="secondary" onPress={handleCancelRestore} style={{ flex: 1, marginRight: 8 }} />
              <Button title="I Understand — Continue" variant="danger" onPress={handleConfirmRestore} style={{ flex: 1 }} />
            </View>
          </Card>
        </View>
      </Modal>

      {/* World Name Confirmation */}
      <Modal visible={showWorldInput} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm World Name</Text>
            <Text style={styles.modalText}>
              Type the world name to confirm restore.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="World name"
              placeholderTextColor={theme.colors.textMuted}
              value={worldNameInput}
              onChangeText={setWorldNameInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="secondary" onPress={handleCancelWorldInput} style={{ flex: 1, marginRight: 8 }} />
              <Button
                title="Restore Now"
                variant="danger"
                onPress={handleWorldNameSubmit}
                disabled={worldNameInput !== currentWorldName}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtext: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCard: {
    marginBottom: 16,
    padding: 12,
  },
  progressText: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  percentText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 15,
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
  modalText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    marginBottom: 16,
  },
});
