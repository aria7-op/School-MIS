// src/components/settings/DataManagement.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SettingItem from './SettingItem';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataManagement = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [syncFrequency, setSyncFrequency] = useState('6 hours');
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    loadDataSettings();
  }, []);

  const loadDataSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('dataSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSyncFrequency(settings.syncFrequency ?? '6 hours');
        setLastSync(settings.lastSync ?? '');
      }
    } catch (error) {
      // Use default settings if loading fails
    }
  };

  const saveDataSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('dataSettings', JSON.stringify(newSettings));
    } catch (error) {
      Alert.alert('Error', 'Failed to save data settings');
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      
      await saveDataSettings({
        syncFrequency,
        lastSync: now
      });
      
      Alert.alert('Success', 'Data synchronized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearingCache(true);
            try {
              // Clear all cached data except settings
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(key => 
                !key.includes('Settings') && 
                !key.includes('auth') && 
                !key.includes('user')
              );
              
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }
              
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setIsClearingCache(false);
            }
          }
        }
      ]
    );
  };

  const handleSyncFrequencyChange = async (frequency: string) => {
    setSyncFrequency(frequency);
    await saveDataSettings({
      syncFrequency: frequency,
      lastSync
    });
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('data_management')}</Text>
      
      <SettingItem
        label={t('sync_frequency')}
        rightComponent={
          <Text style={{ color: colors.text }}>{syncFrequency}</Text>
        }
      />

      <SettingItem
        label={t('last_sync')}
        rightComponent={
          <Text style={{ color: colors.text }}>
            {lastSync || t('never')}
          </Text>
        }
      />
      
      <SettingItem
        label=""
        rightComponent={
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleForceSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('force_sync_now')}</Text>
            )}
          </TouchableOpacity>
        }
      />
      
      <SettingItem
        label=""
        rightComponent={
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#f44336' }]}
            onPress={handleClearCache}
            disabled={isClearingCache}
          >
            {isClearingCache ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('clear_cache')}</Text>
            )}
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default DataManagement;
