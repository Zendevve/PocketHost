import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useServerStore } from '../stores/serverStore';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getPlayerList, modifyPlayerList, PlayerListEntry } from '../services/playerListManager';

export default function BannedIpsTab() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const isRunning = statuses[activeServerId || '']?.status === 'running';

  const [entries, setEntries] = useState<PlayerListEntry[]>([]);
  const [inputIp, setInputIp] = useState('');
  const [inputReason, setInputReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    const data = await getPlayerList(config.worldPath, 'banned-ips');
    setEntries(data);
    setLoading(false);
  }, [config?.worldPath]);

  useEffect(() => {
    fetchList();
  }, [activeServerId, config?.worldPath, fetchList]);

  const handleAdd = async () => {
    if (!inputIp.trim() || !config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(
      config.worldPath,
      'banned-ips',
      'add',
      inputIp.trim(),
      isRunning,
      inputReason.trim() || undefined
    );
    setInputIp('');
    setInputReason('');
    await fetchList();
  };

  const handleRemove = async (ip: string) => {
    if (!config?.worldPath) return;
    setLoading(true);
    await modifyPlayerList(config.worldPath, 'banned-ips', 'remove', ip, isRunning);
    await fetchList();
  };

  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={{ color: '#f9fafb', fontWeight: '700', marginBottom: 12 }}>
          Ban IP Address
        </Text>
        <Input
          label="IP address"
          placeholder="e.g. 192.168.1.100"
          value={inputIp}
          onChangeText={setInputIp}
        />
        <Input
          label="Reason (optional)"
          placeholder="Griefing spawn"
          value={inputReason}
          onChangeText={setInputReason}
        />
        <Button
          title="Ban IP"
          variant="danger"
          onPress={handleAdd}
          disabled={loading || !inputIp.trim()}
        />
      </Card>

      <Text style={{ color: '#f9fafb', fontWeight: '700', marginTop: 24, marginBottom: 12 }}>
        Banned IPs
      </Text>

      {entries.length === 0 ? (
        <Card>
          <Text style={{ color: '#9ca3af' }}>No IPs banned.</Text>
        </Card>
      ) : (
        entries.map((entry) => {
          const ip = entry.ip || '';
          return (
            <Card key={ip}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: '#f9fafb', fontWeight: '700' }}>{ip}</Text>
                  {entry.reason && (
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      Reason: {entry.reason}
                    </Text>
                  )}
                </View>
                <Button
                  title="Unban"
                  variant="danger"
                  onPress={() => handleRemove(ip)}
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
