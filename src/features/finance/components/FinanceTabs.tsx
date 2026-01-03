import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { FinanceTab } from '../types/finance';

interface FinanceTabsProps {
  activeTab: FinanceTab;
  onChangeTab: (tab: FinanceTab) => void;
}

let MaterialIcons, FontAwesome5, Feather;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdListAlt;
  FontAwesome5 = require('react-icons/fa').FaChartPie;
  Feather = require('react-icons/fi').FiPieChart;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  FontAwesome5 = require('@expo/vector-icons').FontAwesome5;
  Feather = require('@expo/vector-icons').Feather;
}

const FinanceTabs: React.FC<FinanceTabsProps> = ({ activeTab, onChangeTab }) => {
  const { colors } = useTheme();

  const tabs: { id: FinanceTab; icon: React.ReactNode; label: string }[] = [
    {
      id: 'transactions',
      icon: <MaterialIcons />,
      label: 'Transactions',
    },
    {
      id: 'analytics',
      icon: <FontAwesome5 />,
      label: 'Analytics',
    },
    {
      id: 'budgets',
      icon: <Feather />,
      label: 'Budgets',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onChangeTab(tab.id)}
        >
          <View style={[
            styles.iconContainer,
            activeTab === tab.id && { backgroundColor: colors.primary }
          ]}>
            {React.cloneElement(tab.icon as React.ReactElement, {
              color: activeTab === tab.id ? '#fff' : colors.text
            })}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  tab: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export default FinanceTabs;
