import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { theme } from '../../src/lib/theme';
import { useServerStore } from '../../src/stores/serverStore';
import { Button } from '../../src/components/ui/Button';
import OnlinePlayersTab from '../../src/components/online-players-tab';
import OpsTab from '../../src/components/ops-tab';
import WhitelistTab from '../../src/components/whitelist-tab';
import BannedPlayersTab from '../../src/components/banned-players-tab';
import BannedIpsTab from '../../src/components/banned-ips-tab';

type TabKey = 'online' | 'ops' | 'whitelist' | 'banned-players' | 'banned-ips';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'online', label: 'Online' },
  { key: 'ops', label: 'Operators' },
  { key: 'whitelist', label: 'Whitelist' },
  { key: 'banned-players', label: 'Bans' },
  { key: 'banned-ips', label: 'IP Bans' },
];

export default function PlayersScreen() {
  const { activeServerId, configs } = useServerStore();
  const config = configs.find((c) => c.id === activeServerId);
  const [activeTab, setActiveTab] = useState<TabKey>('online');

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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            title={tab.label}
            variant={activeTab === tab.key ? 'default' : 'secondary'}
            onPress={() => setActiveTab(tab.key)}
            style={{ flex: 1, minWidth: '30%' }}
          />
        ))}
      </View>

      {activeTab === 'online' && <OnlinePlayersTab />}
      {activeTab === 'ops' && <OpsTab />}
      {activeTab === 'whitelist' && <WhitelistTab />}
      {activeTab === 'banned-players' && <BannedPlayersTab />}
      {activeTab === 'banned-ips' && <BannedIpsTab />}
    </ScrollView>
  );
}
