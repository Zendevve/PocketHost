import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking, TextInput } from 'react-native';
import { Console } from '../components/ui/Console';
import { serverManager } from '../services/serverManager';
import { useServerStore } from '../store/serverStore';

export default function Dashboard() {
  const { status, errorMessage, playitClaimUrl, playitAddress, config, actions } = useServerStore(state => state);

  useEffect(() => {
    serverManager.initializeEventListeners();
    return () => {
      // Cleanup could happen here if necessary, but we are keeping event listeners alive for now
    };
  }, []);

  const handleToggleServer = () => {
    if (status === 'running') {
      serverManager.stopServer();
    } else {
      serverManager.startServer();
    }
  };

  const handleMemoryChange = (amount: number) => {
    const newMem = Math.max(512, Math.min(4096, config.memoryLimit + amount));
    actions.updateConfig({ memoryLimit: newMem });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PocketHost</Text>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: status === 'running' ? '#00FF00' : (status === 'starting' ? '#FFA500' : '#FF0000') }
          ]} />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.settingsRow} pointerEvents={status === 'idle' ? 'auto' : 'none'}>
        <View style={[styles.settingBlock, status !== 'idle' && styles.settingDisabled]}>
          <Text style={styles.settingLabel}>Active World</Text>
          <TextInput 
            style={styles.textInput}
            value={config.activeWorld}
            onChangeText={(text) => actions.updateConfig({ activeWorld: text })}
            placeholder="world"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.settingBlock, status !== 'idle' && styles.settingDisabled]}>
          <Text style={styles.settingLabel}>Memory Limit</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity style={styles.stepperButton} onPress={() => handleMemoryChange(-512)}>
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{config.memoryLimit} MB</Text>
            <TouchableOpacity style={styles.stepperButton} onPress={() => handleMemoryChange(512)}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, status === 'starting' ? styles.buttonDisabled : null]}
          onPress={handleToggleServer}
          disabled={status === 'starting'}
        >
          {status === 'starting' ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {status === 'running' ? 'Stop Server' : 'Start Server'}
            </Text>
          )}
        </TouchableOpacity>

        {playitClaimUrl && !playitAddress && (
          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => Linking.openURL(playitClaimUrl)}
          >
            <Text style={styles.claimButtonText}>Claim Your Network Tunnel</Text>
          </TouchableOpacity>
        )}

        {playitAddress && (
          <View style={styles.ipContainer}>
            <Text style={styles.ipLabel}>Public IP:</Text>
            <Text style={styles.ipAddress} selectable={true}>{playitAddress}</Text>
          </View>
        )}
      </View>
      
      {errorMessage && (
        <View style={styles.errorContainer}>
           <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <Text style={styles.consoleTitle}>Console</Text>
      <Console />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#AAA',
    fontWeight: 'bold',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingBlock: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingDisabled: {
    opacity: 0.5,
  },
  settingLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  stepperButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  stepperButtonText: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00FF00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#55aa55',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  claimButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  claimButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  ipContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  ipLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 4,
  },
  ipAddress: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF7777',
  },
  consoleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  }
});
