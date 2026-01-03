// src/components/settings/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SettingItem from './SettingItem';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettings = () => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setSoundEnabled(settings.soundEnabled ?? true);
        setEmailNotifications(settings.emailNotifications ?? true);
        setPushNotifications(settings.pushNotifications ?? true);
      }
    } catch (error) {
      // Use default settings if loading fails
    }
  };

  const saveNotificationSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    await saveNotificationSettings({
      notifications: value,
      soundEnabled,
      emailNotifications,
      pushNotifications
    });
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await saveNotificationSettings({
      notifications,
      soundEnabled: value,
      emailNotifications,
      pushNotifications
    });
  };

  const handleEmailToggle = async (value: boolean) => {
    setEmailNotifications(value);
    await saveNotificationSettings({
      notifications,
      soundEnabled,
      emailNotifications: value,
      pushNotifications
    });
  };

  const handlePushToggle = async (value: boolean) => {
    setPushNotifications(value);
    await saveNotificationSettings({
      notifications,
      soundEnabled,
      emailNotifications,
      pushNotifications: value
    });
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('notifications')}</Text>
      
      <SettingItem
        label={t('enable_notifications')}
        rightComponent={
          <Switch
            value={notifications}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        }
      />
      
      <SettingItem
        label={t('notification_sound')}
        rightComponent={
          <Switch
            value={soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            disabled={!notifications}
          />
        }
      />

      <SettingItem
        label={t('email_notifications')}
        rightComponent={
          <Switch
            value={emailNotifications}
            onValueChange={handleEmailToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            disabled={!notifications}
          />
        }
      />

      <SettingItem
        label={t('push_notifications')}
        rightComponent={
          <Switch
            value={pushNotifications}
            onValueChange={handlePushToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
            disabled={!notifications}
          />
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
});

export default NotificationSettings;
