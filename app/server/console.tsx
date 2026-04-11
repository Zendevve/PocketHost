import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useServerStore } from '../../src/stores/serverStore';
import { serverManager } from '../../src/services/serverManager';
import { ConsoleOutput } from '../../src/components/console/ConsoleOutput';
import { ConsoleInput } from '../../src/components/console/ConsoleInput';
import { theme } from '../../src/lib/theme';

export default function ConsoleScreen() {
  const { activeServerId, consoleLogs } = useServerStore();
  const logs = activeServerId ? consoleLogs[activeServerId] ?? [] : [];
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto-scroll on mount or log changes
    if (logs.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [logs.length]);

  const handleCommand = (cmd: string) => {
    if (!activeServerId) return;
    
    // Optimistic UI for command entry
    useServerStore.getState().appendLog(activeServerId, `> ${cmd}`);
    
    // Only send if running
    if (serverManager.isRunning()) {
      serverManager.sendCommand(cmd).catch(e => {
        useServerStore.getState().appendLog(activeServerId, `[ERROR] Failed to send command: ${e.message}`);
      });
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
