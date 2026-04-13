import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Console } from '../components/ui/Console';
import { serverManager } from '../services/serverManager';
import { useServerStore } from '../store/serverStore';

export default function Dashboard() {
  const status = useServerStore(state => state.status);
  const errorMessage = useServerStore(state => state.errorMessage);

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
  controls: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00FF00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#55aa55',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
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
