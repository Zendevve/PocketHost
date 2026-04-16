import { FlatList, KeyboardAvoidingView, Platform, View, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { useServerStore } from '../../src/stores/serverStore';
import { serverManager } from '../../src/services/serverManager';
import { theme } from '../../src/lib/theme';
import { ConsoleInput } from '../../src/components/console/ConsoleInput';
import { ConsoleOutput } from '../../src/components/console/ConsoleOutput';

export default function ConsoleScreen() {
  const activeServerId = useServerStore(s => s.activeServerId);
  const logs = useServerStore(s => activeServerId ? (s.consoleLogs[activeServerId] ?? []) : []);
  const status = useServerStore(s => activeServerId ? s.statuses[activeServerId]?.status : 'idle');
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [logs.length]);

  const handleCommand = (cmd: string) => {
    if (!activeServerId) return;
    
    useServerStore.getState().appendLog(activeServerId, `> ${cmd}`);
    
    if (status === 'running') {
      try {
        serverManager.sendCommand(cmd);
      } catch (e: any) {
        useServerStore.getState().appendLog(activeServerId, `[ERROR] Failed to send command: ${e.message}`);
      }
    } else {
      useServerStore.getState().appendLog(activeServerId, `[WARN] Cannot execute command. Server is not running.`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={theme.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ flex: 1, backgroundColor: '#000000', borderRadius: 8, padding: 8, marginBottom: 12 }}>
        <FlatList
          ref={flatRef}
          data={logs}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <ConsoleOutput line={item} />}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />
      </View>
      <ConsoleInput onSubmit={handleCommand} />
    </KeyboardAvoidingView>
  );
}
