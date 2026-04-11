import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { getPlayerList, modifyPlayerList, ListType, PlayerListEntry } from '../../src/services/playerListManager';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

const LIST_TYPES: { value: ListType; label: string }[] = [
  { value: 'ops', label: 'Operators' },
  { value: 'whitelist', label: 'Whitelist' },
  { value: 'banned-players', label: 'Bans' },
  { value: 'banned-ips', label: 'IP Bans' },
];

export default function PlayersScreen() {
  const { activeServerId, configs, statuses } = useServerStore();
  const config = configs.find(c => c.id === activeServerId);
  const status = statuses[activeServerId || ''];
  
  const [activeTab, setActiveTab] = useState<ListType>('ops');
  const [entries, setEntries] = useState<PlayerListEntry[]>([]);
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    if (!config?.worldPath) return;
    setLoading(true);
    const data = await getPlayerList(config.worldPath, activeTab);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [activeServerId, activeTab, config?.worldPath]);

  const handleAdd = async () => {
    if (!inputName.trim() || !config?.worldPath) return;
    setLoading(true);
    const success = await modifyPlayerList(
      config.worldPath, 
      activeTab, 
      'add', 
      inputName.trim(), 
      status?.status === 'running'
    );
    if (!success) Alert.alert('Error', 'Failed to add player to list.');
    setInputName('');
    await fetchList();
  };

  const handleRemove = async (name: string) => {
    if (!config?.worldPath) return;
    setLoading(true);
    const success = await modifyPlayerList(
      config.worldPath, 
      activeTab, 
      'remove', 
      name, 
      status?.status === 'running'
    );
    if (!success) Alert.alert('Error', 'Failed to remove player from list.');
    await fetchList();
  };

  if (!config) {
    return (
      <View style={theme.screen}>
        <Text style={theme.heading}>Players</Text>
        <Text style={theme.body}>Select a server first.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={theme.heading}>Manage Players</Text>
      
      <View style={styles.tabs}>
        {LIST_TYPES.map(tab => (
          <Button 
            key={tab.value}
            title={tab.label}
            variant={activeTab === tab.value ? 'default' : 'secondary'}
            onPress={() => setActiveTab(tab.value)}
            style={styles.tabButton}
          />
        ))}
      </View>

      <Card>
        <Text style={theme.heading}>Add to {LIST_TYPES.find(t => t.value === activeTab)?.label}</Text>
        <View style={styles.addForm}>
          <Input 
            label="Player username or IP"
            placeholder="e.g. Steve" 
            value={inputName}
            onChangeText={setInputName}
          />
          <Button 
            title="Add" 
            onPress={handleAdd} 
            disabled={loading || !inputName.trim()} 
          />
        </View>
      </Card>

      <Text style={[theme.heading, { marginTop: 24, marginBottom: 12 }]}>Current List</Text>
      
      {entries.length === 0 ? (
        <Card>
          <Text style={theme.body}>This list is currently empty.</Text>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.uuid || entry.name} style={styles.entryCard}>
            <View style={styles.entryInfo}>
              <Text style={{ ...theme.body, fontWeight: 'bold' }}>{entry.name}</Text>
              {entry.uuid && <Text style={{ ...theme.caption, fontSize: 10 }}>{entry.uuid}</Text>}
              {entry.reason && <Text style={theme.caption}>Reason: {entry.reason}</Text>}
            </View>
            <Button 
              title="Remove" 
              variant="danger" 
              onPress={() => handleRemove(entry.name)} 
              disabled={loading}
            />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    minWidth: '45%',
  },
  addForm: {
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
    marginRight: 12,
  },
});
