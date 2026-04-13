import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useServerStore } from '../../store/serverStore';

export const Console = () => {
  const logs = useServerStore(state => state.logs);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when logs change
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
