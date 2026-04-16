import { Pressable, StyleProp, View, ViewStyle, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { theme } from '../../lib/theme';
import { Button } from './Button';

interface BackupCardProps {
  backup: {
    id: string;
    worldName: string;
    timestamp: string;
    size: number;
    path: string;
  };
  onRestore: () => void;
  disabled?: boolean;
}

export function BackupCard({ backup, onRestore, disabled }: BackupCardProps) {
  const formattedDate = new Date(backup.timestamp).toLocaleString();
  const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.title}>World: {backup.worldName}</Text>
          <Text style={styles.subtext}>{formattedDate}</Text>
          <Text style={styles.subtext}>Size: {sizeMB} MB</Text>
        </View>
        <View style={styles.action}>
          <Button title="Restore" variant="danger" onPress={onRestore} disabled={disabled} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
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
  action: {
    marginLeft: 12,
  },
});
