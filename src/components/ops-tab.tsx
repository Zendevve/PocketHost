import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useServerStore } from '../stores/serverStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getPlayerList, modifyPlayerList, PlayerListEntry } from '../services/playerListManager';

export default function OpsTab() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const isRunning = statuses[activeServerId || '']?.status === 'running';

  const [entries, setEntries] = useState<PlayerListEntry[]>([]);
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    const data = await getPlayerList(config.worldPath, 'ops');
    setEntries(data);
    setLoading(false);
  }, [config?.worldPath]);

  useEffect(() => {
    fetchList();
  }, [activeServerId, config?.worldPath, fetchList]);

  const handleAdd = async () => {
    if (!inputName.trim() || !config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'ops', 'add', inputName.trim(), isRunning);
    setInputName('');
    await fetchList();
  };

  const handleRemove = async (name: string) => {
    if (!config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'ops', 'remove', name, isRunning);
    await fetchList();
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={{ color: '#f9fafb', fontWeight: '700', marginBottom: 12 }}>
          Grant Operator
        </Text>
        <Input
          label="Player username"
          placeholder="e.g. Steve"
          value={inputName}
          onChangeText={setInputName}
        />
        <Button
          title="Grant Op"
          onPress={handleAdd}
          disabled={loading || !inputName.trim()}
        />
      </Card>

      <Text style={{ color: '#f9fafb', fontWeight: '700', marginTop: 24, marginBottom: 12 }}>
        Operators
      </Text>

      {entries.length === 0 ? (
        <Card>
          <Text style={{ color: '#9ca3af' }}>No operators configured.</Text>
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
                  <Text selectable style={{ color: '#f9fafb', fontWeight: '700' }}>
                    {name}
                  </Text>
                  <Badge label={`Level ${entry.level || 4}`} color="#f59e0b" />
                </View>
                <Button
                  title="Demote"
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
