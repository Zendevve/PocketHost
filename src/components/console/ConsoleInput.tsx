import { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { colors } from '../../lib/theme';
import { Button } from '../ui/Button';

interface ConsoleInputProps {
  onSubmit: (command: string) => void;
}

export function ConsoleInput({ onSubmit }: ConsoleInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter command (e.g. op username)"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button 
        title="Send" 
        onPress={handleSubmit} 
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.surfaceHover || '#252525',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    color: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
