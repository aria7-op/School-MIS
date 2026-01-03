import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SystemMonitor from '../components/SystemMonitor';
import { useSystemMonitor } from '../hooks/useSystemMonitor';

const SystemMonitorScreen: React.FC = () => {
  const {
    isInitialized,
    error,
    initialize,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
  } = useSystemMonitor();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !isMonitoring) {
      startMonitoring();
    }
  }, [isInitialized, isMonitoring, startMonitoring]);

  useEffect(() => {
    if (error) {
      Alert.alert(
        'System Monitor Error',
        error,
        [
          {
            text: 'Retry',
            onPress: () => initialize(),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    }
  }, [error, initialize]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View>
          <MaterialIcons name="memory" size={64} color="#667eea" />
          <Text style={styles.loadingTitle}>System Monitor</Text>
          <Text style={styles.loadingSubtitle}>Initializing advanced monitoring...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SystemMonitor />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SystemMonitorScreen; 
