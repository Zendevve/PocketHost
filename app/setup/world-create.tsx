import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Toggle } from '../../src/components/ui/Toggle';
import { theme } from '../../src/lib/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function WorldCreateScreen() {
  const router = useRouter();
  const { version } = useLocalSearchParams<{ version: string }>();
  const settings = useSettingsStore();

  const [serverName, setServerName] = useState('PocketHost Server');
  const [worldName, setWorldName] = useState('world');
  const [crossplayEnabled, setCrossplayEnabled] = useState(settings.crossplayEnabled);
  const [maxMemoryMB, setMaxMemoryMB] = useState(String(settings.maxMemoryMB));

  return (
    <View style={theme.screen}>
      <Text style={theme.heading}>Create World</Text>
      <Card>
        <Text style={theme.subtext}>Version: {version}</Text>
      </Card>

      <Input label="Server Name" value={serverName} onChangeText={setServerName} />
      <Input label="World Name" value={worldName} onChangeText={setWorldName} />
      <Input
        label="Max Memory (MB)"
        value={maxMemoryMB}
        keyboardType="numeric"
        onChangeText={setMaxMemoryMB}
      />
      <Toggle label="Enable Bedrock Crossplay" value={crossplayEnabled} onValueChange={setCrossplayEnabled} />

      <Button
        title="Continue"
        style={{ marginTop: 16 }}
        onPress={() => {
          router.push({
            pathname: '/setup/region-select',
            params: {
              version: version ?? '',
              serverName,
              worldName,
              crossplayEnabled: String(crossplayEnabled),
              maxMemoryMB,
            },
          });
        }}
      />
    </View>
  );
}
