import { Text, View, Alert } from 'react-native';
import { Toggle } from '../src/components/ui/Toggle';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { theme } from '../src/lib/theme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function SettingsScreen() {
  const {
    crossplayEnabled,
    maxMemoryMB,
    autoBackup,
    playitSecretKey,
    setCrossplay,
    setMaxMemory,
    setAutoBackup,
    setPlayitSecretKey,
  } = useSettingsStore();

  const handlePlayitKey = () => {
    Alert.prompt(
      'Playit.gg Secret Key',
      'Enter your agent secret key from the Playit.gg dashboard to enable global tunneling.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (text) => setPlayitSecretKey(text || null)
        }
      ],
      'plain-text',
      playitSecretKey || ''
    );
  };

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>Settings</Text>
      
      <Card style={{ marginBottom: 16 }}>
        <Text style={theme.heading}>Network Relay</Text>
        <Text style={[theme.body, { marginBottom: 12 }]}>
          Configure Playit.gg to allow players outside your local network to join.
        </Text>
        {playitSecretKey ? (
          <View>
            <Text style={{ color: theme.colors?.primary || '#4ade80', marginBottom: 8 }}>✓ Agent Key Configured</Text>
            <Button title="Edit Key" variant="secondary" onPress={handlePlayitKey} />
          </View>
        ) : (
          <Button title="Set Agent Key" onPress={handlePlayitKey} />
        )}
      </Card>

      <Toggle label="Crossplay Enabled" value={crossplayEnabled} onValueChange={setCrossplay} />
      <Toggle label="Auto Backup" value={autoBackup} onValueChange={setAutoBackup} />
      <Input
        label="Default Memory (MB)"
        keyboardType="numeric"
        value={String(maxMemoryMB)}
        onChangeText={(v) => setMaxMemory(Number(v) || 1024)}
      />
    </View>
  );
}
