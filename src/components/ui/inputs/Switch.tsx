import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated
} from 'react-native';

// Constants
import { COLORS, SPACING } from '../../../theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  color = COLORS.primary,
  style
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 32,
          height: 18,
          thumbSize: 14,
          thumbOffset: 2,
        };
      case 'large':
        return {
          width: 56,
          height: 30,
          thumbSize: 26,
          thumbOffset: 2,
        };
      default: // medium
        return {
          width: 44,
          height: 24,
          thumbSize: 20,
          thumbOffset: 2,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          backgroundColor: value ? color : COLORS.border,
          opacity: disabled ? 0.5 : 1,
        },
        style
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: sizeStyles.thumbSize,
            height: sizeStyles.thumbSize,
            left: value ? sizeStyles.width - sizeStyles.thumbSize - sizeStyles.thumbOffset : sizeStyles.thumbOffset,
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 
