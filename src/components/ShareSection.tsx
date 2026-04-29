import React, { useState } from 'react';
import { View, Text, Modal, Share, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { colors } from '../lib/theme';

interface ShareSectionProps {
  address: string;
}

export function ShareSection({ address }: ShareSectionProps) {
  const [qrVisible, setQrVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Minecraft server: ${address}`,
      });
    } catch {
      // User dismissed share sheet — ignore
    }
  };

  return (
    <>
      <Card>
        <Text style={styles.label}>Server Address</Text>
        <Text style={styles.address}>{address}</Text>
        <View style={styles.buttonRow}>
          <Button
            title={copied ? 'Copied!' : 'Copy'}
            onPress={handleCopy}
            style={{ flex: 1 }}
          />
          <Button
            title="Share"
            variant="secondary"
            onPress={handleShare}
            style={{ flex: 1 }}
          />
          <Button
            title="QR Code"
            variant="secondary"
            onPress={() => setQrVisible(true)}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      <Modal
        visible={qrVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan to Join</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={address}
                size={220}
                color={colors.text}
                backgroundColor={colors.bg}
              />
            </View>
            <Text style={styles.modalAddress}>{address}</Text>
            <Button title="Close" onPress={() => setQrVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  address: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: colors.bg,
    borderRadius: 12,
  },
  modalAddress: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
