import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/lib/theme';
import { useCloudBackupStore } from '../../src/stores/cloudBackupStore';
import { useServerStore } from '../../src/stores/serverStore';
import { useBackupStore } from '../../src/stores/backupStore';
import {
  isSignedIn,
  signOut,
  uploadBackup,
  listDriveBackups,
  downloadBackup,
  deleteDriveBackup,
  getCachedBackups,
  setAccessToken,
} from '../../src/services/cloudBackupService';
import { GOOGLE_OAUTH_WEB_CLIENT_ID, isGoogleOAuthConfigured } from '../../src/lib/config';
import * as FileSystem from 'expo-file-system';
import * as AuthSession from 'expo-auth-session';

export default function CloudBackupScreen() {
  const router = useRouter();
  const backups = useCloudBackupStore((s) => s.backups);
  const storeSignedIn = useCloudBackupStore((s) => s.isSignedIn);
  const isLoading = useCloudBackupStore((s) => s.isLoading);
  const uploadProgress = useCloudBackupStore((s) => s.uploadProgress);
  const downloadProgress = useCloudBackupStore((s) => s.downloadProgress);
  const error = useCloudBackupStore((s) => s.error);

  const setBackups = useCloudBackupStore((s) => s.setBackups);
  const setSignedIn = useCloudBackupStore((s) => s.setSignedIn);
  const setLoading = useCloudBackupStore((s) => s.setLoading);
  const setUploadProgress = useCloudBackupStore((s) => s.setUploadProgress);
  const setDownloadProgress = useCloudBackupStore((s) => s.setDownloadProgress);
  const setError = useCloudBackupStore((s) => s.setError);
  const removeBackup = useCloudBackupStore((s) => s.removeBackup);

  const activeServerId = useServerStore((s) => s.activeServerId);
  const configs = useServerStore((s) => s.configs);
  const activeConfig = configs.find((c) => c.id === activeServerId);
  const localBackups = useBackupStore((s) => s.backups);

  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    checkSignIn();
  }, []);

  const checkSignIn = useCallback(async () => {
    const signedIn = await isSignedIn();
    setSignedIn(signedIn);
    if (signedIn) {
      const cached = await getCachedBackups();
      setBackups(cached);
      refreshList();
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listDriveBackups();
      setBackups(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!isGoogleOAuthConfigured()) {
      Alert.alert(
        'OAuth Not Configured',
        'Google Drive sign-in requires a Web Client ID. Set googleOAuthWebClientId in app.json extra field.'
      );
      return;
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'pockethost' });
    const clientId = GOOGLE_OAUTH_WEB_CLIENT_ID;

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });

    try {
      const result = await request.promptAsync(discovery);
      if (result.type === 'success' && result.authentication?.accessToken) {
        setAccessToken(result.authentication.accessToken);
        setSignedIn(true);
        refreshList();
      } else {
        setError('Sign-in was cancelled or failed');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setSignedIn(false);
    setBackups([]);
  }, []);

  const handleUploadLocal = useCallback(
    async (localBackup: { path: string; worldName: string }) => {
      if (!activeConfig) return;
      setUploadingId(localBackup.path);
      setUploadProgress(0);
      try {
        const entry = await uploadBackup(localBackup.path, localBackup.worldName, (percent) => {
          setUploadProgress(percent);
        });
        setBackups([entry, ...backups]);
        Alert.alert('Success', 'Backup uploaded to Google Drive');
      } catch (e: any) {
        setError(e.message);
        Alert.alert('Upload failed', e.message);
      } finally {
        setUploadingId(null);
        setUploadProgress(0);
      }
    },
    [activeConfig, backups]
  );

  const handleDownloadRestore = useCallback(
    async (backup: any) => {
      if (!activeConfig) return;
      setRestoringId(backup.driveFileId);
      setDownloadProgress(0);
      try {
        const destDir = `${FileSystem.documentDirectory}backups`;
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        const destPath = `${destDir}/${backup.name}`;

        await downloadBackup(backup.driveFileId, destPath, (percent) => {
          setDownloadProgress(percent);
        });

        Alert.alert('Downloaded', 'Backup downloaded. Go to Local Backups to restore it.');
      } catch (e: any) {
        setError(e.message);
        Alert.alert('Download failed', e.message);
      } finally {
        setRestoringId(null);
        setDownloadProgress(0);
        setSelectedBackup(null);
        setShowRestoreConfirm(false);
      }
    },
    [activeConfig]
  );

  const handleDelete = useCallback(
    async (backup: any) => {
      Alert.alert('Delete Backup', `Delete "${backup.name}" from Google Drive?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDriveBackup(backup.driveFileId);
              removeBackup(backup.driveFileId);
            } catch (e: any) {
              setError(e.message);
              Alert.alert('Delete failed', e.message);
            }
          },
        },
      ]);
    },
    [removeBackup]
  );

  const renderCloudBackup = ({ item }: { item: any }) => (
    <Card style={styles.backupCard}>
      <View style={styles.backupHeader}>
        <Text style={styles.backupName}>{item.name}</Text>
        <Text style={styles.backupMeta}>{item.worldName}</Text>
        <Text style={styles.backupMeta}>
          {new Date(item.timestamp).toLocaleDateString()} · {(item.size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
      <View style={styles.backupActions}>
        <Button
          title="Download"
          variant="secondary"
          onPress={() => {
            setSelectedBackup(item);
            setShowRestoreConfirm(true);
          }}
          disabled={restoringId === item.driveFileId}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button title="Delete" variant="danger" onPress={() => handleDelete(item)} style={{ flex: 1 }} />
      </View>
      {restoringId === item.driveFileId && (
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{downloadProgress}%</Text>
        </View>
      )}
    </Card>
  );

  const renderLocalBackup = ({ item }: { item: any }) => (
    <Card style={styles.backupCard}>
      <View style={styles.backupHeader}>
        <Text style={styles.backupName}>{item.worldName}</Text>
        <Text style={styles.backupMeta}>
          {new Date(item.timestamp).toLocaleDateString()} · {(item.size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
      <Button
        title={uploadingId === item.path ? `Uploading ${uploadProgress}%` : 'Upload to Drive'}
        onPress={() => handleUploadLocal(item)}
        disabled={uploadingId === item.path}
        style={{ marginTop: 8 }}
      />
    </Card>
  );

  if (!storeSignedIn) {
    const oauthReady = isGoogleOAuthConfigured();
    return (
      <View style={theme.screen}>
        <Text style={theme.heading}>Cloud Backups</Text>
        <Text style={theme.subtext}>Back up your worlds to Google Drive for safe off-device storage.</Text>
        <Card style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text, fontSize: 15, marginBottom: 16 }}>
            Sign in with Google to enable cloud backups
          </Text>
          <Button
            title={oauthReady ? 'Sign in with Google' : 'OAuth Not Configured'}
            onPress={handleSignIn}
            variant={oauthReady ? 'default' : 'secondary'}
          />
          {!oauthReady && (
            <Text style={{ color: theme.colors.danger, fontSize: 13, marginTop: 12, textAlign: 'center' }}>
              Google OAuth Web Client ID is missing.{'\n'}
              Set googleOAuthWebClientId in app.json extra field.
            </Text>
          )}
        </Card>
        {error && (
          <Text style={{ color: theme.colors.danger, marginTop: 12 }}>{error}</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={theme.heading}>Cloud Backups</Text>
        <Pressable onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {isLoading && backups.length === 0 && (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
      )}

      <Text style={[theme.subtext, { marginBottom: 12 }]}>Google Drive — PocketHost Backups folder</Text>

      {backups.length === 0 && !isLoading ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No cloud backups yet.</Text>
          <Text style={[styles.emptyText, { marginTop: 4 }]}>Upload a local backup below.</Text>
        </Card>
      ) : (
        backups.map((item) => (
          <View key={item.driveFileId}>{renderCloudBackup({ item })}</View>
        ))
      )}

      <Text style={[theme.heading, { fontSize: 18, marginTop: 20, marginBottom: 8 }]}>Upload Local Backup</Text>
      {localBackups.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No local backups. Create one first.</Text>
        </Card>
      ) : (
        localBackups.map((item) => (
          <View key={item.id}>{renderLocalBackup({ item })}</View>
        ))
      )}

      {/* Restore Confirmation */}
      <Modal visible={showRestoreConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Download Backup</Text>
            <Text style={styles.modalText}>
              This will download the backup to your device. You can then restore it from the Local Backups screen.
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Download"
                onPress={() => selectedBackup && handleDownloadRestore(selectedBackup)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signOutText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  backupCard: {
    marginBottom: 12,
  },
  backupHeader: {
    marginBottom: 8,
  },
  backupName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  backupMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  backupActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarBg: {
    flex: 1,
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
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
    width: 36,
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
});
