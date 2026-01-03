import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../../../../contexts/TranslationContext';

const Header: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('dashboard')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Header;
