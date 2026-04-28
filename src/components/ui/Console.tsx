import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useServerStore } from '../../stores/serverStore';

export const Console = () => {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const consoleLogs = useServerStore((s) => s.consoleLogs);
  const logs = useMemo(
    () => (activeServerId ? consoleLogs[activeServerId] ?? [] : []),
    [activeServerId, consoleLogs]
  );
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [logs]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.logText}>{item}</Text>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  logText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  }
});
