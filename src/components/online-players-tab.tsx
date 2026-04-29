import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { usePlayerStore } from '../stores/playerStore';
import { useServerStore } from '../stores/serverStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { usePlayerActions } from '../hooks/use-player-actions';
import { PromptModal } from './prompt-modal';
import { getPlayerList } from '../services/playerListManager';

export default function OnlinePlayersTab() {
  const { players } = usePlayerStore();
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const status = statuses[activeServerId || ''];

  const { isLoading, kick, ban, op, deop, setGamemode } = usePlayerActions();

  const [opsList, setOpsList] = useState<{ name: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'kick' | 'ban'>('kick');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    if (!config?.worldPath) return;
    getPlayerList(config.worldPath, 'ops').then((list) => {
      setOpsList(list.map((e) => ({ name: e.name })));
    });
  }, [activeServerId, config?.worldPath]);

  const onlinePlayers = players.filter((p) => p.online);

  const handleAction = (player: { username: string }) => {
    const isOp = opsList.some(
      (o) => o.name.toLowerCase() === player.username.toLowerCase()
    );

    Alert.alert(player.username, 'Choose an action', [
      {
        text: 'Kick',
        style: 'destructive',
        onPress: () => {
          setModalType('kick');
          setSelectedPlayer(player.username);
          setModalVisible(true);
        },
      },
      {
        text: 'Ban',
        onPress: () => {
          setModalType('ban');
          setSelectedPlayer(player.username);
          setModalVisible(true);
        },
      },
      {
        text: isOp ? 'Deop' : 'Op',
        style: isOp ? 'destructive' : 'default',
        onPress: () => {
          if (isOp) {
            deop(player.username);
          } else {
            op(player.username);
          }
        },
      },
      {
        text: 'Set Gamemode',
        onPress: () => {
          Alert.alert('Select Gamemode', undefined, [
            { text: 'Survival', onPress: () => setGamemode(player.username, 'survival') },
            { text: 'Creative', onPress: () => setGamemode(player.username, 'creative') },
            { text: 'Adventure', onPress: () => setGamemode(player.username, 'adventure') },
            { text: 'Spectator', onPress: () => setGamemode(player.username, 'spectator') },
            { text: 'Cancel', style: 'cancel' },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleModalConfirm = (text: string) => {
    setModalVisible(false);
    if (modalType === 'kick') {
      kick(selectedPlayer, text || undefined);
    } else if (modalType === 'ban') {
      ban(selectedPlayer, text || undefined);
    }
  };

  if (onlinePlayers.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <Card>
          <Text style={{ color: '#9ca3af' }}>
            No players are currently online.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={onlinePlayers}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => (
          <Card onPress={() => handleAction(item)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text selectable style={{ color: '#f9fafb', fontWeight: '700' }}>
                {item.username}
              </Text>
              <Badge label="Online" color="#4ade80" />
            </View>
          </Card>
        )}
      />
      <PromptModal
        visible={modalVisible}
        title={modalType === 'kick' ? 'Kick Player' : 'Ban Player'}
        message={`Enter an optional reason for ${modalType}ing ${selectedPlayer}:`}
        placeholder="Reason (optional)"
        confirmText={modalType === 'kick' ? 'Kick' : 'Ban'}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
}
