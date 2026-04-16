import { useRouter } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';

export default function ServerDashboardScreen() {
  const router = useRouter();
  const { configs, activeServerId, statuses, backupStatus, lastBackupTime } = useServerStore();
  const activeConfig = configs.find((c) => c.id === activeServerId);
  const activeState = activeServerId ? statuses[activeServerId] : null;

  if (!activeConfig) {
    return (
      <View style={[theme.screen, { justifyContent: 'center' }]}>
        <Text style={theme.heading}>PocketHost</Text>
        <Text style={theme.subtext}>No server configured yet.</Text>
        <Button
          title="Create Server"
          onPress={() => router.push('/setup/version-select')}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>Server: {activeConfig.name}</Text>
      <Card>
        <Text style={theme.subtext}>Status: {(activeState?.status ?? 'idle').toUpperCase()}</Text>
        
        {activeState?.relayAddress ? (
          <Text style={[theme.subtext, { color: theme.colors?.primary || '#4ade80', fontWeight: 'bold', marginVertical: 4 }]}>
            IP: {activeState.relayAddress}
          </Text>
        ) : activeState?.status === 'running' ? (
          <Text style={[theme.subtext, { marginVertical: 4 }]}>
            Local IP: localhost:25565
          </Text>
        ) : null}

        <Text style={theme.subtext}>Uptime: {activeState?.uptimeSeconds || 0}s</Text>
        <Text style={theme.subtext}>Memory: {activeState?.memoryUsedMB || 0} / {activeState?.memoryMaxMB || activeConfig.maxMemoryMB} MB</Text>
        <Text style={theme.subtext}>TPS: {activeState?.tps || 20}</Text>
      </Card>

      {/* Backup Status Indicator */}
      <View style={styles.backupStatusContainer}>
        <Text style={styles.backupStatusLabel}>Backup:</Text>
        {backupStatus === 'idle' && lastBackupTime && (
          <Text style={styles.backupStatusReady}>Ready (last: {new Date(lastBackupTime).toLocaleDateString()})</Text>
        )}
        {backupStatus === 'idle' && !lastBackupTime && (
          <Text style={styles.backupStatusReady}>Ready</Text>
        )}
        {backupStatus === 'creating' && (
          <Text style={styles.backupStatusBusy}>Creating backup...</Text>
        )}
        {backupStatus === 'restoring' && (
          <Text style={styles.backupStatusBusy}>Restoring backup...</Text>
        )}
        {backupStatus === 'error' && (
          <Text style={styles.backupStatusError}>Error</Text>
        )}
      </View>

      <Button
        title="Open Console"
        onPress={() => router.push('/server/console')}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Server Properties"
        variant="secondary"
        onPress={() => router.push('/server/properties')}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Players"
        variant="secondary"
        onPress={() => router.push('/players')}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Worlds"
        variant="secondary"
        onPress={() => router.push('/worlds')}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Backups"
        variant="secondary"
        onPress={() => router.push('/backup')}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Plugins"
        variant="secondary"
        onPress={() => router.push('/plugins')}
        style={{ marginBottom: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backupStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backupStatusLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginRight: 6,
  },
  backupStatusReady: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  backupStatusBusy: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
  },
  backupStatusError: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
