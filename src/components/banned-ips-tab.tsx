import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './ui/Card';

export default function BannedIpsTab() {
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text style={{ color: '#9ca3af' }}>Banned IPs (stub)</Text>
      </Card>
    </View>
  );
}
