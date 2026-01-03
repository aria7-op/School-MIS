// src/components/settings/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SettingItem from './SettingItem';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useAuth } from '../../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfile = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [lastLogin, setLastLogin] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedLastLogin = await AsyncStorage.getItem('lastLogin');
      if (savedLastLogin) {
        setLastLogin(savedLastLogin);
      } else {
        // Set current time as last login if not found
        const now = new Date().toLocaleString();
        setLastLogin(now);
        await AsyncStorage.setItem('lastLogin', now);
      }
    } catch (error) {
      // Use current time as fallback
      const now = new Date().toLocaleString();
      setLastLogin(now);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      // Simulate password change process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Password Change',
        'Password change request sent. Check your email for further instructions.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process password change request');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // Clear user data
              await AsyncStorage.removeItem('lastLogin');
              
              // Call logout from auth context
              if (logout) {
                await logout();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout properly');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const getUserType = () => {
    if (!user) return t('unknown');
    
    // Determine user type based on user data
    if (user.role === 'admin') return t('administrator');
    if (user.role === 'teacher') return t('teacher');
    if (user.role === 'student') return t('student');
    if (user.role === 'parent') return t('parent');
    
    return t('user');
  };

  const getUserName = () => {
    if (!user) return t('unknown_user');
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return user.name || user.email || t('unknown_user');
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('user_profile')}</Text>
      
      <SettingItem
        label={t('user_name')}
        rightComponent={
          <Text style={{ color: colors.text }}>{getUserName()}</Text>
        }
      />

      <SettingItem
        label={t('account_type')}
        rightComponent={
          <Text style={{ color: colors.text }}>{getUserType()}</Text>
        }
      />
      
      <SettingItem
        label={t('last_login')}
        rightComponent={
          <Text style={{ color: colors.text }}>{lastLogin}</Text>
        }
      />

      <SettingItem
        label={t('email')}
        rightComponent={
          <Text style={{ color: colors.text }}>
            {user?.email || t('not_available')}
          </Text>
        }
      />
      
      <SettingItem
        label=""
        rightComponent={
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('change_password')}</Text>
            )}
          </TouchableOpacity>
        }
      />
      
      <SettingItem
        label=""
        rightComponent={
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#f44336' }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('logout')}</Text>
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

export default UserProfile;
