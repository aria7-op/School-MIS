// src/screens/SettingsScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SystemSettings from '../components/SystemSettings';
import NotificationSettings from '../components/NotificationSettings';
import AcademicSettings from '../components/AcademicSettings';
import DataManagement from '../components/DataManagement';
import UserProfile from '../components/UserProfile';

const SettingsScreen = () => {
  const { colors } = useTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background },styles.scrollViewScrollbar]}
      contentContainerStyle={styles.contentContainer}
  
    >
      <SystemSettings />
      <NotificationSettings />
      <AcademicSettings />
      <DataManagement />
      <UserProfile />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:'95%',
    marginTop:10
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollViewScrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#4f46e5 transparent',
    // For webkit browsers
    '&::-webkit-scrollbar': {
      width: 8,

    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#4f46e5',
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  }
});

export default SettingsScreen;
