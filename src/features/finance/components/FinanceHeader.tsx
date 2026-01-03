import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface FinanceHeaderProps {
  onFilterPress: () => void;
  onSearchPress: () => void;
}

let MaterialIcons, Feather;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdFilterList;
  Feather = require('react-icons/fi').FiSearch;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  Feather = require('@expo/vector-icons').Feather;
}

const FinanceHeader: React.FC<FinanceHeaderProps> = ({ 
  onFilterPress, 
  onSearchPress 
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Finance</Text>
      
      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
          <Feather size={22} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onFilterPress} style={styles.iconButton}>
          <MaterialIcons size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
});

export default FinanceHeader;
