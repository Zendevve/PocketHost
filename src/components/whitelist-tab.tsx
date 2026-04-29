import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useServerStore } from '../stores/serverStore';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { getPlayerList, modifyPlayerList, PlayerListEntry } from '../services/playerListManager';
import ServerProcess from '../../modules/server-process';

export default function WhitelistTab() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const isRunning = statuses[activeServerId || '']?.status === 'running';

  const [entries, setEntries] = useState<PlayerListEntry[]>([]);
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);

  const fetchList = useCallback(async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    const data = await getPlayerList(config.worldPath, 'whitelist');
    setEntries(data);
    setLoading(false);
  }, [config?.worldPath]);

  useEffect(() => {
    fetchList();
  }, [activeServerId, config?.worldPath, fetchList]);

  const handleToggle = async (value: boolean) => {
    if (isRunning) {
      setWhitelistEnabled(value);
      await ServerProcess.sendCommand(value ? 'whitelist on' : 'whitelist off');
    } else {
      Alert.alert('Server Offline', 'Start the server to change the whitelist runtime state.');
    }
  };

  const handleAdd = async () => {
    if (!inputName.trim() || !config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'whitelist', 'add', inputName.trim(), isRunning);
    setInputName('');
    await fetchList();
  };

  const handleRemove = async (name: string) => {
    if (!config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'whitelist', 'remove', name, isRunning);
    await fetchList();
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Toggle
          label="Whitelist Enabled"
          value={whitelistEnabled}
          onValueChange={handleToggle}
        />
      </Card>

      <Card>
        <Text style={{ color: '#f9fafb', fontWeight: '700', marginBottom: 12 }}>
          Add Player
        </Text>
        <Input
          label="Player username"
          placeholder="e.g. Steve"
          value={inputName}
          onChangeText={setInputName}
        />
        <Button
          title="Add"
          onPress={handleAdd}
          disabled={loading || !inputName.trim()}
        />
      </Card>

      <Text style={{ color: '#f9fafb', fontWeight: '700', marginTop: 24, marginBottom: 12 }}>
        Whitelisted Players
      </Text>

      {entries.length === 0 ? (
        <Card>
          <Text style={{ color: '#9ca3af' }}>No players whitelisted.</Text>
        </Card>
      ) : (
        entries.map((entry) => {
          const name = entry.name || '';
          return (
            <Card key={name}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#f9fafb', fontWeight: '700' }}>{name}</Text>
                <Button
                  title="Remove"
                  variant="danger"
                  onPress={() => handleRemove(name)}
                  disabled={loading}
                />
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}
