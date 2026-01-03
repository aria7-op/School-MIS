import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native'; // Add this import
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';
import { quickActions } from '../../../../data/dashboardData';
import { useTranslation } from '../../../../contexts/TranslationContext';

const QuickActions: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation(); // Now properly imported
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <SectionTitle title={t('quick_actions')} />
      <View style={styles.actionsContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate(action.screen as never)} // Added type assertion
          >
            <MaterialCommunityIcons name={action.icon} size={28} style={styles.iconColor}/>
            <Text style={[styles.actionText, { color: colors.text }]}>{t(action.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  iconColor:{
    color:'#6366F1'
  }
});

export default QuickActions;
