import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface AddTransactionFABProps {
  onPress: () => void;
}

let MaterialIcons;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdAdd;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
}

const AddTransactionFAB: React.FC<AddTransactionFABProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <MaterialIcons />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default AddTransactionFAB;
