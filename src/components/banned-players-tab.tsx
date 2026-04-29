import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useServerStore } from '../stores/serverStore';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getPlayerList, modifyPlayerList, PlayerListEntry } from '../services/playerListManager';

export default function BannedPlayersTab() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const isRunning = statuses[activeServerId || '']?.status === 'running';

  const [entries, setEntries] = useState<PlayerListEntry[]>([]);
  const [inputName, setInputName] = useState('');
  const [inputReason, setInputReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    const data = await getPlayerList(config.worldPath, 'banned-players');
    setEntries(data);
    setLoading(false);
  }, [config?.worldPath]);

  useEffect(() => {
    fetchList();
  }, [activeServerId, config?.worldPath, fetchList]);

  const handleAdd = async () => {
    if (!inputName.trim() || !config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(
      config.worldPath,
      'banned-players',
      'add',
      inputName.trim(),
      isRunning,
      inputReason.trim() || undefined
    );
    setInputName('');
    setInputReason('');
    await fetchList();
  };

  const handleRemove = async (name: string) => {
    if (!config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'banned-players', 'remove', name, isRunning);
    await fetchList();
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={{ color: '#f9fafb', fontWeight: '700', marginBottom: 12 }}>
          Ban Player
        </Text>
        <Input
          label="Player username"
          placeholder="e.g. Griefer"
          value={inputName}
          onChangeText={setInputName}
        />
        <Input
          label="Reason (optional)"
          placeholder="Griefing spawn"
          value={inputReason}
          onChangeText={setInputReason}
        />
        <Button
          title="Ban"
          variant="danger"
          onPress={handleAdd}
          disabled={loading || !inputName.trim()}
        />
      </Card>

      <Text style={{ color: '#f9fafb', fontWeight: '700', marginTop: 24, marginBottom: 12 }}>
        Banned Players
      </Text>

      {entries.length === 0 ? (
        <Card>
          <Text style={{ color: '#9ca3af' }}>No players banned.</Text>
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
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: '#f9fafb', fontWeight: '700' }}>{name}</Text>
                  {entry.reason && (
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      Reason: {entry.reason}
                    </Text>
                  )}
                </View>
                <Button
                  title="Unban"
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
