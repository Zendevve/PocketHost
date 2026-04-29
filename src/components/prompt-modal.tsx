import React, { useState } from 'react';
import { Modal, View, Text } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function PromptModal({
  visible,
  title,
  message,
  placeholder,
  confirmText,
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [text, setText] = useState('');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onShow={() => setText('')}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 16,
            padding: 20,
            gap: 12,
          }}
        >
          <Text style={{ color: '#f9fafb', fontSize: 18, fontWeight: '700' }}>
            {title}
          </Text>
          {message && (
            <Text style={{ color: '#d1d5db' }}>{message}</Text>
          )}
          <Input
            placeholder={placeholder || ''}
            value={text}
            onChangeText={setText}
            label=""
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <Button
              title={confirmText || 'OK'}
              variant="default"
              onPress={() => onConfirm(text)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
