import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ConsoleOutputProps {
  line: string;
}

export const ConsoleOutput = memo(function ConsoleOutput({ line }: ConsoleOutputProps) {
  // Simple heuristic for coloring log levels
  let color = '#d1d5db'; // default gray
  if (line.includes('WARN')) color = '#facc15';
  if (line.includes('ERROR') || line.includes('FATAL')) color = '#ef4444';
  if (line.includes('INFO')) color = '#93c5fd';
  if (line.startsWith('>')) color = '#4ade80'; // user commands

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>{line}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});
