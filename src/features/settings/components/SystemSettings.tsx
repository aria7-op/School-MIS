import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SettingItem from './SettingItem';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useThemeContext } from '../../../contexts/ThemeContext';

const SystemSettings = () => {
  const { colors } = useTheme();
  const { lang, t } = useTranslation();
  // const { mode, toggleMode } = useThemeContext();

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('system_settings')}</Text>
      {/*
      <SettingItem
        label={t('dark_mode')}
        rightComponent={
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleMode}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        }
      />
      */}
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
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: 200,
  },
});

export default SystemSettings;
